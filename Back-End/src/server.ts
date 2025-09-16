import { createServer } from "node:http";
import path from "node:path";
import process from "node:process";
import { env } from "@config/env";
import type { components } from "@generated/typescript/api-nonextended";
import { jwtMiddleware } from "@middleware/jwt.middleware";
import authRoutes from "@routes/auth.routes";
import chatRoutes from "@routes/chat.routes";
import hashtagRoutes from "@routes/hashtag.routes";
import notificationRoutes from "@routes/notification.routes";
import photoRoutes from "@routes/photo.routes";
import userRoutes from "@routes/user.routes";
import cors from "cors";
import express, { type Express } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { pino } from "pino";
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { pool } from "./database";

const logger = pino({
	name: "matcha-server",
	transport: {
		target: "pino-pretty",
		options: {
			colorize: true,
		},
	},
});

const app: Express = express();
// Create the HTTP server here to avoid circular init with sockets
const server = createServer(app);

declare module "express-serve-static-core" {
	interface Locals {
		user?: components["schemas"]["User"];
	}
}

// Set the application to trust the reverse proxy
app.set("trust proxy", true);

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
	cors({
		origin: env.CORS_ORIGIN,
		credentials: true,
	}),
);
app.use(helmet());

// Rate limiters
const globalLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	limit: 300, // max requests per IP per window
	standardHeaders: true, // add RateLimit headers
	legacyHeaders: false,
	validate: true,
	message: { error: "TOO_MANY_REQUESTS", message: "Too many requests, please try again later." },
	skip: (req) =>
		req.method === "OPTIONS" ||
		req.path === "/health" ||
		req.path.startsWith("/api-docs") ||
		req.path.startsWith("/uploads"),
});

const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	limit: 20, // stricter limit for auth endpoints
	standardHeaders: true,
	legacyHeaders: false,
	validate: true,
	message: {
		error: "TOO_MANY_REQUESTS",
		message: "Too many auth attempts, please try again later.",
	},
});

// Apply global limiter before route handling
app.use(globalLimiter);

if (env.NODE_ENV !== "testopalle") {
	pool.connect((err, _client, release) => {
		if (err) {
			logger.error(`Database connection failed: ${err}`);
			process.exit(1); // Exit if DB is not connected in non-test envs
		} else {
			logger.info("Database connected successfully");
			pool.query("SELECT COUNT(*) FROM users", (err, result) => {
				if (err) {
					logger.error(`Error fetching user count: ${err}`);
				} else {
					logger.info(`Total users in database: ${result.rows[0].count}`);
					if (parseInt(result.rows[0].count, 10) === 0) {
						logger.warn("No users found in database. Auto-seeding 500 users...");
						import("@utils/seeder")
							.then(({ seedUsers }) => {
								seedUsers(500)
									.then((result) => {
										logger.info(`✅ Auto-seeding completed: ${result.usersCreated} users created`);
									})
									.catch((error) => {
										logger.error("❌ Auto-seeding failed:", error);
									});
							})
							.catch(logger.error);
					}
				}
			});
			release(); // Release the client back to the pool
		}
	});
} else {
	logger.info("Test environment detected: skipping DB connect check and auto-seeding");
}

// Swagger Configuration
const swaggerOptions = {
	definition: {
		openapi: "3.0.0",
		info: {
			title: "Matcha Dating App API",
			version: "1.0.0",
			description: "A comprehensive dating app API with location-based matching",
		},
		servers: [
			{
				url: env.API_URL,
				description: "Development server",
			},
		],
		components: {
			securitySchemes: {
				bearerAuth: {
					type: "http",
					scheme: "bearer",
					bearerFormat: "JWT",
				},
			},
		},
	},
	apis: ["./src/routes/*.js", "./src/controllers/*.js"], // Path to the API files
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

// Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

//HEALTH
app.get("/health", (_req, res) => {
	res.json({
		status: "ok",
		timestamp: new Date(),
	});
});

// Root endpoint
app.get("/", (_req, res) => {
	res.json({
		message: "Welcome to Matcha Dating App API",
		documentation: "/api-docs",
		version: "1.0.0",
	});
});

app.use(jwtMiddleware);

// Protected static serving of uploaded photos. Only authenticated users (JWT) can fetch.
// Frontend can embed with <img src="${env.API_URL}/uploads/..."> and the browser will send cookies.
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// API Routes
app.use("/auth", authLimiter, authRoutes());
app.use("/users", userRoutes());
app.use("/photos", photoRoutes());
app.use("/hashtags", hashtagRoutes());
app.use("/chat", chatRoutes());
app.use("/notifications", notificationRoutes());

export { app, logger, server };
