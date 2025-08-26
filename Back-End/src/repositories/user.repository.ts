import { BaseRepository } from "@orm/base-repository";
import type { User, CreateUserData, UpdateUserData } from "@models/user.entity";
import type { Pool } from "pg";

export class UserRepository extends BaseRepository<User> {
	constructor(pool: Pool) {
		super(pool, "users");
	}

	/**
	 * Find user by email
	 */
	async findByEmail(email: string): Promise<User | null> {
		return this.findOneBy({ email } as Partial<User>);
	}

	/**
	 * Find user by username
	 */
	async findByUsername(username: string): Promise<User | null> {
		return this.findOneBy({ username } as Partial<User>);
	}

	/**
	 * Find user by email or username
	 */
	async findByEmailOrUsername(emailOrUsername: string): Promise<User | null> {
		const query = `
      SELECT * FROM ${this.tableName} 
      WHERE email = $1 OR username = $1 
      LIMIT 1
    `;
		const result = await this.pool.query(query, [emailOrUsername]);
		return result.rows[0] || null;
	}

	/**
	 * Create a new user with default values
	 */
	async createUser(userData: CreateUserData): Promise<User> {
		const userWithDefaults = {
			...userData,
			activated: false,
			profile_complete: false,
			fame_rating: 0.0,
			online_status: false,
			last_seen: new Date(),
			hashtags: [],
			location_manual: userData.location_manual ?? false,
		};

		return this.create(userWithDefaults);
	}

	/**
	 * Update user profile
	 */
	async updateProfile(
		id: string,
		profileData: UpdateUserData
	): Promise<User | null> {
		return this.update(id, profileData);
	}

	/**
	 * Activate user account
	 */
	async activateUser(id: string): Promise<User | null> {
		return this.update(id, {
			activated: true,
			email_verified_at: new Date(),
		} as Partial<User>);
	}

	/**
	 * Update user's online status
	 */
	async updateOnlineStatus(
		id: string,
		isOnline: boolean
	): Promise<User | null> {
		const updateData: Partial<User> = {
			online_status: isOnline,
			last_seen: new Date(),
		};
		return this.update(id, updateData);
	}

	/**
	 * Find users by location (within radius)
	 */
	async findByLocation(
		latitude: number,
		longitude: number,
		radiusKm: number = 50
	): Promise<User[]> {
		const query = `
      SELECT * FROM ${this.tableName}
      WHERE activated = true 
        AND ST_DWithin(
          location::geography,
          ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
          $3 * 1000
        )
      ORDER BY ST_Distance(
        location::geography,
        ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
      )
    `;

		const result = await this.pool.query(query, [
			longitude,
			latitude,
			radiusKm,
		]);
		return result.rows;
	}

	/**
	 * Search users by criteria
	 */
	async searchUsers(criteria: {
		ageMin?: number;
		ageMax?: number;
		gender?: string;
		sexualOrientation?: string;
		location?: { lat: number; lng: number; radius?: number };
		limit?: number;
		offset?: number;
	}): Promise<User[]> {
		let query = `SELECT * FROM ${this.tableName} WHERE activated = true`;
		const params: unknown[] = [];
		let paramIndex = 1;

		if (criteria.ageMin !== undefined) {
			query += ` AND age >= $${paramIndex}`;
			params.push(criteria.ageMin);
			paramIndex++;
		}

		if (criteria.ageMax !== undefined) {
			query += ` AND age <= $${paramIndex}`;
			params.push(criteria.ageMax);
			paramIndex++;
		}

		if (criteria.gender) {
			query += ` AND gender = $${paramIndex}`;
			params.push(criteria.gender);
			paramIndex++;
		}

		if (criteria.sexualOrientation) {
			query += ` AND sexual_orientation = $${paramIndex}`;
			params.push(criteria.sexualOrientation);
			paramIndex++;
		}

		if (criteria.location) {
			const radius = criteria.location.radius || 50;
			query += ` AND ST_DWithin(
        location::geography,
        ST_SetSRID(ST_MakePoint($${paramIndex}, $${
				paramIndex + 1
			}), 4326)::geography,
        $${paramIndex + 2} * 1000
      )`;
			params.push(criteria.location.lng, criteria.location.lat, radius);
			paramIndex += 3;
		}

		query += ` ORDER BY created_at DESC`;

		if (criteria.limit) {
			query += ` LIMIT $${paramIndex}`;
			params.push(criteria.limit);
			paramIndex++;
		}

		if (criteria.offset) {
			query += ` OFFSET $${paramIndex}`;
			params.push(criteria.offset);
		}

		const result = await this.pool.query(query, params);
		return result.rows;
	}
}
