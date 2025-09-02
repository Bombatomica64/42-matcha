import type { Express } from "express";
import request from "supertest";
import { createAndAuthenticateUser, createTestApp } from "../helpers/app.helper";
import { clearDatabase, closeTestPool, seedTestData } from "../helpers/database.helper";

describe("Auth Debug", () => {
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

	it("should debug JWT token", async () => {
		// Import JWT utilities
		const { generateAuthToken, decodeJwt } = await import("../../src/utils/jwt");

		// Create a mock user
		const mockUser = {
			id: "550e8400-e29b-41d4-a716-446655440000",
			username: "testuser",
			location: undefined,
		};

		// Generate token manually
		const manualToken = generateAuthToken(mockUser);
		process.stderr.write(`Generated token manually: ${manualToken.substring(0, 50)}...\n`);

		// Decode it to check
		const decoded = decodeJwt(manualToken);
		process.stderr.write(`Decoded token: ${JSON.stringify(decoded)}\n`);

		// Try using this token directly
		const response = await request(app)
			.get("/users/profile")
			.set("Authorization", `Bearer ${manualToken}`);

		process.stderr.write(
			`Manual token test - Status: ${response.status}, Body: ${JSON.stringify(response.body)}\n`,
		);

		// Now test our helper
		const userAuth = await createAndAuthenticateUser(app, {
			email: "debug@test.com",
			username: "debuguser",
		});

		process.stderr.write(`Helper token: ${userAuth.token.substring(0, 50)}...\n`);
		const helperDecoded = decodeJwt(userAuth.token);
		process.stderr.write(`Helper decoded: ${JSON.stringify(helperDecoded)}\n`);

		const helperResponse = await request(app)
			.get("/users/profile")
			.set("Authorization", `Bearer ${userAuth.token}`);

		process.stderr.write(
			`Helper token test - Status: ${helperResponse.status}, Body: ${JSON.stringify(helperResponse.body)}\n`,
		);

		expect(true).toBe(true); // Just to pass the test
	});
});
