import type { components, PaginatedResponse } from "@generated/typescript/api";
import { HashtagRepository } from "@repositories/hashtag.repository";
import { pool } from "../database";

type Hashtag = components["schemas"]["Hashtag"];

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
		pagination = { page: 1, limit: 10 },
	): Promise<PaginatedResponse<Hashtag>> {
		return this.hashtagRepository.hashtagSearchByKeyword(keyword, pagination);
	}
}
