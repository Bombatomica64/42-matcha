import { dbUserToApiUser } from "@mappers/user.mapper";
import { UserRepository } from "@repositories/user.repository";
import { decodeJwt, refreshAccessToken, verifyJwt } from "@utils/jwt";
import type { NextFunction, Request, Response } from "express";
import { pool } from "../database";
import { logger } from "../server";

const nonProtectedEndpoints: Array<string> = [
	"/auth/login",
	"/auth/register",
	"/auth/verifyEmail",
	"/auth/resetPassword",
	"/auth/refresh",
];

const userRepository = new UserRepository(pool);

export const jwtMiddleware = async (req: Request, res: Response, next: NextFunction) => {
	if (nonProtectedEndpoints.includes(req.path)) {
		return next();
	}

	const jwt = req.headers.authorization?.split(" ")[1];

	if (!jwt) {
		return res.status(401).json({ message: "Unauthorized" });
	}

	try {
		let decoded = decodeJwt(jwt);
		let userId: string = decoded?.userId || "";
		let currentToken = jwt;

		// Check if token is an access token
		if (decoded?.type !== "access") {
			return res.status(401).json({ message: "Invalid token type" });
		}

		if (!userId) {
			return res.status(401).json({ message: "Unauthorized" });
		}

		// Check if access token is expired
		if (decoded?.exp && Date.now() >= decoded.exp * 1000) {
			// Check refresh token in http cookies
			const refreshToken = req.cookies.refreshToken;
			if (!refreshToken) {
				return res.status(401).json({ message: "Unauthorized" });
			}

			// Verify the refresh token
			const decodedRefreshToken = await verifyJwt(refreshToken);
			if (!decodedRefreshToken) {
				return res.status(401).json({ message: "Invalid refresh token" });
			}
			if (decodedRefreshToken.exp && Date.now() >= decodedRefreshToken.exp * 1000) {
				return res.status(401).json({ message: "Refresh token expired" });
			}

			// Issue new access token and continue the call
			const newAccessToken = refreshAccessToken(refreshToken); // Add await if async
			if (!newAccessToken) {
				return res.status(401).json({ message: "Failed to issue new access token" });
			}

			// Update variables with new token info
			decoded = decodeJwt(newAccessToken);
			userId = decoded?.userId || "";
			currentToken = newAccessToken;

			// Send new access token to client via header
			res.setHeader("X-New-Access-Token", newAccessToken);
		}

		// Verify the current token (original or refreshed)
		const verifiedToken = await verifyJwt(currentToken);
		if (!verifiedToken) {
			return res.status(401).json({ message: "Token verification failed" });
		}

		// Await the user lookup
		const user = await userRepository.findById(userId);

		if (!user) {
			return res.status(401).json({ message: "User not found" });
		}

		res.locals.user = dbUserToApiUser(user);
		next();
	} catch (error) {
		logger.error(`JWT middleware error: ${error}`);
		return res.status(401).json({ message: "Invalid token" });
	}
};
