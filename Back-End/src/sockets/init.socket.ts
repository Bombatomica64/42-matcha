import { createServer } from "node:http";

import { Server } from "socket.io";
import { app } from "../server";

const server = createServer(app);

const io = new Server(server, {
	// Enable webtransport with fallbacks
	transports: ["websocket", "polling"],

	allowUpgrades: true,
	cors: {
		origin: [
			"https://matcha.bombatomica64.dev",
			"http://localhost:4200",
			"http://172.18.0.3:4200", // Docker network address
			process.env.CORS_ORIGIN || "http://localhost:3000",
		],
		methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
		credentials: true, // Required for HTTP-only cookies
		allowedHeaders: ["Content-Type", "Authorization", "x-new-access-token"],
	},
	// Add connection settings for better stability
	pingTimeout: 60000,
	pingInterval: 25000,
	connectTimeout: 45000,
});

export { io, server };
