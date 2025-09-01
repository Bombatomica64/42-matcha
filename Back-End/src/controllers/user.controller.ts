import type { components } from "@generated/typescript/api";
import type { UpdateUserData } from "@models/user.entity";
import type { UserService } from "@services/user.services";
import { validatePatchRequest, validatePutRequest } from "@utils/user-validation";
import type { Request, Response } from "express";
import { logger } from "../server";

type ErrorResponse = components["schemas"]["ErrorResponse"];
type SuccessResponse = components["schemas"]["SuccessResponse"];
type User = components["schemas"]["User"];

export class UserController {
	private userService: UserService;

	constructor(userService: UserService) {
		this.userService = userService;
	}

	public async getSelf(_req: Request, res: Response): Promise<Response> {
		const userId = res.locals?.user?.id;

		if (!userId) {
			const errorResponse: ErrorResponse = {
				error: "Unauthorized",
				message: "Authentication required to access this resource",
				code: "AUTH_REQUIRED",
			};
			return res.status(401).json(errorResponse);
		}

		try {
			const user = await this.userService.getUserById(userId);

			if (!user) {
				const errorResponse: ErrorResponse = {
					error: "Not Found",
					message: "User profile not found",
					code: "USER_NOT_FOUND",
				};
				return res.status(404).json(errorResponse);
			}

			// Return User object wrapped in user property to match test expectations
			return res.json({ user: user as unknown as User });
		} catch (error) {
			logger.error(`Failed to get self user: ${userId}`, error);
			const errorResponse: ErrorResponse = {
				error: "Internal Server Error",
				message: "Failed to retrieve user profile",
				code: "SERVER_ERROR",
			};
			return res.status(500).json(errorResponse);
		}
	}

	/**
	 * Get user by ID
	 */
	public async getUserById(req: Request, res: Response): Promise<void> {
		const { id } = req.params;

		try {
			const user = await this.userService.getUserById(id);

			if (!user) {
				const errorResponse: ErrorResponse = {
					error: "Not Found",
					message: "User not found",
					code: "USER_NOT_FOUND",
				};
				res.status(404).json(errorResponse);
				return;
			}

			// Return User object wrapped in user property to match test expectations
			res.json({ user: user as unknown as User });
		} catch (error) {
			logger.error(`Failed to get user by ID: ${id}`, error);
			const errorResponse: ErrorResponse = {
				error: "Internal Server Error",
				message: "Failed to retrieve user",
				code: "SERVER_ERROR",
			};
			res.status(500).json(errorResponse);
		}
	}

	/**
	 * Patch user profile
	 */
	public async patchProfile(req: Request, res: Response): Promise<void> {
		const userId = res.locals?.user?.id;

		if (!userId) {
			const errorResponse: ErrorResponse = {
				error: "Unauthorized",
				message: "Authentication required to update profile",
				code: "AUTH_REQUIRED",
			};
			res.status(401).json(errorResponse);
			return;
		}

		// Validate the request body
		const validation = validatePatchRequest(req.body);

		if (!validation.isValid) {
			const errorResponse: ErrorResponse = {
				error: "Validation Error",
				message: "Invalid data provided for profile update",
				code: "VALIDATION_ERROR",
				details: validation.errors as unknown as { [key: string]: unknown },
			};
			res.status(400).json(errorResponse);
			return;
		}

		// Check if there's anything to update
		if (Object.keys(validation.cleanedData).length === 0) {
			const errorResponse: ErrorResponse = {
				error: "Bad Request",
				message: "No valid fields to update provided",
				code: "NO_UPDATE_DATA",
			};
			res.status(400).json(errorResponse);
			return;
		}

		try {
			const updatedUser = await this.userService.updateUser(
				userId,
				validation.cleanedData as Partial<UpdateUserData>,
			);

			if (!updatedUser) {
				const errorResponse: ErrorResponse = {
					error: "Not Found",
					message: "User profile not found",
					code: "USER_NOT_FOUND",
				};
				res.status(404).json(errorResponse);
				return;
			}

			// Return User object wrapped in user property to match test expectations
			res.json({ user: updatedUser as unknown as User });
		} catch (error) {
			logger.error(`Failed to patch user profile: ${userId}`, error);
			const errorResponse: ErrorResponse = {
				error: "Internal Server Error",
				message: "Failed to update profile",
				code: "SERVER_ERROR",
			};
			res.status(500).json(errorResponse);
		}
	}

