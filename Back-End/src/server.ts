import process from "node:process";
import { env } from "@config/env";
import type { components } from "@generated/typescript/api-nonextended";
import { jwtMiddleware } from "@middleware/jwt.middleware";
import authRoutes from "@routes/auth.routes";
import chatRoutes from "@routes/chat.routes";
import hashtagRoutes from "@routes/hashtag.routes";
import photoRoutes from "@routes/photo.routes";
import userRoutes from "@routes/user.routes";
import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import { pino } from "pino";
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { pool } from "./database";

const logger = pino({ name: "matcha-server" });
const app: Express = express();

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

pool.connect((err, _client, release) => {
	if (err) {
		logger.error(`Database connection failed: ${err}`);
		process.exit(1); // Exit if DB is not connected
	} else {
		logger.info("Database connected successfully");
		pool.query("SELECT COUNT(*) FROM users", (err, result) => {
			if (err) {
				logger.error(`Error fetching user count: ${err}`);
			} else {
				logger.info(`Total users in database: ${result.rows[0].count}`);
				// Only auto-seed in development, not in test environment
				if (parseInt(result.rows[0].count, 10) === 0 && env.NODE_ENV !== "test") {
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

// API Routes
app.use("/auth", authRoutes());
app.use("/users", userRoutes());
app.use("/photos", photoRoutes());
app.use("/hashtags", hashtagRoutes());
app.use("/chat", chatRoutes());

export { app, logger };
