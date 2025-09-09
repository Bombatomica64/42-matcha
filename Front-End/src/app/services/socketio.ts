import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { io, type Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';
import { TokenStore } from './token-store';
import { isPlatformBrowser } from '@angular/common';

export interface SocketHandlers {
  onConnect?: () => void;
  onDisconnect?: (reason: string) => void;
  onConnectError?: (error: Error) => void;
  onMessage?: (data: unknown) => void;
  onError?: (error: Error) => void;
}

@Injectable({ providedIn: 'root' })
export class SocketService {
  private socket: Socket | null = null;
  private tokenStore = inject(TokenStore);
  private platformId = inject(PLATFORM_ID);
  private isInitialized = false;
  private currentNamespace: string = '';


  /**
   * Initialize the socket connection with handlers.
   * Optionally provide a namespace (e.g., '/chat').
   */
  initialize(handlers: SocketHandlers = {}, namespace?: string): void {
    // Only initialize socket on browser platform
    if (!isPlatformBrowser(this.platformId)) {
      console.log('[SocketService] Skipping socket initialization on server');
      return;
    }

    const ns = namespace ? (namespace.startsWith('/') ? namespace : `/${namespace}`) : '';
    const alreadySameNs = this.socket && this.currentNamespace === ns;
    if (this.isInitialized && alreadySameNs && this.socket?.connected) {
      // Already connected to the same namespace; just attach any additional handlers
      this.setupEventHandlers(handlers);
      return;
    }

    const token = this.tokenStore.getAccessToken();
    if (!token) {
      console.error('No access token available for socket connection');
      return;
    }

    // Use different URLs for SSR vs browser and append optional namespace
    const baseUrl = isPlatformBrowser(this.platformId)
      ? environment.socketUrl
      : environment.serverSocketUrl;
    const socketUrl = `${baseUrl}${ns}`;

    console.log('[SocketService] Connecting to:', socketUrl);
    console.log('[SocketService] Token:', token ? 'Present' : 'Missing');
    console.log('[SocketService] Platform:', isPlatformBrowser(this.platformId) ? 'Browser' : 'Server');
    if (ns) console.log('[SocketService] Namespace:', ns);

    // If switching namespace from a previous connection, disconnect first
    if (this.socket && !alreadySameNs) {
      try { this.socket.disconnect(); } catch { }
      this.socket = null;
      this.isInitialized = false;
    }

    this.socket = io(socketUrl, {
      withCredentials: true,
      auth: { token },
      timeout: 20000,
      forceNew: !alreadySameNs,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    console.log('[SocketService] Socket instance created with transports:', ['websocket', 'polling']);
    this.setupEventHandlers(handlers);
    this.isInitialized = true;
    this.currentNamespace = ns;
  }

  /**
   * Connect directly to a namespace (e.g., '/chat').
   * If already connected, disconnects and reconnects to the new namespace.
   */
  connectNamespace(namespace: string, handlers: SocketHandlers = {}): void {
    if (!isPlatformBrowser(this.platformId)) {
      console.log('[SocketService] Skipping connectNamespace on server:', namespace);
      return;
    }
    this.ensureConnected(namespace, handlers);
  }

  /** Ensure a single persistent connection; connect if not connected or namespace differs. */
  ensureConnected(namespace?: string, handlers: SocketHandlers = {}): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const ns = namespace ? (namespace.startsWith('/') ? namespace : `/${namespace}`) : '';

    if (this.socket?.connected && this.currentNamespace === ns) {
      this.setupEventHandlers(handlers);
      return;
    }
    if (this.socket && this.currentNamespace === ns && !this.socket.connected) {
      this.socket.connect();
      this.setupEventHandlers(handlers);
      this.isInitialized = true;
      return;
    }
    this.initialize(handlers, ns || undefined);
  }

  // Convenience helpers for chat namespace usage
  join(roomId: string): void {
    this.emit('join', typeof roomId === 'string' ? roomId : String(roomId));
  }
  joinWithUser(userId: string): void {
    this.emit('join:withUser', typeof userId === 'string' ? userId : String(userId));
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(handlers: SocketHandlers): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
      console.log('Transport:', this.socket?.io.engine.transport.name);
      handlers.onConnect?.();
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log('Socket disconnected:', reason);
      handlers.onDisconnect?.(reason);
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('Socket connection error:', error);
      handlers.onConnectError?.(error);
    });

    // Message events
    this.socket.on('message', (data: unknown) => {
      handlers.onMessage?.(data);
    });

    this.socket.on('error', (error: Error) => {
      console.error('Socket error:', error);
      handlers.onError?.(error);
    });

    // Transport upgrade events (for debugging)
    this.socket.io.engine.on('upgrade', () => {
      console.log('Transport upgraded to:', this.socket?.io.engine.transport.name);
    });
  }

  /**
   * Add additional event handlers after initialization
   */
  addHandlers(handlers: SocketHandlers): void {
    if (!this.socket) {
      console.error('Socket not initialized. Call initialize() first.');
      return;
    }

    if (handlers.onConnect) {
      this.socket.on('connect', handlers.onConnect);
    }

    if (handlers.onDisconnect) {
      this.socket.on('disconnect', handlers.onDisconnect);
    }

    if (handlers.onConnectError) {
      this.socket.on('connect_error', handlers.onConnectError);
    }

    if (handlers.onMessage) {
      this.socket.on('message', handlers.onMessage);
    }

    if (handlers.onError) {
      this.socket.on('error', handlers.onError);
    }
  }

  /**
   * Send a message to the server
   */
  sendMessage(message: string): void {
    if (!this.socket?.connected) {
      console.error('Socket not connected');
      return;
    }
    this.socket.emit('message', message);
  }

  /**
   * Emit custom events
   */
  emit(event: string, data?: unknown): void {
    if (!isPlatformBrowser(this.platformId)) {
      console.log('[SocketService] Skipping emit on server:', event);
      return;
    }
    if (!this.socket?.connected) {
      console.error('Socket not connected');
      return;
    }
    this.socket.emit(event, data);
  }

  /**
   * Listen to custom events
   */
  on(event: string, callback: (data: unknown) => void): void {
    if (!isPlatformBrowser(this.platformId)) {
      console.log('[SocketService] Skipping event listener on server:', event);
      return;
    }
    if (!this.socket) {
      console.error('Socket not initialized');
      return;
    }
    this.socket.on(event, callback);
  }

  /**
   * Remove event listeners
   */
  off(event: string, callback?: (data: unknown) => void): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    if (!this.socket) {
      console.error('Socket not initialized');
      return;
    }
    this.socket.off(event, callback);
  }

  /**
   * Join a room
   */
  joinRoom(roomId: string): void {
    if (!isPlatformBrowser(this.platformId)) {
      console.log('[SocketService] Skipping joinRoom on server:', roomId);
      return;
    }
    if (!this.socket?.connected) {
      console.error('Socket not connected');
      return;
    }
    this.socket.emit('joinRoom', roomId);
  }

  /**
   * Leave a room
   */
  leaveRoom(roomId: string): void {
    if (!isPlatformBrowser(this.platformId)) {
      console.log('[SocketService] Skipping leaveRoom on server:', roomId);
      return;
    }
    if (!this.socket?.connected) {
      console.error('Socket not connected');
      return;
    }
    this.socket.emit('leaveRoom', roomId);
  }

  /**
   * Get connection status
   */
  get isConnected(): boolean {
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }
    return this.socket?.connected ?? false;
  }

  /**
   * Get socket ID
   */
  get socketId(): string | undefined {
    return this.socket?.id;
  }

  /**
   * Get current transport
   */
  get transport(): string | undefined {
    return this.socket?.io.engine.transport.name;
  }

  /**
   * Reconnect manually
   */
  reconnect(): void {
    if (!this.socket) {
      console.error('Socket not initialized');
      return;
    }
    this.socket.connect();
  }

  /**
   * Disconnect and cleanup
   */
  disconnect(): void {
    if (!isPlatformBrowser(this.platformId)) {
      console.log('[SocketService] Skipping disconnect on server');
      return;
    }
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isInitialized = false;
    }
  }

  /**
   * Update authentication token
   */
  updateToken(newToken: string): void {
    if (this.socket) {
      this.socket.auth = { token: newToken };
      if (this.socket.connected) {
        this.socket.disconnect().connect();
      }
    }
  }
}
