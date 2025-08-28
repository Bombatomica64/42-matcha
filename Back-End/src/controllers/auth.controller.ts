import type { Request, Response } from "express";
import { logger } from "../server";
import type { AuthService } from "@services/auth.services";
import { ValidationSchemas } from "@utils/validation";
import { env } from "@config/env";
import type { components } from "@generated/typescript/api";

type RegisterRequest = components['schemas']['RegisterRequest'];
type RegisterResponse = components['schemas']['RegisterResponse'];
type LoginRequest = components['schemas']['LoginRequest'];
type LoginResponse = components['schemas']['LoginResponse'];
type LogoutResponse = components['schemas']['LogoutResponse'];
type verifyEmailResponse = components['schemas']['verifyEmailResponse'];
type ResetPasswordResponse = components['schemas']['ResetPasswordResponse'];
type ErrorResponse = components['schemas']['ErrorResponse'];

export class AuthController {
	private authService: AuthService;

	constructor(authService: AuthService) {
		this.authService = authService;
	}

	/**
	 * Handle user registration
	 */
	async register(req: Request, res: Response): Promise<void> {
		try {
			const registerData: RegisterRequest = req.body;

			// Validate required fields
			if (
				!registerData.username ||
				!registerData.email ||
				!registerData.password ||
				!registerData.first_name ||
				!registerData.last_name ||
				!registerData.birth_date ||
				!registerData.gender ||
				!registerData.sexual_orientation
			) {
				const errorResponse: ErrorResponse = {
					error: "Bad Request",
					message: "Missing required fields",
					code: "VALIDATION_ERROR"
				};
				res.status(400).json(errorResponse);
				return;
			}

			// Validate email format
			if (!ValidationSchemas.validateEmail(registerData.email)) {
				const errorResponse: ErrorResponse = {
					error: "Bad Request",
					message: "Invalid email format",
					code: "INVALID_EMAIL"
				};
				res.status(400).json(errorResponse);
				return;
			}

			// Validate password strength
			if (!ValidationSchemas.validatePassword(registerData.password)) {
				const errorResponse: ErrorResponse = {
					error: "Bad Request",
					message:
						"Password must be at least 8 characters with uppercase, lowercase, and number",
					code: "INVALID_PASSWORD"
				};
				res.status(400).json(errorResponse);
				return;
			}

			// Validate username format
			if (!ValidationSchemas.validateUsername(registerData.username)) {
				const errorResponse: ErrorResponse = {
					error: "Bad Request",
					message:
						"Username must be 3-20 characters, alphanumeric and underscore only",
					code: "INVALID_USERNAME"
				};
				res.status(400).json(errorResponse);
				return;
			}

			// Convert API request to service data
			const userData = {
				username: registerData.username,
				email: registerData.email,
				password: registerData.password,
				first_name: registerData.first_name,
				last_name: registerData.last_name,
				birth_date: new Date(registerData.birth_date),
				bio: registerData.bio,
				gender: registerData.gender,
				sexual_orientation: registerData.sexual_orientation,
				location:
					registerData.location?.lat && registerData.location?.lng
						? {
								type: "Point" as const,
								coordinates: [
									registerData.location.lng,
									registerData.location.lat,
								] as [number, number],
						  }
						: undefined,
				location_manual: registerData.location_manual ?? false,
			};

			// Register user using service
			const newUser = await this.authService.registerUser(userData);

			const successResponse: RegisterResponse = {
				message: "User registered successfully",
				user_id: newUser.id,
			};

			res.status(201).json(successResponse);
		} catch (error) {
			logger.error("Registration error:", error);

			const errorResponse: ErrorResponse = {
				error: "Bad Request",
				message: error instanceof Error ? error.message : "Registration failed",
				code: "REGISTRATION_FAILED"
			};

			res.status(400).json(errorResponse);
		}
	}

	/**
	 * Handle user login
	 */
	async login(req: Request, res: Response): Promise<void> {
		try {
			const loginData: LoginRequest = req.body;

			if (!loginData.email_or_username || !loginData.password) {
				const errorResponse: ErrorResponse = {
					error: "Bad Request",
					message: "Email/username and password are required",
					code: "VALIDATION_ERROR"
				};
				res.status(400).json(errorResponse);
				return;
			}

			const result = await this.authService.loginUser(
				loginData.email_or_username,
				loginData.password
			);

			if (!result) {
				const errorResponse: ErrorResponse = {
					error: "Unauthorized",
					message: "Invalid credentials",
					code: "INVALID_CREDENTIALS"
				};
				res.status(401).json(errorResponse);
				return;
			}

			const successResponse: LoginResponse = {
				message: "Login successful",
				token: result.accessToken, // Keep existing field name for now
				user_id: result.user.id,
			};

			// Set refresh token in httpOnly cookie for security
			res.cookie("refreshToken", result.refreshToken, {
				httpOnly: true,
				secure: env.NODE_ENV === "production",
				sameSite: "strict",
				maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
			});

			res.status(200).json(successResponse);
		} catch (error) {
			logger.error("Login error:", error);

			const errorResponse: ErrorResponse = {
				error: "Unauthorized",
				message: error instanceof Error ? error.message : "Login failed",
				code: "LOGIN_FAILED"
			};

			res.status(401).json(errorResponse);
		}
	}

