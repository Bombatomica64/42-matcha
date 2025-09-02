import type { Express } from "express";
import request from "supertest";
import { createAndAuthenticateUser, createTestApp } from "../helpers/app.helper";
import { clearDatabase, closeTestPool, seedTestData } from "../helpers/database.helper";

describe("JWT Middleware Debug", () => {
	let app: Express;

	beforeAll(async () => {
		app = await createTestApp();
	});

	afterAll(async () => {
		await closeTestPool();
	});

	beforeEach(async () => {
		await clearDatabase();
		await seedTestData();
	});

	it("should debug JWT authentication flow", async () => {
		console.log("\n=== Starting JWT Debug Test ===");

		// Step 1: Create and authenticate a user
		console.log("\n1. Creating and authenticating user...");
		const userAuth = await createAndAuthenticateUser(app, {
			email: "jwt-test@example.com",
			username: "jwtuser",
			firstName: "JWT",
			lastName: "Test",
			password: "JWTTest123!",
			birthDate: "1990-01-01",
			gender: "male",
		});

		console.log("User created successfully:", {
			userId: userAuth.userId,
			hasToken: !!userAuth.token,
			tokenLength: userAuth.token ? userAuth.token.length : 0,
			tokenPreview: userAuth.token ? `${userAuth.token.slice(0, 50)}...` : "none",
		});

		// Step 2: Test JWT decode manually to debug
		console.log("\n2. Manual JWT verification...");
		try {
			const { verifyJwt } = require("../../src/utils/jwt");
			const decoded = verifyJwt(userAuth.token);
			console.log("JWT decode result:", {
				success: !!decoded,
				userId: decoded?.userId,
				type: decoded?.type,
				username: decoded?.username,
			});
		} catch (error) {
			console.log("JWT decode error:", error);
		}

		// Step 3: Test protected endpoint
		console.log("\n3. Testing protected endpoint...");
		const response = await request(app)
			.get("/users/profile")
			.set("Authorization", `Bearer ${userAuth.token}`);

		console.log("Protected endpoint response:", {
			status: response.status,
			body: response.body,
			hasUser: !!response.body.user,
			hasNewToken: !!response.headers["x-new-access-token"],
			wasRefreshed: response.headers["x-token-refreshed"] === "true",
		});

		if (response.status !== 200) {
			console.log("ERROR: Expected 200 but got", response.status);
			console.log("Response body:", response.body);
		}

		expect(response.status).toBe(200);
		expect(response.body).toHaveProperty("user");
		expect(response.body.user.email).toBe("jwt-test@example.com");
	});

	it("should handle missing authorization header", async () => {
		console.log("\n=== Testing Missing Auth Header ===");

		const response = await request(app).get("/users/profile");

		console.log("No auth header response:", {
			status: response.status,
			error: response.body.error,
			code: response.body.code,
		});

		expect(response.status).toBe(401);
		expect(response.body.code).toBe("AUTH_HEADER_MISSING");
	});

	it("should handle invalid token", async () => {
		console.log("\n=== Testing Invalid Token ===");

		const response = await request(app)
			.get("/users/profile")
			.set("Authorization", "Bearer invalid-token-here");

		console.log("Invalid token response:", {
			status: response.status,
			error: response.body.error,
			code: response.body.code,
		});

		expect(response.status).toBe(401);
		expect(response.body.code).toBe("TOKEN_EXPIRED_NO_REFRESH");
	});

	it("should allow access to non-protected endpoints", async () => {
		console.log("\n=== Testing Non-Protected Endpoints ===");

		const healthResponse = await request(app).get("/health");
		const rootResponse = await request(app).get("/");

		console.log("Non-protected endpoints:", {
			health: { status: healthResponse.status },
			root: { status: rootResponse.status },
		});

		expect(healthResponse.status).toBe(200);
		expect(rootResponse.status).toBe(200);
	});
});
