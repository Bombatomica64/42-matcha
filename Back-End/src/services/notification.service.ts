import { createPaginatedResponse } from "@utils/pagination";
import { NotificationRepository } from "@repositories/notification.repository";

export class NotificationService {
  private repo: NotificationRepository;

  constructor(repo: NotificationRepository = new NotificationRepository()) {
    this.repo = repo;
  }

  async list(userId: string, page: number, limit: number, sort?: string, order?: "asc" | "desc") {
    const { rows, total } = await this.repo.getPage(userId, page, limit, sort, order);
    return createPaginatedResponse(rows, total, page, limit, "/notifications");
  }

  async listUnread(userId: string, page: number, limit: number) {
    const { rows, total } = await this.repo.getUnreadPage(userId, page, limit);
    return createPaginatedResponse(rows, total, page, limit, "/notifications/unread");
  }

  async unreadCount(userId: string) {
    const unread = await this.repo.countUnread(userId);
    return { unread };
  }

  async markRead(userId: string, id: string) {
    const row = await this.repo.markRead(userId, id);
    return row || null;
  }

  async markAllRead(userId: string) {
    const updated = await this.repo.markAllRead(userId);
    return { updated };
  }
}
