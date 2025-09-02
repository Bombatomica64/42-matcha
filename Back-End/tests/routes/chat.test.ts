import type { Express } from "express";
import request from "supertest";
import { createAndAuthenticateUser, createTestApp } from "../helpers/app.helper";
import { clearDatabase, closeTestPool, testQuery } from "../helpers/database.helper";

describe("Chat Routes", () => {
	let app: Express;
	let authUser1: {
		userId: string;
		token: string;
		credentials: { email: string; password: string };
	};
	let authUser2: {
		userId: string;
		token: string;
		credentials: { email: string; password: string };
	};
	let chatRoomId: string;

	beforeAll(async () => {
		app = await createTestApp();
	});

	afterAll(async () => {
		await closeTestPool();
	});

	beforeEach(async () => {
		await clearDatabase();

		// Create two authenticated test users
		authUser1 = await createAndAuthenticateUser(app, {
			email: "user1@test.com",
			username: "user1",
			firstName: "John",
			lastName: "Doe",
			password: "TestPassword123!",
			birthDate: "1995-05-15",
			gender: "male",
			bio: "Test user 1",
		});

		authUser2 = await createAndAuthenticateUser(app, {
			email: "user2@test.com",
			username: "user2",
			firstName: "Jane",
			lastName: "Smith",
			password: "TestPassword123!",
			birthDate: "1993-08-20",
			gender: "female",
			bio: "Test user 2",
		});

		// Create a chat room
		const chatRoomResult = await testQuery(
			"INSERT INTO chat_rooms (user1_id, user2_id) VALUES ($1, $2) RETURNING id",
			[
				authUser1.userId < authUser2.userId ? authUser1.userId : authUser2.userId,
				authUser1.userId < authUser2.userId ? authUser2.userId : authUser1.userId,
			],
		);
		chatRoomId = chatRoomResult.rows[0].id;

		// Create some test messages
		await testQuery(
			`INSERT INTO chat_messages (chat_room_id, sender_id, message_type, content) 
       VALUES ($1, $2, 'text', 'Hello from user 1'), 
              ($1, $3, 'text', 'Hello from user 2'),
              ($1, $2, 'text', 'How are you?'),
              ($1, $3, 'text', 'I am fine, thanks!')`,
			[chatRoomId, authUser1.userId, authUser2.userId],
		);
	});

	describe("GET /chat/user", () => {
		it("should return user chat rooms", async () => {
			const response = await request(app)
				.get("/chat/user")
				.set("Authorization", `Bearer ${authUser1.token}`)
				.expect(200);

			expect(response.body).toBeInstanceOf(Array);
			expect(response.body).toHaveLength(1);
			expect(response.body[0]).toHaveProperty("id", chatRoomId);
		});

		it("should return 401 without auth token", async () => {
			await request(app).get("/chat/user").expect(401);
		});
	});

	describe("GET /chat/:id", () => {
		it("should return specific chat room", async () => {
			const response = await request(app)
				.get(`/chat/${chatRoomId}`)
				.set("Authorization", `Bearer ${authUser1.token}`)
				.expect(200);

			expect(response.body).toHaveProperty("id", chatRoomId);
			expect(response.body).toHaveProperty("user1_id");
			expect(response.body).toHaveProperty("user2_id");
		});

		it("should return 404 for non-existent chat room", async () => {
			const fakeId = "123e4567-e89b-12d3-a456-426614174000";
			await request(app)
				.get(`/chat/${fakeId}`)
				.set("Authorization", `Bearer ${authUser1.token}`)
				.expect(404);
		});
	});

	describe("GET /chat/:id/messages", () => {
		it("should return paginated messages with default pagination", async () => {
			const response = await request(app)
				.get(`/chat/${chatRoomId}/messages`)
				.set("Authorization", `Bearer ${authUser1.token}`)
				.expect(200);

			expect(response.body).toHaveProperty("data");
			expect(response.body).toHaveProperty("meta");
			expect(response.body).toHaveProperty("links");

			expect(response.body.data).toBeInstanceOf(Array);
			expect(response.body.data).toHaveLength(4);

			expect(response.body.meta).toMatchObject({
				total_items: 4,
				total_pages: 1,
				current_page: 1,
				per_page: 10,
				has_previous: false,
				has_next: false,
			});

			expect(response.body.links).toHaveProperty("first");
			expect(response.body.links).toHaveProperty("last");
			expect(response.body.links).toHaveProperty("self");
		});

		it("should return paginated messages with custom pagination", async () => {
			const response = await request(app)
				.get(`/chat/${chatRoomId}/messages`)
				.query({ page: 1, limit: 2, sort: "created_at", order: "asc" })
				.set("Authorization", `Bearer ${authUser1.token}`)
				.expect(200);

			expect(response.body.data).toHaveLength(2);
			expect(response.body.meta).toMatchObject({
				total_items: 4,
				total_pages: 2,
				current_page: 1,
				per_page: 2,
				has_previous: false,
				has_next: true,
			});

			// Check that messages are sorted by created_at ASC
			const messages = response.body.data;
			expect(messages[0].content).toBe("Hello from user 1");
			expect(messages[1].content).toBe("Hello from user 2");
		});

		it("should return second page of messages", async () => {
			const response = await request(app)
				.get(`/chat/${chatRoomId}/messages`)
				.query({ page: 2, limit: 2, sort: "created_at", order: "asc" })
				.set("Authorization", `Bearer ${authUser1.token}`)
				.expect(200);

			expect(response.body.data).toHaveLength(2);
			expect(response.body.meta).toMatchObject({
				total_items: 4,
				total_pages: 2,
				current_page: 2,
				per_page: 2,
				has_previous: true,
				has_next: false,
			});

			const messages = response.body.data;
			expect(messages[0].content).toBe("How are you?");
			expect(messages[1].content).toBe("I am fine, thanks!");
		});

		it("should return 403 for unauthorized chat room access", async () => {
			// Create a third user
			const authUser3 = await createAndAuthenticateUser(app, {
				email: "user3@test.com",
				username: "user3",
				firstName: "Bob",
				lastName: "Wilson",
				password: "TestPassword123!",
				birthDate: "1990-01-01",
				gender: "male",
			});

			// Create a chat room between user2 and user3 (excluding user1)
			const anotherChatResult = await testQuery(
				"INSERT INTO chat_rooms (user1_id, user2_id) VALUES ($1, $2) RETURNING id",
				[authUser2.userId, authUser3.userId],
			);

			// User1 should not be able to access this chat room
			await request(app)
				.get(`/chat/${anotherChatResult.rows[0].id}/messages`)
				.set("Authorization", `Bearer ${authUser1.token}`)
				.expect(403);
		});
	});

	describe("DELETE /chat/:id", () => {
		it("should delete chat room", async () => {
			await request(app)
				.delete(`/chat/${chatRoomId}`)
				.set("Authorization", `Bearer ${authUser1.token}`)
				.expect(204);

			// Verify chat room is deleted
			const result = await testQuery("SELECT * FROM chat_rooms WHERE id = $1", [chatRoomId]);
			expect(result.rows).toHaveLength(0);
		});

		it("should return 404 for non-existent chat room", async () => {
			const fakeId = "123e4567-e89b-12d3-a456-426614174000";
			await request(app)
				.delete(`/chat/${fakeId}`)
				.set("Authorization", `Bearer ${authUser1.token}`)
				.expect(404);
		});
	});
});
