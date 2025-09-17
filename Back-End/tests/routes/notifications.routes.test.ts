import { afterAll, beforeAll, beforeEach, describe, expect, it } from "@jest/globals";
import type { Express } from "express";
import request from "supertest";
import { server } from "../../src/server";
import { createTestApp } from "../helpers/app.helper";
import { createUserAndAccessToken } from "../helpers/auth.helper";
import { clearDatabase, closeTestPool, testQuery } from "../helpers/database.helper";

describe("Notifications Routes", () => {
	let app: Express;
	let userId: string;
	let token: string;

	beforeAll(async () => {
		app = await createTestApp();
	});

	afterAll(async () => {
		await closeTestPool();
		server.close();
	});

	beforeEach(async () => {
		await clearDatabase();
		const created = await createUserAndAccessToken({
			username: "tester",
			email: "tester@example.com",
		});
		userId = created.userId;
		token = created.token;
		// Seed few notifications (unread)
		await testQuery(
			`INSERT INTO notifications (user_id, type, status, metadata)
	   VALUES ($1, 'LIKE', 'pending', '{}'::jsonb),
			  ($1, 'MATCH', 'pending', '{}'::jsonb)
	   ON CONFLICT DO NOTHING`,
			[userId],
		);
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
		const list = await testQuery(
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
