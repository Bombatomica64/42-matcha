import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";
import type { components } from "@generated/typescript/api";
import type { UpdatePhotoData } from "@models/photo.entity";
import { BaseRepository } from "@orm/base-repository";
import type { Express } from "express";
import type { Pool } from "pg";
import { pool } from "../database";

type Photo = components["schemas"]["Photo"];

export class PhotoRepository extends BaseRepository<Photo> {
	constructor(pool: Pool) {
		super(pool, {
			tableName: "user_photos",
			primaryKey: "id",
			autoManagedColumns: ["id", "created_at", "updated_at"],
			defaultTextFields: ["filename", "original_filename"],
			defaultOrderBy: "display_order",
			defaultOrderDirection: "ASC",
		});
	}

	async findByUserId(userId: string): Promise<Photo[]> {
		const query = `
			SELECT 
				id,
				user_id,
				filename,
				original_filename,
				file_path as image_url,
				file_size,
				mime_type,
				is_primary as is_main,
				display_order,
				created_at as uploaded_at
			FROM user_photos 
			WHERE user_id = $1 
			ORDER BY display_order ASC, created_at ASC
		`;

		const result = await pool.query(query, [userId]);
		return result.rows.map((row: Photo & { uploaded_at: Date }) => {
			const image_url = row.image_url.startsWith("/") ? row.image_url : `/${row.image_url}`;
			return {
				...row,
				image_url,
				uploaded_at: new Date(row.uploaded_at).toISOString(),
			};
		});
	}

	async findByIdAndUser(photoId: string, userId: string): Promise<Photo | null> {
		const query = `
			SELECT 
				id,
				user_id,
				filename,
				original_filename,
				file_path as image_url,
				file_size,
				mime_type,
				is_primary as is_main,
				display_order,
				created_at as uploaded_at
			FROM user_photos 
			WHERE id = $1 AND user_id = $2
		`;

		const result = await pool.query(query, [photoId, userId]);
		if (result.rows.length === 0) return null;

		const row = result.rows[0];
		const image_url = row.image_url.startsWith("/") ? row.image_url : `/${row.image_url}`;
		return {
			...row,
			image_url,
			uploaded_at: new Date(row.uploaded_at).toISOString(),
		};
	}

	async countByUserId(userId: string): Promise<number> {
		const query = "SELECT COUNT(*) as count FROM user_photos WHERE user_id = $1";
		const result = await pool.query(query, [userId]);
		return parseInt(result.rows[0].count, 10);
	}

	async createPhoto(userId: string, file: Express.Multer.File): Promise<Photo> {
		// Generate unique filename
		const timestamp = Date.now();
		const ext = path.extname(file.originalname);
		const filename = `photo_${timestamp}${ext}`;
		const filePath = `uploads/users/${userId}/${filename}`;

		// Ensure directory exists
		const dirPath = path.dirname(path.join(process.cwd(), filePath));
		await fs.mkdir(dirPath, { recursive: true });

		// Move file to permanent location
		await fs.rename(file.path, path.join(process.cwd(), filePath));

		// Get next display order
		const orderQuery =
			"SELECT COALESCE(MAX(display_order), -1) + 1 as next_order FROM user_photos WHERE user_id = $1";
		const orderResult = await pool.query(orderQuery, [userId]);
		const displayOrder = orderResult.rows[0].next_order;

		// Insert into database
		const insertQuery = `
			INSERT INTO user_photos (
				user_id, filename, original_filename, file_path, 
				file_size, mime_type, display_order
			) VALUES ($1, $2, $3, $4, $5, $6, $7)
			RETURNING 
				id,
				user_id,
				filename,
				original_filename,
				file_path as image_url,
				file_size,
				mime_type,
				is_primary as is_main,
				display_order,
				created_at as uploaded_at
		`;

		const result = await pool.query(insertQuery, [
			userId,
			filename,
			file.originalname,
			filePath,
			file.size,
			file.mimetype,
			displayOrder,
		]);

		const row = result.rows[0];
		const image_url = row.image_url.startsWith("/") ? row.image_url : `/${row.image_url}`;
		return {
			...row,
			image_url,
			uploaded_at: new Date(row.uploaded_at).toISOString(),
		};
	}

	async deleteByIdAndUser(photoId: string, userId: string): Promise<boolean> {
		// First get the photo to delete the physical file
		const photo = await this.findByIdAndUser(photoId, userId);
		if (!photo) return false;

		// Delete from database
		const deleteQuery = "DELETE FROM user_photos WHERE id = $1 AND user_id = $2";
		const result = await pool.query(deleteQuery, [photoId, userId]);

		if (result.rowCount && result.rowCount > 0) {
			// Delete physical file
			try {
				const fullFilePath = path.join(process.cwd(), photo.image_url);
				await fs.unlink(fullFilePath);
			} catch {
				// Log error but don't fail the operation
				// Use logger if available in your project
			}
			return true;
		}

		return false;
	}
	async setAsMain(photoId: string, userId: string): Promise<boolean> {
		// Use transaction to ensure consistency
		const client = await pool.connect();

		try {
			await client.query("BEGIN");

			// First, unset any existing primary photo for this user
			await client.query(
				"UPDATE user_photos SET is_primary = false WHERE user_id = $1 AND is_primary = true",
				[userId],
			);

			// Then set the new primary photo
			const result = await client.query(
				"UPDATE user_photos SET is_primary = true WHERE id = $1 AND user_id = $2",
				[photoId, userId],
			);

			await client.query("COMMIT");
			return result.rowCount !== null && result.rowCount > 0;
		} catch (error) {
			await client.query("ROLLBACK");
			throw error;
		} finally {
			client.release();
		}
	}

	async updatePhoto(
		photoId: string,
		userId: string,
		updateData: UpdatePhotoData,
	): Promise<Photo | null> {
		const setClauses: string[] = [];
		const values: (string | number | boolean)[] = [];
		let paramIndex = 1;

		// Map API fields to database fields
		Object.entries(updateData).forEach(([key, value]) => {
			if (value !== undefined) {
				let dbField = key;
				if (key === "is_main") dbField = "is_primary";
				setClauses.push(`${dbField} = $${paramIndex}`);
				values.push(value);
				paramIndex++;
			}
		});

		if (setClauses.length === 0) {
			return this.findByIdAndUser(photoId, userId);
		}

		const query = `
			UPDATE user_photos 
			SET ${setClauses.join(", ")} 
			WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
			RETURNING 
				id,
				user_id,
				filename,
				original_filename,
				file_path as image_url,
				file_size,
				mime_type,
				is_primary as is_main,
				display_order,
				created_at as uploaded_at
		`;

		values.push(photoId, userId);
		const result = await pool.query(query, values);

		if (result.rows.length === 0) return null;

		const row = result.rows[0];
		const image_url = row.image_url.startsWith("/") ? row.image_url : `/${row.image_url}`;
		return {
			...row,
			image_url,
			uploaded_at: new Date(row.uploaded_at).toISOString(),
		};
	}
}
