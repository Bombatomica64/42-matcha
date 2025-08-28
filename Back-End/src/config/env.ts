import process from "node:process";
import { config } from "dotenv";

// Load environment variables
config();

export const env = {
	NODE_ENV: process.env.NODE_ENV || "development",
	PORT: Number(process.env.PORT) || 3000,
	HOST: process.env.HOST || "localhost",

	// Database
	DATABASE_URL: process.env.DATABASE_URL || "",

	// JWT
	JWT_SECRET: process.env.JWT_SECRET || "",

	// CORS
	CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:3000",

	// API
	API_URL: process.env.API_URL || "http://localhost:3000",

	// Bcrypt
	BCRYPT_SALT_ROUNDS: Number(process.env.BCRYPT_SALT_ROUNDS) || 12,
} as const;
