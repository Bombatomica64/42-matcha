import { HashtagController } from "@controllers/hashtag.controller";
import { HashtagService } from "@services/hashtag.service";
import type { Router } from "express";
import { Router as createRouter } from "express";

const hashtagRoutes = (): Router => {
	const router = createRouter();
	const hashtagService = new HashtagService();
	const hashtagController = new HashtagController(hashtagService);

	// GET all hashtags with pagination
	router.get("/", hashtagController.searchHashtagsByKeyword.bind(hashtagController));
	router.get("/search", hashtagController.searchHashtagsByKeyword.bind(hashtagController));
	router.post("/:id", hashtagController.addHashtagToUser.bind(hashtagController));
	router.delete("/:id", hashtagController.removeHashtagFromUser.bind(hashtagController));
	return router;
};

export default hashtagRoutes;
