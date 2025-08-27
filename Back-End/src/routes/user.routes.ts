
import { UserController } from "@controllers/user.controller";
import { UserService } from "@services/user.services";

import { Router as createRouter } from "express";
import type { Router } from "express";


const userRoutes = (): Router => {
	const router = createRouter();

	const userService = new UserService();
	const userController = new UserController(userService);

	router.get("/users/profile", userController.getSelf.bind(userController));
	router.get("/users/:id", userController.getUserById.bind(userController));

	return router;
};

export default userRoutes;
