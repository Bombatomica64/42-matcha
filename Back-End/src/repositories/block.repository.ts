import { BaseRepository } from "@orm/base-repository";
import type { Pool } from "pg";

export interface UserBlock {
	id: string;
	blocker_id: string;
	blocked_id: string;
	created_at: Date;
}

export interface CreateBlockData {
	blocker_id: string;
	blocked_id: string;
}

export interface BlockedUserWithDetails {
	id: string;
	blocker_id: string;
	blocked_id: string;
	created_at: Date;
	blocked_user: {
		id: string;
		username: string;
		first_name: string;
		last_name: string;
		bio: string;
		fame_rating: number;
		last_seen: Date;
		online_status: boolean;
	};
}

export class BlockRepository extends BaseRepository<UserBlock> {
	constructor(pool: Pool) {
		super(pool, {
			tableName: "user_blocks",
			primaryKey: "id",
			autoManagedColumns: ["id", "created_at"],
			defaultTextFields: [],
			defaultOrderBy: "created_at",
			defaultOrderDirection: "DESC",
		});
	}

	/**
	 * Create a new block
	 */
	async createBlock(blockData: CreateBlockData): Promise<UserBlock> {
		const query = `
      INSERT INTO user_blocks (blocker_id, blocked_id) 
      VALUES ($1, $2)
      ON CONFLICT (blocker_id, blocked_id) DO NOTHING
      RETURNING *
    `;

		const result = await this.pool.query(query, [blockData.blocker_id, blockData.blocked_id]);

		// If no row returned, block already exists
		if (result.rows.length === 0) {
			// Fetch the existing block
			return (await this.findBlock(blockData.blocker_id, blockData.blocked_id)) as UserBlock;
		}

		return result.rows[0];
	}

	/**
	 * Remove a block (unblock user)
	 */
	async removeBlock(blockerId: string, blockedId: string): Promise<boolean> {
		const query = `
      DELETE FROM user_blocks 
      WHERE blocker_id = $1 AND blocked_id = $2
    `;

		const result = await this.pool.query(query, [blockerId, blockedId]);
		return result.rowCount !== null && result.rowCount > 0;
	}

	/**
	 * Find block between two users
	 */
	async findBlock(blockerId: string, blockedId: string): Promise<UserBlock | null> {
		const query = `
      SELECT * FROM user_blocks 
      WHERE blocker_id = $1 AND blocked_id = $2
    `;

		const result = await this.pool.query(query, [blockerId, blockedId]);
		return result.rows[0] || null;
	}

	/**
	 * Check if user1 has blocked user2
	 */
	async isUserBlocked(blockerId: string, blockedId: string): Promise<boolean> {
		const block = await this.findBlock(blockerId, blockedId);
		return block !== null;
	}

	/**
	 * Check if there's any block between two users (either direction)
	 */
	async isBlockedBetweenUsers(
		user1Id: string,
		user2Id: string,
	): Promise<{
		user1BlockedUser2: boolean;
		user2BlockedUser1: boolean;
		anyBlock: boolean;
	}> {
		const query = `
      SELECT 
        EXISTS(SELECT 1 FROM user_blocks WHERE blocker_id = $1 AND blocked_id = $2) as user1_blocked_user2,
        EXISTS(SELECT 1 FROM user_blocks WHERE blocker_id = $2 AND blocked_id = $1) as user2_blocked_user1
    `;

		const result = await this.pool.query(query, [user1Id, user2Id]);
		const row = result.rows[0];

		const user1BlockedUser2 = row.user1_blocked_user2;
		const user2BlockedUser1 = row.user2_blocked_user1;

		return {
			user1BlockedUser2,
			user2BlockedUser1,
			anyBlock: user1BlockedUser2 || user2BlockedUser1,
		};
	}

