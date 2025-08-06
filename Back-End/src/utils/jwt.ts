import jwt, { Secret } from "jsonwebtoken";
import { env } from "node:process";

const JWT_SECRET = env.JWT_SECRET as Secret;

if (!JWT_SECRET) {
	throw new Error("JWT_SECRET environment variable is required");
}

export interface JwtPayload {
	userId: string;
	username: string;
	location?: {
		type: "Point";
		coordinates: [number, number]; // [longitude, latitude]
	};
	iat?: number; // issued at
	exp?: number; // expiration
}

export function signJwt(
	payload: Omit<JwtPayload, "iat" | "exp">,
	expiresIn = "24h"
): string {
	return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function verifyJwt(token: string): JwtPayload | null {
	try {
		const decoded = jwt.verify(token, JWT_SECRET);
		return decoded as JwtPayload;
	} catch {
		return null;
	}
}

export function decodeJwt(token: string): JwtPayload | null {
	try {
		return jwt.decode(token) as JwtPayload;
	} catch {
		return null;
	}
}

export function generateAuthToken(user: {
	id: string;
	username: string;
	location?: {
		type: "Point";
		coordinates: [number, number];
	};
}): string {
	const payload: Omit<JwtPayload, "iat" | "exp"> = {
		userId: user.id,
		username: user.username,
		location: user.location,
	};

	return signJwt(payload);
}

export function refreshToken(oldToken: string): string | null {
	const payload = verifyJwt(oldToken);
	if (!payload) {
		return null;
	}

	// Remove old timestamps and create new token
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { iat, exp, ...userPayload } = payload;

	return signJwt(userPayload);
}
