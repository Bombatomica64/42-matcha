import { BaseRepository } from "@orm/base-repository";
import type { components } from "@generated/typescript/api";

type Hashtag = components["schemas"]["Hashtag"];

class HashtagRepository extends BaseRepository<Hashtag> {
	/**
	 * Find hashtags by user ID.
	 */
	async hashtagFindByUserId(userId: string): Promise<Hashtag[]> {
		return this.findByUserId(userId, 'user_hashtags', 'hashtag_id');
	}

	/**
	 * Search hashtags by keyword.
	 */
	async hashtagSearchByKeyword(keyword: string): Promise<Hashtag[]> {
		return this.findBy({ name: keyword });
	}

}