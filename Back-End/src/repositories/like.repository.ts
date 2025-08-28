import { BaseRepository } from "@orm/base-repository";
import type { Pool } from "pg";

export interface UserLike {
	id: string;
	liker_id: string;
	liked_id: string;
	is_like: boolean;
	created_at: Date;
}

export interface CreateLikeData {
	liker_id: string;
	liked_id: string;
	is_like: boolean;
}

export interface LikeStats {
	total_likes: number;
	total_dislikes: number;
	recent_likes: number; // likes in last 24h
}

export class LikeRepository extends BaseRepository<UserLike> {
	constructor(pool: Pool) {
		super(pool, "user_likes");
	}

	/**
	 * Create or update a like/dislike
	 */
	async createOrUpdateLike(likeData: CreateLikeData): Promise<UserLike> {
		const query = `
      INSERT INTO user_likes (liker_id, liked_id, is_like) 
      VALUES ($1, $2, $3)
      ON CONFLICT (liker_id, liked_id) 
      DO UPDATE SET 
        is_like = EXCLUDED.is_like,
        created_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

		const result = await this.pool.query(query, [
			likeData.liker_id,
			likeData.liked_id,
			likeData.is_like,
		]);

		return result.rows[0];
	}

	/**
	 * Remove a like/dislike (unlike)
	 */
	async removeLike(likerId: string, likedId: string): Promise<boolean> {
		const query = `
      DELETE FROM user_likes 
      WHERE liker_id = $1 AND liked_id = $2
    `;

		const result = await this.pool.query(query, [likerId, likedId]);
		return result.rowCount !== null && result.rowCount > 0;
	}

	/**
	 * Get like status between two users
	 */
	async getLikeBetweenUsers(likerId: string, likedId: string): Promise<UserLike | null> {
		const query = `
      SELECT * FROM user_likes 
      WHERE liker_id = $1 AND liked_id = $2
    `;

		const result = await this.pool.query(query, [likerId, likedId]);
		return result.rows[0] || null;
	}

	/**
	 * Check if there's mutual like (match potential)
	 */
	async checkMutualLike(user1Id: string, user2Id: string): Promise<boolean> {
		const query = `
      SELECT COUNT(*) as count FROM user_likes 
      WHERE ((liker_id = $1 AND liked_id = $2) OR (liker_id = $2 AND liked_id = $1))
      AND is_like = true
    `;

		const result = await this.pool.query(query, [user1Id, user2Id]);
		return parseInt(result.rows[0].count) === 2;
	}

	/**
	 * Get users who liked a specific user
	 */
	async getUsersWhoLikedUser(userId: string, limit = 50, offset = 0): Promise<UserLike[]> {
		const query = `
      SELECT ul.*, 
             u.username, u.first_name, u.last_name, u.bio,
             u.fame_rating, u.last_seen, u.online_status
      FROM user_likes ul
      JOIN users u ON ul.liker_id = u.id
      WHERE ul.liked_id = $1 AND ul.is_like = true
      ORDER BY ul.created_at DESC
      LIMIT $2 OFFSET $3
    `;

		const result = await this.pool.query(query, [userId, limit, offset]);
		return result.rows;
	}

	/**
	 * Get users that a user has liked
	 */
	async getUsersLikedByUser(userId: string, limit = 50, offset = 0): Promise<UserLike[]> {
		const query = `
      SELECT ul.*, 
             u.username, u.first_name, u.last_name, u.bio,
             u.fame_rating, u.last_seen, u.online_status
      FROM user_likes ul
      JOIN users u ON ul.liked_id = u.id
      WHERE ul.liker_id = $1 AND ul.is_like = true
      ORDER BY ul.created_at DESC
      LIMIT $2 OFFSET $3
    `;

		const result = await this.pool.query(query, [userId, limit, offset]);
		return result.rows;
	}

	/**
	 * Get like statistics for a user
	 */
	async getLikeStats(userId: string): Promise<LikeStats> {
		const query = `
      SELECT 
        COUNT(*) FILTER (WHERE is_like = true) as total_likes,
        COUNT(*) FILTER (WHERE is_like = false) as total_dislikes,
        COUNT(*) FILTER (WHERE is_like = true AND created_at > NOW() - INTERVAL '24 hours') as recent_likes
      FROM user_likes 
      WHERE liked_id = $1
    `;

		const result = await this.pool.query(query, [userId]);
		const row = result.rows[0];

		return {
			total_likes: parseInt(row.total_likes) || 0,
			total_dislikes: parseInt(row.total_dislikes) || 0,
			recent_likes: parseInt(row.recent_likes) || 0,
		};
	}

	/**
	 * Update user's likes_received_count in users table
	 */
	async updateUserLikeCount(userId: string): Promise<void> {
		const query = `
      UPDATE users 
      SET likes_received_count = (
        SELECT COUNT(*) FROM user_likes 
        WHERE liked_id = $1 AND is_like = true
      )
      WHERE id = $1
    `;

		await this.pool.query(query, [userId]);
	}

	/**
	 * Get recent likes activity for discovery/recommendations
	 */
	async getRecentLikeActivity(userId: string, days = 7): Promise<UserLike[]> {
		const query = `
      SELECT * FROM user_likes 
      WHERE liker_id = $1 
      AND created_at > NOW() - INTERVAL '${days} days'
      ORDER BY created_at DESC
    `;

		const result = await this.pool.query(query, [userId]);
		return result.rows;
	}

	/**
	 * Check if user can like (rate limiting)
	 */
	async checkLikeRateLimit(userId: string, maxLikesPerHour = 50): Promise<boolean> {
		const query = `
      SELECT COUNT(*) as count FROM user_likes 
      WHERE liker_id = $1 
      AND created_at > NOW() - INTERVAL '1 hour'
    `;

		const result = await this.pool.query(query, [userId]);
		const likesInLastHour = parseInt(result.rows[0].count);

		return likesInLastHour < maxLikesPerHour;
	}
}
