import { HashtagController } from "@controllers/hashtag.controller";
import { HashtagService } from "@services/hashtag.service";
import type { Router } from "express";
import { Router as createRouter } from "express";

const hashtagRoutes = (): Router => {
	const router = createRouter();
	const hashtagService = new HashtagService();
	const hashtagController = new HashtagController(hashtagService);

	router.get("/search", hashtagController.searchHashtagsByKeyword.bind(hashtagController));

	return router;
};

export default hashtagRoutes;
