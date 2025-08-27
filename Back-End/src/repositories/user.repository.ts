import { BaseRepository } from "@orm/base-repository";
import type { User, CreateUserData, UpdateUserData } from "@models/user.entity";
import type { Pool } from "pg";

export class UserRepository extends BaseRepository<User> {
	constructor(pool: Pool) {
		super(pool, "users");
	}

	/**
	 * Find user with hashtags and photos
	 */
	async findByIdWithDetails(id: string): Promise<User | null> {
		const query = `
			SELECT 
				u.*,
				COALESCE(
					JSON_AGG(
						DISTINCT h.name
					) FILTER (WHERE h.name IS NOT NULL), 
					'[]'
				) as hashtags,
				COALESCE(
					JSON_AGG(
						DISTINCT jsonb_build_object(
							'id', p.id,
							'user_uuid', p.user_uuid,
							'filename', p.filename,
							'original_filename', p.original_filename,
							'file_path', p.file_path,
							'file_size', p.file_size,
							'mime_type', p.mime_type,
							'is_primary', p.is_primary,
							'display_order', p.display_order,
							'created_at', p.created_at
						)
					) FILTER (WHERE p.id IS NOT NULL),
					'[]'
				) as photos
			FROM users u
			LEFT JOIN user_hashtags uh ON u.id = uh.user_id
			LEFT JOIN hashtags h ON uh.hashtag_id = h.id
			LEFT JOIN user_photos p ON u.id = p.user_uuid
			WHERE u.id = $1
			GROUP BY u.id
		`;
		
		const result = await this.pool.query(query, [id]);
		return result.rows[0] || null;
	}

	/**
	 * Override the base findById to include details
	 */
	async findById(id: string): Promise<User | null> {
		return this.findByIdWithDetails(id);
	}

	/**
	 * Find user by email
	 */
	async findByEmail(email: string): Promise<User | null> {
		const query = `
			SELECT 
				u.*,
				COALESCE(
					JSON_AGG(
						DISTINCT h.name
					) FILTER (WHERE h.name IS NOT NULL), 
					'[]'
				) as hashtags,
				COALESCE(
					JSON_AGG(
						DISTINCT jsonb_build_object(
							'id', p.id,
							'user_uuid', p.user_uuid,
							'filename', p.filename,
							'original_filename', p.original_filename,
							'file_path', p.file_path,
							'file_size', p.file_size,
							'mime_type', p.mime_type,
							'is_primary', p.is_primary,
							'display_order', p.display_order,
							'created_at', p.created_at
						)
					) FILTER (WHERE p.id IS NOT NULL),
					'[]'
				) as photos
			FROM users u
			LEFT JOIN user_hashtags uh ON u.id = uh.user_id
			LEFT JOIN hashtags h ON uh.hashtag_id = h.id
			LEFT JOIN user_photos p ON u.id = p.user_uuid
			WHERE u.email = $1
			GROUP BY u.id
		`;
		
		const result = await this.pool.query(query, [email]);
		return result.rows[0] || null;
	}