	/**
	 * Put (replace) user profile
	 */
	public async putProfile(req: Request, res: Response): Promise<void> {
		const userId = res.locals?.user?.id;

		if (!userId) {
			const errorResponse: ErrorResponse = {
				error: "Unauthorized",
				message: "Authentication required to replace profile",
				code: "AUTH_REQUIRED",
			};
			res.status(401).json(errorResponse);
			return;
		}

		// Validate the request body
		const validation = validatePutRequest(req.body);

		if (!validation.isValid) {
			const errorResponse: ErrorResponse = {
				error: "Validation Error",
				message: "Invalid data provided for profile replacement",
				code: "VALIDATION_ERROR",
				details: validation.errors as unknown as { [key: string]: unknown },
			};
			res.status(400).json(errorResponse);
			return;
		}

		try {
			const updatedUser = await this.userService.updateUser(
				userId,
				validation.cleanedData as UpdateUserData,
			);

			if (!updatedUser) {
				const errorResponse: ErrorResponse = {
					error: "Not Found",
					message: "User profile not found",
					code: "USER_NOT_FOUND",
				};
				res.status(404).json(errorResponse);
				return;
			}

			// Return User object wrapped in user property to match test expectations
			res.json({ user: updatedUser as unknown as User });
		} catch (error) {
			logger.error(`Failed to put user profile: ${userId}`, error);
			const errorResponse: ErrorResponse = {
				error: "Internal Server Error",
				message: "Failed to replace profile",
				code: "SERVER_ERROR",
			};
			res.status(500).json(errorResponse);
		}
	}

	/**
	 * Like/Dislike a person
	 */
	public async likeUser(req: Request, res: Response): Promise<void> {
		const userId = res.locals?.user?.id;
		const targetUserId = req.params.id;

		if (!userId) {
			const errorResponse: ErrorResponse = {
				error: "Unauthorized",
				message: "Authentication required to like users",
				code: "AUTH_REQUIRED",
			};
			res.status(401).json(errorResponse);
			return;
		}

		if (targetUserId === userId) {
			const errorResponse: ErrorResponse = {
				error: "Bad Request",
				message: "Cannot like or dislike yourself",
				code: "SELF_INTERACTION_FORBIDDEN",
			};
			res.status(400).json(errorResponse);
			return;
		}

		const { like } = req.body;

		if (typeof like !== "boolean") {
			const errorResponse: ErrorResponse = {
				error: "Bad Request",
				message: "Invalid request body. 'like' field must be a boolean",
				code: "INVALID_LIKE_VALUE",
			};
			res.status(400).json(errorResponse);
			return;
		}

		try {
			const result = await this.userService.likeUser(userId, targetUserId, like);

			const successResponse: SuccessResponse = {
				message: like ? "User liked successfully" : "User disliked successfully",
				data: {
					isMatch: result.isMatch,
					matchId: result.matchId,
					action: like ? "liked" : "disliked",
					targetUserId,
				},
			};
			res.status(201).json(successResponse);
		} catch (error) {
			logger.error(`Failed to like/dislike user: ${userId} -> ${targetUserId}`, error);
			const errorResponse: ErrorResponse = {
				error: "Internal Server Error",
				message: `Failed to ${like ? "like" : "dislike"} user`,
				code: "LIKE_ACTION_FAILED",
			};
			res.status(500).json(errorResponse);
		}
	}

	/**
	 * Remove like (unlike a user)
	 */
	public async unlikeUser(req: Request, res: Response): Promise<void> {
		const userId = res.locals?.user?.id;
		const targetUserId = req.params.id;

		if (!userId) {
			const errorResponse: ErrorResponse = {
				error: "Unauthorized",
				message: "Authentication required to unlike users",
				code: "AUTH_REQUIRED",
			};
			res.status(401).json(errorResponse);
			return;
		}

		try {
			const success = await this.userService.unlikeUser(userId, targetUserId);

			if (success) {
				res.status(204).send();
			} else {
				const errorResponse: ErrorResponse = {
					error: "Not Found",
					message: "Like relationship not found",
					code: "LIKE_NOT_FOUND",
				};
				res.status(404).json(errorResponse);
			}
		} catch (error) {
			logger.error(`Failed to unlike user: ${userId} -> ${targetUserId}`, error);
			const errorResponse: ErrorResponse = {
				error: "Internal Server Error",
				message: "Failed to remove like",
				code: "UNLIKE_ACTION_FAILED",
			};
			res.status(500).json(errorResponse);
		}
	}

