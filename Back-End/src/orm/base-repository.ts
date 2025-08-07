import type { Pool, QueryResult } from 'pg';

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

    const conditions = keys.map((key, index) => `${key} = $${index + 1}`).join(' AND ');
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
  async create(entity: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<T> {
    const keys = Object.keys(entity);
    const values = Object.values(entity);
    const placeholders = keys.map((_, index) => `$${index + 1}`).join(', ');
    const columns = keys.join(', ');

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

    const setClause = keys.map((key, index) => `${key} = $${index + 2}`).join(', ');
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
      const conditions = keys.map((key, index) => `${key} = $${index + 1}`).join(' AND ');
      values = Object.values(criteria);
      query += ` WHERE ${conditions}`;
    }

    const result = await this.pool.query(query, values);
    return parseInt(result.rows[0].count, 10);
  }
}
