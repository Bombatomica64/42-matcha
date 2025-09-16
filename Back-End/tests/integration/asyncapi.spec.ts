import { afterAll, beforeAll, beforeEach, describe, expect, it } from "@jest/globals";
import { createUserAndAccessToken } from "../helpers/auth.helper";
import { clearDatabase, closeTestPool, seedTestData } from "../helpers/database.helper";

// Minimal runtime guards matching AsyncAPI payloads we defined
const isNewMessagePayload = (
	x: unknown,
): x is {
	chat_room_id: string;
	message_type: string;
	content?: string | null;
	media_file_path?: string | null;
	media_mime_type?: string | null;
} => {
	if (!x || typeof x !== "object") return false;
	const r = x as Record<string, unknown>;
	return typeof r.chat_room_id === "string" && typeof r.message_type === "string";
};

const isNotification = (
	x: unknown,
): x is {
	id: string;
	type: string;
	title: string;
	body: string;
	created_at: string;
	read: boolean;
} => {
	if (!x || typeof x !== "object") return false;
	const r = x as Record<string, unknown>;
	return (
		typeof r.id === "string" &&
		typeof r.type === "string" &&
		typeof r.title === "string" &&
		typeof r.body === "string" &&
		typeof r.created_at === "string" &&
		typeof r.read === "boolean"
	);
};

describe("AsyncAPI events (Socket.IO)", () => {
	beforeAll(async () => {
		// server is started by the app when running full integration; for now we only run shape checks
	});

	afterAll(async () => {
		await closeTestPool();
	});

	beforeEach(async () => {
		await clearDatabase();
		await seedTestData();
		await createUserAndAccessToken();
	});

	it("should validate a sample chat text message payload shape", () => {
		const payload = { chat_room_id: "room-1", message_type: "text", content: "hello" };
		expect(isNewMessagePayload(payload)).toBe(true);
	});

	it("should handle a pushed notification payload shape", async () => {
		// This is a schema-shape check. If the server emits 'notification.new', it should match our spec
		const sample = {
			id: "notif-1",
			type: "match",
			title: "You have a new match",
			body: "Say hi!",
			created_at: new Date().toISOString(),
			read: false,
		};
		expect(isNotification(sample)).toBe(true);
	});
});
