import type { PaginatedResponse, PaginationRequest } from "@generated/typescript/api";
import { calculatePagination, createPaginatedResponse } from "@utils/pagination";
import type { Pool, QueryResult } from "pg";
export abstract class BaseRepository<T> {
	protected pool: Pool;
	protected tableName: string;

	constructor(pool: Pool, tableName: string) {
		this.pool = pool;
		this.tableName = tableName;
	}

	/**
	 * Find entity by ID
	 */
	async findById(id: string): Promise<T | null> {
		const query = `SELECT * FROM ${this.tableName} WHERE id = $1`;
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
	async create(
		entity: Omit<T, "id" | "created_at" | "updated_at" | "photos" | "hashtags">,
	): Promise<T> {
		const keys = Object.keys(entity);
		const values = Object.values(entity);
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
		const keys = Object.keys(updates);
		if (keys.length === 0) return this.findById(id);

		const setClause = keys.map((key, index) => `${key} = $${index + 2}`).join(", ");
		const values = [id, ...Object.values(updates)];

		const query = `
      UPDATE ${this.tableName} 
      SET ${setClause}, updated_at = NOW() 
      WHERE id = $1 
      RETURNING *
    `;

		const result = await this.pool.query(query, values);
		return result.rows[0] || null;
	}

	/**
	 * Delete entity by ID
	 */
	async delete(id: string): Promise<boolean> {
		const query = `DELETE FROM ${this.tableName} WHERE id = $1`;
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

		const { textFields = [], orderBy, orderDirection = "ASC" } = options;
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

		const { orderBy, orderDirection = "ASC", logicalOperator = "AND" } = options;
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
		if (pagination.sort) {
			const direction = pagination.order || "desc";
			query += ` ORDER BY ${pagination.sort} ${direction.toUpperCase()}`;
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
		const { textFields = [] } = options;

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
		if (pagination.sort) {
			const direction = pagination.order || "desc";
			query += ` ORDER BY ${pagination.sort} ${direction.toUpperCase()}`;
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
}
