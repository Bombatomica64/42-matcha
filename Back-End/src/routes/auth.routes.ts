import { AuthController } from "@controllers/auth.controller";
import { AuthService } from "@services/auth.services";

import { Router as createRouter } from "express";
import type { Router } from "express";

const authRoutes = (): Router => {
	const router = createRouter();

	// Create service and controller instances
	const authService = new AuthService();
	const authController = new AuthController(authService);

	// Route handlers - bind controller methods to preserve 'this' context
	router.post("/register", authController.register.bind(authController));
	router.post("/login", authController.login.bind(authController));
	router.post("/logout", authController.logout.bind(authController));
	router.post(
		"/resetPassword",
		authController.resetPassword.bind(authController)
	);
	router.post(
		"/changePassword",
		authController.changePassword.bind(authController)
	);
	router.get("/verifyEmail", authController.verifyEmail.bind(authController));

	return router;
};

export default authRoutes;
