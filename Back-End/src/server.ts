import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import { pino } from "pino";
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env";
import authRoutes from "./routes/auth.routes";

const logger = pino({ name: "matcha-server" });
const app: Express = express();

// Set the application to trust the reverse proxy
app.set("trust proxy", true);

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ 
	origin: env.CORS_ORIGIN, 
	credentials: true 
}));
app.use(helmet());

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
	apis: ["./src/routes/*.ts", "./src/controllers/*.ts"], // Path to the API files
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

// Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API Routes
app.use("/api/auth", authRoutes);

// Root endpoint
app.get("/", (req, res) => {
	res.json({
		message: "Welcome to Matcha Dating App API",
		documentation: "/api-docs",
		version: "1.0.0"
	});
});

export { app, logger };
