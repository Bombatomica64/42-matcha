import type { components, PaginatedResponse } from "@generated/typescript/api";
import { calculatePagination, createPaginatedResponse } from "@utils/pagination";
import type { Pool, QueryResult } from "pg";

type PaginationRequest = components["schemas"]["PaginationQuery"];

interface BaseRepositoryConfig {
	/** Primary table name for this repository */
	tableName: string;
	/** Primary key column name (default: 'id') */
	primaryKey?: string;
	/** Columns that are automatically managed (excluded from create/update) */
	autoManagedColumns?: string[];
	/** Default text fields for search operations */
	defaultTextFields?: string[];
	/** Default ordering field */
	defaultOrderBy?: string;
	/** Default ordering direction */
	defaultOrderDirection?: "ASC" | "DESC";
}

export abstract class BaseRepository<T> {
	protected pool: Pool;
	protected tableName: string;
	protected primaryKey: string;
	protected autoManagedColumns: string[];
	protected defaultTextFields: string[];
	protected defaultOrderBy?: string;
	protected defaultOrderDirection: "ASC" | "DESC";

	constructor(pool: Pool, config: BaseRepositoryConfig) {
		this.pool = pool;
		this.tableName = config.tableName;
		this.primaryKey = config.primaryKey || "id";
		this.autoManagedColumns = config.autoManagedColumns || [
			"id",
			"created_at",
			"updated_at",
			"photos",
			"hashtags",
		];
		this.defaultTextFields = config.defaultTextFields || [];
		this.defaultOrderBy = config.defaultOrderBy;
		this.defaultOrderDirection = config.defaultOrderDirection || "DESC";
	}

	/**
	 * Find entity by ID
	 */
	async findById(id: string): Promise<T | null> {
		const query = `SELECT * FROM ${this.tableName} WHERE ${this.primaryKey} = $1`;
		const result = await this.pool.query(query, [id]);
		return result.rows[0] || null;
	}

	/**
	 * Find all entities with optional limit and offset
	 */
	async findAll(limit?: number, offset?: number): Promise<T[]> {
		let query = `SELECT * FROM ${this.tableName}`;
		const params: unknown[] = [];

		if (limit !== undefined) {
			params.push(limit);
			query += ` LIMIT $${params.length}`;
		}

		if (offset !== undefined) {
			params.push(offset);
			query += ` OFFSET $${params.length}`;
		}

		const result = await this.pool.query(query, params);
		return result.rows;
	}

	/**
	 * Find entities by criteria
	 */
	async findBy(criteria: Partial<T>, limit?: number, offset?: number): Promise<T[]> {
		const keys = Object.keys(criteria);
		if (keys.length === 0) return this.findAll(limit, offset);

		const conditions = keys.map((key, index) => `${key} = $${index + 1}`).join(" AND ");
		const values = Object.values(criteria);

		let query = `SELECT * FROM ${this.tableName} WHERE ${conditions}`;

		if (limit !== undefined) {
			values.push(limit);
			query += ` LIMIT $${values.length}`;
		}

		if (offset !== undefined) {
			values.push(offset);
			query += ` OFFSET $${values.length}`;
		}

		const result = await this.pool.query(query, values);
		return result.rows;
	}

	/**
	 * Find one entity by criteria
	 */
	async findOneBy(criteria: Partial<T>): Promise<T | null> {
		const results = await this.findBy(criteria, 1);
		return results[0] || null;
	}

	/**
	 * Create new entity
	 */
	async create(entity: Partial<T>): Promise<T> {
		// Filter out auto-managed columns
		const filteredEntity: Record<string, unknown> = {};
		Object.keys(entity as Record<string, unknown>).forEach((key) => {
			if (!this.autoManagedColumns.includes(key)) {
				filteredEntity[key] = (entity as Record<string, unknown>)[key];
			}
		});

		const keys = Object.keys(filteredEntity);
		const values = Object.values(filteredEntity);
		const placeholders = keys.map((_, index) => `$${index + 1}`).join(", ");
		const columns = keys.join(", ");

		const query = `
      INSERT INTO ${this.tableName} (${columns}) 
      VALUES (${placeholders}) 
      RETURNING *
    `;

		const result = await this.pool.query(query, values);
		return result.rows[0];
	}

