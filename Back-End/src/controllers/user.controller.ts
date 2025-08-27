import type { Request, Response } from "express";
import { logger } from "../server";
import type { UserService } from "@services/user.services";
import type { UpdateUserData } from "@models/user.entity";
import {
	validatePatchRequest,
	validatePutRequest,
} from "@utils/user-validation";

export class UserController {
	private userService: UserService;

	constructor(userService: UserService) {
		this.userService = userService;
	}

	public async getSelf(_req: Request, res: Response): Promise<Response> {
		const userId = res.locals?.user?.id;

		if (!userId) {
			return res.status(401).json({ message: "Unauthorized" });
		}

		try {
			const user = await this.userService.getUserById(userId);

			if (!user) {
				return res.status(404).json({ message: "User not found" });
			}

			return res.json(user);
		} catch (error) {
			logger.error(`Failed to get self user: ${userId}`, error);
			return res.status(500).json({ message: "Internal server error" });
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
				res.status(404).json({ message: "User not found" });
				return;
			}

			res.json(user);
		} catch (error) {
			logger.error(`Failed to get user by ID: ${id}`, error);
			res.status(500).json({ message: "Internal server error" });
		}
	}

	/**
	 * Patch user profile
	 */
	public async patchProfile(req: Request, res: Response): Promise<void> {
		const userId = res.locals?.user?.id;

		if (!userId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		// Validate the request body
		const validation = validatePatchRequest(req.body);

		if (!validation.isValid) {
			res.status(400).json({
				message: "Validation failed",
				errors: validation.errors,
				code: "VALIDATION_ERROR",
			});
			return;
		}

		// Check if there's anything to update
		if (Object.keys(validation.cleanedData).length === 0) {
			res.status(400).json({
				message: "No valid fields to update provided",
				code: "NO_UPDATE_DATA",
			});
			return;
		}

		try {
			const updatedUser = await this.userService.updateUser(
				userId,
				validation.cleanedData as Partial<UpdateUserData>
			);

			if (!updatedUser) {
				res.status(404).json({ message: "User not found" });
				return;
			}

			res.json({
				success: true,
				message: "Profile updated successfully",
				data: updatedUser,
			});
		} catch (error) {
			logger.error(`Failed to patch user profile: ${userId}`, error);
			res.status(500).json({ message: "Internal server error" });
		}
	}

	/**
	 * Put (replace) user profile
	 */
	public async putProfile(req: Request, res: Response): Promise<void> {
		const userId = res.locals?.user?.id;

		if (!userId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		// Validate the request body
		const validation = validatePutRequest(req.body);

		if (!validation.isValid) {
			res.status(400).json({
				message: "Validation failed",
				errors: validation.errors,
				code: "VALIDATION_ERROR",
			});
			return;
		}

		try {
			const updatedUser = await this.userService.updateUser(
				userId,
				validation.cleanedData as UpdateUserData
			);

			if (!updatedUser) {
				res.status(404).json({ message: "User not found" });
				return;
			}

			res.json({
				success: true,
				message: "Profile updated successfully",
				data: updatedUser,
			});
		} catch (error) {
			logger.error(`Failed to put user profile: ${userId}`, error);
			res.status(500).json({ message: "Internal server error" });
		}
	}

	/**
	 * Like/Dislike a person
	 */
	public async likeUser(req: Request, res: Response): Promise<void> {
		const userId = res.locals?.user?.id;
		const targetUserId = req.params.id;

		if (!userId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		if (targetUserId === userId) {
			res.status(400).json({ message: "Cannot like/dislike yourself" });
			return;
		}

		const { like } = req.body;

		if (typeof like !== "boolean") {
			res.status(400).json({ message: "Invalid request body" });
			return;
		}

		try {
			const result = await this.userService.likeUser(
				userId,
				targetUserId,
				like
			);

			res.status(201).json({
				success: true,
				message: like
					? "User liked successfully"
					: "User disliked successfully",
				data: {
					isMatch: result.isMatch,
					matchId: result.matchId,
				},
			});
		} catch (error) {
			logger.error(`Failed to like/dislike user: ${userId}`, error);
			res.status(500).json({ message: "Internal server error" });
		}
	}

	/**
	 * Remove like (unlike a user)
	 */
	public async unlikeUser(req: Request, res: Response): Promise<void> {
		const userId = res.locals?.user?.id;
		const targetUserId = req.params.id;

		if (!userId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		try {
			const success = await this.userService.unlikeUser(userId, targetUserId);

			if (success) {
				res.status(204).send();
			} else {
				res.status(404).json({ message: "Like not found" });
			}
		} catch (error) {
			logger.error(`Failed to unlike user: ${userId}`, error);
			res.status(500).json({ message: "Internal server error" });
		}
	}

	/**
	 * Get users who liked the specified user
	 */
	public async getUserLikes(req: Request, res: Response): Promise<void> {
		const userId = req.params.id;
		const currentUserId = res.locals?.user?.id;
		const page = parseInt(req.query.page as string) || 1;
		const limit = parseInt(req.query.limit as string) || 20;

		if (!currentUserId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		// Users can only see their own likes (privacy)
		if (userId !== currentUserId) {
			res
				.status(403)
				.json({ message: "Forbidden: Can only view your own likes" });
			return;
		}

		try {
			const result = await this.userService.getUserLikes(userId, page, limit);

			res.json({
				success: true,
				data: result.likes,
				pagination: result.pagination,
			});
		} catch (error) {
			logger.error(`Failed to get user likes: ${userId}`, error);
			res.status(500).json({ message: "Internal server error" });
		}
	}

	/**
	 * Get blocked users for a user
	 */
	public async getBlockedUsers(req: Request, res: Response): Promise<void> {
		const userId = req.params.id;
		const currentUserId = res.locals?.user?.id;
		const page = parseInt(req.query.page as string) || 1;
		const limit = parseInt(req.query.limit as string) || 20;

		if (!currentUserId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		// Users can only see their own blocked users (privacy)
		if (userId !== currentUserId) {
			res
				.status(403)
				.json({ message: "Forbidden: Can only view your own blocked users" });
			return;
		}

		try {
			const result = await this.userService.getBlockedUsers(
				userId,
				page,
				limit
			);

			res.json({
				success: true,
				data: result.blocks, // Fixed: should be 'blocks' not 'blockedUsers'
				pagination: result.pagination,
			});
		} catch (error) {
			logger.error(`Failed to get blocked users: ${userId}`, error);
			res.status(500).json({ message: "Internal server error" });
		}
	}

	/**
	 * Block a user
	 */
	public async blockUser(req: Request, res: Response): Promise<void> {
		const currentUserId = res.locals?.user?.id;
		const targetUserId = req.params.id;

		if (!currentUserId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		if (targetUserId === currentUserId) {
			res.status(400).json({ message: "Cannot block yourself" });
			return;
		}

		try {
			const result = await this.userService.blockUser(
				currentUserId,
				targetUserId
			);

			res.status(201).json({
				success: true,
				message: "User blocked successfully",
				data: {
					matchRemoved: result.matchRemoved,
					likesRemoved: result.likesRemoved,
				},
			});
		} catch (error) {
			logger.error(
				`Failed to block user: ${currentUserId} -> ${targetUserId}`,
				error
			);
			res.status(500).json({ message: "Internal server error" });
		}
	}

	/**
	 * Unblock a user
	 */
	public async unblockUser(req: Request, res: Response): Promise<void> {
		const currentUserId = res.locals?.user?.id;
		const targetUserId = req.params.id;

		if (!currentUserId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		try {
			const success = await this.userService.unblockUser(
				currentUserId,
				targetUserId
			);

			if (success) {
				res.status(204).send();
			} else {
				res.status(404).json({ message: "Block not found" });
			}
		} catch (error) {
			logger.error(
				`Failed to unblock user: ${currentUserId} -> ${targetUserId}`,
				error
			);
			res.status(500).json({ message: "Internal server error" });
		}
	}

	/**
	 * Get users matches
	 */
	public async getUserMatches(req: Request, res: Response): Promise<void> {
		const userId = req.params.id;
		const currentUserId = res.locals?.user?.id;
		const page = parseInt(req.query.page as string) || 1;
		const limit = parseInt(req.query.limit as string) || 20;

		if (!currentUserId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		// Users can only see their own matches (privacy)
		if (userId !== currentUserId) {
			res
				.status(403)
				.json({ message: "Forbidden: Can only view your own matches" });
			return;
		}

		try {
			const result = await this.userService.getUserMatches(userId, page, limit);

			res.json({
				success: true,
				data: result.matches,
				pagination: result.pagination,
			});
		} catch (error) {
			logger.error(`Failed to get user matches: ${userId}`, error);
			res.status(500).json({ message: "Internal server error" });
		}
	}

}