	/**
	 * Get users who liked the specified user (legacy endpoint with ID parameter)
	 */
	public async getUserLikes(req: Request, res: Response): Promise<void> {
		const userId = req.params.id;
		const currentUserId = res.locals?.user?.id;
		const page = parseInt(req.query.page as string) || 1;
		const limit = parseInt(req.query.limit as string) || 20;

		if (!currentUserId) {
			const errorResponse: ErrorResponse = {
				error: "Unauthorized",
				message: "Authentication required to view likes",
				code: "AUTH_REQUIRED",
			};
			res.status(401).json(errorResponse);
			return;
		}

		// Users can only see their own likes (privacy)
		if (userId !== currentUserId) {
			const errorResponse: ErrorResponse = {
				error: "Forbidden",
				message: "You can only view your own likes. Use /users/likes instead.",
				code: "PRIVACY_VIOLATION",
			};
			res.status(403).json(errorResponse);
			return;
		}

		try {
			const result = await this.userService.getUserLikes(userId, page, limit);

			const successResponse: SuccessResponse = {
				message: "User likes retrieved successfully",
				data: {
					likes: result.likes,
					pagination: result.pagination,
				},
			};
			res.json(successResponse);
		} catch (error) {
			logger.error(`Failed to get user likes: ${userId}`, error);
			const errorResponse: ErrorResponse = {
				error: "Internal Server Error",
				message: "Failed to retrieve user likes",
				code: "SERVER_ERROR",
			};
			res.status(500).json(errorResponse);
		}
	}

	/**
	 * Get blocked users for a user (legacy endpoint with ID parameter)
	 */
	public async getBlockedUsers(req: Request, res: Response): Promise<void> {
		const userId = req.params.id;
		const currentUserId = res.locals?.user?.id;
		const page = parseInt(req.query.page as string) || 1;
		const limit = parseInt(req.query.limit as string) || 20;

		if (!currentUserId) {
			const errorResponse: ErrorResponse = {
				error: "Unauthorized",
				message: "Authentication required to view blocked users",
				code: "AUTH_REQUIRED",
			};
			res.status(401).json(errorResponse);
			return;
		}

		// Users can only see their own blocked users (privacy)
		if (userId !== currentUserId) {
			const errorResponse: ErrorResponse = {
				error: "Forbidden",
				message: "You can only view your own blocked users. Use /users/blocks instead.",
				code: "PRIVACY_VIOLATION",
			};
			res.status(403).json(errorResponse);
			return;
		}

		try {
			const result = await this.userService.getBlockedUsers(userId, page, limit);

			const successResponse: SuccessResponse = {
				message: "Blocked users retrieved successfully",
				data: {
					blocks: result.blocks,
					pagination: result.pagination,
				},
			};
			res.json(successResponse);
		} catch (error) {
			logger.error(`Failed to get blocked users: ${userId}`, error);
			const errorResponse: ErrorResponse = {
				error: "Internal Server Error",
				message: "Failed to retrieve blocked users",
				code: "SERVER_ERROR",
			};
			res.status(500).json(errorResponse);
		}
	}

	/**
	 * Block a user
	 */
	public async blockUser(req: Request, res: Response): Promise<void> {
		const currentUserId = res.locals?.user?.id;
		const targetUserId = req.params.id;

		if (!currentUserId) {
			const errorResponse: ErrorResponse = {
				error: "Unauthorized",
				message: "Authentication required to block users",
				code: "AUTH_REQUIRED",
			};
			res.status(401).json(errorResponse);
			return;
		}

		if (targetUserId === currentUserId) {
			const errorResponse: ErrorResponse = {
				error: "Bad Request",
				message: "Cannot block yourself",
				code: "SELF_BLOCK_FORBIDDEN",
			};
			res.status(400).json(errorResponse);
			return;
		}

		try {
			await this.userService.blockUser(currentUserId, targetUserId);

			// According to OpenAPI spec, block should return 204 No Content
			res.status(204).send();
		} catch (error) {
			logger.error(`Failed to block user: ${currentUserId} -> ${targetUserId}`, error);
			const errorResponse: ErrorResponse = {
				error: "Internal Server Error",
				message: "Failed to block user",
				code: "BLOCK_ACTION_FAILED",
			};
			res.status(500).json(errorResponse);
		}
	}

