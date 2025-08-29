import type { components, PaginatedResponse } from "@generated/typescript/api";
import { HashtagRepository } from "@repositories/hashtag.repository";
import { pool } from "../database";

type Hashtag = components["schemas"]["Hashtag"];
type PaginationRequest = components["schemas"]["PaginationQuery"];

export class HashtagService {
	private hashtagRepository: HashtagRepository;

	constructor() {
		this.hashtagRepository = new HashtagRepository(pool);
	}

	/**
	 * Get hashtags by user ID.
	 */
	async getHashtagsByUserId(userId: string): Promise<Hashtag[]> {
		return this.hashtagRepository.hashtagFindByUserId(userId);
	}

	/**
	 * Search hashtags by keyword.
	 */
	async searchHashtagsByKeyword(
		keyword: string,
		pagination = { page: 1, limit: 10, order: "desc" as const } as PaginationRequest,
	): Promise<PaginatedResponse<Hashtag>> {
		return this.hashtagRepository.hashtagSearchByKeyword(keyword, pagination);
	}

	/**
	 * Add a hashtag to a user's profile.
	 */
	async addHashtagToUser(userId: string, hashtagId: number): Promise<Hashtag> {
		return this.hashtagRepository.hashtagAddToUser(userId, hashtagId);
	}

	/**
	 * Remove a hashtag from a user's profile.
	 */
	async removeHashtagFromUser(userId: string, hashtagId: number): Promise<boolean> {
		return this.hashtagRepository.hashtagRemoveFromUser(userId, hashtagId);
	}
}
