
import { Router as createRouter } from "express";
import type { Router } from "express";
import { UserController } from "@controllers/user.controller";
import { UserService } from "@services/user.services";
import { validateUserPatchRequest, validateUserPutRequest } from "@middleware/validation.middleware";

const userRoutes = (): Router => {
	const router = createRouter();

	const userService = new UserService();
	const userController = new UserController(userService);

	// Profile endpoints
	router.get("/profile", userController.getSelf.bind(userController));
	router.patch("/profile", validateUserPatchRequest, userController.patchProfile.bind(userController));
	router.put("/profile", validateUserPutRequest, userController.putProfile.bind(userController));	// User by ID
	router.get("/:id", userController.getUserById.bind(userController));
	
	// Photo endpoints
	router.get("/photos", userController.getUserPhotos.bind(userController));
	router.post("/photos", userController.uploadUserPhoto.bind(userController));
	router.get("/photos/:photoId", userController.getUserPhotoById.bind(userController));
	router.delete("/photos/:photoId", userController.deleteUserPhoto.bind(userController));
	router.post("/photos/:photoId/set-main", userController.setMainPhoto.bind(userController));
	
	// Like endpoints
	router.post("/:id/like", userController.likeUser.bind(userController));
	router.delete("/:id/like", userController.unlikeUser.bind(userController));
	router.get("/:id/likes", userController.getUserLikes.bind(userController)); // Fixed: should be 'likes' not 'like'
	
	// Block endpoints  
	router.get("/:id/blocked", userController.getBlockedUsers.bind(userController)); // Fixed: should be 'blocked' not 'block'
	router.post("/:id/block", userController.blockUser.bind(userController));
	router.delete("/:id/block", userController.unblockUser.bind(userController));
	
	// Matches
	router.get("/:id/matches", userController.userMatches.bind(userController));
	
	// Search and discover
	router.get("/search", userController.searchUsers.bind(userController));
	router.get("/discover", userController.discoverUsers.bind(userController));

	return router;
};

export default userRoutes;
