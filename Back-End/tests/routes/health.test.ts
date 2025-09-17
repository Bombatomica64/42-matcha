import { afterAll, beforeAll, beforeEach, describe, expect, it } from "@jest/globals";
import type { Express } from "express";
import request from "supertest";
import { server } from "../../src/server";
import { createTestApp } from "../helpers/app.helper";
import { clearDatabase, closeTestPool } from "../helpers/database.helper";

describe("Health and Basic Routes", () => {
	let app: Express;

	beforeAll(async () => {
		app = await createTestApp();
	});

	afterAll(async () => {
		await closeTestPool();
		server.close();
	});

	beforeEach(async () => {
		await clearDatabase();
	});

	describe("GET /health", () => {
		it("should return health status", async () => {
			const response = await request(app).get("/health").expect(200);

			expect(response.body).toHaveProperty("status", "ok");
			expect(response.body).toHaveProperty("timestamp");
		});
	});

	describe("GET /", () => {
		it("should return welcome message", async () => {
			const response = await request(app).get("/").expect(200);

			expect(response.body).toMatchObject({
				message: "Welcome to Matcha Dating App API",
				documentation: "/api-docs",
				version: "1.0.0",
			});
		});
	});

	describe("GET /api-docs", () => {
		it("should serve swagger documentation", async () => {
			const response = await request(app).get("/api-docs/").expect(200);

			expect(response.text).toContain("Swagger UI");
		});
	});
});
