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

	// Google OAuth
	GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
	GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || "",
	GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL || "/auth/google/callback",

	// University SAML
	UNIVERSITY_SAML_ENTRY_POINT: process.env.UNIVERSITY_SAML_ENTRY_POINT || "",
	UNIVERSITY_SAML_ISSUER: process.env.UNIVERSITY_SAML_ISSUER || "matcha-app",
	UNIVERSITY_SAML_CALLBACK_URL: process.env.UNIVERSITY_SAML_CALLBACK_URL || "/auth/university/callback",
	UNIVERSITY_SAML_CERT: process.env.UNIVERSITY_SAML_CERT || "",

	// Session Secret
	SESSION_SECRET: process.env.SESSION_SECRET || "your-super-secret-session-key",
} as const;
