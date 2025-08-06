import { Router } from "express";
import { app } from "../index";

const authRoutes = () => {
  const router = Router();

	router.get("/", (req, res) => {
		// Handle auth home
		res.send("Auth Home");
	});

  router.post("/login", (req, res) => {
    // Handle login
  });

  router.post("/register", (req, res) => {
    // Handle registration
  });

	router.get("/logout", (req, res) => {
		// Handle logout
	});

	router.get("/reset-password", (req, res) => {
		// Handle password reset
	});

  app.use("/auth", router);
};

export default authRoutes;
