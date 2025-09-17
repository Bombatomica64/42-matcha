import { afterAll, beforeAll, beforeEach, describe, expect, it } from "@jest/globals";
import type { Express } from "express";
import request from "supertest";
import { server } from "../../src/server";
import { createTestApp } from "../helpers/app.helper";
import { createUserAndAccessToken } from "../helpers/auth.helper";
import { clearDatabase, closeTestPool, seedTestData, testQuery } from "../helpers/database.helper";

interface DiscoveredUser {
	id: string;
	username: string;
	gender: string;
	age: number;
}

describe("Integration Tests", () => {
	let app: Express;
	let user1Token: string;
	let user2Token: string;
	let user1Id: string;
	let user2Id: string;

	beforeAll(async () => {
		app = await createTestApp();
	});

	afterAll(async () => {
		await closeTestPool();
		await new Promise((resolve) => server.close(resolve));
	});

	beforeEach(async () => {
		await clearDatabase();
		await seedTestData();

		// Create two test users
		const user1Data = {
			email: "user1@example.com",
			username: "testuser1",
			firstName: "Test",
			lastName: "User1",
			password: "SecurePassword123!",
			birthDate: "1990-01-01",
			gender: "male",
		};

		const user2Data = {
			email: "user2@example.com",
			username: "testuser2",
			firstName: "Test",
			lastName: "User2",
			password: "SecurePassword123!",
			birthDate: "1992-05-15",
			gender: "female",
		};

		// Create users directly in DB and generate access tokens (avoid hitting login/rate limits)
		const u1 = await createUserAndAccessToken(user1Data);
		const u2 = await createUserAndAccessToken(user2Data);
		user1Id = u1.userId;
		user2Id = u2.userId;
		user1Token = u1.token;
		user2Token = u2.token;
	});

	describe("User Discovery Flow", () => {
		it("should discover users and handle interactions", async () => {
			// User1 discovers users
			const discoverResponse = await request(app)
				.get("/users/discover")
				.set("Authorization", `Bearer ${user1Token}`)
				.query({ page: 1, limit: 10 })
				.expect((res) => {
					// Accept 200 with body or 204 with empty body
					if (![200, 204].includes(res.status)) {
						throw new Error(`Unexpected status ${res.status}`);
					}
				});

			if (discoverResponse.status === 200) {
				expect(discoverResponse.body).toHaveProperty("users");
				expect(Array.isArray(discoverResponse.body.users)).toBe(true);

				// Check if user2 is in the discovery results
				const discoveredUser = discoverResponse.body.users.find(
					(u: DiscoveredUser) => u.id === user2Id,
				);
				if (discoveredUser) {
					expect(discoveredUser).toHaveProperty("username", "testuser2");
					expect(discoveredUser).not.toHaveProperty("password");
				}
			}
		});

		it("should filter discovery results based on preferences", async () => {
			const discoverResponse = await request(app)
				.get("/users/discover")
				.set("Authorization", `Bearer ${user1Token}`)
				.query({
					gender: "female",
					ageMin: 20,
					ageMax: 35,
					maxDistance: 100,
				})
				.expect((res) => {
					if (![200, 204].includes(res.status)) {
						throw new Error(`Unexpected status ${res.status}`);
					}
				});

			if (discoverResponse.status === 200) {
				expect(discoverResponse.body).toHaveProperty("users");
				// All returned users should match the filter criteria
				for (const user of discoverResponse.body.users as DiscoveredUser[]) {
					expect(user.gender).toBe("female");
					expect(user.age).toBeGreaterThanOrEqual(20);
					expect(user.age).toBeLessThanOrEqual(35);
				}
			}
		});
	});

	describe("Like/Match System", () => {
		it("should handle like interactions", async () => {
			// User1 likes User2
			const likeResponse = await request(app)
				.post(`/users/${user2Id}/like`)
				.set("Authorization", `Bearer ${user1Token}`)
				.send({ like: true })
				.expect(201);

			expect(likeResponse.body).toHaveProperty("message");
			expect(likeResponse.body).toHaveProperty("action", "like");
		});

		it("should create match when both users like each other", async () => {
			// User1 likes User2
			await request(app)
				.post(`/users/${user2Id}/like`)
				.set("Authorization", `Bearer ${user1Token}`)
				.send({ like: true })
				.expect(201);

			// User2 likes User1 back
			const matchResponse = await request(app)
				.post(`/users/${user1Id}/like`)
				.set("Authorization", `Bearer ${user2Token}`)
				.send({ like: true })
				.expect(201);

			expect(matchResponse.body).toHaveProperty("isMatch", true);
			expect(matchResponse.body).toHaveProperty("message");
		});

		it("should handle dislike interactions", async () => {
			const dislikeResponse = await request(app)
				.post(`/users/${user2Id}/like`)
				.set("Authorization", `Bearer ${user1Token}`)
				.send({ like: false })
				.expect(201);

			expect(dislikeResponse.body).toHaveProperty("message");
			expect(dislikeResponse.body).toHaveProperty("action", "dislike");
		});

		it("should not show liked/disliked users in discovery", async () => {
			// User1 dislikes User2
			await request(app)
				.post(`/users/${user2Id}/like`)
				.set("Authorization", `Bearer ${user1Token}`)
				.send({ like: false })
				.expect(201);

			// Check discovery - User2 should not appear
			const discoverResponse = await request(app)
				.get("/users/discover")
				.set("Authorization", `Bearer ${user1Token}`)
				.query({ page: 1, limit: 100 })
				.expect((res) => {
					if (![200, 204].includes(res.status)) {
						throw new Error(`Unexpected status ${res.status}`);
					}
				});

			if (discoverResponse.status === 200) {
				const userIds = discoverResponse.body.users.map((u: DiscoveredUser) => u.id);
				expect(userIds).not.toContain(user2Id);
			}
		});
	});

	describe("Block System", () => {
		it("should block users successfully", async () => {
			const blockResponse = await request(app)
				.post(`/users/${user2Id}/block`)
				.set("Authorization", `Bearer ${user1Token}`)
				.expect(204);

			// Block endpoint returns 204 with no body
			expect(blockResponse.body).toEqual({});
		});

		it("should not show blocked users in discovery", async () => {
			// User1 blocks User2
			await request(app)
				.post(`/users/${user2Id}/block`)
				.set("Authorization", `Bearer ${user1Token}`)
				.expect(204);

			// Check discovery - User2 should not appear
			const discoverResponse = await request(app)
				.get("/users/discover")
				.set("Authorization", `Bearer ${user1Token}`)
				.query({ page: 1, limit: 100 })
				.expect((res) => {
					if (![200, 204].includes(res.status)) {
						throw new Error(`Unexpected status ${res.status}`);
					}
				});

			if (discoverResponse.status === 200) {
				const userIds = discoverResponse.body.users.map((u: DiscoveredUser) => u.id);
				expect(userIds).not.toContain(user2Id);
			}
		});

		it("should prevent blocked user from seeing blocker", async () => {
			// User1 blocks User2
			await request(app)
				.post(`/users/${user2Id}/block`)
				.set("Authorization", `Bearer ${user1Token}`)
				.expect(204);

			// User2 tries to discover users - should not see User1
			const discoverResponse = await request(app)
				.get("/users/discover")
				.set("Authorization", `Bearer ${user2Token}`)
				.query({ page: 1, limit: 100 })
				.expect((res) => {
					if (![200, 204].includes(res.status)) {
						throw new Error(`Unexpected status ${res.status}`);
					}
				});

			if (discoverResponse.status === 200) {
				const userIds = discoverResponse.body.users.map((u: DiscoveredUser) => u.id);
				expect(userIds).not.toContain(user1Id);
			}
		});

		it("should unblock users successfully", async () => {
			// First block
			await request(app)
				.post(`/users/${user2Id}/block`)
				.set("Authorization", `Bearer ${user1Token}`)
				.expect(204);

			// Then unblock
			const unblockResponse = await request(app)
				.delete(`/users/${user2Id}/block`)
				.set("Authorization", `Bearer ${user1Token}`)
				.expect(204);

			// Unblock endpoint returns 204 with no body
			expect(unblockResponse.body).toEqual({});
		});
	});

	describe("Profile Completeness", () => {
		it("should require complete profile for discovery", async () => {
			// Create user with incomplete profile
			const incompleteUser = {
				email: "incomplete@example.com",
				username: "incomplete",
				firstName: "In",
				lastName: "Complete",
				password: "SecurePassword123!",
				birthDate: "1990-01-01",
				gender: "male",
			};

			const registerResponse = await createUserAndAccessToken(incompleteUser);

			// Incomplete user should not appear in discovery
			const discoverResponse = await request(app)
				.get("/users/discover")
				.set("Authorization", `Bearer ${user1Token}`)
				.query({ page: 1, limit: 100 })
				.expect((res) => {
					if (![200, 204].includes(res.status)) {
						throw new Error(`Unexpected status ${res.status}`);
					}
				});

			if (discoverResponse.status === 200) {
				const userIds = discoverResponse.body.users.map((u: DiscoveredUser) => u.id);
				expect(userIds).not.toContain(registerResponse.userId);
			}
		});
	});

	describe("Location-based Discovery", () => {
		it("should filter users by distance", async () => {
			// Update user locations
			await request(app)
				.put("/users/profile")
				.set("Authorization", `Bearer ${user1Token}`)
				.send({
					first_name: "Test",
					last_name: "User1",
					bio: "Test bio",
					gender: "male",
					sexual_orientation: "heterosexual",
					username: "testuser1",
					location: {
						type: "Point",
						coordinates: [2.3522, 48.8566], // Paris
					},
				})
				.expect(200);

			await request(app)
				.put("/users/profile")
				.set("Authorization", `Bearer ${user2Token}`)
				.send({
					first_name: "Test",
					last_name: "User2",
					bio: "Test bio",
					gender: "female",
					sexual_orientation: "heterosexual",
					username: "testuser2",
					location: {
						type: "Point",
						coordinates: [-0.1278, 51.5074], // London
					},
				})
				.expect(200);

			// Discover with small distance limit (should not find London from Paris)
			const discoverResponse = await request(app)
				.get("/users/discover")
				.set("Authorization", `Bearer ${user1Token}`)
				.query({ maxDistance: 100 }) // 100km
				.expect((res) => {
					if (![200, 204].includes(res.status)) {
						throw new Error(`Unexpected status ${res.status}`);
					}
				});

			// User2 in London should not appear (distance > 100km from Paris)
			if (discoverResponse.status === 200) {
				const userIds = discoverResponse.body.users.map((u: DiscoveredUser) => u.id);
				expect(userIds).not.toContain(user2Id);
			}
		});
	});

	describe("Database Consistency", () => {
		it("should maintain data consistency across operations", async () => {
			// Perform multiple operations
			await request(app)
				.post(`/users/${user2Id}/like`)
				.set("Authorization", `Bearer ${user1Token}`)
				.send({ like: true })
				.expect(201);

			await request(app)
				.post(`/users/${user1Id}/like`)
				.set("Authorization", `Bearer ${user2Token}`)
				.send({ like: true })
				.expect(201);

			// Check database state
			const likesResult = await testQuery(
				"SELECT * FROM user_likes WHERE liker_id = $1 OR liker_id = $2",
				[user1Id, user2Id],
			);

			expect(likesResult.rows).toHaveLength(2);

			const matchesResult = await testQuery(
				"SELECT * FROM matches WHERE (user1_id = $1 AND user2_id = $2) OR (user1_id = $2 AND user2_id = $1)",
				[user1Id, user2Id],
			);

			expect(matchesResult.rows).toHaveLength(1);
		});
	});

	describe("Error Handling", () => {
		it("should handle non-existent user operations gracefully", async () => {
			const nonExistentUserId = "non-existent-user-id";

			// Try to like non-existent user
			const likeResponse = await request(app)
				.post(`/users/${nonExistentUserId}/like`)
				.set("Authorization", `Bearer ${user1Token}`)
				.send({ like: true })
				.expect(404);

			expect(likeResponse.body).toHaveProperty("error");

			// Try to get non-existent user profile
			const profileResponse = await request(app)
				.get(`/users/${nonExistentUserId}`)
				.set("Authorization", `Bearer ${user1Token}`)
				.expect(404);

			expect(profileResponse.body).toHaveProperty("error");
		});

		it("should prevent self-interactions", async () => {
			// Try to like self
			const likeResponse = await request(app)
				.post(`/users/${user1Id}/like`)
				.set("Authorization", `Bearer ${user1Token}`)
				.send({ like: true })
				.expect(400);

			expect(likeResponse.body).toHaveProperty("error");

			// Try to block self
			const blockResponse = await request(app)
				.post(`/users/${user1Id}/block`)
				.set("Authorization", `Bearer ${user1Token}`)
				.expect(400);

			expect(blockResponse.body).toHaveProperty("error");
		});
	});
});
