// Removed direct HttpClient usage; using HttpRequestService wrapper
import { CommonModule } from "@angular/common";
import { Component, inject, type OnInit, signal, computed } from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import { environment } from "../../../environments/environment";
import type { components } from "../../../types/api";
import { SocketService } from "../../services/socketio";
import { HttpRequestService, type HttpEndpoint, type HttpMethod } from "../../services/http-request";
import { firstValueFrom } from "rxjs";
import { TokenStore } from "../../services/token-store";

type ChatRoom = components["schemas"]["ChatRoom"];
type User = components["schemas"]["User"];

interface ChatListItem {
  room: ChatRoom;
  otherUser?: User;
  unread: number;
  lastMessageAt?: string;
  isOnline?: boolean;
}

@Component({
  selector: "app-chat-list",
  standalone: true,
  imports: [RouterLink, CommonModule],
  template: `
<div class="chat-list-wrapper">
	@if (items().length) {
		<div class="chat-list">
			@for (item of items(); track item.room.id) {
				<button class="chat-card" type="button" [routerLink]="['/home/chat', item.room.id]" (click)="markRead(item.room.id)">
					<div class="avatar">
						@if (item.otherUser && hasPhoto(item)) {
							<img [src]="mainPhoto(item)" alt="avatar" />
						} @else { <div class="placeholder">?</div> }
						<span class="status-dot" [class.online]="item.isOnline"></span>
					</div>
					<div class="meta">
						<div class="line1">
							<span class="name">{{ otherName(item) }}</span>
							@if (item.unread) { <span class="badge">{{ item.unread }}</span> }
						</div>
            @if (item.lastMessageAt) { <div class="line2">{{ item.lastMessageAt | date:'shortTime' }}</div> }
					</div>
				</button>
			}
		</div>
	} @else {
		<div class="empty">No chats yet</div>
	}
</div>
`,
  styles: `
.chat-list-wrapper { padding: .5rem; display:flex; flex-direction:column; gap:.5rem; }
.chat-list { display:flex; flex-direction:column; gap:.5rem; }
.chat-card { display:flex; align-items:center; gap:.75rem; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.08); border-radius: .9rem; padding:.55rem .75rem; cursor:pointer; text-align:left; position:relative; overflow:hidden; }
.chat-card:hover { background:rgba(255,255,255,0.1); }
.avatar { position:relative; width:42px; height:42px; border-radius:50%; overflow:hidden; flex-shrink:0; background:#222; display:flex; align-items:center; justify-content:center; }
.avatar img { width:100%; height:100%; object-fit:cover; display:block; }
.placeholder { color:#999; font-size:18px; }
.status-dot { position:absolute; bottom:2px; right:2px; width:10px; height:10px; border-radius:50%; background:#666; border:2px solid #1d1d1d; }
.status-dot.online { background:#16c784; }
.meta { flex:1 1 auto; min-width:0; display:flex; flex-direction:column; }
.line1 { display:flex; align-items:center; gap:.5rem; }
.name { font-weight:600; font-size:.9rem; color:#fff; max-width:120px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.badge { background:#ef4444; color:#fff; font-size:.65rem; font-weight:600; padding:2px 6px; border-radius:1rem; line-height:1; }
.line2 { font-size:.65rem; opacity:.65; color:#ddd; }
.empty { padding: .75rem; font-size:.8rem; opacity:.7; }
`,
})
export class ChatList implements OnInit {
  private environment = environment;
  private tokenStore = inject(TokenStore);
  private router = inject(Router);
  private httpReq = inject(HttpRequestService);
  private roomsSig = signal<ChatRoom[]>([]);
  private currentUserId = this.tokenStore.userId;
  private unreadMap = signal<Record<string, number>>({});
  private itemsSig = signal<ChatListItem[]>([]);
  items = computed(() => this.itemsSig());

  // Ensure a single persistent Socket.IO connection for the whole chat area
  private socket = inject(SocketService);

  ngOnInit(): void {
    this.socket.ensureConnected("/chat");
    this.fetchRooms();
    this.socket.on('newMessage', (data: unknown) => {
      const m = data as { chat_room_id?: string; created_at?: string };
      const roomId = m.chat_room_id;
      if (!roomId) return;
      const activeId = this.router.url.includes('/home/chat/') ? this.router.url.split('/home/chat/')[1] : null;
      if (activeId?.startsWith(roomId)) return;
      this.unreadMap.update(curr => ({ ...curr, [roomId]: (curr[roomId] || 0) + 1 }));
      this.itemsSig.update(list => list.map(it => it.room.id === roomId ? { ...it, unread: (it.unread || 0) + 1, lastMessageAt: m.created_at } : it));
    });
  }

