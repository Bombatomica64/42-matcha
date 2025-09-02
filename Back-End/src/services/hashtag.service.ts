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
	 * Get all hashtags with pagination.
	 */
	async getAllHashtags(
		pagination: PaginationRequest,
		baseUrl: string,
	): Promise<PaginatedResponse<Hashtag>> {
		return this.hashtagRepository.findAllPaginated(pagination, baseUrl);
	}

	/**
	 * Search hashtags by keyword.
	 */
	async searchHashtagsByKeyword(
		keyword: string,
		pagination: PaginationRequest,
		baseUrl: string,
	): Promise<PaginatedResponse<Hashtag>> {
		return this.hashtagRepository.hashtagSearchByKeyword(keyword, pagination, baseUrl);
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
