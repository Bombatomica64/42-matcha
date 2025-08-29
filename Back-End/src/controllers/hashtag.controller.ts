import type { components, PaginatedResponse } from "@generated/typescript/api";
import type { HashtagService } from "@services/hashtag.service";
import type { Request, Response } from "express";
import { logger } from "../server";

type Hashtag = components["schemas"]["Hashtag"];
export class HashtagController {
	private hashtagService: HashtagService;

	constructor(hashtagService: HashtagService) {
		this.hashtagService = hashtagService;
	}

	/**
	 * Search hashtags by keyword.
	 */
	public async searchHashtagsByKeyword(req: Request, res: Response): Promise<Response> {
		const { keyword } = req.query;
		const pagination = { page: Number(req.query.page) || 1, limit: Number(req.query.limit) || 10 };

		try {
			const result = await this.hashtagService.searchHashtagsByKeyword(
				keyword as string,
				pagination,
			);
			if (typeof result !== "object") {
				return res.status(500).json({ message: "Internal server error" });
			}

			if (result) {
				return res.status(200).json(result as PaginatedResponse<Hashtag>);
			} else {
				return res.status(204).json({ message: "No hashtags found" });
			}
		} catch (error) {
			logger.error("Error searching hashtags by keyword:", error);
			return res.status(500).json({ message: "Internal server error" });
		}
	}
}
