import fs from "node:fs";
import path from "node:path";
import type { Express } from "express";
import request from "supertest";
import { createTestApp } from "../helpers/app.helper";
import { createUserAndAccessToken } from "../helpers/auth.helper";
import { clearDatabase, closeTestPool, seedTestData } from "../helpers/database.helper";

describe("Photo Routes", () => {
	let app: Express;
	let authToken: string;
	let testImagePath: string;

	beforeAll(async () => {
		app = await createTestApp();

		// Create a test image file
		testImagePath = path.join(__dirname, "../fixtures/test-image.jpg");
		const testImageDir = path.dirname(testImagePath);

		// Create fixtures directory if it doesn't exist
		if (!fs.existsSync(testImageDir)) {
			fs.mkdirSync(testImageDir, { recursive: true });
		}

		// Create a minimal test image (1x1 pixel JPEG)
		const minimalJpeg = Buffer.from([
			0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00,
			0x48, 0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43, 0x00, 0x08, 0x06, 0x06, 0x07, 0x06,
			0x05, 0x08, 0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0a, 0x0c, 0x14, 0x0d, 0x0c, 0x0b, 0x0b,
			0x0c, 0x19, 0x12, 0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1d, 0x1a, 0x1c, 0x1c, 0x20,
			0x24, 0x2e, 0x27, 0x20, 0x22, 0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29, 0x2c, 0x30, 0x31,
			0x34, 0x34, 0x34, 0x1f, 0x27, 0x39, 0x3d, 0x38, 0x32, 0x3c, 0x2e, 0x33, 0x34, 0x32, 0xff,
			0xc0, 0x00, 0x11, 0x08, 0x00, 0x01, 0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0x02, 0x11, 0x01,
			0x03, 0x11, 0x01, 0xff, 0xc4, 0x00, 0x1f, 0x00, 0x00, 0x01, 0x05, 0x01, 0x01, 0x01, 0x01,
			0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05,
			0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0xff, 0xc4, 0x00, 0xb5, 0x10, 0x00, 0x02, 0x01, 0x03,
			0x03, 0x02, 0x04, 0x03, 0x05, 0x05, 0x04, 0x04, 0x00, 0x00, 0x01, 0x7d, 0x01, 0x02, 0x03,
			0x00, 0x04, 0x11, 0x05, 0x12, 0x21, 0x31, 0x41, 0x06, 0x13, 0x51, 0x61, 0x07, 0x22, 0x71,
			0x14, 0x32, 0x81, 0x91, 0xa1, 0x08, 0x23, 0x42, 0xb1, 0xc1, 0x15, 0x52, 0xd1, 0xf0, 0x24,
			0x33, 0x62, 0x72, 0x82, 0x09, 0x0a, 0x16, 0x17, 0x18, 0x19, 0x1a, 0x25, 0x26, 0x27, 0x28,
			0x29, 0x2a, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3a, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48,
			0x49, 0x4a, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59, 0x5a, 0x63, 0x64, 0x65, 0x66, 0x67,
			0x68, 0x69, 0x6a, 0x73, 0x74, 0x75, 0x76, 0x77, 0x78, 0x79, 0x7a, 0x83, 0x84, 0x85, 0x86,
			0x87, 0x88, 0x89, 0x8a, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9a, 0xa2, 0xa3,
			0xa4, 0xa5, 0xa6, 0xa7, 0xa8, 0xa9, 0xaa, 0xb2, 0xb3, 0xb4, 0xb5, 0xb6, 0xb7, 0xb8, 0xb9,
			0xba, 0xc2, 0xc3, 0xc4, 0xc5, 0xc6, 0xc7, 0xc8, 0xc9, 0xca, 0xd2, 0xd3, 0xd4, 0xd5, 0xd6,
			0xd7, 0xd8, 0xd9, 0xda, 0xe1, 0xe2, 0xe3, 0xe4, 0xe5, 0xe6, 0xe7, 0xe8, 0xe9, 0xea, 0xf1,
			0xf2, 0xf3, 0xf4, 0xf5, 0xf6, 0xf7, 0xf8, 0xf9, 0xfa, 0xff, 0xda, 0x00, 0x0c, 0x03, 0x01,
			0x00, 0x02, 0x11, 0x03, 0x11, 0x00, 0x3f, 0x00, 0xf9, 0xfe, 0x8a, 0x28, 0xaf, 0xc3, 0x0f,
			0xff, 0xd9,
		]);

		fs.writeFileSync(testImagePath, minimalJpeg);
	});

	afterAll(async () => {
		await closeTestPool();

		// Clean up test image
		if (fs.existsSync(testImagePath)) {
			fs.unlinkSync(testImagePath);
		}
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

	describe("POST /photos", () => {
		it("should upload a photo successfully", async () => {
			const response = await request(app)
				.post("/photos")
				.set("Authorization", `Bearer ${authToken}`)
				.attach("photo", testImagePath)
				.expect(201);

			expect(response.body).toHaveProperty("message");
			expect(response.body).toHaveProperty("photo");
			expect(response.body.photo).toHaveProperty("id");
			expect(response.body.photo).toHaveProperty("url");
			expect(response.body.photo).toHaveProperty("is_main");
		});

		it("should reject upload without authentication", async () => {
			const response = await request(app)
				.post("/photos")
				.attach("photo", testImagePath)
				.expect(401);

			expect(response.body).toHaveProperty("error");
		});

		it("should reject upload without file", async () => {
			const response = await request(app)
				.post("/photos")
				.set("Authorization", `Bearer ${authToken}`)
				.expect(400);

			expect(response.body).toHaveProperty("error");
		});

		it("should reject non-image files", async () => {
			// Create a text file
			const textFilePath = path.join(__dirname, "../fixtures/test.txt");
			fs.writeFileSync(textFilePath, "This is not an image");

			const response = await request(app)
				.post("/photos")
				.set("Authorization", `Bearer ${authToken}`)
				.attach("photo", textFilePath)
				.expect(400);

			expect(response.body).toHaveProperty("error");

			// Clean up
			fs.unlinkSync(textFilePath);
		});

		it("should set first photo as main photo automatically", async () => {
			const response = await request(app)
				.post("/photos")
				.set("Authorization", `Bearer ${authToken}`)
				.attach("photo", testImagePath)
				.expect(201);

			expect(response.body.photo.is_main).toBe(true);
		});
	});

	describe("GET /photos", () => {
		it("should get current user photos", async () => {
			// First upload a photo
			await request(app)
				.post("/photos")
				.set("Authorization", `Bearer ${authToken}`)
				.attach("photo", testImagePath);

			// Then get user photos
			const response = await request(app)
				.get("/photos")
				.set("Authorization", `Bearer ${authToken}`)
				.expect(200);

			expect(response.body).toHaveProperty("photos");
			expect(Array.isArray(response.body.photos)).toBe(true);
			expect(response.body.photos.length).toBeGreaterThan(0);
		});

		it("should reject request without authentication", async () => {
			const response = await request(app).get("/photos").expect(401);

			expect(response.body).toHaveProperty("error");
		});
	});

	describe("POST /photos/:photoId/main", () => {
		let photoId: string;

		beforeEach(async () => {
			// Upload a photo first
			const uploadResponse = await request(app)
				.post("/photos")
				.set("Authorization", `Bearer ${authToken}`)
				.attach("photo", testImagePath);

			photoId = uploadResponse.body.photo.id;
		});

		it("should set photo as main photo", async () => {
			const response = await request(app)
				.post(`/photos/${photoId}/main`)
				.set("Authorization", `Bearer ${authToken}`)
				.expect(200);

			expect(response.body).toHaveProperty("message");
			expect(response.body).toHaveProperty("photo");
			expect(response.body.photo.is_main).toBe(true);
		});

		it("should reject setting non-existent photo as main", async () => {
			const response = await request(app)
				.post("/photos/non-existent-id/main")
				.set("Authorization", `Bearer ${authToken}`)
				.expect(404);

			expect(response.body).toHaveProperty("error");
		});

		it("should reject request without authentication", async () => {
			const response = await request(app).post(`/photos/${photoId}/main`).expect(401);

			expect(response.body).toHaveProperty("error");
		});
	});

	describe("DELETE /photos/:photoId", () => {
		let photoId: string;

		beforeEach(async () => {
			// Upload a photo first
			const uploadResponse = await request(app)
				.post("/photos")
				.set("Authorization", `Bearer ${authToken}`)
				.attach("photo", testImagePath);

			photoId = uploadResponse.body.photo.id;
		});

		it("should delete photo successfully", async () => {
			const response = await request(app)
				.delete(`/photos/${photoId}`)
				.set("Authorization", `Bearer ${authToken}`)
				.expect(200);

			expect(response.body).toHaveProperty("message");
		});

		it("should return 404 for non-existent photo", async () => {
			const response = await request(app)
				.delete("/photos/non-existent-id")
				.set("Authorization", `Bearer ${authToken}`)
				.expect(404);

			expect(response.body).toHaveProperty("error");
		});

		it("should reject request without authentication", async () => {
			const response = await request(app).delete(`/photos/${photoId}`).expect(401);

			expect(response.body).toHaveProperty("error");
		});
	});

	describe("GET /photos/:photoId", () => {
		let photoId: string;

		beforeEach(async () => {
			// Upload a photo first
			const uploadResponse = await request(app)
				.post("/photos")
				.set("Authorization", `Bearer ${authToken}`)
				.attach("photo", testImagePath);

			photoId = uploadResponse.body.photo.id;
		});

		it("should get photo details", async () => {
			const response = await request(app)
				.get(`/photos/${photoId}`)
				.set("Authorization", `Bearer ${authToken}`)
				.expect(200);

			expect(response.body).toHaveProperty("photo");
			expect(response.body.photo).toHaveProperty("id", photoId);
			expect(response.body.photo).toHaveProperty("url");
			expect(response.body.photo).toHaveProperty("is_main");
		});

		it("should return 404 for non-existent photo", async () => {
			const response = await request(app)
				.get("/photos/non-existent-id")
				.set("Authorization", `Bearer ${authToken}`)
				.expect(404);

			expect(response.body).toHaveProperty("error");
		});

		it("should reject request without authentication", async () => {
			const response = await request(app).get(`/photos/${photoId}`).expect(401);

			expect(response.body).toHaveProperty("error");
		});
	});

	describe("Photo upload limits", () => {
		it("should enforce maximum photos per user", async () => {
			// Upload maximum allowed photos (assuming limit is 5)
			const maxPhotos = 5;

			for (let i = 0; i < maxPhotos; i++) {
				await request(app)
					.post("/photos")
					.set("Authorization", `Bearer ${authToken}`)
					.attach("photo", testImagePath)
					.expect(201);
			}

			// Try to upload one more - should fail
			const response = await request(app)
				.post("/photos")
				.set("Authorization", `Bearer ${authToken}`)
				.attach("photo", testImagePath)
				.expect(400);

			expect(response.body).toHaveProperty("error");
			expect(response.body.error).toContain("maximum");
		});
	});

	describe("Photo file validation", () => {
		it("should enforce file size limits", async () => {
			// Create a large file (this is a simple test, in reality you'd need a very large file)
			const largeFilePath = path.join(__dirname, "../fixtures/large-file.jpg");
			const largeBuffer = Buffer.alloc(10 * 1024 * 1024); // 10MB
			fs.writeFileSync(largeFilePath, largeBuffer);

			const response = await request(app)
				.post("/photos")
				.set("Authorization", `Bearer ${authToken}`)
				.attach("photo", largeFilePath)
				.expect(400);

			expect(response.body).toHaveProperty("error");

			// Clean up
			fs.unlinkSync(largeFilePath);
		});

		it("should only accept image file types", async () => {
			const disallowedTypes = ["txt", "pdf", "doc", "mp4"];

			for (const type of disallowedTypes) {
				const filePath = path.join(__dirname, `../fixtures/test.${type}`);
				fs.writeFileSync(filePath, "test content");

				const response = await request(app)
					.post("/photos")
					.set("Authorization", `Bearer ${authToken}`)
					.attach("photo", filePath)
					.expect(400);

				expect(response.body).toHaveProperty("error");

				// Clean up
				fs.unlinkSync(filePath);
			}
		});
	});
});
