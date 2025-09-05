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

	async findById(id: string): Promise<ChatRoom | null> {
		const res = await this.pool.query("SELECT * FROM chat_rooms WHERE id = $1", [id]);
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
		const query = `
            SELECT * FROM chat_rooms
            WHERE user1_id = $1 OR user2_id = $1
            ORDER BY created_at DESC
        `;
		const result = await this.pool.query(query, [userId]);
		return result.rows;
	}

	async findByUserIds(user1Id: string, user2Id: string): Promise<ChatRoom | null> {
		const query = `
            SELECT * FROM chat_rooms
            WHERE (user1_id = $1 AND user2_id = $2) 
               OR (user1_id = $2 AND user2_id = $1)
            LIMIT 1
        `;
		const result = await this.pool.query(query, [user1Id, user2Id]);
		return result.rows[0] || null;
	}

	async createChatRoom(user1Id: string, user2Id: string): Promise<ChatRoom> {
		// Ensure consistent ordering (smaller UUID first)
		const [firstUserId, secondUserId] = [user1Id, user2Id].sort();

		const query = `
            INSERT INTO chat_rooms (user1_id, user2_id)
            VALUES ($1, $2)
            ON CONFLICT DO NOTHING
            RETURNING *
        `;
		const result = await this.pool.query(query, [firstUserId, secondUserId]);
		return result.rows[0];
	}

	async deleteChatRoom(chatRoomId: string): Promise<boolean> {
		const query = `
			DELETE FROM chat_rooms
			WHERE id = $1
		`;
		const result = await this.pool.query(query, [chatRoomId]);
		return (result.rowCount ?? 0) > 0;
	}
}