	/**
	 * Update entity by ID
	 */
	async update(id: string, updates: Partial<T>): Promise<T | null> {
		// Filter out auto-managed columns from updates
		const filteredUpdates: Record<string, unknown> = {};
		Object.keys(updates as Record<string, unknown>).forEach((key) => {
			if (!this.autoManagedColumns.includes(key)) {
				filteredUpdates[key] = (updates as Record<string, unknown>)[key];
			}
		});

		const keys = Object.keys(filteredUpdates);
		if (keys.length === 0) return this.findById(id);

		const setClause = keys.map((key, index) => `${key} = $${index + 2}`).join(", ");
		const values = [id, ...Object.values(filteredUpdates)];

		const query = `
      UPDATE ${this.tableName} 
      SET ${setClause}, updated_at = NOW() 
      WHERE ${this.primaryKey} = $1 
      RETURNING *
    `;

		const result = await this.pool.query(query, values);
		return result.rows[0] || null;
	}

	/**
	 * Delete entity by ID
	 */
	async delete(id: string): Promise<boolean> {
		const query = `DELETE FROM ${this.tableName} WHERE ${this.primaryKey} = $1`;
		const result = await this.pool.query(query, [id]);
		return result.rowCount !== null && result.rowCount > 0;
	}

	/**
	 * Execute raw query
	 */
	async query(sql: string, params?: unknown[]): Promise<QueryResult> {
		return this.pool.query(sql, params);
	}

	/**
	 * Check if entity exists
	 */
	async exists(criteria: Partial<T>): Promise<boolean> {
		const entity = await this.findOneBy(criteria);
		return entity !== null;
	}

	/**
	 * Count entities
	 */
	async count(criteria?: Partial<T>): Promise<number> {
		let query = `SELECT COUNT(*) as count FROM ${this.tableName}`;
		let values: unknown[] = [];

		if (criteria && Object.keys(criteria).length > 0) {
			const keys = Object.keys(criteria);
			const conditions = keys.map((key, index) => `${key} = $${index + 1}`).join(" AND ");
			values = Object.values(criteria);
			query += ` WHERE ${conditions}`;
		}

		const result = await this.pool.query(query, values);
		return parseInt(result.rows[0].count, 10);
	}

	/**
	 * Find entities by user ID through many-to-many relationship
	 */
	async findByUserId(
		userId: string,
		junctionTable: string,
		junctionLocalKey: string = "hashtag_id",
	): Promise<T[]> {
		const query = `
    SELECT t.* 
    FROM ${this.tableName} t
    JOIN ${junctionTable} j ON t.id = j.${junctionLocalKey}
    WHERE j.user_id = $1
  `;

		const result = await this.pool.query(query, [userId]);
		return result.rows;
	}

	/**
	 * Generic search function with partial matching for text fields
	 * Uses ILIKE for string fields and exact match for other types
	 */
	async search(
		searchCriteria: Partial<T>,
		options: {
			limit?: number;
			offset?: number;
			textFields?: string[]; // Fields to use ILIKE on
			orderBy?: string;
			orderDirection?: "ASC" | "DESC";
		} = {},
	): Promise<T[]> {
		const keys = Object.keys(searchCriteria);
		if (keys.length === 0) return this.findAll(options.limit, options.offset);

		const {
			textFields = this.defaultTextFields,
			orderBy = this.defaultOrderBy,
			orderDirection = this.defaultOrderDirection,
		} = options;
		const values = Object.values(searchCriteria);
		const params: unknown[] = [];

		// Build WHERE conditions
		const conditions = keys.map((key, index) => {
			const value = values[index];
			params.push(value);
			const paramIndex = params.length;

			// Use ILIKE for text fields, exact match for others
			if (textFields.includes(key) && typeof value === "string") {
				return `${key} ILIKE $${paramIndex}`;
			}
			return `${key} = $${paramIndex}`;
		});

		// Wrap string values with % for ILIKE
		params.forEach((param, index) => {
			const key = keys[index];
			if (textFields.includes(key) && typeof param === "string") {
				params[index] = `%${param}%`;
			}
		});

		let query = `SELECT * FROM ${this.tableName} WHERE ${conditions.join(" AND ")}`;

		// Add ORDER BY if specified
		if (orderBy) {
			query += ` ORDER BY ${orderBy} ${orderDirection}`;
		}

		// Add pagination
		if (options.limit !== undefined) {
			params.push(options.limit);
			query += ` LIMIT $${params.length}`;
		}

		if (options.offset !== undefined) {
			params.push(options.offset);
			query += ` OFFSET $${params.length}`;
		}

		const result = await this.pool.query(query, params);
		return result.rows;
	}

