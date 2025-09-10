import { httpResource } from "@angular/common/http";
import { Component, inject, type OnInit } from "@angular/core";
import { RouterLink } from "@angular/router";
import { environment } from "../../../environments/environment";
import type { components } from "../../../types/api";
import { SocketService } from "../../services/socketio";

type ChatRoom = components["schemas"]["ChatRoom"];

@Component({
	selector: "app-chat-list",
	standalone: true,
	imports: [RouterLink],
	template: `<div class="router-frame">
					@if (chatList.value()?.length) {
						<div class="chat-list">
							@for (chat of chatList.value(); track chat.id) {
								<button class="chat-item" [routerLink]="['/home/chat', chat.id]" type="button">
									<span class="title">Chat {{ chat.id }}</span>
								</button>
							}
						</div>
					} @else {
						<div class="empty">No chats yet</div>
					}
				</div>`,
	styles: `
		.chat-list { display: flex; flex-direction: column; gap: 4px; padding: 8px; }
		.chat-item { text-align: left; padding: 8px 10px; border: 1px solid rgba(0,0,0,0.1); background: #fff; border-radius: 6px; cursor: pointer; font: inherit; transition: background .15s; }
		.chat-item:hover { background: #f5f5f5; }
		.empty { padding: 12px; color: #666; font-size: 14px; }
	`,
})
export class ChatList implements OnInit {
	private environment = environment;
	chatList = httpResource<ChatRoom[]>(() => {
		return `${this.environment.apiUrl}/chat/user`;
	});

	// Ensure a single persistent Socket.IO connection for the whole chat area
	private socket = inject(SocketService);

	ngOnInit(): void {
		this.socket.ensureConnected("/chat");
	}
}
