import {
	Component,
	computed,
	effect,
	inject,
	input,
	type OnDestroy,
	type OnInit,
	signal,
} from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { ScrollerModule } from "primeng/scroller";
import { firstValueFrom } from "rxjs";
import type { components } from "../../../types/api";
import { ChatCacheService } from "../../services/chat-cache";
import {
	type HttpEndpoint,
	type HttpMethod,
	HttpRequestService,
} from "../../services/http-request";
import { SocketService } from "../../services/socketio";

// Types
type HttpChatMessage = components["schemas"]["ChatMessage"];
type PaginationQuery = components["schemas"]["PaginationQuery"];

@Component({
	selector: "app-chat",
	imports: [ScrollerModule],
	templateUrl: "./chat.html",
	styleUrl: "./chat.scss",
})
export class Chat implements OnInit, OnDestroy {
	// Inputs
	chatRoomId = input.required<string>();
	urlParams = signal<PaginationQuery | null>(null);

	// Services
	private socket = inject(SocketService);
	private http = inject(HttpRequestService);
	private cache = inject(ChatCacheService);
	private route = inject(ActivatedRoute);

	// Local state

	private older = signal<HttpChatMessage[]>([]);
	private live = signal<HttpChatMessage[]>([]);
	private seenIds = new Set<string>();

	// Pagination state
	private page = signal(1);
	private readonly pageSize = 30;
	loadingInitial = signal(false);
	loadingOlder = signal(false);
	loadError = signal<string | null>(null);

	// Track current room and late-join handler
	private currentRoomId: string | null = null;
	private connectHandler: (() => void) | null = null;

	// Final merged messages in ascending chronological order
	messages = computed(() => {
		const merged = [...this.older(), ...this.live()];
		return merged
			.slice()
			.sort(
				(a, b) =>
					new Date(a.created_at as string).getTime() -
					new Date(b.created_at as string).getTime(),
			);
	});

	// Room-scoped message handler
	private onNewMessage = (raw: unknown) => {
		if (!raw || typeof raw !== "object") return;
		const m = raw as Partial<HttpChatMessage>;
		if (!m.id) return;
		if (this.currentRoomId && m.chat_room_id !== this.currentRoomId) return;
		if (this.seenIds.has(m.id)) return;
		this.seenIds.add(m.id);
		this.live.update((arr) => [...arr, m as HttpChatMessage]);
	};

	ngOnInit(): void {
		// Seed from resolver if present (SSR prefetch)
		const pre = this.route.snapshot.data["chatPrefetch"] as {
			roomId: string;
			messagesAsc: HttpChatMessage[];
		} | null;
		if (pre?.roomId && pre.messagesAsc?.length) {
			this.older.set(pre.messagesAsc);
			for (const m of pre.messagesAsc) if (m.id) this.seenIds.add(m.id);
			// Cache immediately
			this.cache.upsertMessages(pre.roomId, pre.messagesAsc);
		}
		// Parent component (ChatList) establishes the socket connection
		effect(() => {
			const rid = this.chatRoomId();
			if (rid == null) return;
			const roomId = String(rid);
			this.currentRoomId = roomId;

			// Reset per-room state
			this.live.set([]);
			this.older.set([]);
			this.seenIds.clear();
			this.page.set(1);
			this.loadError.set(null);

			// Join the room now or on connect
			if (this.socket.isConnected) {
				this.socket.emit("join", roomId);
			} else {
				if (this.connectHandler)
					this.socket.off("connect", this.connectHandler);
				this.connectHandler = () => this.socket.emit("join", roomId);
				this.socket.on("connect", this.connectHandler);
			}

			// Bind room-filtered listener
			this.socket.off("newMessage", this.onNewMessage);
			this.socket.on("newMessage", this.onNewMessage);

			// Load from cache immediately, then fetch latest and prefetch rest
			void this.hydrateFromCacheAndFetch(roomId);
		});
	}

	ngOnDestroy(): void {
		this.socket.off("newMessage", this.onNewMessage);
		if (this.connectHandler) {
			this.socket.off("connect", this.connectHandler);
			this.connectHandler = null;
		}
	}