  private async fetchRooms() {
    try {
      const resp = await firstValueFrom(
        this.httpReq.request(
          null,
          "/chat/user" as HttpEndpoint,
          "GET" as HttpMethod,
        ),
      );
      const rooms: ChatRoom[] = Array.isArray(resp) ? resp : (resp?.data ?? []); // accept both legacy shapes
      this.roomsSig.set(rooms);
      interface PhotoShape { id: string; user_id: string; filename: string; image_url: string; mime_type?: string; is_main?: boolean; display_order?: number; uploaded_at?: string; original_filename?: string; file_size?: number; }
      type SmallUserShape = { id: string; first_name?: string; last_name?: string; online_status?: boolean; main_photo?: PhotoShape };
      const enriched: ChatListItem[] = rooms.map(r => {
        const su1 = (r as unknown as { small_user1: SmallUserShape }).small_user1;
        const su2 = (r as unknown as { small_user2: SmallUserShape }).small_user2;
        let other: SmallUserShape = su1;
        if (this.currentUserId && su1?.id === this.currentUserId) other = su2;
        const photo = other?.main_photo;
  let userLike: User = {
          id: other?.id,
          first_name: other?.first_name,
          last_name: other?.last_name,
          online_status: other?.online_status,
          photos: photo ? [{
            id: photo.id,
            user_id: photo.user_id,
            filename: photo.filename,
            original_filename: photo.original_filename,
            image_url: photo.image_url?.startsWith('http') ? photo.image_url : `${this.environment.apiUrl}${photo.image_url}`,
            file_size: photo.file_size,
            mime_type: photo.mime_type,
            is_main: photo.is_main,
            display_order: photo.display_order,
            uploaded_at: photo.uploaded_at,
          }] : [],
        } as unknown as User;
        // If we accidentally picked current user (e.g., currentUserId not yet set when mapping), swap to the other one
        if (this.currentUserId && userLike.id === this.currentUserId) {
          const alt = other?.id === su1?.id ? su2 : su1;
          if (alt && alt.id !== userLike.id) {
            const altPhoto = alt.main_photo;
            const rebuilt: User = {
              id: alt.id,
              first_name: alt.first_name,
              last_name: alt.last_name,
              online_status: alt.online_status,
              photos: altPhoto ? [{
                id: altPhoto.id,
                user_id: altPhoto.user_id,
                filename: altPhoto.filename,
                original_filename: altPhoto.original_filename,
                image_url: altPhoto.image_url?.startsWith('http') ? altPhoto.image_url : `${this.environment.apiUrl}${altPhoto.image_url}`,
                file_size: altPhoto.file_size,
                mime_type: altPhoto.mime_type,
                is_main: altPhoto.is_main,
                display_order: altPhoto.display_order,
                uploaded_at: altPhoto.uploaded_at,
              }] : [],
            } as unknown as User;
            // replace reference
            userLike = rebuilt;
          }
        }
        return {
          room: r,
          otherUser: userLike,
          unread: this.unreadMap()[r.id] || 0,
          lastMessageAt: undefined,
          isOnline: !!other?.online_status,
        } as ChatListItem;
      });
      this.itemsSig.set(enriched);
    } catch { }
  }

  otherName(item: ChatListItem): string {
    const u = item.otherUser as unknown as { first_name?: string; last_name?: string } | undefined;
    if (!u) return 'Unknown';
    return [u.first_name, u.last_name].filter(Boolean).join(' ') || 'User';
  }

  hasPhoto(item: ChatListItem): boolean {
    const u = item.otherUser as unknown as { photos?: Array<{ image_url?: string; is_main?: boolean }> } | undefined;
    return !!u && Array.isArray(u.photos) && u.photos.length > 0;
  }

  mainPhoto(item: ChatListItem): string | undefined {
    const u = item.otherUser as unknown as { photos?: Array<{ image_url?: string; is_main?: boolean }> } | undefined;
    if (u?.photos?.length) {
      const main = u.photos.find(p => p.is_main) || u.photos[0];
      if (!main?.image_url) return undefined;
      return main.image_url.startsWith('http') ? main.image_url : `${this.environment.apiUrl}${main.image_url}`;
    }
    return undefined;
  }

  markRead(roomId: string) {
    this.unreadMap.update(curr => { if (!curr[roomId]) return curr; const copy = { ...curr }; delete copy[roomId]; return copy; });
    this.itemsSig.update(list => list.map(it => it.room.id === roomId ? { ...it, unread: 0 } : it));
  }
}
