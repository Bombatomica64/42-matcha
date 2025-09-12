import request from "supertest";
import { app } from "../../src/server";
import { pool } from "../../src/database";
import jwt from "jsonwebtoken";

// Helper to create auth token (adjust secret/env retrieval as needed)
function makeToken(userId: string) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || "secret", { expiresIn: "1h" });
}

describe("Notifications Routes", () => {
  const userId = "00000000-0000-0000-0000-000000000001"; // deterministic for test
  let token: string;

  beforeAll(async () => {
    token = makeToken(userId);
    // Ensure user exists minimal insert if absent
    await pool.query(
      `INSERT INTO users (id, username, email, birth_date, password, gender, sexual_orientation)
       VALUES ($1, 'tester', 'tester@example.com', '1990-01-01', 'hash', 'other', 'bisexual')
       ON CONFLICT (id) DO NOTHING`,
      [userId],
    );
    // Seed few notifications (unread)
    await pool.query(
      `INSERT INTO notifications (user_id, type, status, metadata)
       VALUES ($1, 'LIKE', 'pending', '{}'::jsonb),
              ($1, 'MATCH', 'pending', '{}'::jsonb)
       ON CONFLICT DO NOTHING`,
      [userId],
    );
  });

  afterAll(async () => {
    await pool.query("DELETE FROM notifications WHERE user_id = $1", [userId]);
  });

  it("should return unread count", async () => {
    const res = await request(app)
      .get("/notifications/unread-count")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(res.body.unread).toBeGreaterThanOrEqual(0);
  });

  it("should list notifications", async () => {
    const res = await request(app)
      .get("/notifications?page=1&limit=10")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("should mark one notification as read", async () => {
    const list = await pool.query(
      "SELECT id FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1",
      [userId],
    );
    const id = list.rows[0].id as string;
    const res = await request(app)
      .patch(`/notifications/${id}/read`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(res.body.id).toBe(id);
    expect(res.body.read_at).toBeDefined();
  });

  it("should mark all notifications as read", async () => {
    const res = await request(app)
      .post("/notifications/mark-all-read")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(typeof res.body.updated).toBe("number");
  });
});