	// Load the latest page (page=1 order=desc), reverse to asc and set as older bucket
	private async loadLatest(roomId: string) {
		try {
			this.loadingInitial.set(true);
			const query = `?page=1&limit=${this.pageSize}&sort=created_at&order=desc`;
			const data = await firstValueFrom(
				this.http.request(
					null,
					`/chat/${roomId}/messages${query}` as HttpEndpoint,
					"GET" as HttpMethod,
				),
			);
			const arr: HttpChatMessage[] = Array.isArray(data)
				? (data as HttpChatMessage[])
				: [];
			const asc = [...arr].reverse();
			for (const m of asc) if (m?.id) this.seenIds.add(m.id);
			this.older.set(asc);
		} catch (e) {
			const msg = e instanceof Error ? e.message : "Failed to load messages";
			this.loadError.set(msg);
		} finally {
			this.loadingInitial.set(false);
		}
	}

	// Hydrate from cache if present, then fetch latest page and prefetch the entire history in background
	private async hydrateFromCacheAndFetch(roomId: string) {
		// 1) Hydrate from cache (IDB or memory) with ascending messages
		const cached = await this.cache.load(roomId);
		if (cached?.messagesAsc?.length) {
			this.older.set(cached.messagesAsc as HttpChatMessage[]);
			this.seenIds = new Set(
				cached.messagesAsc
					.map((m) => (m && "id" in m ? (m as HttpChatMessage).id : undefined))
					.filter((v): v is string => typeof v === "string"),
			);
		}

		// 2) Always fetch the latest page to capture anything new since cache
		await this.loadLatest(roomId);

		// 3) Persist current merged in cache
		this.cache.upsertMessages(roomId, this.messages());

		// 4) If not fully loaded, prefetch all older pages in background once per session
		if (!cached?.fullyLoaded) {
			void this.prefetchAll(roomId).then(() =>
				this.cache.markFullyLoaded(roomId),
			);
		}
	}

	// Prefetch all remaining pages and cache them; does not block UI
	private async prefetchAll(roomId: string) {
		// Start from page 2 onward until server returns empty
		let next = 2;
		// Defend against re-entry
		let keepGoing = true;
		while (keepGoing) {
			try {
				const query = `?page=${next}&limit=${this.pageSize}&sort=created_at&order=desc`;
				const pageData = await firstValueFrom(
					this.http.request(
						null,
						`/chat/${roomId}/messages${query}` as HttpEndpoint,
						"GET" as HttpMethod,
					),
				);
				const arr: HttpChatMessage[] = Array.isArray(pageData)
					? (pageData as HttpChatMessage[])
					: [];
				if (!arr.length) break;
				const asc = [...arr].reverse();
				const dedup = asc.filter((m) => !!m?.id && !this.seenIds.has(m.id));
				dedup.forEach((m) => m.id && this.seenIds.add(m.id));
				this.older.update((curr) => [...(dedup as HttpChatMessage[]), ...curr]);
				this.cache.upsertMessages(roomId, dedup as HttpChatMessage[]);
				next++;
			} catch {
				// Stop prefetch on error (network etc.)
				keepGoing = false;
			}
		}
	}

	// Load older pages (page 2, 3, ...) using server order desc and prepend as asc
	async loadOlder(): Promise<void> {
		if (this.loadingOlder()) return;
		const rid = this.chatRoomId();
		if (rid == null) return;
		const roomId = String(rid);
		const nextPage = this.page() + 1;
		try {
			this.loadingOlder.set(true);
			const query = `?page=${nextPage}&limit=${this.pageSize}&sort=created_at&order=desc`;
			const pageData = await firstValueFrom(
				this.http.request(
					null,
					`/chat/${roomId}/messages${query}` as HttpEndpoint,
					"GET" as HttpMethod,
				),
			);
			const arr: HttpChatMessage[] = Array.isArray(pageData)
				? (pageData as HttpChatMessage[])
				: [];
			const asc = [...arr].reverse();
			const dedup = asc.filter((m) => !!m?.id && !this.seenIds.has(m.id));
			dedup.forEach((m) => m.id && this.seenIds.add(m.id));
			this.older.update((curr) => [...(dedup as HttpChatMessage[]), ...curr]);
			this.page.set(nextPage);
		} catch (e) {
			const msg =
				e instanceof Error ? e.message : "Failed to load older messages";
			this.loadError.set(msg);
		} finally {
			this.loadingOlder.set(false);
		}
	}
}
