import type { Pool } from "pg";
import { pool } from "../database";

export interface NotificationRow {
  id: string;
  user_id: string;
  actor_id: string | null;
  type: string;
  read_at: string | null;
  delivered_at: string | null;
  status: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export class NotificationRepository {
  private pool: Pool;

  constructor(dbPool: Pool = pool) {
    this.pool = dbPool;
  }

  async getPage(userId: string, page: number, limit: number, sort = "created_at", order: "asc" | "desc" = "desc") {
    const offset = (page - 1) * limit;
    const sortable = ["created_at", "read_at", "type"];
    const sortCol = sortable.includes(sort) ? sort : "created_at";
    const direction = order === "asc" ? "ASC" : "DESC";

    const listQuery = `SELECT id, user_id, actor_id, type, read_at, delivered_at, status, metadata, created_at
      FROM notifications
      WHERE user_id = $1
      ORDER BY ${sortCol} ${direction}, id ${direction}
      LIMIT $2 OFFSET $3`;
    const countQuery = `SELECT COUNT(*)::int as total FROM notifications WHERE user_id = $1`;

    const [listResult, countResult] = await Promise.all([
      this.pool.query(listQuery, [userId, limit, offset]),
      this.pool.query(countQuery, [userId]),
    ]);

    return { rows: listResult.rows as NotificationRow[], total: countResult.rows[0].total as number };
  }

  async getUnreadPage(userId: string, page: number, limit: number) {
    const offset = (page - 1) * limit;
    const listQuery = `SELECT id, user_id, actor_id, type, read_at, delivered_at, status, metadata, created_at
      FROM notifications
      WHERE user_id = $1 AND read_at IS NULL
      ORDER BY created_at DESC, id DESC
      LIMIT $2 OFFSET $3`;
    const countQuery = `SELECT COUNT(*)::int as total FROM notifications WHERE user_id = $1 AND read_at IS NULL`;
    const [listResult, countResult] = await Promise.all([
      this.pool.query(listQuery, [userId, limit, offset]),
      this.pool.query(countQuery, [userId]),
    ]);
    return { rows: listResult.rows as NotificationRow[], total: countResult.rows[0].total as number };
  }

  async countUnread(userId: string): Promise<number> {
    const result = await this.pool.query(
      "SELECT COUNT(*)::int as unread FROM notifications WHERE user_id = $1 AND read_at IS NULL",
      [userId],
    );
    return result.rows[0].unread as number;
  }

  async markRead(userId: string, id: string) {
    const result = await this.pool.query(
      `UPDATE notifications SET read_at = NOW() 
       WHERE id = $1 AND user_id = $2 AND read_at IS NULL
       RETURNING id, read_at`,
      [id, userId],
    );
    return result.rows[0] as { id: string; read_at: string } | undefined;
  }

  async markAllRead(userId: string) {
    const result = await this.pool.query(
      `UPDATE notifications SET read_at = NOW()
       WHERE user_id = $1 AND read_at IS NULL`,
      [userId],
    );
    return result.rowCount ?? 0;
  }
}
