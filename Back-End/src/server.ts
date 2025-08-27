import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import { pino } from "pino";
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { env } from "@config/env";
import authRoutes from "@routes/auth.routes";
import { jwtMiddleware } from "@middleware/jwt.middleware";
import type { User } from "@models/user.entity";

const logger = pino({ name: "matcha-server" });
const app: Express = express();

declare module "express-serve-static-core" {
  interface Locals {
    user?: User;
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
	})
);
app.use(helmet());

// Swagger Configuration
const swaggerOptions = {
	definition: {
		openapi: "3.0.0",
		info: {
			title: "Matcha Dating App API",
			version: "1.0.0",
			description:
				"A comprehensive dating app API with location-based matching",
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

export { app, logger };