	/**
	 * Advanced search with multiple operators
	 */
	async advancedSearch(
		searchCriteria: {
			[K in keyof Partial<T>]: {
				value: T[K];
				operator?: "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "like" | "ilike" | "in";
			};
		},
		options: {
			limit?: number;
			offset?: number;
			orderBy?: string;
			orderDirection?: "ASC" | "DESC";
			logicalOperator?: "AND" | "OR";
		} = {},
	): Promise<T[]> {
		const keys = Object.keys(searchCriteria);
		if (keys.length === 0) return this.findAll(options.limit, options.offset);

		const {
			orderBy = this.defaultOrderBy,
			orderDirection = this.defaultOrderDirection,
			logicalOperator = "AND",
		} = options;
		const params: unknown[] = [];

		// Build WHERE conditions with operators
		const conditions = keys.map((key) => {
			const criteria = searchCriteria[key as keyof T] as { value: unknown; operator?: string };
			const { value, operator = "eq" } = criteria;

			params.push(value);
			const paramIndex = params.length;

			switch (operator) {
				case "ne":
					return `${key} != $${paramIndex}`;
				case "gt":
					return `${key} > $${paramIndex}`;
				case "gte":
					return `${key} >= $${paramIndex}`;
				case "lt":
					return `${key} < $${paramIndex}`;
				case "lte":
					return `${key} <= $${paramIndex}`;
				case "like":
					params[paramIndex - 1] = `%${value}%`;
					return `${key} LIKE $${paramIndex}`;
				case "ilike":
					params[paramIndex - 1] = `%${value}%`;
					return `${key} ILIKE $${paramIndex}`;
				case "in":
					return `${key} = ANY($${paramIndex})`;
				default:
					return `${key} = $${paramIndex}`;
			}
		});

		let query = `SELECT * FROM ${this.tableName} WHERE ${conditions.join(` ${logicalOperator} `)}`;

		// Add ORDER BY if specified
		if (orderBy) {
			query += ` ORDER BY ${orderBy} ${orderDirection}`;
		}

		// Add pagination
		if (options.limit !== undefined) {
			params.push(options.limit);
			query += ` LIMIT $${params.length}`;
		}

		if (options.offset !== undefined) {
			params.push(options.offset);
			query += ` OFFSET $${params.length}`;
		}

		const result = await this.pool.query(query, params);
		return result.rows;
	}

	/**
	 * Find all entities with standardized pagination
	 */
	async findAllPaginated(
		pagination: PaginationRequest,
		baseUrl: string,
	): Promise<PaginatedResponse<T>> {
		const { offset, limit, page } = calculatePagination(pagination);

		// Get total count
		const countQuery = `SELECT COUNT(*) as total FROM ${this.tableName}`;
		const countResult = await this.pool.query(countQuery);
		const totalItems = parseInt(countResult.rows[0].total, 10);

		// Get data
		let query = `SELECT * FROM ${this.tableName}`;
		const params: unknown[] = [];

		// Add sorting
		if (pagination.sort || this.defaultOrderBy) {
			const sortField = pagination.sort || this.defaultOrderBy;
			const direction = pagination.order || this.defaultOrderDirection.toLowerCase();
			query += ` ORDER BY ${sortField} ${direction.toUpperCase()}`;
		}

		// Add pagination
		params.push(limit, offset);
		query += ` LIMIT $1 OFFSET $2`;

		const result = await this.pool.query(query, params);

		// Build query params for links
		const queryParams: Record<string, string | number> = {};
		if (pagination.limit) queryParams.limit = pagination.limit;
		if (pagination.sort) queryParams.sort = pagination.sort;
		if (pagination.order) queryParams.order = pagination.order;

		return createPaginatedResponse(result.rows, totalItems, page, limit, baseUrl, queryParams);
	}

