import { generateTokenPair } from "../../src/utils/jwt";
import { createTestUserInDB } from "./database.helper";

export type TestUserInput = Partial<{
	email: string;
	username: string;
	firstName: string;
	lastName: string;
	password: string;
	birthDate: string;
	gender: string;
	bio: string;
}>;

export interface CreatedTestUser {
	userId: string;
	email: string;
	username: string;
	password: string;
}

const defaultUserData = {
	// Make defaults unique per run to avoid duplicate key errors in tests
	email: `testuser_${Date.now()}@example.com`,
	username: `testuser_${Date.now()}`,
	firstName: "Test",
	lastName: "User",
	password: "TestPassword123!",
	birthDate: "1990-01-01",
	gender: "male",
	bio: "Test user for authentication",
} as const;

/**
 * Create a user directly in DB with verified email and return tokens without hitting /auth/login.
 */
export const createUserAndTokens = async (
	userData?: TestUserInput,
): Promise<CreatedTestUser & { accessToken: string; refreshToken: string }> => {
	const merged = { ...defaultUserData, ...(userData || {}) } as Required<typeof defaultUserData>;
	const userId = await createTestUserInDB(merged);
	const { accessToken, refreshToken } = generateTokenPair({
		id: userId,
		username: merged.username,
	});

	return {
		userId,
		email: merged.email,
		username: merged.username,
		password: merged.password,
		accessToken,
		refreshToken,
	};
};

/**
 * Convenience to create a user and return only the access token.
 */
export const createUserAndAccessToken = async (
	userData?: TestUserInput,
): Promise<{ userId: string; token: string; username: string; email: string }> => {
	const created = await createUserAndTokens(userData);
	return {
		userId: created.userId,
		token: created.accessToken,
		username: created.username,
		email: created.email,
	};
};

/**
 * Return a known invalid token string.
 */
export const getInvalidToken = (): string => "invalid-token";
