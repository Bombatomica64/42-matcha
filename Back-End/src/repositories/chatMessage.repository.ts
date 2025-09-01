import type { PaginatedResponse, components } from "@generated/typescript/api";
import { BaseRepository } from "@orm/base-repository";
import type { Pool } from "pg";

type ChatMessage = components["schemas"]["ChatMessage"];
type PaginationRequest = components["schemas"]["PaginationQuery"];

export class ChatMessageRepository extends BaseRepository<ChatMessage> {
	constructor(pool: Pool) {
		super(pool, {
			tableName: "chat_messages",
			primaryKey: "id",
			autoManagedColumns: ["created_at", "id"],
			defaultOrderBy: "created_at",
			defaultOrderDirection: "DESC",
		});
	}

	async getByChatId(
		chatRoomId: string,
		pagination: PaginationRequest,
		baseUrl: string
	): Promise<PaginatedResponse<ChatMessage>> {
		return this.searchPaginated(
			{ chat_room_id: chatRoomId } as Partial<ChatMessage>,
			pagination,
			baseUrl
		);
	}
}
