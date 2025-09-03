import type { components } from "@generated/typescript/api";
import { dbUserToApiUser } from "@mappers/user.mapper";
import { UserRepository } from "@repositories/user.repository";
import { verifyJwt } from "@utils/jwt";
import type { Socket } from "socket.io";
import { pool } from "../database";
import { logger } from "../server";
import { io } from "./init.socket";

declare module "socket.io" {
	interface Socket {
		userId: string;
		user: components["schemas"]["User"];
	}
}

const userRepository = new UserRepository(pool);

// JWT Authentication middleware
io.use(async (socket, next) => {
	try {
		// Get token from different sources
		const token =
			socket.handshake.auth.token ||
			socket.handshake.headers.authorization?.replace("Bearer ", "") ||
			socket.handshake.query.token;

		if (!token) {
			return next(new Error("Authentication error: No token provided"));
		}

		// Verify the token (make it async if your verifyJwt is async)
		const decoded = await verifyJwt(token);

		if (!decoded) {
			return next(new Error("Authentication error: Invalid token"));
		}

		// Check token type (same as your HTTP middleware)
		if (decoded.type !== "access") {
			return next(new Error("Authentication error: Invalid token type"));
		}

		// Check if token is expired
		if (decoded.exp && Date.now() >= decoded.exp * 1000) {
			return next(new Error("Authentication error: Token expired"));
		}

		// Attach user info to socket
		socket.userId = decoded.userId;
		const user = await userRepository.findById(decoded.userId);

		if (!user) {
			return next(new Error("User not found"));
		}

		socket.user = dbUserToApiUser(user);

		next();
	} catch (err) {
		logger.error("Socket authentication error:", err);
		next(new Error("Authentication error: Invalid token"));
	}
});

// Connection handler
io.on("connection", (socket: Socket) => {
	logger.info(`User ${socket.userId} connected via Socket.IO (${socket.id})`);

	// Join user to their personal room for private messages
	socket.join(`user_${socket.userId}`);

	socket.on("disconnect", (reason) => {
		logger.info(`User ${socket.userId} disconnected: ${reason} (${socket.id})`);
	});

	// Add your other socket event handlers here
	socket.on("joinRoom", (roomId) => {
		socket.join(roomId);
		logger.info(`User ${socket.userId} joined room: ${roomId}`);
	});
});
