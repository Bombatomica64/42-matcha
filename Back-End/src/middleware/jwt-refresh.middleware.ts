import { refreshAccessToken, verifyJwt } from "@utils/jwt";
import type { NextFunction, Request, Response } from "express";
import { logger } from "../server";

export const jwtRefreshMiddleware = async (req: Request, res: Response, next: NextFunction) => {
	const accessToken = req.headers.authorization?.split(" ")[1];
	const refreshToken = req.headers["x-refresh-token"] as string;

	if (!accessToken) {
		return res.status(401).json({ message: "Access token required" });
	}

	try {
		// Try to verify access token
		const decoded = verifyJwt(accessToken);

		if (decoded && decoded.type === "access") {
			// Access token is valid, proceed normally
			res.locals.userId = decoded.userId;
			return next();
		}

		// Access token is invalid/expired, try to refresh
		if (!refreshToken) {
			return res.status(401).json({
				message: "Access token expired and no refresh token provided",
			});
		}

		// Verify refresh token and generate new access token
		const refreshPayload = verifyJwt(refreshToken);
		if (!refreshPayload || refreshPayload.type !== "refresh") {
			return res.status(401).json({
				message: "Invalid refresh token",
			});
		}

		const newAccessToken = refreshAccessToken(refreshToken);
		if (!newAccessToken) {
			return res.status(401).json({
				message: "Failed to refresh access token",
			});
		}

		// Set new access token in response header
		res.setHeader("X-New-Access-Token", newAccessToken);
		res.locals.userId = refreshPayload.userId;
		res.locals.tokenRefreshed = true;

		logger.info(`Access token refreshed for user ${refreshPayload.userId}`);
		next();
	} catch (error) {
		logger.error(`JWT refresh middleware error: ${error}`);
		return res.status(401).json({ message: "Token processing failed" });
	}
};
