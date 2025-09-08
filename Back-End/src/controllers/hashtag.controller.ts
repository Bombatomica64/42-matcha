import type { components, PaginatedResponse } from "@generated/typescript/api";
import type { HashtagService } from "@services/hashtag.service";
import type { Request, Response } from "express";
import { logger } from "../server";
import { buildBaseUrl, extractPaginationQuery } from "../utils/pagination";

type Hashtag = components["schemas"]["Hashtag"];
type SuccessResponse = components["schemas"]["SuccessResponse"];
type ErrorResponse = components["schemas"]["ErrorResponse"];
export class HashtagController {
	private hashtagService: HashtagService;

	constructor(hashtagService: HashtagService) {
		this.hashtagService = hashtagService;
	}

	/**
	 * Search hashtags by keyword.
	 */
	public async searchHashtagsByKeyword(req: Request, res: Response): Promise<Response> {
		const keyword = req.query.q || req.query.keyword || req.query.query; // Support multiple parameter names

		// Use pagination utility to extract pagination parameters
		const pagination = extractPaginationQuery(req);
		const baseUrl = buildBaseUrl(req);

		try {
			let result: PaginatedResponse<Hashtag>;

			if (keyword) {
				// Search by keyword if provided
				result = await this.hashtagService.searchHashtagsByKeyword(
					keyword as string,
					pagination,
					baseUrl,
				);
			} else {
				// Get all hashtags if no keyword provided
				result = await this.hashtagService.getAllHashtags(pagination, baseUrl);
			}

			if (result) {
				return res.status(200).json(result);
			} else {
				return res.status(204).json({ message: "No hashtags found" });
			}
		} catch (error) {
			logger.error(`Error searching hashtags by keyword: ${error}`);
			return res.status(500).json({ message: "Internal server error" });
		}
	}

	/**
	 * Add a hashtag to the user's hashtags.
	 */
	public async addHashtagToUser(
		req: Request,
		res: Response,
	): Promise<Response<SuccessResponse | ErrorResponse>> {
		const { id } = req.params;
		const userId = res.locals.user?.id;
		const hashtagId = Number(id);
		if (!userId) {
			return res.status(401).json({ message: "Unauthorized" });
		}

		try {
			const result = await this.hashtagService.addHashtagToUser(userId, hashtagId);
			if (result) {
				return res
					.status(200)
					.json({ message: "Hashtag added successfully", hashtag: result } as SuccessResponse);
			} else {
				return res.status(404).json({ error: "Hashtag not found" } as ErrorResponse);
			}
		} catch (error: unknown) {
			// Check if it's a "hashtag not found" error
			if (error instanceof Error && error.message === "Hashtag not found") {
				return res.status(404).json({ error: "Hashtag not found" } as ErrorResponse);
			}
			logger.error(`Error adding hashtag to user: ${error}`);
			return res.status(500).json({ message: "Internal server error" } as ErrorResponse);
		}
	}

	/**
	 * Remove a hashtag from the user's hashtags.
	 */
	public async removeHashtagFromUser(
		req: Request,
		res: Response,
	): Promise<Response<SuccessResponse | ErrorResponse>> {
		const { id } = req.params;
		const userId = res.locals.user?.id;
		const hashtagId = Number(id);
		if (!userId) {
			return res.status(401).json({ message: "Unauthorized" });
		}

		try {
			const result = await this.hashtagService.removeHashtagFromUser(userId, hashtagId);
			if (result) {
				return res.status(200).json({ message: "Hashtag removed successfully" } as SuccessResponse);
			} else {
				return res.status(404).json({ error: "Hashtag not found" } as ErrorResponse);
			}
		} catch (error) {
			logger.error(`Error removing hashtag from user: ${error}`);
			return res.status(500).json({ message: "Internal server error" } as ErrorResponse);
		}
	}
}
