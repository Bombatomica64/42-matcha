import { ChatController } from "@controllers/chat.controller";
import { ChatMessageRepository } from "@repositories/chatMessage.repository";
import { ChatRoomRepository } from "@repositories/chatRoom.repository";
import { ChatService } from "@services/chat.services";
import type { Router } from "express";
import { Router as createRouter } from "express";
import { pool } from "../database";

const chatRoutes = (): Router => {
	const router = createRouter();

	// Initialize repositories and services
	const chatRoomRepository = new ChatRoomRepository(pool);
	const chatMessageRepository = new ChatMessageRepository(pool);
	const chatService = new ChatService(chatRoomRepository, chatMessageRepository);
	const chatController = new ChatController(chatService);

	// Chat room endpoints
	router.get("/user", chatController.getUserChats.bind(chatController));
	router.get("/:id", chatController.getChatById.bind(chatController));
	router.delete("/:id", chatController.deleteChatById.bind(chatController));

	// Chat messages endpoint with pagination
	router.get("/:id/messages", chatController.getChatMessages.bind(chatController));

	return router;
};

export default chatRoutes;
