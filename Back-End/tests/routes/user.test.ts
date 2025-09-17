import { afterAll, beforeAll, beforeEach, describe, expect, it } from "@jest/globals";
import type { Express } from "express";
import request from "supertest";
import { server } from "../../src/server";
import { createTestApp } from "../helpers/app.helper";
import { createUserAndAccessToken } from "../helpers/auth.helper";
import { clearDatabase, closeTestPool, seedTestData } from "../helpers/database.helper";

describe("User Routes", () => {
	let app: Express;
	let authToken: string;
	let _userId: string;

	beforeAll(async () => {
		app = await createTestApp();
	});

	afterAll(async () => {
		await closeTestPool();
		server.close();
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
		_userId = userAuth.userId;
	});

	describe("GET /users/profile", () => {
		it("should get current user profile with valid token", async () => {
			const response = await request(app)
				.get("/users/profile")
				.set("Authorization", `Bearer ${authToken}`)
				.expect(200);

			expect(response.body).toHaveProperty("user");
			expect(response.body.user).toHaveProperty("email", "test@example.com");
			// API returns "name" (username) in mapper; accept either
			const un = response.body.user.username ?? response.body.user.name;
			expect(un).toBe("testuser");
			expect(response.body.user).not.toHaveProperty("password");
		});

		it("should reject request without token", async () => {
			const response = await request(app).get("/users/profile").expect(401);
			// Middleware returns { message: "Unauthorized" }
			expect(response.body).toHaveProperty("message");
		});

		it("should reject request with invalid token", async () => {
			const response = await request(app)
				.get("/users/profile")
				.set("Authorization", "Bearer invalid-token")
				.expect(401);
			// Could be invalid token type or verification failed
			expect(response.body).toHaveProperty("message");
		});
	});

	describe("PUT /users/profile", () => {
		it("should replace entire user profile with complete data", async () => {
			const completeProfileData = {
				username: "updateduser",
				email: "updated@example.com",
				birth_date: "1990-01-01",
				bio: "This is my updated bio",
				first_name: "Updated",
				last_name: "Name",
				gender: "male",
				sexual_orientation: "heterosexual",
				location: {
					latitude: 40.7128,
					longitude: -74.006,
				},
				location_manual: false,
				fame_rating: 3,
				profile_complete: true,
			};

			const response = await request(app)
				.put("/users/profile")
				.set("Authorization", `Bearer ${authToken}`)
				.send(completeProfileData)
				.expect(200);

			expect(response.body).toHaveProperty("user");
			expect(response.body.user).toHaveProperty("first_name", "Updated");
			expect(response.body.user).toHaveProperty("last_name", "Name");
			expect(response.body.user).toHaveProperty("bio", "This is my updated bio");
			expect(response.body.user).toHaveProperty("gender", "male");
			expect(response.body.user).toHaveProperty("sexual_orientation", "heterosexual");
		});

		it("should reject incomplete profile data", async () => {
			const incompleteData = {
				first_name: "Updated",
				// Missing required fields like last_name, username, bio, gender, sexual_orientation
			};

			const response = await request(app)
				.put("/users/profile")
				.set("Authorization", `Bearer ${authToken}`)
				.send(incompleteData)
				.expect(400);

			expect(response.body).toHaveProperty("error");
		});

		it("should reject invalid field values", async () => {
			const invalidData = {
				username: "",
				email: "invalid-email",
				birth_date: "1990-01-01",
				bio: "Bio",
				first_name: "", // Empty name should be invalid
				last_name: "Name",
				gender: "invalid_gender",
				sexual_orientation: "heterosexual",
				location: {
					latitude: 40.7128,
					longitude: -74.006,
				},
			};

			const response = await request(app)
				.put("/users/profile")
				.set("Authorization", `Bearer ${authToken}`)
				.send(invalidData)
				.expect(400);

			expect(response.body).toHaveProperty("error");
		});
	});

	describe("PATCH /users/profile", () => {
		it("should partially update user profile", async () => {
			const patchData = {
				first_name: "Patched",
				bio: "This is my patched bio",
			};

			const response = await request(app)
				.patch("/users/profile")
				.set("Authorization", `Bearer ${authToken}`)
				.send(patchData)
				.expect(200);

			expect(response.body).toHaveProperty("user");
			expect(response.body.user).toHaveProperty("first_name", "Patched");
			expect(response.body.user).toHaveProperty("bio", "This is my patched bio");
			// Other fields should remain unchanged
			expect(response.body.user).toHaveProperty("last_name", "User");
		});

		it("should update only provided fields", async () => {
			const patchData = {
				sexual_orientation: "bisexual",
				location: {
					latitude: 41.8781,
					longitude: -87.6298,
				},
			};

			const response = await request(app)
				.patch("/users/profile")
				.set("Authorization", `Bearer ${authToken}`)
				.send(patchData)
				.expect(200);

			expect(response.body).toHaveProperty("user");
			expect(response.body.user).toHaveProperty("sexual_orientation", "bisexual");
			expect(response.body.user.location).toHaveProperty("latitude", 41.8781);
			expect(response.body.user.location).toHaveProperty("longitude", -87.6298);
			// Original fields should remain unchanged
			expect(response.body.user).toHaveProperty("first_name", "Test");
		});

		it("should reject invalid patch data", async () => {
			const invalidPatchData = {
				gender: "invalid_gender",
				sexual_orientation: "invalid_orientation",
			};

			const response = await request(app)
				.patch("/users/profile")
				.set("Authorization", `Bearer ${authToken}`)
				.send(invalidPatchData)
				.expect(400);

			expect(response.body).toHaveProperty("error");
		});

		it("should accept empty patch (no changes)", async () => {
			const emptyPatch = {};

			const response = await request(app)
				.patch("/users/profile")
				.set("Authorization", `Bearer ${authToken}`)
				.send(emptyPatch)
				.expect(200);

			expect(response.body).toHaveProperty("user");
			// All original fields should remain unchanged
			expect(response.body.user).toHaveProperty("first_name", "Test");
			expect(response.body.user).toHaveProperty("last_name", "User");
		});
	});

	describe("GET /users/discover", () => {
		it("should return potential matches", async () => {
			const response = await request(app)
				.get("/users/discover")
				.set("Authorization", `Bearer ${authToken}`)
				.query({ page: 1, limit: 10 })
				.expect(200);

			// API uses standardized pagination: { data, meta, links }
			expect(response.body).toHaveProperty("data");
			expect(Array.isArray(response.body.data)).toBe(true);
			expect(response.body).toHaveProperty("meta");
			expect(response.body.meta).toHaveProperty("current_page");
			expect(response.body.meta).toHaveProperty("per_page");
			expect(response.body).toHaveProperty("links");
		});

		it("should support pagination parameters", async () => {
			const response = await request(app)
				.get("/users/discover")
				.set("Authorization", `Bearer ${authToken}`)
				.query({ page: 2, limit: 5 });

			// Accept both 200 (with data) and 204 (no more users)
			expect([200, 204]).toContain(response.status);

			if (response.status === 200) {
				expect(response.body.meta).toHaveProperty("current_page", 2);
				expect(response.body.meta).toHaveProperty("per_page", 5);
			}
		});

		it("should support filtering parameters", async () => {
			const response = await request(app)
				.get("/users/discover")
				.set("Authorization", `Bearer ${authToken}`)
				.query({
					ageMin: 25,
					ageMax: 35,
					maxDistance: 50,
					gender: "female",
				});

			// Accept both 200 (with data) and 204 (no matches)
			expect([200, 204]).toContain(response.status);

			if (response.status === 200) {
				expect(response.body).toHaveProperty("data");
				expect(Array.isArray(response.body.data)).toBe(true);
			}
		});
	});

	describe("GET /users/:id", () => {
		it("should get specific user profile", async () => {
			// Use one of the seeded test users
			const response = await request(app)
				.get("/users/550e8400-e29b-41d4-a716-446655440000")
				.set("Authorization", `Bearer ${authToken}`)
				.expect(200);

			expect(response.body).toHaveProperty("user");
			expect(response.body.user).toHaveProperty("id", "550e8400-e29b-41d4-a716-446655440000");
			expect(response.body.user).not.toHaveProperty("password");
		});

		it("should return 404 for non-existent user", async () => {
			const response = await request(app)
				.get("/users/550e8400-e29b-41d4-a716-446655999999")
				.set("Authorization", `Bearer ${authToken}`)
				.expect(404);

			expect(response.body).toHaveProperty("error");
		});
	});
});
