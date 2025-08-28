import { UserController } from "@controllers/user.controller";
import {
	validateUserPatchRequest,
	validateUserPutRequest,
} from "@middleware/validation.middleware";
import { UserService } from "@services/user.services";
import type { Router } from "express";
import { Router as createRouter } from "express";

const userRoutes = (): Router => {
	const router = createRouter();

	const userService = new UserService();
	const userController = new UserController(userService);

	// Profile endpoints
	router.get("/profile", userController.getSelf.bind(userController));
	router.patch(
		"/profile",
		validateUserPatchRequest,
		userController.patchProfile.bind(userController),
	);
	router.put("/profile", validateUserPutRequest, userController.putProfile.bind(userController));

	// User by ID
	router.get("/:id", userController.getUserById.bind(userController));

	// Dedicated privacy-safe endpoints (new)
	router.get("/likes", userController.getCurrentUserLikes.bind(userController));
	router.get("/blocks", userController.getCurrentUserBlocks.bind(userController));
	router.get("/matches", userController.getCurrentUserMatches.bind(userController));

	// Like endpoints (legacy with privacy protection)
	router.post("/:id/like", userController.likeUser.bind(userController));
	router.delete("/:id/like", userController.unlikeUser.bind(userController));
	router.get("/:id/likes", userController.getUserLikes.bind(userController)); // Privacy protected

	// Block endpoints (legacy with privacy protection)
	router.get("/:id/blocked", userController.getBlockedUsers.bind(userController)); // Privacy protected
	router.post("/:id/block", userController.blockUser.bind(userController));
	router.delete("/:id/block", userController.unblockUser.bind(userController));

	// Legacy matches endpoint (privacy protected)
	router.get("/:id/matches", userController.getUserMatches.bind(userController));

	//Algo TODO
	router.get("/discover", userController.getDiscoverableUsers.bind(userController));
	return router;
};

export default userRoutes;