	/**
	 * Find user by username
	 */
	async findByUsername(username: string): Promise<User | null> {
		const query = `
			SELECT 
				u.*,
				COALESCE(
					JSON_AGG(
						DISTINCT h.name
					) FILTER (WHERE h.name IS NOT NULL), 
					'[]'
				) as hashtags,
				COALESCE(
					JSON_AGG(
						DISTINCT jsonb_build_object(
							'id', p.id,
							'user_uuid', p.user_uuid,
							'filename', p.filename,
							'original_filename', p.original_filename,
							'file_path', p.file_path,
							'file_size', p.file_size,
							'mime_type', p.mime_type,
							'is_primary', p.is_primary,
							'display_order', p.display_order,
							'created_at', p.created_at
						)
					) FILTER (WHERE p.id IS NOT NULL),
					'[]'
				) as photos
			FROM users u
			LEFT JOIN user_hashtags uh ON u.id = uh.user_id
			LEFT JOIN hashtags h ON uh.hashtag_id = h.id
			LEFT JOIN user_photos p ON u.id = p.user_uuid
			WHERE u.username = $1
			GROUP BY u.id
		`;
		
		const result = await this.pool.query(query, [username]);
		return result.rows[0] || null;
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
	 * Search users by criteria with pagination (excludes blocked users)
	 */
	async searchUsers(
		currentUserId: string,
		criteria: {
			ageMin?: number;
			ageMax?: number;
			gender?: string;
			sexualOrientation?: string;
			location?: { lat: number; lng: number; radius?: number };
			query?: string;
			interests?: string[];
			page?: number;
			perPage?: number;
		}
	): Promise<{
		total_results: number;
		total_pages: number;
		current_page: number;
		users: User[];
		links: {
			first: string;
			last: string;
			prev: string | null;
			next: string | null;
		};
	}> {
		const page = criteria.page || 1;
		const perPage = Math.min(criteria.perPage || 10, 50); // Max 50 per page
		const offset = (page - 1) * perPage;

		// Base query for counting total results
		let countQuery = `
			SELECT COUNT(DISTINCT u.id) as total
			FROM users u
			LEFT JOIN user_hashtags uh ON u.id = uh.user_id
			LEFT JOIN hashtags h ON uh.hashtag_id = h.id
			WHERE u.activated = true
			AND u.id != $1
			AND NOT EXISTS (
				SELECT 1 FROM user_blocks ub1 
				WHERE ub1.blocker_id = $1 AND ub1.blocked_id = u.id
			)
			AND NOT EXISTS (
				SELECT 1 FROM user_blocks ub2 
				WHERE ub2.blocker_id = u.id AND ub2.blocked_id = $1
			)
		`;

		// Base query for fetching users with details
		let dataQuery = `
			SELECT 
				u.*,
				COALESCE(
					JSON_AGG(
						DISTINCT h.name
					) FILTER (WHERE h.name IS NOT NULL), 
					'[]'
				) as hashtags,
				COALESCE(
					JSON_AGG(
						DISTINCT jsonb_build_object(
							'id', p.id,
							'user_uuid', p.user_uuid,
							'filename', p.filename,
							'original_filename', p.original_filename,
							'file_path', p.file_path,
							'file_size', p.file_size,
							'mime_type', p.mime_type,
							'is_primary', p.is_primary,
							'display_order', p.display_order,
							'created_at', p.created_at
						)
					) FILTER (WHERE p.id IS NOT NULL),
					'[]'
				) as photos
			FROM users u
			LEFT JOIN user_hashtags uh ON u.id = uh.user_id
			LEFT JOIN hashtags h ON uh.hashtag_id = h.id
			LEFT JOIN user_photos p ON u.id = p.user_uuid
			WHERE u.activated = true
			AND u.id != $1
			AND NOT EXISTS (
				SELECT 1 FROM user_blocks ub1 
				WHERE ub1.blocker_id = $1 AND ub1.blocked_id = u.id
			)
			AND NOT EXISTS (
				SELECT 1 FROM user_blocks ub2 
				WHERE ub2.blocker_id = u.id AND ub2.blocked_id = $1
			)
		`;
		
		const params: unknown[] = [currentUserId];
		const countParams: unknown[] = [currentUserId];
		let paramIndex = 2; // Start at 2 since $1 is currentUserId

		// Add search filters
		if (criteria.query) {
			const searchCondition = ` AND (
				u.first_name ILIKE $${paramIndex} OR 
				u.last_name ILIKE $${paramIndex} OR 
				u.username ILIKE $${paramIndex} OR
				u.bio ILIKE $${paramIndex}
			)`;
			const searchValue = `%${criteria.query}%`;
			
			dataQuery += searchCondition;
			countQuery += searchCondition;
			params.push(searchValue);
			countParams.push(searchValue);
			paramIndex++;
		}

		if (criteria.ageMin !== undefined) {
			const ageCondition = ` AND EXTRACT(YEAR FROM AGE(u.birth_date)) >= $${paramIndex}`;
			dataQuery += ageCondition;
			countQuery += ageCondition;
			params.push(criteria.ageMin);
			countParams.push(criteria.ageMin);
			paramIndex++;
		}

		if (criteria.ageMax !== undefined) {
			const ageCondition = ` AND EXTRACT(YEAR FROM AGE(u.birth_date)) <= $${paramIndex}`;
			dataQuery += ageCondition;
			countQuery += ageCondition;
			params.push(criteria.ageMax);
			countParams.push(criteria.ageMax);
			paramIndex++;
		}

		if (criteria.gender) {
			const genderCondition = ` AND u.gender = $${paramIndex}`;
			dataQuery += genderCondition;
			countQuery += genderCondition;
			params.push(criteria.gender);
			countParams.push(criteria.gender);
			paramIndex++;
		}

		if (criteria.sexualOrientation) {
			const orientationCondition = ` AND u.sexual_orientation = $${paramIndex}`;
			dataQuery += orientationCondition;
			countQuery += orientationCondition;
			params.push(criteria.sexualOrientation);
			countParams.push(criteria.sexualOrientation);
			paramIndex++;
		}

		if (criteria.interests && criteria.interests.length > 0) {
			const interestsCondition = ` AND EXISTS (
				SELECT 1 FROM user_hashtags uh2 
				JOIN hashtags h2 ON uh2.hashtag_id = h2.id 
				WHERE uh2.user_id = u.id AND h2.name = ANY($${paramIndex})
			)`;
			dataQuery += interestsCondition;
			countQuery += interestsCondition;
			params.push(criteria.interests);
			countParams.push(criteria.interests);
			paramIndex++;
		}

		if (criteria.location) {
			const radius = criteria.location.radius || 50;
			const locationCondition = ` AND ST_DWithin(
				u.location::geography,
				ST_SetSRID(ST_MakePoint($${paramIndex}, $${paramIndex + 1}), 4326)::geography,
				$${paramIndex + 2} * 1000
			)`;
			dataQuery += locationCondition;
			countQuery += locationCondition;
			params.push(criteria.location.lng, criteria.location.lat, radius);
			countParams.push(criteria.location.lng, criteria.location.lat, radius);
			paramIndex += 3;
		}

		// Get total count
		const countResult = await this.pool.query(countQuery, countParams);
		const totalResults = parseInt(countResult.rows[0].total, 10);
		const totalPages = Math.ceil(totalResults / perPage);

		// Add GROUP BY and pagination to main query
		dataQuery += ` GROUP BY u.id ORDER BY u.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
		params.push(perPage, offset);

		const result = await this.pool.query(dataQuery, params);

		// Build query string for pagination links
		const buildQueryString = (pageNum: number) => {
			const queryParts: string[] = [];
			queryParts.push(`page=${pageNum}`);
			queryParts.push(`per_page=${perPage}`);
			
			if (criteria.query) queryParts.push(`query=${encodeURIComponent(criteria.query)}`);
			if (criteria.ageMin !== undefined) queryParts.push(`age_min=${criteria.ageMin}`);
			if (criteria.ageMax !== undefined) queryParts.push(`age_max=${criteria.ageMax}`);
			if (criteria.gender) queryParts.push(`gender=${criteria.gender}`);
			if (criteria.sexualOrientation) queryParts.push(`sexual_orientation=${criteria.sexualOrientation}`);
			if (criteria.location) {
				queryParts.push(`location=${criteria.location.lat},${criteria.location.lng}`);
				if (criteria.location.radius) queryParts.push(`radius=${criteria.location.radius}`);
			}
			if (criteria.interests && criteria.interests.length > 0) {
				queryParts.push(`interests=${criteria.interests.join(',')}`);
			}
			
			return `/api/user/search?${queryParts.join('&')}`;
		};

		return {
			total_results: totalResults,
			total_pages: totalPages,
			current_page: page,
			users: result.rows,
			links: {
				first: buildQueryString(1),
				last: buildQueryString(totalPages),
				prev: page > 1 ? buildQueryString(page - 1) : null,
				next: page < totalPages ? buildQueryString(page + 1) : null,
			},
		};
	}
}
