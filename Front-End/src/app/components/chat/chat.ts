import { Component, computed, effect, inject, input, signal, OnDestroy, OnInit } from '@angular/core';
import { ScrollerModule } from 'primeng/scroller';
import { ChatMessage } from '../chat-message/chat-message';
import { SocketService } from '../../services/socketio';
import { ChatCacheService } from '../../services/chat-cache';
import { HttpRequestService, HttpMethod, HttpEndpoint } from '../../services/http-request';
import { firstValueFrom } from 'rxjs';
import type { components } from '../../../types/api';

// Types
type HttpChatMessage = components['schemas']['ChatMessage'];
type PaginationQuery = components['schemas']['PaginationQuery'];

@Component({
	selector: 'app-chat',
	imports: [ScrollerModule, ChatMessage],
	templateUrl: './chat.html',
	styleUrl: './chat.scss'
})
export class Chat implements OnInit, OnDestroy {
	// Inputs
	chatRoomId = input.required<string>();
	urlParams = signal<PaginationQuery | null>(null);

	// Services
	private socket = inject(SocketService);
	private http = inject(HttpRequestService);
	private cache = inject(ChatCacheService);

	// Local state
	private isTyping = signal(false);

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
			.sort((a, b) => new Date(a.created_at as string).getTime() - new Date(b.created_at as string).getTime());
	});

	// Room-scoped message handler
	private onNewMessage = (raw: unknown) => {
		const m = raw as HttpChatMessage | undefined;
		if (!m || !m.id) return;
		// Only accept messages for this room
		if (this.currentRoomId && (m as any).chat_room_id !== this.currentRoomId) return;
		if (this.seenIds.has(m.id)) return;
		this.seenIds.add(m.id);
		this.live.update(arr => [...arr, m]);
	};

	ngOnInit(): void {
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
				this.socket.emit('join', roomId);
			} else {
				if (this.connectHandler) this.socket.off('connect', this.connectHandler);
				this.connectHandler = () => this.socket.emit('join', roomId);
				this.socket.on('connect', this.connectHandler);
			}

			// Bind room-filtered listener
			this.socket.off('newMessage', this.onNewMessage);
			this.socket.on('newMessage', this.onNewMessage);

			// Load from cache immediately, then fetch latest and prefetch rest
			void this.hydrateFromCacheAndFetch(roomId);
		});
	}

	ngOnDestroy(): void {
		this.socket.off('newMessage', this.onNewMessage);
		if (this.connectHandler) {
			this.socket.off('connect', this.connectHandler);
			this.connectHandler = null;
		}
	}

	// Load the latest page (page=1 order=desc), reverse to asc and set as older bucket
	private async loadLatest(roomId: string) {
		try {
			this.loadingInitial.set(true);
			const query = `?page=1&limit=${this.pageSize}&sort=created_at&order=desc`;
			const data = await firstValueFrom(
				this.http.request(null, `/chat/${roomId}/messages${query}` as HttpEndpoint, 'GET' as HttpMethod)
			);
			const asc = [...data].reverse();
			for (const m of asc) if (m.id) this.seenIds.add(m.id);
			this.older.set(asc);
		} catch (e: any) {
			this.loadError.set(e?.message ?? 'Failed to load messages');
		} finally {
			this.loadingInitial.set(false);
		}
	}

	// Hydrate from cache if present, then fetch latest page and prefetch the entire history in background
	private async hydrateFromCacheAndFetch(roomId: string) {
		// 1) Hydrate from cache (IDB or memory) with ascending messages
		const cached = await this.cache.load(roomId);
		if (cached?.messagesAsc?.length) {
			// seed older with cached history
			this.older.set(cached.messagesAsc);
			this.seenIds = new Set(cached.messagesAsc.map(m => m.id!).filter(Boolean) as string[]);
		}

		// 2) Always fetch the latest page to capture anything new since cache
		await this.loadLatest(roomId);

		// 3) Persist current merged in cache
		this.cache.upsertMessages(roomId, this.messages());

		// 4) If not fully loaded, prefetch all older pages in background once per session
		if (!cached?.fullyLoaded) {
			void this.prefetchAll(roomId).then(() => this.cache.markFullyLoaded(roomId));
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
					this.http.request(null, `/chat/${roomId}/messages${query}` as HttpEndpoint, 'GET' as HttpMethod)
				);
				if (!pageData?.length) break;
				const asc = [...pageData].reverse();
				// Update component state minimally to keep merge consistent
				const dedup = asc.filter(m => !!m.id && !this.seenIds.has(m.id!));
				dedup.forEach(m => this.seenIds.add(m.id!));
				this.older.update(curr => [...dedup, ...curr]);
				// Update cache
				this.cache.upsertMessages(roomId, dedup);
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
				this.http.request(null, `/chat/${roomId}/messages${query}` as HttpEndpoint, 'GET' as HttpMethod)
			);
			const asc = [...pageData].reverse();
			// Deduplicate and prepend
			const dedup = asc.filter(m => !!m.id && !this.seenIds.has(m.id!));
			dedup.forEach(m => this.seenIds.add(m.id!));
			this.older.update(curr => [...dedup, ...curr]);
			this.page.set(nextPage);
		} catch (e: any) {
			this.loadError.set(e?.message ?? 'Failed to load older messages');
		} finally {
			this.loadingOlder.set(false);
		}
	}
}
