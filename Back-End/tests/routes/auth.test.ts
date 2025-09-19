import { afterAll, beforeAll, beforeEach, describe, expect, it } from "@jest/globals";
import type { Express } from "express";
import request from "supertest";
import type { components } from "../../src/generated/typescript/api";
import { server } from "../../src/server";
import { createTestApp } from "../helpers/app.helper";
import { createUserAndTokens } from "../helpers/auth.helper";
import { clearDatabase, closeTestPool, testQuery } from "../helpers/database.helper";

type RegisterRequest = components["schemas"]["RegisterRequest"];
type RegisterResponse = components["schemas"]["RegisterResponse"];
type LoginResponse = components["schemas"]["LoginResponse"];
type ErrorResponse = components["schemas"]["ErrorResponse"];

describe("Authentication Routes", () => {
	let app: Express;

	beforeAll(async () => {
		app = await createTestApp();
	});

	describe("GET /auth/identities", () => {
		let accessToken: string;
		let userId: string;

		beforeEach(async () => {
			// Create user
			const created = await createUserAndTokens();
			accessToken = created.accessToken;
			userId = created.userId;

			// Ensure providers are seeded (migration may have run already)
			await testQuery(
				`INSERT INTO auth_providers(key, name, type) VALUES ('google','Google','oauth2') ON CONFLICT (key) DO NOTHING`,
			);
			const providerRes = await testQuery(`SELECT id FROM auth_providers WHERE key = 'google'`);
			const providerId = providerRes.rows[0].id as number;

			// Seed a linked identity for the user
			await testQuery(
				`INSERT INTO user_identities (user_id, provider_id, provider_user_id, email) VALUES ($1, $2, $3, $4)
				ON CONFLICT (provider_id, provider_user_id) DO NOTHING`,
				[userId, providerId, "google-sub-123", "linked@example.com"],
			);
		});

		it("should return linked identities for authenticated user", async () => {
			const response = await request(app)
				.get("/auth/identities")
				.set("Authorization", `Bearer ${accessToken}`)
				.expect(200);

			expect(response.body).toHaveProperty("identities");
			expect(Array.isArray(response.body.identities)).toBe(true);
			if (response.body.identities.length > 0) {
				const first = response.body.identities[0];
				expect(first).toHaveProperty("provider_key");
				expect(first).toHaveProperty("provider_user_id");
			}
		});

		it("should reject when not authenticated", async () => {
			await request(app).get("/auth/identities").expect(401);
		});
	});

	afterAll(async () => {
		await closeTestPool();
		server.close();
	});

	beforeEach(async () => {
		await clearDatabase();
	});

	describe("POST /auth/register", () => {
		const validUserData = {
			email: `test+${Date.now()}@example.com`,
			username: `testuser_${Math.floor(Date.now() % 1_000_000)}`,
			first_name: `Test`,
			last_name: "User",
			password: "SecurePassword123!",
			birth_date: "1990-01-01",
			gender: "male",
			sexual_orientation: "heterosexual",
			location: { lat: 0, lng: 0 },
			location_manual: true,
		} as RegisterRequest;

		it("should register a new user successfully", async () => {
			const response = await request(app)
				.post("/auth/register")
				.send({
					email: validUserData.email,
					username: validUserData.username,
					password: validUserData.password,
					first_name: validUserData.first_name,
					last_name: validUserData.last_name,
					birth_date: validUserData.birth_date,
					gender: validUserData.gender,
					sexual_orientation: validUserData.sexual_orientation,
					location: { lat: 0, lng: 0 },
				})
				.expect(201);

			const body = response.body as RegisterResponse;
			expect(typeof body.message).toBe("string");
			// Current API returns user_id instead of user object
			expect(typeof body.user_id).toBe("string");
		});

		it("should reject invalid email format", async () => {
			const response = await request(app)
				.post("/auth/register")
				.send({
					email: "invalid-email",
					username: validUserData.username,
					password: validUserData.password,
					first_name: validUserData.first_name,
					last_name: validUserData.last_name,
					birth_date: validUserData.birth_date,
					gender: validUserData.gender,
					sexual_orientation: validUserData.sexual_orientation,
					location: { lat: 0, lng: 0 },
				})
				.expect(400);

			const body = response.body as ErrorResponse;
			console.log(body);
			expect(typeof body.error).toBe("string");
			expect(typeof body.message).toBe("string");
		});

		it("should reject weak password", async () => {
			const response = await request(app)
				.post("/auth/register")
				.send({
					email: validUserData.email,
					username: validUserData.username,
					password: "123",
					first_name: validUserData.first_name,
					last_name: validUserData.last_name,
					birth_date: validUserData.birth_date,
					gender: validUserData.gender,
					sexual_orientation: validUserData.sexual_orientation,
					location: { lat: 0, lng: 0 },
				})
				.expect(400);

			const body = response.body as ErrorResponse;
			expect(typeof body.error).toBe("string");
			expect(typeof body.message).toBe("string");
		});

		it("should reject duplicate email", async () => {
			// First registration
			await request(app)
				.post("/auth/register")
				.send({
					email: validUserData.email,
					username: validUserData.username,
					password: validUserData.password,
					first_name: validUserData.first_name,
					last_name: validUserData.last_name,
					birth_date: validUserData.birth_date,
					gender: validUserData.gender,
					sexual_orientation: validUserData.sexual_orientation,
					location: { lat: 0, lng: 0 },
				})
				.expect(201);

			// Second registration with same email
			const response = await request(app)
				.post("/auth/register")
				.send({
					email: validUserData.email,
					username: validUserData.username,
					password: validUserData.password,
					first_name: validUserData.first_name,
					last_name: validUserData.last_name,
					birth_date: validUserData.birth_date,
					gender: validUserData.gender,
					sexual_orientation: validUserData.sexual_orientation,
					location: { lat: 0, lng: 0 },
				});

			// Service currently responds with 400 on duplicate constraint
			expect(response.status).toBe(400);
			const body = response.body as ErrorResponse;
			console.log(body);
			expect(typeof body.error).toBe("string");
			expect(typeof body.message).toBe("string");
		});
	});

	describe("POST /auth/login", () => {
		const userData = {
			email: "test@example.com",
			username: "testuser",
			firstName: "Test",
			lastName: "User",
			password: "SecurePassword123!",
			birthDate: "1990-01-01",
			gender: "male",
		};

		beforeEach(async () => {
			// Create a user directly in DB for login tests
			await createUserAndTokens({
				email: userData.email,
				username: userData.username,
				firstName: userData.firstName,
				lastName: userData.lastName,
				password: userData.password,
				birthDate: userData.birthDate,
				gender: userData.gender,
			});
		});

		it("should login with valid credentials", async () => {
			const response = await request(app)
				.post("/auth/login")
				.send({
					email_or_username: userData.email,
					password: userData.password,
				})
				.expect(200);

			const body = response.body as LoginResponse;
			expect(typeof body.token).toBe("string");
			expect(typeof body.user_id).toBe("string");
		});

		it("should reject invalid password", async () => {
			const response = await request(app)
				.post("/auth/login")
				.send({
					email_or_username: userData.email,
					password: "wrongpassword",
				})
				.expect(401);

			const body = response.body as ErrorResponse;
			expect(typeof body.error).toBe("string");
			expect(typeof body.message).toBe("string");
		});

		it("should reject non-existent email", async () => {
			const response = await request(app)
				.post("/auth/login")
				.send({
					email_or_username: "nonexistent@example.com",
					password: userData.password,
				})
				.expect(401);

			const body = response.body as ErrorResponse;
			expect(typeof body.error).toBe("string");
			expect(typeof body.message).toBe("string");
		});
	});

	describe("POST /auth/refresh", () => {
		it("should refresh token with valid refresh token", async () => {
			// Create user and obtain refresh token via helper
			const { refreshToken } = await createUserAndTokens({
				email: "test@example.com",
				username: "testuser",
				firstName: "Test",
				lastName: "User",
				password: "SecurePassword123!",
				birthDate: "1990-01-01",
				gender: "male",
			});

			// Use refresh token via header to get new access token
			const response = await request(app)
				.post("/auth/refresh")
				.set("x-refresh-token", refreshToken)
				.expect(200);

			expect(response.body).toHaveProperty("access_token");
		});

		it("should reject invalid refresh token", async () => {
			const response = await request(app)
				.post("/auth/refresh")
				.set("x-refresh-token", "invalid-token")
				.expect(401);

			expect(response.body).toHaveProperty("error");
		});
	});
});
