import { BaseRepository } from "@orm/base-repository";
import type { Pool } from "pg";

export interface Match {
	id: string;
	user1_id: string;
	user2_id: string;
	created_at: Date;
}

export interface CreateMatchData {
	user1_id: string;
	user2_id: string;
}

export interface MatchWithUser {
	id: string;
	user1_id: string;
	user2_id: string;
	created_at: Date;
	matched_user: {
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

export class MatchRepository extends BaseRepository<Match> {
	constructor(pool: Pool) {
		super(pool, {
			tableName: "matches",
			primaryKey: "id",
			autoManagedColumns: ["id", "created_at"],
			defaultTextFields: [],
			defaultOrderBy: "created_at",
			defaultOrderDirection: "DESC",
		});
	}

	/**
	 * Create a new match between two users
	 */
	async createMatch(user1Id: string, user2Id: string): Promise<Match> {
		// Ensure consistent ordering (smaller ID first)
		const [firstUserId, secondUserId] = [user1Id, user2Id].sort();

		const query = `
      INSERT INTO matches (user1_id, user2_id) 
      VALUES ($1, $2)
      ON CONFLICT (user1_id, user2_id) DO NOTHING
      RETURNING *
    `;

		const result = await this.pool.query(query, [firstUserId, secondUserId]);

		// If no row returned, match already exists
		if (result.rows.length === 0) {
			// Fetch the existing match
			return (await this.findMatch(user1Id, user2Id)) as Match;
		}

		return result.rows[0];
	}

	/**
	 * Find match between two users
	 */
	async findMatch(user1Id: string, user2Id: string): Promise<Match | null> {
		const [firstUserId, secondUserId] = [user1Id, user2Id].sort();

		const query = `
      SELECT * FROM matches 
      WHERE user1_id = $1 AND user2_id = $2
    `;

		const result = await this.pool.query(query, [firstUserId, secondUserId]);
		return result.rows[0] || null;
	}

	/**
	 * Get all matches for a user
	 */
	async getUserMatches(userId: string, limit = 50, offset = 0): Promise<MatchWithUser[]> {
		const query = `
      SELECT 
        m.*,
        CASE 
          WHEN m.user1_id = $1 THEN m.user2_id 
          ELSE m.user1_id 
        END as matched_user_id,
        u.username, u.first_name, u.last_name, u.bio,
        u.fame_rating, u.last_seen, u.online_status
      FROM matches m
      JOIN users u ON (
        CASE 
          WHEN m.user1_id = $1 THEN m.user2_id 
          ELSE m.user1_id 
        END = u.id
      )
      WHERE m.user1_id = $1 OR m.user2_id = $1
      ORDER BY m.created_at DESC
      LIMIT $2 OFFSET $3
    `;

		const result = await this.pool.query(query, [userId, limit, offset]);

		return result.rows.map((row) => ({
			id: row.id,
			user1_id: row.user1_id,
			user2_id: row.user2_id,
			created_at: row.created_at,
			matched_user: {
				id: row.matched_user_id,
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
	 * Remove a match (unmatch)
	 */
	async removeMatch(user1Id: string, user2Id: string): Promise<boolean> {
		const [firstUserId, secondUserId] = [user1Id, user2Id].sort();

		const query = `
      DELETE FROM matches 
      WHERE user1_id = $1 AND user2_id = $2
    `;

		const result = await this.pool.query(query, [firstUserId, secondUserId]);
		return result.rowCount !== null && result.rowCount > 0;
	}

	/**
	 * Check if two users are matched
	 */
	async areUsersMatched(user1Id: string, user2Id: string): Promise<boolean> {
		const match = await this.findMatch(user1Id, user2Id);
		return match !== null;
	}

	/**
	 * Get match count for a user
	 */
	async getUserMatchCount(userId: string): Promise<number> {
		const query = `
      SELECT COUNT(*) as count FROM matches 
      WHERE user1_id = $1 OR user2_id = $1
    `;

		const result = await this.pool.query(query, [userId]);
		return parseInt(result.rows[0].count, 10);
	}

	/**
	 * Get recent matches for a user
	 */
	async getRecentMatches(userId: string, days = 7): Promise<MatchWithUser[]> {
		const query = `
      SELECT 
        m.*,
        CASE 
          WHEN m.user1_id = $1 THEN m.user2_id 
          ELSE m.user1_id 
        END as matched_user_id,
        u.username, u.first_name, u.last_name, u.bio,
        u.fame_rating, u.last_seen, u.online_status
      FROM matches m
      JOIN users u ON (
        CASE 
          WHEN m.user1_id = $1 THEN m.user2_id 
          ELSE m.user1_id 
        END = u.id
      )
      WHERE (m.user1_id = $1 OR m.user2_id = $1)
      AND m.created_at > NOW() - INTERVAL '${days} days'
      ORDER BY m.created_at DESC
    `;

		const result = await this.pool.query(query, [userId]);

		return result.rows.map((row) => ({
			id: row.id,
			user1_id: row.user1_id,
			user2_id: row.user2_id,
			created_at: row.created_at,
			matched_user: {
				id: row.matched_user_id,
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
	 * Update user's match count in users table
	 */
	async updateUserMatchCount(userId: string): Promise<void> {
		const query = `
      UPDATE users 
      SET matches_count = (
        SELECT COUNT(*) FROM matches 
        WHERE user1_id = $1 OR user2_id = $1
      )
      WHERE id = $1
    `;

		await this.pool.query(query, [userId]);
	}
}