	/**
	 * Unblock a user
	 */
	public async unblockUser(req: Request, res: Response): Promise<void> {
		const currentUserId = res.locals?.user?.id;
		const targetUserId = req.params.id;

		if (!currentUserId) {
			const errorResponse: ErrorResponse = {
				error: "Unauthorized",
				message: "Authentication required to unblock users",
				code: "AUTH_REQUIRED",
			};
			res.status(401).json(errorResponse);
			return;
		}

		try {
			await this.userService.unblockUser(currentUserId, targetUserId);

			// According to OpenAPI spec, unblock should return 204 No Content
			res.status(204).send();
		} catch (error) {
			logger.error(`Failed to unblock user: ${currentUserId} -> ${targetUserId}`, error);
			const errorResponse: ErrorResponse = {
				error: "Internal Server Error",
				message: "Failed to unblock user",
				code: "UNBLOCK_ACTION_FAILED",
			};
			res.status(500).json(errorResponse);
		}
	}

	/**
	 * Get users matches (legacy endpoint with ID parameter)
	 */
	public async getUserMatches(req: Request, res: Response): Promise<void> {
		const userId = req.params.id;
		const currentUserId = res.locals?.user?.id;
		const page = parseInt(req.query.page as string) || 1;
		const limit = parseInt(req.query.limit as string) || 20;

		if (!currentUserId) {
			const errorResponse: ErrorResponse = {
				error: "Unauthorized",
				message: "Authentication required to access matches",
				code: "AUTH_REQUIRED",
			};
			res.status(401).json(errorResponse);
			return;
		}

		// Users can only see their own matches (privacy)
		if (userId !== currentUserId) {
			const errorResponse: ErrorResponse = {
				error: "Forbidden",
				message: "Forbidden: You can only view your own matches. Use /users/matches instead.",
				code: "PRIVACY_VIOLATION",
			};
			res.status(403).json(errorResponse);
			return;
		}

		try {
			const result = await this.userService.getUserMatches(userId, page, limit);

			const successResponse: SuccessResponse = {
				message: "Matches retrieved successfully",
				data: {
					matches: result.matches,
					pagination: result.pagination,
				},
			};
			res.status(200).json(successResponse);
		} catch (error) {
			logger.error(`Failed to get user matches: ${userId}`, error);
			const errorResponse: ErrorResponse = {
				error: "Internal Server Error",
				message: "Failed to fetch matches",
				code: "SERVER_ERROR",
			};
			res.status(500).json(errorResponse);
		}
	}

	/**
	 * Get current user's likes (dedicated endpoint)
	 */
	public async getCurrentUserLikes(req: Request, res: Response): Promise<void> {
		const currentUserId = res.locals?.user?.id;
		const type = (req.query.type as "given" | "received" | "mutual") || "received";
		const page = parseInt(req.query.page as string) || 1;
		const limit = parseInt(req.query.limit as string) || 20;

		if (!currentUserId) {
			const errorResponse: ErrorResponse = {
				error: "Unauthorized",
				message: "Authentication required to access likes",
				code: "AUTH_REQUIRED",
			};
			res.status(401).json(errorResponse);
			return;
		}

		// Validate type parameter
		if (!["given", "received", "mutual"].includes(type)) {
			const errorResponse: ErrorResponse = {
				error: "Bad Request",
				message: "Invalid type parameter. Must be 'given', 'received', or 'mutual'",
				code: "INVALID_PARAMETER",
			};
			res.status(400).json(errorResponse);
			return;
		}

		try {
			const result = await this.userService.getCurrentUserLikes(currentUserId, type, page, limit);

			const successResponse: SuccessResponse = {
				message: "Likes retrieved successfully",
				data: {
					type,
					total: result.total,
					page: result.pagination.page,
					totalPages: result.pagination.totalPages,
					likes: result.likes,
				},
			};
			res.status(200).json(successResponse);
		} catch (error) {
			logger.error(`Failed to get current user likes: ${currentUserId}`, error);
			const errorResponse: ErrorResponse = {
				error: "Internal Server Error",
				message: "Failed to fetch likes",
				code: "SERVER_ERROR",
			};
			res.status(500).json(errorResponse);
		}
	}

