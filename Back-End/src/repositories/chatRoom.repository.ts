import type { components } from "@generated/typescript/api";
import { BaseRepository } from "@orm/base-repository";
import type { Pool } from "pg";

type ChatRoom = components["schemas"]["ChatRoom"];

export class ChatRoomRepository extends BaseRepository<ChatRoom> {
	constructor(pool: Pool) {
		super(pool, {
			tableName: "chat_rooms",
			primaryKey: "id",
			autoManagedColumns: ["created_at", "id"],
			defaultOrderBy: "created_at",
			defaultOrderDirection: "DESC",
		});
	}

	private baseSelect(whereClause: string) {
		return `
			SELECT
				cr.id,
				cr.created_at,
				/* user1 small */
				json_build_object(
					'id', u1.id,
					'first_name', u1.first_name,
					'last_name', u1.last_name,
					'online_status', COALESCE(u1.online_status, false),
					'main_photo', COALESCE(
						json_build_object(
							'id', p1.id,
							'user_id', p1.user_id,
							'filename', p1.filename,
							'original_filename', p1.original_filename,
							'image_url', p1.file_path,
							'file_size', p1.file_size,
							'mime_type', p1.mime_type,
							'is_main', p1.is_primary,
							'display_order', p1.display_order,
							'uploaded_at', p1.created_at
						),
						json_build_object(
							'id', u1.id || ':placeholder',
							'user_id', u1.id,
							'filename', 'placeholder.jpg',
							'image_url', '/uploads/placeholder.jpg',
							'mime_type', 'image/jpeg',
							'is_main', true,
							'display_order', 0,
							'uploaded_at', NOW()
						)
					)
				) AS small_user1,
				/* user2 small */
				json_build_object(
					'id', u2.id,
					'first_name', u2.first_name,
					'last_name', u2.last_name,
					'online_status', COALESCE(u2.online_status, false),
					'main_photo', COALESCE(
						json_build_object(
							'id', p2.id,
							'user_id', p2.user_id,
							'filename', p2.filename,
							'original_filename', p2.original_filename,
							'image_url', p2.file_path,
							'file_size', p2.file_size,
							'mime_type', p2.mime_type,
							'is_main', p2.is_primary,
							'display_order', p2.display_order,
							'uploaded_at', p2.created_at
						),
						json_build_object(
							'id', u2.id || ':placeholder',
							'user_id', u2.id,
							'filename', 'placeholder.jpg',
							'image_url', '/uploads/placeholder.jpg',
							'mime_type', 'image/jpeg',
							'is_main', true,
							'display_order', 0,
							'uploaded_at', NOW()
						)
					)
				) AS small_user2
			FROM chat_rooms cr
			JOIN users u1 ON u1.id = cr.user1_id
			JOIN users u2 ON u2.id = cr.user2_id
			LEFT JOIN LATERAL (
				SELECT * FROM user_photos up WHERE up.user_id = cr.user1_id AND up.is_primary = true LIMIT 1
			) p1 ON TRUE
			LEFT JOIN LATERAL (
				SELECT * FROM user_photos up WHERE up.user_id = cr.user2_id AND up.is_primary = true LIMIT 1
			) p2 ON TRUE
			${whereClause}
			ORDER BY cr.created_at DESC`;
	}

	async findById(id: string): Promise<ChatRoom | null> {
		const sql = this.baseSelect("WHERE cr.id = $1");
		const res = await this.pool.query(sql, [id]);
		return res.rows[0] ?? null;
	}

	async userIsInRoom(userId: string, roomId: string): Promise<boolean> {
		const res = await this.pool.query(
			"SELECT 1 FROM chat_rooms WHERE id = $1 AND (user1_id = $2 OR user2_id = $2) LIMIT 1",
			[roomId, userId],
		);
		return (res.rowCount ?? 0) > 0;
	}

	async findByUserId(userId: string): Promise<ChatRoom[]> {
		const sql = this.baseSelect("WHERE cr.user1_id = $1 OR cr.user2_id = $1");
		const res = await this.pool.query(sql, [userId]);
		return res.rows;
	}

	async findByUserIds(user1Id: string, user2Id: string): Promise<ChatRoom | null> {
		const sql = this.baseSelect(
			"WHERE (cr.user1_id = $1 AND cr.user2_id = $2) OR (cr.user1_id = $2 AND cr.user2_id = $1) LIMIT 1",
		);
		const res = await this.pool.query(sql, [user1Id, user2Id]);
		return res.rows[0] ?? null;
	}

	async createChatRoom(user1Id: string, user2Id: string): Promise<ChatRoom> {
		const [firstUserId, secondUserId] = [user1Id, user2Id].sort();
		const insert = `INSERT INTO chat_rooms (user1_id, user2_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING id`;
		await this.pool.query(insert, [firstUserId, secondUserId]);
		// Return enriched row (always enriched select)
		return (await this.findByUserIds(firstUserId, secondUserId))!;
	}

	async deleteChatRoom(chatRoomId: string): Promise<boolean> {
		const result = await this.pool.query("DELETE FROM chat_rooms WHERE id = $1", [chatRoomId]);
		return (result.rowCount ?? 0) > 0;
	}
}