	/**
	 * Search with standardized pagination
	 */
	async searchPaginated(
		searchCriteria: Partial<T>,
		pagination: PaginationRequest,
		baseUrl: string,
		options: {
			textFields?: string[];
		} = {},
	): Promise<PaginatedResponse<T>> {
		const { offset, limit, page } = calculatePagination(pagination);
		const { textFields = this.defaultTextFields } = options;

		const keys = Object.keys(searchCriteria);
		if (keys.length === 0) {
			return this.findAllPaginated(pagination, baseUrl);
		}

		const values = Object.values(searchCriteria);
		const params: unknown[] = [];

		// Build WHERE conditions
		const conditions = keys.map((key, index) => {
			const value = values[index];
			params.push(value);
			const paramIndex = params.length;

			// Use ILIKE for text fields, exact match for others
			if (textFields.includes(key) && typeof value === "string") {
				return `${key} ILIKE $${paramIndex}`;
			}
			return `${key} = $${paramIndex}`;
		});

		// Wrap string values with % for ILIKE
		params.forEach((param, index) => {
			const key = keys[index];
			if (textFields.includes(key) && typeof param === "string") {
				params[index] = `%${param}%`;
			}
		});

		const whereClause = conditions.join(" AND ");

		// Get total count
		const countQuery = `SELECT COUNT(*) as total FROM ${this.tableName} WHERE ${whereClause}`;
		const countResult = await this.pool.query(countQuery, [...params]);
		const totalItems = parseInt(countResult.rows[0].total, 10);

		// Get data
		let query = `SELECT * FROM ${this.tableName} WHERE ${whereClause}`;

		// Add sorting
		if (pagination.sort || this.defaultOrderBy) {
			const sortField = pagination.sort || this.defaultOrderBy;
			const direction = pagination.order || this.defaultOrderDirection.toLowerCase();
			query += ` ORDER BY ${sortField} ${direction.toUpperCase()}`;
		}

		// Add pagination
		params.push(limit, offset);
		query += ` LIMIT $${params.length - 1} OFFSET $${params.length}`;

		const result = await this.pool.query(query, params);

		// Build query params for links
		const queryParams: Record<string, string | number> = {};
		if (pagination.limit) queryParams.limit = pagination.limit;
		if (pagination.sort) queryParams.sort = pagination.sort;
		if (pagination.order) queryParams.order = pagination.order;

		// Add search criteria to query params
		keys.forEach((key, index) => {
			queryParams[key] = values[index] as string | number;
		});

		return createPaginatedResponse(result.rows, totalItems, page, limit, baseUrl, queryParams);
	}

	/**
	 * Adds an item to a user by creating a relationship record in the specified user table.
	 *
	 * @param userId - The unique identifier of the user
	 * @param itemId - The unique identifier of the item to associate with the user
	 * @param userTable - The name of the table that stores user-item relationships
	 * @param itemColumn - The name of the column that stores the item identifier
	 * @returns A promise that resolves to the created relationship record
	 * @throws Will throw an error if the database operation fails
	 */
	async addUserRelationship(
		userId: string,
		itemId: number,
		userTable: string,
		itemColumn: string,
	): Promise<T> {
		// Define allowed tables and columns
		const allowedTables = ["user_hashtags", "user_photos", "user_items"];
		const allowedColumns = ["hashtag_id", "photo_id", "item_id"];

		if (!allowedTables.includes(userTable)) {
			throw new Error("Invalid userTable name");
		}
		if (!allowedColumns.includes(itemColumn)) {
			throw new Error("Invalid itemColumn name");
		}

		const query = `
			INSERT INTO ${userTable} (user_id, ${itemColumn})
			VALUES ($1, $2)
			RETURNING *
		`;
		const result = await this.pool.query(query, [userId, itemId]);
		return result.rows[0];
	}

	async removeUserRelationship(
		userId: string,
		itemId: number,
		userTable: string,
		itemColumn: string,
	): Promise<boolean> {
		// Define allowed tables and columns
		const allowedTables = ["user_hashtags", "user_photos", "user_items"];
		const allowedColumns = ["hashtag_id", "photo_id", "item_id"];

		if (!allowedTables.includes(userTable)) {
			throw new Error("Invalid userTable name");
		}
		if (!allowedColumns.includes(itemColumn)) {
			throw new Error("Invalid itemColumn name");
		}

		const query = `
			DELETE FROM ${userTable}
			WHERE user_id = $1 AND ${itemColumn} = $2
		`;
		const result = await this.pool.query(query, [userId, itemId]);
		return result.rowCount !== null && result.rowCount > 0;
	}
}