	/**
	 * Get current user's blocked users (dedicated endpoint)
	 */
	public async getCurrentUserBlocks(req: Request, res: Response): Promise<void> {
		const currentUserId = res.locals?.user?.id;
		const page = parseInt(req.query.page as string) || 1;
		const limit = parseInt(req.query.limit as string) || 20;

		if (!currentUserId) {
			const errorResponse: ErrorResponse = {
				error: "Unauthorized",
				message: "Authentication required to access blocked users",
				code: "AUTH_REQUIRED",
			};
			res.status(401).json(errorResponse);
			return;
		}

		try {
			const result = await this.userService.getCurrentUserBlocks(currentUserId, page, limit);

			const successResponse: SuccessResponse = {
				message: "Blocked users retrieved successfully",
				data: {
					total: result.total,
					page: result.pagination.page,
					totalPages: result.pagination.totalPages,
					blockedUsers: result.blocks,
				},
			};
			res.status(200).json(successResponse);
		} catch (error) {
			logger.error(`Failed to get current user blocks: ${currentUserId}`, error);
			const errorResponse: ErrorResponse = {
				error: "Internal Server Error",
				message: "Failed to fetch blocked users",
				code: "SERVER_ERROR",
			};
			res.status(500).json(errorResponse);
		}
	}

	/**
	 * Get current user's matches (dedicated endpoint)
	 */
	public async getCurrentUserMatches(req: Request, res: Response): Promise<void> {
		const currentUserId = res.locals?.user?.id;
		const page = parseInt(req.query.page as string) || 1;
		const limit = parseInt(req.query.limit as string) || 20;

		if (!currentUserId) {
			const errorResponse: ErrorResponse = {
				error: "Unauthorized",
				message: "Authentication required to access matches",
				code: "AUTH_REQUIRED",
			};
			res.status(401).json(errorResponse);
			return;
		}

		try {
			const result = await this.userService.getUserMatches(currentUserId, page, limit);

			const successResponse: SuccessResponse = {
				message: "Matches retrieved successfully",
				data: {
					total: result.pagination.total,
					page: result.pagination.page,
					totalPages: Math.ceil(result.pagination.total / limit),
					matches: result.matches,
				},
			};
			res.status(200).json(successResponse);
		} catch (error) {
			logger.error(`Failed to get current user matches: ${currentUserId}`, error);
			const errorResponse: ErrorResponse = {
				error: "Internal Server Error",
				message: "Failed to fetch matches",
				code: "SERVER_ERROR",
			};
			res.status(500).json(errorResponse);
		}
	}

