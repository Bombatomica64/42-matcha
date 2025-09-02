import type { Express } from "express";
import request from "supertest";
import { createAndAuthenticateUser, createTestApp } from "../helpers/app.helper";
import { clearDatabase, closeTestPool, seedTestData } from "../helpers/database.helper";

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

		// Create and authenticate a test user that can actually log in
		const userAuth = await createAndAuthenticateUser(app, {
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

			expect(response.body).toHaveProperty("hashtags");
			expect(Array.isArray(response.body.hashtags)).toBe(true);

			// Check that returned hashtags contain the search term
			for (const hashtag of response.body.hashtags) {
				expect(hashtag.name.toLowerCase()).toContain("travel");
			}
		});

		it("should return empty array for non-existent hashtag", async () => {
			const response = await request(app)
				.get("/hashtags/search")
				.set("Authorization", `Bearer ${authToken}`)
				.query({ q: "nonexistenthashtag" })
				.expect(200);

			expect(response.body).toHaveProperty("hashtags");
			expect(response.body.hashtags).toHaveLength(0);
		});

		it("should require search query parameter", async () => {
			const response = await request(app)
				.get("/hashtags/search")
				.set("Authorization", `Bearer ${authToken}`)
				.expect(400);

			expect(response.body).toHaveProperty("error");
		});

		it("should reject request without authentication", async () => {
			const response = await request(app)
				.get("/hashtags/search")
				.query({ q: "travel" })
				.expect(401);

			expect(response.body).toHaveProperty("error");
		});
	});

	describe("POST /hashtags/:id", () => {
		it("should add hashtag to user", async () => {
			// First get a hashtag ID from seeded data
			const searchResponse = await request(app)
				.get("/hashtags/search")
				.set("Authorization", `Bearer ${authToken}`)
				.query({ q: "travel" });

			expect(searchResponse.body.hashtags.length).toBeGreaterThan(0);
			const hashtagId = searchResponse.body.hashtags[0].id;

			const response = await request(app)
				.post(`/hashtags/${hashtagId}`)
				.set("Authorization", `Bearer ${authToken}`)
				.expect(200);

			expect(response.body).toHaveProperty("message");
			expect(response.body.message).toContain("added");
		});

		it("should return 404 for non-existent hashtag", async () => {
			const response = await request(app)
				.post("/hashtags/999999")
				.set("Authorization", `Bearer ${authToken}`)
				.expect(404);

			expect(response.body).toHaveProperty("error");
		});

		it("should reject request without authentication", async () => {
			const response = await request(app).post("/hashtags/1").expect(401);

			expect(response.body).toHaveProperty("error");
		});
	});

	describe("DELETE /hashtags/:id", () => {
		it("should remove hashtag from user", async () => {
			// First add a hashtag to the user
			const searchResponse = await request(app)
				.get("/hashtags/search")
				.set("Authorization", `Bearer ${authToken}`)
				.query({ q: "travel" });

			const hashtagId = searchResponse.body.hashtags[0].id;

			// Add it first
			await request(app).post(`/hashtags/${hashtagId}`).set("Authorization", `Bearer ${authToken}`);

			// Then remove it
			const response = await request(app)
				.delete(`/hashtags/${hashtagId}`)
				.set("Authorization", `Bearer ${authToken}`)
				.expect(200);

			expect(response.body).toHaveProperty("message");
			expect(response.body.message).toContain("removed");
		});

		it("should return 404 for non-existent hashtag", async () => {
			const response = await request(app)
				.delete("/hashtags/999999")
				.set("Authorization", `Bearer ${authToken}`)
				.expect(404);

			expect(response.body).toHaveProperty("error");
		});

		it("should reject request without authentication", async () => {
			const response = await request(app).delete("/hashtags/1").expect(401);

			expect(response.body).toHaveProperty("error");
		});
	});
});
