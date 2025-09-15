import { inject, Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, type Observable } from 'rxjs';
import type { components } from '../../types/api';
import { SocketService } from './socketio';
import { environment } from '../../environments/environment';

type Notification = components["schemas"]["Notification"];
type NotificationListResponse = components["schemas"]["NotificationListResponse"];
type UnreadCountResponse = components["schemas"]["UnreadCountResponse"];

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private http = inject(HttpClient);
  private socketService = inject(SocketService);

  // Reactive state
  private _notifications = signal<Notification[]>([]);
  private _unreadCount = signal<number>(0);
  private _isLoading = signal<boolean>(false);
  private _isSubscribed = signal<boolean>(false);

  // Public readonly signals
  readonly notifications = computed(() => this._notifications());
  readonly unreadCount = computed(() => this._unreadCount());
  readonly isLoading = computed(() => this._isLoading());
  readonly isSubscribed = computed(() => this._isSubscribed());

  // Subject for new notification events
  private newNotificationSubject = new BehaviorSubject<Notification | null>(null);

  constructor() {}

  /**
   * Subscribe to real-time notifications from the backend
   */
  subscribe(): void {
    if (this._isSubscribed()) {
      console.log('[NotificationService] Already subscribed to notifications');
      return;
    }

    console.log('[NotificationService] Subscribing to notifications...');

    // Initialize socket connection
    this.socketService.initialize({
      onConnect: () => {
        console.log('[NotificationService] Socket connected for notifications');
        this._isSubscribed.set(true);
        // Load initial notifications and count
        this.loadNotifications();
        this.loadUnreadCount();
      },
      onDisconnect: (reason) => {
        console.log('[NotificationService] Socket disconnected:', reason);
        this._isSubscribed.set(false);
      },
      onConnectError: (error) => {
        console.error('[NotificationService] Socket connection error:', error);
        this._isSubscribed.set(false);
      }
    });

    // Listen for new notifications
    this.socketService.on('notification', (data: unknown) => {
      console.log('[NotificationService] New notification received:', data);
      this.handleNewNotification(data as Notification);
    });

    // Listen for notification read events
    this.socketService.on('notification:read', (data: unknown) => {
      const readData = data as { notificationId: string };
      console.log('[NotificationService] Notification marked as read:', readData);
      this.handleNotificationRead(readData.notificationId);
    });

    // Listen for bulk read events
    this.socketService.on('notifications:allRead', () => {
      console.log('[NotificationService] All notifications marked as read');
      this.handleAllNotificationsRead();
    });
  }

  /**
   * Unsubscribe from notifications
   */
  unsubscribe(): void {
    console.log('[NotificationService] Unsubscribing from notifications...');

    this.socketService.off('notification');
    this.socketService.off('notification:read');
    this.socketService.off('notifications:allRead');
    this.socketService.disconnect();

    this._isSubscribed.set(false);
    this._notifications.set([]);
    this._unreadCount.set(0);
  }

  /**
   * Load notifications from REST API
   */
  async loadNotifications(page: number = 1, limit: number = 20): Promise<void> {
    this._isLoading.set(true);

    try {
      const response = await this.http.get<NotificationListResponse>(
        `${environment.apiUrl}/notifications`,
        { params: { page: page.toString(), limit: limit.toString() } }
      ).toPromise();

      if (response?.data) {
        this._notifications.set(response.data);
      }
    } catch (error) {
      console.error('[NotificationService] Error loading notifications:', error);
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Load unread notifications count
   */
  async loadUnreadCount(): Promise<void> {
    try {
      const response = await this.http.get<UnreadCountResponse>(
        `${environment.apiUrl}/notifications/unread-count`
      ).toPromise();

      if (response?.unread !== undefined) {
        this._unreadCount.set(response.unread);
      }
    } catch (error) {
      console.error('[NotificationService] Error loading unread count:', error);
    }
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    try {
      await this.http.patch(
        `${environment.apiUrl}/notifications/${notificationId}/read`,
        {}
      ).toPromise();

      // Update local state optimistically
      this.handleNotificationRead(notificationId);
    } catch (error) {
      console.error('[NotificationService] Error marking notification as read:', error);
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    try {
      await this.http.post(
        `${environment.apiUrl}/notifications/mark-all-read`,
        {}
      ).toPromise();

      // Update local state optimistically
      this.handleAllNotificationsRead();
    } catch (error) {
      console.error('[NotificationService] Error marking all notifications as read:', error);
    }
  }

  /**
   * Get observable for new notifications
   */
  getNewNotificationObservable(): Observable<Notification | null> {
    return this.newNotificationSubject.asObservable();
  }

  /**
   * Handle new notification from socket
   */
  private handleNewNotification(notification: Notification): void {
    // Add to the beginning of the list
    const currentNotifications = this._notifications();
    this._notifications.set([notification, ...currentNotifications]);

    // Increment unread count if notification is unread
    if (!notification.read_at) {
      this._unreadCount.update(count => count + 1);
    }

    // Emit to subscribers
    this.newNotificationSubject.next(notification);
  }

  /**
   * Handle notification marked as read
   */
  private handleNotificationRead(notificationId: string): void {
    const currentNotifications = this._notifications();
    const updatedNotifications = currentNotifications.map(notification => {
      if (notification.id === notificationId && !notification.read_at) {
        // Decrement unread count
        this._unreadCount.update(count => Math.max(0, count - 1));

        return {
          ...notification,
          read_at: new Date().toISOString()
        };
      }
      return notification;
    });

    this._notifications.set(updatedNotifications);
  }

  /**
   * Handle all notifications marked as read
   */
  private handleAllNotificationsRead(): void {
    const currentNotifications = this._notifications();
    const updatedNotifications = currentNotifications.map(notification => ({
      ...notification,
      read_at: notification.read_at || new Date().toISOString()
    }));

    this._notifications.set(updatedNotifications);
    this._unreadCount.set(0);
  }
}