	/**
	 * Get users blocked by a specific user
	 */
	async getBlockedUsers(
		blockerId: string,
		limit = 50,
		offset = 0,
	): Promise<BlockedUserWithDetails[]> {
		const query = `
      SELECT 
        ub.*,
        u.username, u.first_name, u.last_name, u.bio,
        u.fame_rating, u.last_seen, u.online_status
      FROM user_blocks ub
      JOIN users u ON ub.blocked_id = u.id
      WHERE ub.blocker_id = $1
      ORDER BY ub.created_at DESC
      LIMIT $2 OFFSET $3
    `;

		const result = await this.pool.query(query, [blockerId, limit, offset]);

		return result.rows.map((row) => ({
			id: row.id,
			blocker_id: row.blocker_id,
			blocked_id: row.blocked_id,
			created_at: row.created_at,
			blocked_user: {
				id: row.blocked_id,
				username: row.username,
				first_name: row.first_name,
				last_name: row.last_name,
				bio: row.bio,
				fame_rating: row.fame_rating,
				last_seen: row.last_seen,
				online_status: row.online_status,
			},
		}));
	}

	/**
	 * Get users who blocked a specific user
	 */
	async getUsersWhoBlockedUser(blockedId: string, limit = 50, offset = 0): Promise<UserBlock[]> {
		const query = `
      SELECT ub.* FROM user_blocks ub
      WHERE ub.blocked_id = $1
      ORDER BY ub.created_at DESC
      LIMIT $2 OFFSET $3
    `;

		const result = await this.pool.query(query, [blockedId, limit, offset]);
		return result.rows;
	}

	/**
	 * Get block count for a user (how many users they've blocked)
	 */
	async getBlockedCount(blockerId: string): Promise<number> {
		const query = `
      SELECT COUNT(*) as count FROM user_blocks 
      WHERE blocker_id = $1
    `;

		const result = await this.pool.query(query, [blockerId]);
		return parseInt(result.rows[0].count, 10);
	}

	/**
	 * Get count of users who blocked this user
	 */
	async getBlockedByCount(blockedId: string): Promise<number> {
		const query = `
      SELECT COUNT(*) as count FROM user_blocks 
      WHERE blocked_id = $1
    `;

		const result = await this.pool.query(query, [blockedId]);
		return parseInt(result.rows[0].count, 10);
	}

	/**
	 * Get all user IDs that a user has blocked (for filtering)
	 */
	async getBlockedUserIds(blockerId: string): Promise<string[]> {
		const query = `
      SELECT blocked_id FROM user_blocks 
      WHERE blocker_id = $1
    `;

		const result = await this.pool.query(query, [blockerId]);
		return result.rows.map((row) => row.blocked_id);
	}

	/**
	 * Get all user IDs who blocked this user (for filtering)
	 */
	async getUsersWhoBlockedUserIds(blockedId: string): Promise<string[]> {
		const query = `
      SELECT blocker_id FROM user_blocks 
      WHERE blocked_id = $1
    `;

		const result = await this.pool.query(query, [blockedId]);
		return result.rows.map((row) => row.blocker_id);
	}

	/**
	 * Get comprehensive block list for filtering (both directions)
	 */
	async getAllBlockedUserIds(userId: string): Promise<{
		blockedByUser: string[];
		userBlockedBy: string[];
		allBlockedUsers: string[];
	}> {
		const query = `
      SELECT 
        ARRAY_AGG(DISTINCT ub1.blocked_id) FILTER (WHERE ub1.blocked_id IS NOT NULL) as blocked_by_user,
        ARRAY_AGG(DISTINCT ub2.blocker_id) FILTER (WHERE ub2.blocker_id IS NOT NULL) as user_blocked_by
      FROM user_blocks ub1
      RIGHT JOIN (SELECT $1 as user_id) u ON true
      LEFT JOIN user_blocks ub2 ON ub2.blocked_id = u.user_id
      WHERE ub1.blocker_id = u.user_id
    `;

		const result = await this.pool.query(query, [userId]);
		const row = result.rows[0];

		const blockedByUser = row.blocked_by_user || [];
		const userBlockedBy = row.user_blocked_by || [];
		const allBlockedUsers = [...new Set([...blockedByUser, ...userBlockedBy])];

		return {
			blockedByUser,
			userBlockedBy,
			allBlockedUsers,
		};
	}

	/**
	 * Clean up blocks when users are deleted (maintenance function)
	 */
	async cleanupDeletedUserBlocks(): Promise<number> {
		const query = `
      DELETE FROM user_blocks 
      WHERE blocker_id NOT IN (SELECT id FROM users)
      OR blocked_id NOT IN (SELECT id FROM users)
    `;

		const result = await this.pool.query(query);
		return result.rowCount || 0;
	}
}
