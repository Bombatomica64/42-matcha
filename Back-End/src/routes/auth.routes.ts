import { AuthController } from "@controllers/auth.controller";
import { UserIdentityRepository } from "@repositories/user-identity.repository";
import { pool } from "../database";
import { AuthService } from "@services/auth.services";
import type { Router } from "express";
import { Router as createRouter } from "express";
import passport from "../auth/passport.config";
import { generateTokenPair } from "@utils/jwt";

const authRoutes = (): Router => {
	const router = createRouter();

	// Create service and controller instances
	const authService = new AuthService();
	const authController = new AuthController(authService);
	const identityRepo = new UserIdentityRepository(pool);

	// Route handlers - bind controller methods to preserve 'this' context
	router.post("/register", authController.register.bind(authController));
	router.post("/login", authController.login.bind(authController));
	router.post("/logout", authController.logout.bind(authController));
	router.post("/refresh", authController.refreshToken.bind(authController));
	router.post("/resetPassword", authController.resetPassword.bind(authController));
	router.post("/changePassword", authController.changePassword.bind(authController));
	router.get("/verifyEmail", authController.verifyEmail.bind(authController));

	// OAuth2: Google
	router.get(
		"/google",
		passport.authenticate("google", { scope: ["profile", "email"], session: false }),
	);
		router.get(
		"/google/callback",
		passport.authenticate("google", { failureRedirect: "/login", session: false }),
			async (_req, res) => {
			// After successful authentication, issue JWTs similar to login
				const user = (res.req as unknown as { user?: { id?: string; username?: string; location?: unknown } }).user;
			if (!user?.id) return res.redirect("/login?error=oauth_failed");
				const tokens = generateTokenPair({ id: user.id, username: user.username as string, location: user.location as unknown as string | { type: "Point"; coordinates: [number, number] } | undefined });
			res.cookie("refreshToken", tokens.refreshToken, {
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
				sameSite: "strict",
				maxAge: 7 * 24 * 60 * 60 * 1000,
			});
			res.cookie("access_token", tokens.accessToken, {
				httpOnly: false,
				secure: process.env.NODE_ENV === "production",
				sameSite: "lax",
				maxAge: 15 * 60 * 1000,
			});
			return res.redirect("/home");
		},
	);

	// SAML: University
	router.get("/university/login", passport.authenticate("university-saml", { session: false }));
		router.post(
		"/university/callback",
		passport.authenticate("university-saml", { failureRedirect: "/login", session: false }),
			async (_req, res) => {
				const user = (res.req as unknown as { user?: { id?: string; username?: string; location?: unknown } }).user;
			if (!user?.id) return res.redirect("/login?error=oauth_failed");
				const tokens = generateTokenPair({ id: user.id, username: user.username as string, location: user.location as unknown as string | { type: "Point"; coordinates: [number, number] } | undefined });
			res.cookie("refreshToken", tokens.refreshToken, {
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
				sameSite: "strict",
				maxAge: 7 * 24 * 60 * 60 * 1000,
			});
			res.cookie("access_token", tokens.accessToken, {
				httpOnly: false,
				secure: process.env.NODE_ENV === "production",
				sameSite: "lax",
				maxAge: 15 * 60 * 1000,
			});
			return res.redirect("/home");
		},
	);

		// Protected: List linked identities/providers for current user
		router.get("/identities", async (_req, res) => {
			try {
				const current = res.locals.user;
				if (!current?.id) {
					return res.status(401).json({ message: "Unauthorized" });
				}
				const identities = await identityRepo.listForUser(current.id);
				// Map to response-friendly structure
				const data = identities.map((i) => ({
					id: i.id,
					provider_key: i.provider_key,
					provider_name: i.provider_name,
					provider_user_id: i.provider_user_id,
					email: i.email,
					created_at: i.created_at,
				}));
				return res.json({ identities: data });
			} catch (_e) {
				return res.status(500).json({ message: "Failed to fetch identities" });
			}
		});

	return router;
};

export default authRoutes;
