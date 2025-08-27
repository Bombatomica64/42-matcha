import { pool } from "../database";
import type { User } from "@models/user.entity";
import { UserRepository } from "@repositories/user.repository";
import { LikeService } from "./like.service";
import { BlockService } from "./block.service";

export class UserService {
	private userRepository: UserRepository;
	private likeService: LikeService;
	private blockService: BlockService;
	private matchService: MatchService;

	constructor() {
		this.userRepository = new UserRepository(pool);
		this.likeService = new LikeService();
		this.blockService = new BlockService();
		this.matchService = new MatchService();
	}

	/**
	 * Get selected user by ID
	 */
	public async getUserById(id: string): Promise<User | null> {
		return this.userRepository.findById(id);
	}

	/**
	 * Update user by ID
	 */
	public async updateUser(
		id: string,
		data: Partial<User>
	): Promise<User | null> {
		return this.userRepository.update(id, data);
	}

	/**
	 * Like a user
	 */
	public async likeUser(
		userId: string,
		targetUserId: string,
		like: boolean
	): Promise<{
		success: boolean;
		isMatch: boolean;
		matchId?: string;
	}> {
		const result = await this.likeService.likeUser(userId, targetUserId, like);

		return {
			success: true,
			isMatch: result.isMatch,
			matchId: result.matchId,
		};
	}

	/**
	 * Unlike a user
	 */
	public async unlikeUser(
		userId: string,
		targetUserId: string
	): Promise<boolean> {
		return this.likeService.unlikeUser(userId, targetUserId);
	}

	/**
	 * Get users who liked this user
	 */
	public async getUserLikes(userId: string, page = 1, limit = 20) {
		return this.likeService.getUserLikes(userId, page, limit);
	}

	/**
	 * Get like statistics for a user
	 */
	public async getLikeStats(userId: string) {
		return this.likeService.getLikeStats(userId);
	}

	/**
	 * Get blocked users for a user
	 */
	public async getBlockedUsers(userId: string, page = 1, limit = 20) {
		return this.blockService.getBlockedUsers(userId, page, limit);
	}

	/**
	 * Block a user
	 */
	public async blockUser(blockerId: string, blockedId: string): Promise<{
		success: boolean;
		matchRemoved: boolean;
		likesRemoved: boolean;
	}> {
		const result = await this.blockService.blockUser(blockerId, blockedId);
		
		return {
			success: true,
			matchRemoved: result.matchRemoved,
			likesRemoved: result.likesRemoved
		};
	}

	/**
	 * Unblock a user
	 */
	public async unblockUser(blockerId: string, blockedId: string): Promise<boolean> {
		return this.blockService.unblockUser(blockerId, blockedId);
	}

	/**
	 * Check if users can interact (not blocked)
	 */
	public async canUsersInteract(user1Id: string, user2Id: string) {
		return this.blockService.canUsersInteract(user1Id, user2Id);
	}

	/**
	 * Get block statistics for a user
	 */
	public async getBlockStats(userId: string) {
		return this.blockService.getBlockStats(userId);
	}

	/**
	 * Get user matches
	 */
	public async getUserMatches(userId: string, page = 1, limit = 20) {
		return this.matchService.getUserMatches(userId, page, limit);
	}
}