	/**
	 * Handle token refresh
	 */
	async refreshToken(req: Request, res: Response): Promise<void> {
		try {
			// Get refresh token from cookie or header
			const refreshToken =
				req.cookies?.refreshToken || req.headers["x-refresh-token"];

			if (!refreshToken) {
				const errorResponse: ErrorResponse = {
					error: "Unauthorized",
					message: "Refresh token is required",
					code: "TOKEN_REQUIRED"
				};
				res.status(401).json(errorResponse);
				return;
			}

			const result = await this.authService.refreshToken(
				refreshToken as string
			);

			if (!result) {
				const errorResponse: ErrorResponse = {
					error: "Unauthorized",
					message: "Invalid or expired refresh token",
					code: "INVALID_TOKEN"
				};
				res.status(401).json(errorResponse);
				return;
			}

			const successResponse = {
				message: "Token refreshed successfully",
				access_token: result.accessToken
			};
			res.status(200).json(successResponse);
		} catch (error) {
			logger.error("Token refresh error:", error);

			const errorResponse: ErrorResponse = {
				error: "Unauthorized",
				message: "Token refresh failed",
				code: "TOKEN_REFRESH_FAILED"
			};

			res.status(401).json(errorResponse);
		}
	}

	/**
	 * Handle user logout
	 */
	async logout(_req: Request, res: Response): Promise<void> {
		try {
			// Clear refresh token cookie
			res.clearCookie("refreshToken");

			// TODO: Implement JWT token blacklisting if needed
			const successResponse: LogoutResponse = {
				message: "User logged out successfully"
			};
			res.status(200).json(successResponse);
		} catch (error) {
			logger.error("Logout error:", error);

			const errorResponse: ErrorResponse = {
				error: "Internal Server Error",
				message: "Logout failed",
				code: "LOGOUT_FAILED"
			};

			res.status(500).json(errorResponse);
		}
	}

	/**
	 * Handle email verification
	 */
	async verifyEmail(req: Request, res: Response): Promise<void> {
		try {
			const { token } = req.query;

			if (!token || typeof token !== "string") {
				const errorResponse: ErrorResponse = {
					error: "Bad Request",
					message: "Verification token is required",
					code: "TOKEN_REQUIRED"
				};
				res.status(400).json(errorResponse);
				return;
			}

			const result = await this.authService.verifyEmail(token);

			if (!result) {
				const errorResponse: ErrorResponse = {
					error: "Bad Request",
					message: "Invalid or expired verification token",
					code: "INVALID_TOKEN"
				};
				res.status(400).json(errorResponse);
				return;
			}

			const successResponse: verifyEmailResponse = {
				message: "Email verified successfully"
			};
			res.status(200).json(successResponse);
		} catch (error) {
			logger.error("Email verification error:", error);

			const errorResponse: ErrorResponse = {
				error: "Bad Request",
				message: "Email verification failed",
				code: "VERIFICATION_FAILED"
			};

			res.status(400).json(errorResponse);
		}
	}

	/**
	 * Handle password reset request
	 */
	async resetPassword(req: Request, res: Response): Promise<void> {
		try {
			const { email } = req.body;

			if (!email) {
				const errorResponse: ErrorResponse = {
					error: "Bad Request",
					message: "Email is required",
					code: "EMAIL_REQUIRED"
				};
				res.status(400).json(errorResponse);
				return;
			}

			await this.authService.requestPasswordReset(email);

			const successResponse: ResetPasswordResponse = {
				message: "Email sent with password reset instructions"
			};
			res.status(200).json(successResponse);
		} catch (error) {
			logger.error("Password reset error:", error);

			const errorResponse: ErrorResponse = {
				error: "Bad Request",
				message: "Password reset request failed",
				code: "RESET_REQUEST_FAILED"
			};

			res.status(400).json(errorResponse);
		}
	}

	/**
	 * Handle password change request
	 */
	async changePassword(req: Request, res: Response): Promise<void> {
		try {
			const { token } = req.query;

			if (!token || typeof token !== "string") {
				const errorResponse: ErrorResponse = {
					error: "Bad Request",
					message: "Password change token is required",
					code: "TOKEN_REQUIRED"
				};
				res.status(400).json(errorResponse);
				return;
			}

			const { newPassword } = req.body;

			if (!newPassword) {
				const errorResponse: ErrorResponse = {
					error: "Bad Request",
					message: "New password is required",
					code: "PASSWORD_REQUIRED"
				};
				res.status(400).json(errorResponse);
				return;
			}

			const result = await this.authService.resetPassword(token, newPassword);

			if (!result) {
				const errorResponse: ErrorResponse = {
					error: "Bad Request",
					message: "Failed to reset password",
					code: "PASSWORD_RESET_FAILED"
				};
				res.status(400).json(errorResponse);
				return;
			}

			const successResponse: ResetPasswordResponse = {
				message: "Password reset successfully"
			};
			res.status(200).json(successResponse);
		} catch (error) {
			logger.error("Password reset error:", error);

			const errorResponse: ErrorResponse = {
				error: "Internal Server Error",
				message: "Password reset failed",
				code: "PASSWORD_RESET_FAILED"
			};

			res.status(500).json(errorResponse);
		}
	}
}
