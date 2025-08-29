import { env } from "node:process";
import jwt, { type Secret } from "jsonwebtoken";

const JWT_SECRET = env.JWT_SECRET as Secret;

if (!JWT_SECRET) {
	throw new Error("JWT_SECRET environment variable is required");
}

export interface JwtPayload {
	userId: string;
	username: string;
	type?: "access" | "refresh"; // Add token type
	location?:
		| {
				type: "Point";
				coordinates: [number, number]; // [longitude, latitude]
		  }
		| string;
	iat?: number; // issued at
	exp?: number; // expiration
}

export function signJwt(
	payload: Omit<JwtPayload, "iat" | "exp">,
	expiresIn: number = 15 * 60, // 15 minutes in seconds for access tokens
): string {
	return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function signRefreshToken(
	payload: Omit<JwtPayload, "iat" | "exp" | "type">,
	expiresIn: number = 7 * 24 * 60 * 60, // 7 days in seconds
): string {
	const refreshPayload = { ...payload, type: "refresh" as const };
	return jwt.sign(refreshPayload, JWT_SECRET, { expiresIn });
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
	location?:
		| {
				type: "Point";
				coordinates: [number, number];
		  }
		| string;
}): string {
	const payload: Omit<JwtPayload, "iat" | "exp" | "type"> = {
		userId: user.id,
		username: user.username,
		location: user.location,
	};

	return signJwt({ ...payload, type: "access" });
}

export function generateRefreshToken(user: {
	id: string;
	username: string;
	location?:
		| {
				type: "Point";
				coordinates: [number, number];
		  }
		| string;
}): string {
	const payload: Omit<JwtPayload, "iat" | "exp" | "type"> = {
		userId: user.id,
		username: user.username,
		location: user.location,
	};

	return signRefreshToken(payload);
}

export function generateTokenPair(user: {
	id: string;
	username: string;
	location?:
		| {
				type: "Point";
				coordinates: [number, number];
		  }
		| string;
}): { accessToken: string; refreshToken: string } {
	return {
		accessToken: generateAuthToken(user),
		refreshToken: generateRefreshToken(user),
	};
}

export function refreshAccessToken(refreshToken: string): string | null {
	const payload = verifyJwt(refreshToken);
	if (!payload || payload.type !== "refresh") {
		return null;
	}

	// Remove old timestamps and type, create new access token
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { iat: _iat, exp: _exp, type: _type, ...userPayload } = payload;

	return signJwt({ ...userPayload, type: "access" });
}
