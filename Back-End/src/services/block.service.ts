import { pool } from "../database";
import { BlockRepository } from "@repositories/block.repository";
import { MatchRepository } from "@repositories/match.repository";
import { LikeRepository } from "@repositories/like.repository";
import type {
	UserBlock,
	CreateBlockData,
	BlockedUserWithDetails,
} from "@repositories/block.repository";

export class BlockService {
	private blockRepository: BlockRepository;
	private matchRepository: MatchRepository;
	private likeRepository: LikeRepository;

	constructor() {
		this.blockRepository = new BlockRepository(pool);
		this.matchRepository = new MatchRepository(pool);
		this.likeRepository = new LikeRepository(pool);
	}

	/**
	 * Block a user
	 */
	async blockUser(
		blockerId: string,
		blockedId: string
	): Promise<{
		block: UserBlock;
		matchRemoved: boolean;
		likesRemoved: boolean;
	}> {
		// Validate: User can't block themselves
		if (blockerId === blockedId) {
			throw new Error("Users cannot block themselves");
		}

		// Create the block
		const blockData: CreateBlockData = {
			blocker_id: blockerId,
			blocked_id: blockedId,
		};

		const block = await this.blockRepository.createBlock(blockData);

		// Remove any existing match between the users
		let matchRemoved = false;
		const existingMatch = await this.matchRepository.findMatch(
			blockerId,
			blockedId
		);
		if (existingMatch) {
			await this.matchRepository.removeMatch(blockerId, blockedId);
			matchRemoved = true;

			// Update match counts
			await this.matchRepository.updateUserMatchCount(blockerId);
			await this.matchRepository.updateUserMatchCount(blockedId);
		}

		// Remove any likes between the users
		let likesRemoved = false;
		const like1 = await this.likeRepository.getLikeBetweenUsers(
			blockerId,
			blockedId
		);
		const like2 = await this.likeRepository.getLikeBetweenUsers(
			blockedId,
			blockerId
		);

		if (like1) {
			await this.likeRepository.removeLike(blockerId, blockedId);
			likesRemoved = true;
		}

		if (like2) {
			await this.likeRepository.removeLike(blockedId, blockerId);
			likesRemoved = true;
		}

		// Update like counts if likes were removed
		if (likesRemoved) {
			await this.likeRepository.updateUserLikeCount(blockerId);
			await this.likeRepository.updateUserLikeCount(blockedId);
		}

		return {
			block,
			matchRemoved,
			likesRemoved,
		};
	}

	/**
	 * Unblock a user
	 */
	async unblockUser(blockerId: string, blockedId: string): Promise<boolean> {
		return this.blockRepository.removeBlock(blockerId, blockedId);
	}

	/**
	 * Get users blocked by a specific user
	 */
	async getBlockedUsers(
		blockerId: string,
		page = 1,
		limit = 20
	): Promise<{
		blocks: BlockedUserWithDetails[];
		pagination: {
			page: number;
			limit: number;
			total: number;
			hasNext: boolean;
			hasPrev: boolean;
		};
	}> {
		const offset = (page - 1) * limit;
		const blocks = await this.blockRepository.getBlockedUsers(
			blockerId,
			limit + 1,
			offset
		);

		// Get total count
		const total = await this.blockRepository.getBlockedCount(blockerId);

		const hasNext = blocks.length > limit;
		const actualBlocks = hasNext ? blocks.slice(0, -1) : blocks;

		return {
			blocks: actualBlocks,
			pagination: {
				page,
				limit,
				total,
				hasNext,
				hasPrev: page > 1,
			},
		};
	}

	/**
	 * Check if user is blocked
	 */
	async isUserBlocked(blockerId: string, blockedId: string): Promise<boolean> {
		return this.blockRepository.isUserBlocked(blockerId, blockedId);
	}

	/**
	 * Check block status between two users (both directions)
	 */
	async getBlockStatus(
		user1Id: string,
		user2Id: string
	): Promise<{
		user1BlockedUser2: boolean;
		user2BlockedUser1: boolean;
		anyBlock: boolean;
	}> {
		return this.blockRepository.isBlockedBetweenUsers(user1Id, user2Id);
	}

	/**
	 * Get comprehensive block list for filtering
	 */
	async getBlockedUserIdsForFiltering(userId: string): Promise<string[]> {
		const blockData = await this.blockRepository.getAllBlockedUserIds(userId);
		return blockData.allBlockedUsers;
	}

	/**
	 * Check if interaction is allowed between two users
	 */
	async canUsersInteract(
		user1Id: string,
		user2Id: string
	): Promise<{
		canInteract: boolean;
		reason?: string;
	}> {
		const blockStatus = await this.getBlockStatus(user1Id, user2Id);

		if (blockStatus.anyBlock) {
			return {
				canInteract: false,
				reason: blockStatus.user1BlockedUser2
					? "You have blocked this user"
					: "This user has blocked you",
			};
		}

		return { canInteract: true };
	}

	/**
	 * Get block statistics for a user
	 */
	async getBlockStats(userId: string): Promise<{
		blockedByUser: number;
		userBlockedBy: number;
	}> {
		const [blockedByUser, userBlockedBy] = await Promise.all([
			this.blockRepository.getBlockedCount(userId),
			this.blockRepository.getBlockedByCount(userId),
		]);

		return {
			blockedByUser,
			userBlockedBy,
		};
	}

	/**
	 * Validate block action (business rules)
	 */
	async validateBlockAction(
		blockerId: string,
		blockedId: string
	): Promise<{
		isValid: boolean;
		error?: string;
	}> {
		// Check if user is trying to block themselves
		if (blockerId === blockedId) {
			return {
				isValid: false,
				error: "Cannot block yourself",
			};
		}

		// Check if already blocked
		const isAlreadyBlocked = await this.isUserBlocked(blockerId, blockedId);
		if (isAlreadyBlocked) {
			return {
				isValid: false,
				error: "User is already blocked",
			};
		}

		// Check block limit (optional business rule - max 1000 blocks per user)
		const blockCount = await this.blockRepository.getBlockedCount(blockerId);
		if (blockCount >= 1000) {
			return {
				isValid: false,
				error: "Maximum block limit reached",
			};
		}

		return { isValid: true };
	}

	/**
	 * Bulk unblock users (admin/maintenance function)
	 */
	async bulkUnblockUsers(
		blockerId: string,
		blockedUserIds: string[]
	): Promise<{
		success: number;
		failed: number;
	}> {
		let success = 0;
		let failed = 0;

		for (const blockedId of blockedUserIds) {
			try {
				const result = await this.unblockUser(blockerId, blockedId);
				if (result) {
					success++;
				} else {
					failed++;
				}
			} catch {
				failed++;
			}
		}

		return { success, failed };
	}

	/**
	 * Get current user's blocked users (dedicated endpoint)
	 */
	async getCurrentUserBlocks(
		userId: string, 
		page = 1, 
		limit = 20
	): Promise<{
		blocks: Array<{
			user: BlockedUserWithDetails;
			blockedAt: Date;
		}>;
		total: number;
		pagination: {
			page: number;
			totalPages: number;
			hasNext: boolean;
			hasPrev: boolean;
		};
	}> {
		const result = await this.getBlockedUsers(userId, page, limit);
		
		const formattedBlocks = result.blocks.map(block => ({
			user: block,
			blockedAt: block.created_at
		}));

		const totalPages = Math.ceil(result.pagination.total / limit);

		return {
			blocks: formattedBlocks,
			total: result.pagination.total,
			pagination: {
				page,
				totalPages,
				hasNext: page < totalPages,
				hasPrev: page > 1
			}
		};
	}
}