	/**
	 * Search for users with filters and pagination
	 */
	public async searchUsers(req: Request, res: Response): Promise<void> {
		const currentUserId = res.locals?.user?.id;

		if (!currentUserId) {
			const errorResponse: ErrorResponse = {
				error: "Unauthorized",
				message: "Authentication required to search users",
				code: "AUTH_REQUIRED",
			};
			res.status(401).json(errorResponse);
			return;
		}

		try {
			// Parse and validate query parameters
			const query = req.query.query as string;
			const ageMin = req.query.age_min ? parseInt(req.query.age_min as string) : undefined;
			const ageMax = req.query.age_max ? parseInt(req.query.age_max as string) : undefined;
			const gender = req.query.gender as string;
			const location = req.query.location as string;
			const interests = req.query.interests as string;
			const page = parseInt(req.query.page as string) || 1;
			const perPage = Math.min(parseInt(req.query.per_page as string) || 10, 50);

			// Validate parameters
			if (ageMin !== undefined && (ageMin < 18 || ageMin > 100)) {
				const errorResponse: ErrorResponse = {
					error: "Bad Request",
					message: "Minimum age must be between 18 and 100",
					code: "VALIDATION_ERROR",
				};
				res.status(400).json(errorResponse);
				return;
			}

			if (ageMax !== undefined && (ageMax < 18 || ageMax > 100)) {
				const errorResponse: ErrorResponse = {
					error: "Bad Request",
					message: "Maximum age must be between 18 and 100",
					code: "VALIDATION_ERROR",
				};
				res.status(400).json(errorResponse);
				return;
			}

			if (ageMin !== undefined && ageMax !== undefined && ageMin > ageMax) {
				const errorResponse: ErrorResponse = {
					error: "Bad Request",
					message: "Minimum age cannot be greater than maximum age",
					code: "VALIDATION_ERROR",
				};
				res.status(400).json(errorResponse);
				return;
			}

			// Parse location if provided
			let locationCriteria: { lat: number; lng: number; radius?: number } | undefined;
			if (location) {
				const [lat, lng, radius] = location.split(",").map(Number);
				if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
					locationCriteria = { lat, lng };
					if (!Number.isNaN(radius) && radius > 0) {
						locationCriteria.radius = Math.min(radius, 1000); // Max 1000km
					}
				}
			}

			// Parse interests if provided
			const interestsList = interests
				? interests
						.split(",")
						.map((s) => s.trim())
						.filter(Boolean)
				: undefined;

			// Build search criteria
			const searchCriteria = {
				query,
				ageMin,
				ageMax,
				gender,
				location: locationCriteria,
				interests: interestsList,
				page,
				perPage,
			};

			// Call the repository search method
			const result = await this.userService.searchUsers(currentUserId, searchCriteria);

			// Return standardized paginated response
			res.status(200).json(result);
		} catch (error) {
			logger.error(`Failed to search users for: ${currentUserId}`, error);
			const errorResponse: ErrorResponse = {
				error: "Internal Server Error",
				message: "Failed to search users",
				code: "SERVER_ERROR",
			};
			res.status(500).json(errorResponse);
		}
	}

	/**
	 * Get discoverable users based on compatibility algorithm
	 */
	public async getDiscoverableUsers(req: Request, res: Response): Promise<void> {
		const currentUserId = res.locals?.user?.id;

		if (!currentUserId) {
			const errorResponse: ErrorResponse = {
				error: "Unauthorized",
				message: "Authentication required to discover users",
				code: "AUTH_REQUIRED",
			};
			res.status(401).json(errorResponse);
			return;
		}

		try {
			// Parse query parameters with page-based pagination
			const maxDistance = req.query.maxDistance ? parseInt(req.query.maxDistance as string) : 10; //10 km default
			const ageMin = req.query.ageMin
				? parseInt(req.query.ageMin as string) < 18
					? 18
					: parseInt(req.query.ageMin as string)
				: 18; //18 years default
			const ageMax = req.query.ageMax
				? parseInt(req.query.ageMax as string) > 100
					? 100
					: parseInt(req.query.ageMax as string)
				: 100; //100 years default
			const minFameRating = req.query.minFameRating
				? parseFloat(req.query.minFameRating as string) < 0
					? 0
					: parseFloat(req.query.minFameRating as string)
				: 0; //0 fame rating default
			const page = parseInt(req.query.page as string) || 1;
			const limit = parseInt(req.query.limit as string) || 20;

			// Validate parameters
			if (maxDistance !== undefined && (maxDistance < 1 || maxDistance > 1000)) {
				const errorResponse: ErrorResponse = {
					error: "Bad Request",
					message: "Max distance must be between 1 and 1000 kilometers",
					code: "VALIDATION_ERROR",
				};
				res.status(400).json(errorResponse);
				return;
			}

			if (ageMin !== undefined && (ageMin < 18 || ageMin > 100)) {
				const errorResponse: ErrorResponse = {
					error: "Bad Request",
					message: "Minimum age must be between 18 and 100",
					code: "VALIDATION_ERROR",
				};
				res.status(400).json(errorResponse);
				return;
			}

			if (ageMax !== undefined && (ageMax < 18 || ageMax > 100)) {
				const errorResponse: ErrorResponse = {
					error: "Bad Request",
					message: "Maximum age must be between 18 and 100",
					code: "VALIDATION_ERROR",
				};
				res.status(400).json(errorResponse);
				return;
			}

			if (ageMin !== undefined && ageMax !== undefined && ageMin > ageMax) {
				const errorResponse: ErrorResponse = {
					error: "Bad Request",
					message: "Minimum age cannot be greater than maximum age",
					code: "VALIDATION_ERROR",
				};
				res.status(400).json(errorResponse);
				return;
			}

			if (minFameRating !== undefined && (minFameRating < 0 || minFameRating > 5)) {
				const errorResponse: ErrorResponse = {
					error: "Bad Request",
					message: "Minimum fame rating must be between 0 and 5",
					code: "VALIDATION_ERROR",
				};
				res.status(400).json(errorResponse);
				return;
			}

			const result = await this.userService.getDiscoverableUsers(currentUserId, {
				maxDistance,
				ageMin,
				ageMax,
				minFameRating,
				page,
				limit,
			});

			// If no users found and this is the first page, return 204
			if (result.data.length === 0 && page === 1) {
				const noUsersResponse = {
					message: "No more potential matches available",
					suggestions: [
						"Try expanding your distance preferences",
						"Consider adjusting your age range",
						"Add more interests to your profile",
					],
				};
				res.status(204).json(noUsersResponse);
				return;
			}

			// Return the standardized paginated response
			res.status(200).json(result);
		} catch (error) {
			logger.error(`Failed to get discoverable users for: ${currentUserId}`, error);
			const errorResponse: ErrorResponse = {
				error: "Internal Server Error",
				message: "Failed to fetch discoverable users",
				code: "SERVER_ERROR",
			};
			res.status(500).json(errorResponse);
		}
	}
}
