
import type { Server, Socket } from "socket.io";
import { ChatMessageRepository } from "@repositories/chatMessage.repository";
import { ChatRoomRepository } from "@repositories/chatRoom.repository";
import { pool } from "../database";
import { logger } from "../server";
import type { components } from "@generated/typescript/api";


const chatMessageRepo = new ChatMessageRepository(pool);
const chatRoomRepo = new ChatRoomRepository(pool);


type ChatMessage = components["schemas"]["ChatMessage"];
type NewChatMessagePayload =
	| {
			chat_room_id: string;
			message_type: "text";
			content: string;
			media_filename?: string;
			media_file_path?: string;
			media_file_size?: number;
			media_mime_type?: string;
			media_duration?: number;
			thumbnail_path?: string;
		}
	| {
			chat_room_id: string;
			message_type: "image" | "video" | "audio";
			content?: string;
			media_filename?: string;
			media_file_path: string;
			media_file_size?: number;
			media_mime_type: string;
			media_duration?: number;
			thumbnail_path?: string;
		};
type TypingPayload = { roomId: string; isTyping: boolean };


// Register the /chat namespace and its handlers
export function registerChatNamespace(io: Server) {
	const nsp = io.of("/chat");

	nsp.use(async (socket, next) => {
		// Optionally, add per-namespace middleware (e.g., logging, extra auth)
		next();
	});

	nsp.on("connection", (socket: Socket) => {
		logger.info(`User ${socket.userId} connected to /chat namespace (${socket.id})`);

		// Join user to their personal room for private messages (optional)
		socket.join(`user_${socket.userId}`);

		// Send welcome message
		socket.emit("message", {
			event: "system",
			message: `Welcome ${socket.user.first_name}! You are connected to chat namespace.`,
			timestamp: new Date().toISOString(),
			userId: "system"
		});

		// Join a chat room by ID (server validates membership)
		socket.on("join", async (payload: string | { roomId: string }) => {
			const roomId = typeof payload === "string" ? payload : payload?.roomId;
			if (!roomId) return;
			// Validate once against DB
			const allowed = await chatRoomRepo.userIsInRoom(socket.userId, roomId).catch(() => false);
			if (!allowed) {
				socket.emit("error", { code: "FORBIDDEN", message: "You are not a member of this chat" });
				return;
			}
			await socket.join(`chat:${roomId}`);
			logger.info(`User ${socket.userId} joined chat room ${roomId}`);
			socket.emit("joined", { roomId });
			socket.emit("system", { roomId, message: `Joined room ${roomId}` });
		});

		// Join (or create) a 1:1 chat by peer user id
		socket.on("join:withUser", async (payload: string | { userId: string }) => {
			const peerUserId = typeof payload === "string" ? payload : payload?.userId;
			if (!peerUserId) {
				socket.emit("error", { code: "BAD_REQUEST", message: "userId is required" });
				return;
			}

			// Find or create the room for the two users
			let room = await chatRoomRepo.findByUserIds(socket.userId, peerUserId);
			if (!room) {
				room = await chatRoomRepo.createChatRoom(socket.userId, peerUserId);
				if (!room) {
					socket.emit("error", { code: "SERVER_ERROR", message: "Unable to create chat room" });
					return;
				}
			}

			await socket.join(`chat:${room.id}`);
			logger.info(`User ${socket.userId} joined 1:1 chat room ${room.id} with ${peerUserId}`);
			socket.emit("joined", { roomId: room.id });
			socket.emit("system", { roomId: room.id, message: `Joined room ${room.id}` });

			// Optionally nudge the peer to join if online
			socket.to(`user_${peerUserId}`).emit("chat:invite", { roomId: room.id, fromUserId: socket.userId });
		});

		// Leave a chat room
		socket.on("leave", async (roomId: string) => {
			if (!roomId) return;
			await socket.leave(`chat:${roomId}`);
			logger.info(`User ${socket.userId} left chat room ${roomId}`);
			socket.emit("system", { roomId, message: `Left room ${roomId}` });
		});

		// Send a message to a chat room
		socket.on("message", async (payload: NewChatMessagePayload) => {
			const p = payload as NewChatMessagePayload;
			if (!p) {
				socket.emit("error", { code: "BAD_REQUEST", message: "Missing payload" });
				return;
			}

			const { chat_room_id } = p;
			if (!chat_room_id) {
				socket.emit("error", { code: "BAD_REQUEST", message: "chat_room_id is required" });
				return;
			}

			// Membership cache check (no DB call): user must have joined the room first
			const roomKey = `chat:${chat_room_id}`;
			if (!socket.rooms.has(roomKey)) {
				socket.emit("error", { code: "FORBIDDEN", message: "Join the room before sending messages" });
				return;
			}

			// Validate per message type
			if (p.message_type === "text") {
				if (!p.content || p.content.trim().length === 0) {
					socket.emit("error", { code: "BAD_REQUEST", message: "content is required for text messages" });
					return;
				}
			} else {
				// image / video / audio
				if (!p.media_file_path || !p.media_mime_type) {
					socket.emit("error", { code: "BAD_REQUEST", message: "media_file_path and media_mime_type are required for media messages" });
					return;
				}
				const expectedPrefix = p.message_type === "image" ? "image/" : p.message_type === "video" ? "video/" : "audio/";
				if (!p.media_mime_type.startsWith(expectedPrefix)) {
					socket.emit("error", { code: "BAD_REQUEST", message: `media_mime_type must start with ${expectedPrefix}` });
					return;
				}
			}

			// Build entity to persist (server sets sender_id)
			const toCreate: Partial<ChatMessage> = {
				chat_room_id,
				sender_id: socket.userId,
				message_type: p.message_type,
				content: p.content,
				media_filename: 'media_filename' in p ? p.media_filename : undefined,
				media_file_path: 'media_file_path' in p ? p.media_file_path : undefined,
				media_file_size: 'media_file_size' in p ? p.media_file_size : undefined,
				media_mime_type: 'media_mime_type' in p ? p.media_mime_type : undefined,
				media_duration: 'media_duration' in p ? p.media_duration : undefined,
				thumbnail_path: 'thumbnail_path' in p ? p.thumbnail_path : undefined,
			};

			const created = await chatMessageRepo.create(toCreate as Partial<ChatMessage>);

			// Broadcast to others in the room and ack to sender
			socket.to(roomKey).emit("newMessage", created);
			socket.emit("ack", { id: created.id, chat_room_id });
		});

		// Typing indicator
		socket.on("typing", (payload: TypingPayload) => {
			const { roomId, isTyping } = payload ?? { roomId: "", isTyping: false };
			if (!roomId) return;
			if (!socket.rooms.has(`chat:${roomId}`)) return;
			socket.to(`chat:${roomId}`).emit("userTyping", { userId: socket.userId, isTyping: !!isTyping });
		});
	});
}

