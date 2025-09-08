import type { components } from "@generated/typescript/api";
import { dbUserToApiUser } from "@mappers/user.mapper";
import { UserRepository } from "@repositories/user.repository";
import { verifyJwt } from "@utils/jwt";
import type { Socket } from "socket.io";
import { pool } from "../database";
import { logger } from "../server";
import { io } from "./init.socket";
import { registerChatNamespace } from "./chat.sockets";

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
		logger.error(`Socket authentication error: ${err}`);
		next(new Error("Authentication error: Invalid token"));
	}
});

// Connection handler
io.on("connection", (socket: Socket) => {
	logger.info(`User ${socket.userId} connected via Socket.IO (${socket.id})`);

	// Join user to their personal room for private messages
	socket.join(`user_${socket.userId}`);

	// Send welcome message
	socket.emit("message", {
		event: "system",
		message: `Welcome ${socket.user.first_name}! You are connected.`,
		timestamp: new Date().toISOString(),
		userId: "system",
	});


	// Register namespace-based chat handlers (once, not per connection)
	registerChatNamespace(io);

	// Ping/Pong handler
	socket.on("ping", (data) => {
		logger.info(`Ping received from user ${socket.userId}:`, data);
		socket.emit("pong", {
			event: "pong",
			message: "Pong! Server is alive",
			timestamp: new Date().toISOString(),
			originalData: data,
			userId: socket.userId,
		});
	});


	// // Typing indicator
	// socket.on("typing", (data) => {
	// 	logger.info(`User ${socket.userId} is typing:`, data);

	// 	// Broadcast typing indicator to room or all users
	// 	const roomId = data.roomId;
	// 	if (roomId) {
	// 		socket.to(roomId).emit("userTyping", {
	// 			userId: socket.userId,
	// 			userName: socket.user.first_name,
	// 			isTyping: data.isTyping || true
	// 		});
	// 	} else {
	// 		socket.broadcast.emit("userTyping", {
	// 			userId: socket.userId,
	// 			userName: socket.user.first_name,
	// 			isTyping: data.isTyping || true
	// 		});
	// 	}
	// });

	// User status updates
	socket.on("userStatus", (status) => {
		logger.info(`User ${socket.userId} status update:`, status);

		socket.broadcast.emit("userStatusUpdate", {
			userId: socket.userId,
			userName: socket.user.first_name,
			status: status,
			timestamp: new Date().toISOString(),
		});

		socket.emit("message", {
			event: "system",
			message: `Your status updated to: ${status}`,
			timestamp: new Date().toISOString(),
			userId: "system",
		});
	});

	// Error test handler
	socket.on("errorTest", (data) => {
		logger.info(`Error test from user ${socket.userId}:`, data);

		socket.emit("error", {
			event: "error",
			message: "This is a test error response",
			timestamp: new Date().toISOString(),
			errorCode: "TEST_ERROR",
			originalData: data,
		});
	});

	// Disconnect handler
	socket.on("disconnect", (reason) => {
		logger.info(`User ${socket.userId} disconnected: ${reason} (${socket.id})`);

		// Broadcast user disconnection
		socket.broadcast.emit("userStatusUpdate", {
			userId: socket.userId,
			userName: socket.user.first_name,
			status: "offline",
			timestamp: new Date().toISOString(),
		});
	});
});
