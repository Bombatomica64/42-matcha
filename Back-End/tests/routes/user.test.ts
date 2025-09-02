import type { Express } from "express";
import request from "supertest";
import { createAndAuthenticateUser, createTestApp } from "../helpers/app.helper";
import { clearDatabase, closeTestPool, seedTestData } from "../helpers/database.helper";

describe("User Routes", () => {
	let app: Express;
	let authToken: string;
	let userId: string;

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
		userId = userAuth.userId;
	});

	describe("GET /users/profile", () => {
		it("should get current user profile with valid token", async () => {
			const response = await request(app)
				.get("/users/profile")
				.set("Authorization", `Bearer ${authToken}`)
				.expect(200);

			expect(response.body).toHaveProperty("user");
			expect(response.body.user).toHaveProperty("email", "test@example.com");
			expect(response.body.user).toHaveProperty("username", "testuser");
			expect(response.body.user).not.toHaveProperty("password");
		});

		it("should reject request without token", async () => {
			const response = await request(app).get("/users/profile").expect(401);

			expect(response.body).toHaveProperty("error");
		});

		it("should reject request with invalid token", async () => {
			const response = await request(app)
				.get("/users/profile")
				.set("Authorization", "Bearer invalid-token")
				.expect(401);

			expect(response.body).toHaveProperty("error");
		});
	});

	describe("PUT /users/profile", () => {
		it("should update user profile successfully", async () => {
			const updateData = {
				first_name: "Updated",
				last_name: "Name",
				bio: "This is my updated bio",
			};

			const response = await request(app)
				.put("/users/profile")
				.set("Authorization", `Bearer ${authToken}`)
				.send(updateData)
				.expect(200);

			expect(response.body).toHaveProperty("message");
			expect(response.body).toHaveProperty("user");
			expect(response.body.user).toHaveProperty("first_name", "Updated");
			expect(response.body.user).toHaveProperty("last_name", "Name");
			expect(response.body.user).toHaveProperty("bio", "This is my updated bio");
		});

		it("should reject invalid update data", async () => {
			const updateData = {
				first_name: "", // Empty name should be invalid
			};

			const response = await request(app)
				.put("/users/profile")
				.set("Authorization", `Bearer ${authToken}`)
				.send(updateData)
				.expect(400);

			expect(response.body).toHaveProperty("error");
		});
	});

	describe("GET /users/discover", () => {
		it("should return potential matches", async () => {
			const response = await request(app)
				.get("/users/discover")
				.set("Authorization", `Bearer ${authToken}`)
				.query({ page: 1, limit: 10 })
				.expect(200);

			expect(response.body).toHaveProperty("users");
			expect(response.body).toHaveProperty("pagination");
			expect(Array.isArray(response.body.users)).toBe(true);
		});

		it("should support pagination parameters", async () => {
			const response = await request(app)
				.get("/users/discover")
				.set("Authorization", `Bearer ${authToken}`)
				.query({ page: 2, limit: 5 })
				.expect(200);

			expect(response.body.pagination).toHaveProperty("page", 2);
			expect(response.body.pagination).toHaveProperty("limit", 5);
		});

		it("should support filtering parameters", async () => {
			const response = await request(app)
				.get("/users/discover")
				.set("Authorization", `Bearer ${authToken}`)
				.query({
					minAge: 25,
					maxAge: 35,
					maxDistance: 50,
					gender: "female",
				})
				.expect(200);

			expect(response.body).toHaveProperty("users");
			expect(Array.isArray(response.body.users)).toBe(true);
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
