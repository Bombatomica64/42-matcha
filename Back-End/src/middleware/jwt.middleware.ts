import { UserRepository } from "@repositories/user.repository";
import { decodeJwt } from "@utils/jwt";
import type { Request, Response, NextFunction } from "express";
import { pool } from "../database";
import { logger } from "../server";
import { dbUserToApiUser } from "src/mappers/user.mapper";

const nonProtectedEndpoints: Array<string> = [
	"/auth/login",
	"/auth/register",
	"/auth/verifyEmail",
	"/auth/resetPassword",
	"/auth/refresh",
];

const userRepository = new UserRepository(pool);

export const jwtMiddleware = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	if (nonProtectedEndpoints.includes(req.path)) {
		return next();
	}

	const jwt = req.headers.authorization?.split(" ")[1];

	if (!jwt) {
		return res.status(401).json({ message: "Unauthorized" });
	}

	try {
		const decoded = decodeJwt(jwt);
		const userId: string = decoded?.userId || "";

		// Check if token is an access token
		if (decoded?.type !== 'access') {
			return res.status(401).json({ message: "Invalid token type" });
		}

		if (!userId) {
			return res.status(401).json({ message: "Unauthorized" });
		}

		// Await the user lookup if it's async
		const user = await userRepository.findById(userId);

		if (!user) {
			return res.status(401).json({ message: "User not found" });
		}

		res.locals.user = dbUserToApiUser(user);
		next();
	} catch (error) {
		logger.error("JWT middleware error:", error);
		return res.status(401).json({ message: "Invalid token" });
	}
};
