import { randomUUID } from "node:crypto";
import { dbUserToApiUser } from "@mappers/user.mapper";
import { UserRepository } from "@repositories/user.repository";
import { refreshAccessToken, verifyJwt } from "@utils/jwt";
import type { NextFunction, Request, Response } from "express";
import { pool } from "../database";
import { logger } from "../server";

const nonProtectedEndpoints: Array<string> = [
	"/auth/login",
	"/auth/register",
	"/auth/verifyEmail",
	"/auth/resetPassword",
	"/auth/refresh",
	"/health",
	"/",
];

const userRepository = new UserRepository(pool);

export const jwtMiddleware = async (req: Request, res: Response, next: NextFunction) => {
	// Generate request ID for tracking
	const requestId = randomUUID().slice(0, 8);
	req.headers["x-request-id"] = requestId;

	logger.info(`[${requestId}] ${req.method} ${req.path} - JWT middleware started`, {
		path: req.path,
		method: req.method,
		userAgent: req.headers["user-agent"],
		isProtected: !nonProtectedEndpoints.includes(req.path),
	});

	// Skip JWT validation for non-protected endpoints
	if (nonProtectedEndpoints.includes(req.path)) {
		logger.info(`[${requestId}] Endpoint not protected, skipping JWT validation`);
		return next();
	}

	const authHeader = req.headers.authorization;
	const refreshToken = req.cookies?.refreshToken || req.headers["x-refresh-token"];

	logger.info(`[${requestId}] Checking authorization`, {
		hasAuthHeader: !!authHeader,
		hasRefreshToken: !!refreshToken,
		authHeaderFormat: authHeader ? "Bearer ***" : "none",
	});

	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		logger.warn(`[${requestId}] No valid authorization header found`);
		return res.status(401).json({
			error: "Unauthorized",
			message: "Authorization header required",
			code: "AUTH_HEADER_MISSING",
		});
	}

	const accessToken = authHeader.split(" ")[1];

	if (!accessToken) {
		logger.warn(`[${requestId}] No access token in authorization header`);
		return res.status(401).json({
			error: "Unauthorized",
			message: "Access token required",
			code: "ACCESS_TOKEN_MISSING",
		});
	}

	try {
		// First, try to verify the access token
		logger.debug(`[${requestId}] Verifying access token`);
		let decoded = verifyJwt(accessToken);
		let tokenRefreshed = false;
		let newAccessToken: string | null = null;

		if (!decoded) {
			logger.info(`[${requestId}] Access token invalid/expired, attempting refresh`);

			// Access token is invalid/expired, try to refresh if refresh token is available
			if (!refreshToken) {
				logger.warn(`[${requestId}] No refresh token available for token refresh`);
				return res.status(401).json({
					error: "Unauthorized",
					message: "Access token expired and no refresh token available",
					code: "TOKEN_EXPIRED_NO_REFRESH",
				});
			}

			// Verify refresh token and generate new access token
			const refreshPayload = verifyJwt(refreshToken);
			if (!refreshPayload || refreshPayload.type !== "refresh") {
				logger.warn(`[${requestId}] Invalid refresh token`);
				return res.status(401).json({
					error: "Unauthorized",
					message: "Invalid refresh token",
					code: "REFRESH_TOKEN_INVALID",
				});
			}

			newAccessToken = refreshAccessToken(refreshToken);
			if (!newAccessToken) {
				logger.error(`[${requestId}] Failed to generate new access token`);
				return res.status(401).json({
					error: "Unauthorized",
					message: "Failed to refresh access token",
					code: "TOKEN_REFRESH_FAILED",
				});
			}

			// Verify the new access token
			decoded = verifyJwt(newAccessToken);
			if (!decoded) {
				logger.error(`[${requestId}] Newly generated access token is invalid`);
				return res.status(500).json({
					error: "Internal Server Error",
					message: "Token generation failed",
					code: "TOKEN_GENERATION_ERROR",
				});
			}

			tokenRefreshed = true;
			logger.info(`[${requestId}] Access token successfully refreshed for user ${decoded.userId}`);
		}

		// Validate token type
		if (decoded.type !== "access") {
			logger.warn(`[${requestId}] Invalid token type: ${decoded.type}`);
			return res.status(401).json({
				error: "Unauthorized",
				message: "Invalid token type",
				code: "INVALID_TOKEN_TYPE",
			});
		}

		const userId = decoded.userId;
		if (!userId) {
			logger.warn(`[${requestId}] No userId in token payload`);
			return res.status(401).json({
				error: "Unauthorized",
				message: "Invalid token payload",
				code: "INVALID_TOKEN_PAYLOAD",
			});
		}

		logger.debug(`[${requestId}] Looking up user ${userId} in database`);

		// Look up user in database
		const user = await userRepository.findById(userId);
		if (!user) {
			logger.warn(`[${requestId}] User ${userId} not found in database`);
			return res.status(401).json({
				error: "Unauthorized",
				message: "User not found",
				code: "USER_NOT_FOUND",
			});
		}

		if (!user.activated) {
			logger.warn(`[${requestId}] User ${userId} account not activated`);
			return res.status(401).json({
				error: "Unauthorized",
				message: "Account not activated",
				code: "ACCOUNT_NOT_ACTIVATED",
			});
		}

		// Set user in response locals
		res.locals.user = dbUserToApiUser(user);
		res.locals.requestId = requestId;

		// If token was refreshed, send new token in response headers
		if (tokenRefreshed && newAccessToken) {
			res.setHeader("X-New-Access-Token", newAccessToken);
			res.setHeader("X-Token-Refreshed", "true");
			logger.info(`[${requestId}] New access token provided in response headers`);
		}

		logger.info(`[${requestId}] JWT middleware completed successfully for user ${userId}`, {
			userId,
			username: user.username,
			tokenRefreshed,
		});

		next();
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		const errorStack = error instanceof Error ? error.stack : undefined;

		logger.error(`[${requestId}] JWT middleware error:`, {
			error: errorMessage,
			stack: errorStack,
			hasAuthHeader: !!authHeader,
			hasRefreshToken: !!refreshToken,
			accessTokenLength: accessToken ? accessToken.length : 0,
		});

		return res.status(401).json({
			error: "Unauthorized",
			message: "Token processing failed",
			code: "TOKEN_PROCESSING_ERROR",
			debug: process.env.NODE_ENV === "test" ? errorMessage : undefined,
		});
	}
};
