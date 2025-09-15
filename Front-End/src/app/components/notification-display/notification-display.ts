import { Component, inject, type OnInit, type OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { BadgeModule } from 'primeng/badge';
import { NotificationService } from '../../services/notification';
import type { components } from '../../../types/api';
import type { Subscription } from 'rxjs';

type Notification = components["schemas"]["Notification"];

@Component({
  selector: 'app-notification-display',
  standalone: true,
  imports: [CommonModule, ButtonModule, BadgeModule],
  template: `
    <div class="notification-container">
      <div class="notification-header">
        <h3>Notifications</h3>
        <p-button
          [badge]="unreadCount().toString()"
          icon="pi pi-bell"
          [text]="true"
          (onClick)="toggleNotifications()">
        </p-button>
      </div>

      @if (showNotifications) {
        <div class="notification-list">
          @if (isLoading()) {
            <div class="loading">Loading notifications...</div>
          } @else {
            @for (notification of notifications(); track notification.id) {
              <div class="notification-item" [class.unread]="!notification.read_at">
                <div class="notification-content">
                  <span class="notification-type">{{ getNotificationMessage(notification) }}</span>
                  <small class="notification-time">{{ formatTime(notification.created_at) }}</small>
                </div>
                @if (!notification.read_at) {
                  <p-button
                    icon="pi pi-check"
                    size="small"
                    [text]="true"
                    (onClick)="markAsRead(notification.id)">
                  </p-button>
                }
              </div>
            } @empty {
              <div class="no-notifications">No notifications yet</div>
            }
          }

          @if (notifications().length > 0) {
            <div class="notification-actions">
              <p-button
                label="Mark All Read"
                size="small"
                [outlined]="true"
                (onClick)="markAllAsRead()">
              </p-button>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .notification-container {
      max-width: 400px;
      border: 1px solid var(--surface-border);
      border-radius: 8px;
      padding: 1rem;
      background: var(--surface-card);
    }

    .notification-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .notification-header h3 {
      margin: 0;
      color: var(--text-color);
    }

    .notification-list {
      max-height: 400px;
      overflow-y: auto;
    }

    .notification-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem;
      border-bottom: 1px solid var(--surface-border);
      transition: background-color 0.2s;
    }

    .notification-item:hover {
      background: var(--surface-hover);
    }

    .notification-item.unread {
      background: var(--blue-50);
      border-left: 3px solid var(--blue-500);
    }

    .notification-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .notification-type {
      font-weight: 500;
      color: var(--text-color);
    }

    .notification-time {
      color: var(--text-color-secondary);
      font-size: 0.875rem;
    }

    .notification-actions {
      padding: 1rem 0.75rem 0;
      border-top: 1px solid var(--surface-border);
      margin-top: 0.5rem;
    }

    .loading, .no-notifications {
      text-align: center;
      padding: 2rem;
      color: var(--text-color-secondary);
    }
  `]
})
export class NotificationDisplay implements OnInit, OnDestroy {
  private notificationService = inject(NotificationService);
  private newNotificationSubscription?: Subscription;

  // Expose reactive signals
  notifications = this.notificationService.notifications;
  unreadCount = this.notificationService.unreadCount;
  isLoading = this.notificationService.isLoading;

  showNotifications = false;

  ngOnInit(): void {
    // Subscribe to new notifications for real-time updates
    this.newNotificationSubscription = this.notificationService
      .getNewNotificationObservable()
      .subscribe(notification => {
        if (notification) {
          console.log('New notification received:', notification);
          // You could show a toast notification here
        }
      });
  }

  ngOnDestroy(): void {
    this.newNotificationSubscription?.unsubscribe();
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
  }

  async markAsRead(notificationId: string): Promise<void> {
    await this.notificationService.markAsRead(notificationId);
  }

  async markAllAsRead(): Promise<void> {
    await this.notificationService.markAllAsRead();
  }

  getNotificationMessage(notification: Notification): string {
    switch (notification.type) {
      case 'LIKE':
        return 'Someone liked your profile';
      case 'PROFILE_VIEW':
        return 'Someone viewed your profile';
      case 'MATCH':
        return 'You have a new match!';
      case 'UNLIKE':
        return 'Someone unliked your profile';
      default:
        return 'You have a notification';
    }
  }

  formatTime(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  }
}
