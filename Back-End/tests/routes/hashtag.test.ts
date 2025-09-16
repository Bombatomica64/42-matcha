import { afterAll, beforeAll, beforeEach, describe, expect, it } from "@jest/globals";
import type { Express } from "express";
import request from "supertest";
import type { components, PaginatedResponse } from "../../src/generated/typescript/api";
import { createTestApp } from "../helpers/app.helper";
import { createUserAndAccessToken } from "../helpers/auth.helper";
import { clearDatabase, closeTestPool, seedTestData } from "../helpers/database.helper";

type Hashtag = components["schemas"]["Hashtag"];
type PaginatedHashtags = PaginatedResponse<Hashtag>;
type SuccessResponse = components["schemas"]["SuccessResponse"];
type ErrorResponse = components["schemas"]["ErrorResponse"];

// Helper guard: error objects can be ErrorResponse or simple { message }
const hasErrorOrMessage = (obj: unknown): obj is ErrorResponse | { message: string } => {
	if (!obj || typeof obj !== "object") return false;
	const rec = obj as Record<string, unknown>;
	return typeof rec.error === "string" || typeof rec.message === "string";
};

describe("Hashtag Routes", () => {
	let app: Express;
	let authToken: string;

	beforeAll(async () => {
		app = await createTestApp();
	});

	afterAll(async () => {
		await closeTestPool();
	});

	beforeEach(async () => {
		await clearDatabase();
		await seedTestData();

		// Create a test user and generate a valid access token without hitting /auth/login
		const userAuth = await createUserAndAccessToken({
			email: "test@example.com",
			username: "testuser",
			firstName: "Test",
			lastName: "User",
			password: "SecurePassword123!",
			birthDate: "1990-01-01",
			gender: "male",
		});

		authToken = userAuth.token;
	});

	describe("GET /hashtags/search", () => {
		it("should search hashtags by keyword", async () => {
			const response = await request(app)
				.get("/hashtags/search")
				.set("Authorization", `Bearer ${authToken}`)
				.query({ q: "travel" })
				.expect(200);

			const payload = response.body as PaginatedHashtags;
			expect(payload).toHaveProperty("data");
			expect(Array.isArray(payload.data)).toBe(true);
			for (const hashtag of payload.data ?? []) {
				expect(hashtag).toHaveProperty("id");
				expect(typeof hashtag.name).toBe("string");
				expect(hashtag.name.toLowerCase()).toContain("travel");
			}
		});

		it("should return empty array for non-existent hashtag", async () => {
			const response = await request(app)
				.get("/hashtags/search")
				.set("Authorization", `Bearer ${authToken}`)
				.query({ q: "nonexistenthashtag" })
				.expect(200);

			const payload = response.body as PaginatedHashtags;
			expect(payload).toHaveProperty("data");
			expect((payload.data ?? []).length).toBe(0);
		});

		it("should handle missing query parameter (returns paginated list)", async () => {
			const response = await request(app)
				.get("/hashtags/search")
				.set("Authorization", `Bearer ${authToken}`)
				.expect(200);

			const payload = response.body as PaginatedHashtags;
			expect(payload).toHaveProperty("data");
			expect(Array.isArray(payload.data)).toBe(true);
		});

		it("should reject request without authentication", async () => {
			const response = await request(app)
				.get("/hashtags/search")
				.query({ q: "travel" })
				.expect(401);

			const err = response.body as unknown;
			// Controller returns { message } for unauthorized, while schema shows ErrorResponse in some places
			expect(hasErrorOrMessage(err)).toBe(true);
		});
	});

	describe("POST /hashtags/:id", () => {
		it("should add hashtag to user", async () => {
			// First get a hashtag ID from seeded data
			const searchResponse = await request(app)
				.get("/hashtags/search")
				.set("Authorization", `Bearer ${authToken}`)
				.query({ q: "travel" });

			const payload = searchResponse.body as PaginatedHashtags;
			expect((payload.data ?? []).length).toBeGreaterThan(0);
			const hashtagId = (payload.data ?? [])[0].id as number;

			const response = await request(app)
				.post(`/hashtags/${hashtagId}`)
				.set("Authorization", `Bearer ${authToken}`)
				.expect(200);

			const ok = response.body as SuccessResponse;
			expect(typeof ok.message).toBe("string");
			expect(ok.message ?? "").toContain("added");
		});

		it("should return 404 for non-existent hashtag", async () => {
			const response = await request(app)
				.post("/hashtags/999999")
				.set("Authorization", `Bearer ${authToken}`)
				.expect(404);

			const err = response.body as unknown;
			expect(hasErrorOrMessage(err)).toBe(true);
		});

		it("should reject request without authentication", async () => {
			const response = await request(app).post("/hashtags/1").expect(401);

			const err = response.body as unknown;
			expect(hasErrorOrMessage(err)).toBe(true);
		});
	});

	describe("DELETE /hashtags/:id", () => {
		it("should remove hashtag from user", async () => {
			// First add a hashtag to the user
			const searchResponse = await request(app)
				.get("/hashtags/search")
				.set("Authorization", `Bearer ${authToken}`)
				.query({ q: "travel" });

			const payload = searchResponse.body as PaginatedHashtags;
			const hashtagId = (payload.data ?? [])[0].id as number;

			// Add it first
			await request(app).post(`/hashtags/${hashtagId}`).set("Authorization", `Bearer ${authToken}`);

			// Then remove it
			const response = await request(app)
				.delete(`/hashtags/${hashtagId}`)
				.set("Authorization", `Bearer ${authToken}`)
				.expect(200);

			const ok = response.body as SuccessResponse;
			expect(typeof ok.message).toBe("string");
			expect(ok.message ?? "").toContain("removed");
		});

		it("should return 404 for non-existent hashtag", async () => {
			const response = await request(app)
				.delete("/hashtags/999999")
				.set("Authorization", `Bearer ${authToken}`)
				.expect(404);

			const err = response.body as unknown;
			expect(hasErrorOrMessage(err)).toBe(true);
		});

		it("should reject request without authentication", async () => {
			const response = await request(app).delete("/hashtags/1").expect(401);

			const err = response.body as unknown;
			expect(hasErrorOrMessage(err)).toBe(true);
		});
	});
});
