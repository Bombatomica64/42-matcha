import { createServer } from "node:http";
import { Server } from "socket.io";
import { app } from "../server";

const server = createServer(app);

const io = new Server(server, {
	transports: ["webtransport", "websocket", "polling"],
	cors: {
		origin: process.env.CORS_ORIGIN || "http://localhost:3000",
		methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
		credentials: true, // Required for HTTP-only cookies
		allowedHeaders: ["Content-Type", "Authorization", "x-new-access-token"],
	},
});

export { io, server };
