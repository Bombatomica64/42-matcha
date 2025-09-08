import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import type { components } from '../../types/api';

type HttpChatMessage = components['schemas']['ChatMessage'];

export interface ChatCacheEntry {
  roomId: string;
  messagesAsc: HttpChatMessage[]; // ascending by created_at
  fullyLoaded: boolean;
  updatedAt: number; // epoch ms
  version: number;
}

@Injectable({ providedIn: 'root' })
export class ChatCacheService {
  private platformId = inject(PLATFORM_ID);
  private memory = new Map<string, ChatCacheEntry>();
  private saveTimers = new Map<string, any>();

  private readonly DB_NAME = 'matcha-chat';
  private readonly STORE = 'rooms';
  private readonly DB_VERSION = 1;

  private isServer(): boolean {
    return isPlatformServer(this.platformId);
  }

  // IndexedDB helpers
  private openDB(): Promise<IDBDatabase> {
    if (this.isServer() || typeof indexedDB === 'undefined') return Promise.reject('IndexedDB not available');
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(this.DB_NAME, this.DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(this.STORE)) {
          db.createObjectStore(this.STORE, { keyPath: 'roomId' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  private idbGet(roomId: string): Promise<ChatCacheEntry | undefined> {
    if (this.isServer() || typeof indexedDB === 'undefined') return Promise.resolve(undefined);
    return this.openDB().then(db => new Promise<ChatCacheEntry | undefined>((resolve, reject) => {
      const tx = db.transaction(this.STORE, 'readonly');
      const store = tx.objectStore(this.STORE);
      const req = store.get(roomId);
      req.onsuccess = () => resolve(req.result as ChatCacheEntry | undefined);
      req.onerror = () => reject(req.error);
    }));
  }

  private idbPut(entry: ChatCacheEntry): Promise<void> {
    if (this.isServer() || typeof indexedDB === 'undefined') return Promise.resolve();
    return this.openDB().then(db => new Promise<void>((resolve, reject) => {
      const tx = db.transaction(this.STORE, 'readwrite');
      const store = tx.objectStore(this.STORE);
      const req = store.put(entry);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    }));
  }

  // Public API
  async load(roomId: string): Promise<ChatCacheEntry | undefined> {
    // Memory first
    const mem = this.memory.get(roomId);
    if (mem) return mem;
    // IDB fallback
    const entry = await this.idbGet(roomId);
    if (entry) this.memory.set(roomId, entry);
    return entry;
  }

  get(roomId: string): ChatCacheEntry | undefined {
    return this.memory.get(roomId);
  }

  set(roomId: string, entry: ChatCacheEntry): void {
    this.memory.set(roomId, entry);
    this.scheduleSave(roomId);
  }

  upsertMessages(roomId: string, newMessagesAsc: HttpChatMessage[], markFullyLoaded = false): void {
    const now = Date.now();
    const current = this.memory.get(roomId) ?? { roomId, messagesAsc: [], fullyLoaded: false, updatedAt: now, version: 1 };

    // Merge while deduping by id; assume newMessagesAsc are ascending
    const seen = new Set(current.messagesAsc.map(m => m.id).filter(Boolean) as string[]);
    const merged = [...current.messagesAsc];
    for (const m of newMessagesAsc) {
      if (!m?.id || seen.has(m.id)) continue;
      seen.add(m.id);
      merged.push(m);
    }
    merged.sort((a, b) => new Date(a.created_at as string).getTime() - new Date(b.created_at as string).getTime());

    const updated: ChatCacheEntry = {
      ...current,
      messagesAsc: merged,
      fullyLoaded: current.fullyLoaded || markFullyLoaded,
      updatedAt: now,
    };
    this.memory.set(roomId, updated);
    this.scheduleSave(roomId);
  }

  markFullyLoaded(roomId: string): void {
    const curr = this.memory.get(roomId);
    if (!curr) return;
    curr.fullyLoaded = true;
    curr.updatedAt = Date.now();
    this.memory.set(roomId, curr);
    this.scheduleSave(roomId);
  }

  private scheduleSave(roomId: string): void {
    if (this.isServer()) return;
    const existing = this.saveTimers.get(roomId);
    if (existing) clearTimeout(existing);
    const timer = setTimeout(() => {
      const entry = this.memory.get(roomId);
      if (entry) void this.idbPut(entry);
      this.saveTimers.delete(roomId);
    }, 800); // debounce writes
    this.saveTimers.set(roomId, timer);
  }
}
