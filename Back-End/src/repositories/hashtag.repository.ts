import type { components, PaginatedResponse } from "@generated/typescript/api";
import { BaseRepository } from "@orm/base-repository";
import type { Pool } from "pg";

type Hashtag = components["schemas"]["Hashtag"];
type PaginationRequest = components["schemas"]["PaginationQuery"];

export class HashtagRepository extends BaseRepository<Hashtag> {
	constructor(pool: Pool) {
		super(pool, {
			tableName: "hashtags",
			primaryKey: "id",
			autoManagedColumns: ["id"],
			defaultTextFields: ["name"],
			defaultOrderBy: "name",
			defaultOrderDirection: "ASC",
		});
	}

	/**
	 * Find hashtags by user ID.
	 */
	async hashtagFindByUserId(userId: string): Promise<Hashtag[]> {
		return this.findByUserId(userId, "user_hashtags", "hashtag_id");
	}

	/**
	 * Search hashtags by keyword.
	 */
	async hashtagSearchByKeyword(
		keyword: string,
		pagination = { page: 1, limit: 10, sort: "name", order: "asc" } as PaginationRequest,
	): Promise<PaginatedResponse<Hashtag>> {
		return this.searchPaginated({ name: keyword }, pagination, "/api/hashtags", {
			textFields: ["name"],
		});
	}

	/**
	 * Add a hashtag to a user's profile.
	 */
	async hashtagAddToUser(userId: string, hashtagId: number): Promise<Hashtag> {
		return this.addUserRelationship(userId, hashtagId, "user_hashtags", "hashtag_id");
	}

	/**
	 * Remove a hashtag from a user's profile.
	 */
	async hashtagRemoveFromUser(userId: string, hashtagId: number): Promise<boolean> {
		return this.removeUserRelationship(userId, hashtagId, "user_hashtags", "hashtag_id");
	}
}
