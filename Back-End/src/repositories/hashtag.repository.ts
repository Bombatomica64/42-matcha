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
		pagination: PaginationRequest,
		baseUrl: string,
	): Promise<PaginatedResponse<Hashtag>> {
		return this.searchPaginated({ name: keyword }, pagination, baseUrl, {
			textFields: ["name"],
		});
	}

	/**
	 * Add a hashtag to a user's profile.
	 */
	async hashtagAddToUser(userId: string, hashtagId: number): Promise<Hashtag> {
		// First, check if the hashtag exists
		const hashtag = await this.findById(hashtagId.toString());
		if (!hashtag) {
			throw new Error("Hashtag not found");
		}

		// Create the relationship
		await this.addUserRelationship(userId, hashtagId, "user_hashtags", "hashtag_id");

		// Return the hashtag data
		return hashtag;
	}

	/**
	 * Remove a hashtag from a user's profile.
	 */
	async hashtagRemoveFromUser(userId: string, hashtagId: number): Promise<boolean> {
		return this.removeUserRelationship(userId, hashtagId, "user_hashtags", "hashtag_id");
	}
}
