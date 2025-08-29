import type { components, PaginatedResponse } from "@generated/typescript/api";
import { BaseRepository } from "@orm/base-repository";
import type { Pool } from "pg";

type Hashtag = components["schemas"]["Hashtag"];

export class HashtagRepository extends BaseRepository<Hashtag> {
	constructor(pool: Pool) {
		super(pool, "hashtags");
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
		pagination = { page: 1, limit: 10 },
	): Promise<PaginatedResponse<Hashtag>> {
		return this.searchPaginated({ name: keyword }, pagination, "/api/hashtags", {
			textFields: ["name"],
		});
	}
}
