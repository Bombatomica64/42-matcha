import type { Request, Response } from "express";
import { NotificationService } from "@services/notification.service";
import { extractPaginationQuery } from "@utils/pagination";
import { logger } from "../server";

export class NotificationController {
  constructor(private service: NotificationService = new NotificationService()) {}

  list = async (req: Request, res: Response) => {
    const userId = res.locals?.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    try {
      const pagination = extractPaginationQuery(req);
      const page = pagination.page ?? 1;
      const limit = pagination.limit ?? 10;
      const result = await this.service.list(
        userId,
        page,
        limit,
        pagination.sort,
        pagination.order,
      );
      res.json(result);
    } catch (e) {
      logger.error(e, "Failed to list notifications");
      res.status(500).json({ error: "SERVER_ERROR", message: "Failed to list notifications" });
    }
  };

  listUnread = async (req: Request, res: Response) => {
    const userId = res.locals?.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    try {
      const pagination = extractPaginationQuery(req);
  const page = pagination.page ?? 1;
  const limit = pagination.limit ?? 10;
  const result = await this.service.listUnread(userId, page, limit);
      res.json(result);
    } catch (e) {
      logger.error(e, "Failed to list unread notifications");
      res.status(500).json({ error: "SERVER_ERROR", message: "Failed to list unread notifications" });
    }
  };

  unreadCount = async (_req: Request, res: Response) => {
    const userId = res.locals?.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    try {
      const data = await this.service.unreadCount(userId);
      res.json(data);
    } catch (e) {
      logger.error(e, "Failed to get unread count");
      res.status(500).json({ error: "SERVER_ERROR", message: "Failed to get unread count" });
    }
  };

  markRead = async (req: Request, res: Response) => {
    const userId = res.locals?.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const { id } = req.params;
    try {
      const row = await this.service.markRead(userId, id);
      if (!row) return res.status(404).json({ error: "NOT_FOUND", message: "Notification not found" });
      res.json(row);
    } catch (e) {
      logger.error(e, "Failed to mark notification read");
      res.status(500).json({ error: "SERVER_ERROR", message: "Failed to mark notification read" });
    }
  };

  markAllRead = async (_req: Request, res: Response) => {
    const userId = res.locals?.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    try {
      const result = await this.service.markAllRead(userId);
      res.json(result);
    } catch (e) {
      logger.error(e, "Failed to mark all notifications read");
      res.status(500).json({ error: "SERVER_ERROR", message: "Failed to mark all notifications read" });
    }
  };
}
