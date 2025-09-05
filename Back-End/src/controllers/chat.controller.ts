import type { components } from "@generated/typescript/api";
import type { ChatService } from "@services/chat.services";
import type { Request, Response } from "express";
import { logger } from "../server";
import { buildBaseUrl, extractPaginationQuery } from "../utils/pagination";

type ErrorResponse = components["schemas"]["ErrorResponse"];
type SuccessResponse = components["schemas"]["SuccessResponse"];

export class ChatController {
	private chatService: ChatService;

	constructor(chatService: ChatService) {
		this.chatService = chatService;
	}

	/**
	 * Get all chat rooms for the authenticated user
	 */
	public async getUserChats(_req: Request, res: Response): Promise<void> {
		const userId = res.locals.user?.id;

		if (!userId) {
			res.status(401).json({
				error: "Unauthorized access",
				message: "You must be logged in to access this resource",
			} as ErrorResponse);
			return;
		}

		try {
			const chatRooms = await this.chatService.getUserChatRooms(userId);
			res.json(chatRooms);
		} catch (error) {
			logger.error(`Error fetching user chats: ${error}`);
			res.status(500).json({
				error: "Internal server error",
				message: "Failed to fetch chat rooms",
			} as ErrorResponse);
		}
	}

	/**
	 * Get a specific chat room by ID
	 */
	public async getChatById(req: Request, res: Response): Promise<void> {
		const { id: chatRoomId } = req.params;
		const userId = res.locals.user?.id;

		if (!userId) {
			res.status(401).json({
				error: "Unauthorized access",
				message: "You must be logged in to access this resource",
			} as ErrorResponse);
			return;
		}

		try {
			const chatRoom = await this.chatService.getChatRoomById(chatRoomId, userId);

			if (!chatRoom) {
				res.status(404).json({
					error: "Chat room not found",
					message: "The specified chat room does not exist",
					code: "NOT_FOUND",
				} as ErrorResponse);
				return;
			}

			res.json(chatRoom);
		} catch (error) {
			logger.error(`Error fetching chat room: ${error}`);
			res.status(500).json({
				error: "Internal server error",
				message: "Failed to fetch chat room",
			} as ErrorResponse);
		}
	}

	/**
	 * Get all messages in a chat room with pagination
	 */
	public async getChatMessages(req: Request, res: Response): Promise<void> {
		const { id: chatRoomId } = req.params;
		const userId = res.locals.user?.id;

		if (!userId) {
			res.status(401).json({
				error: "Unauthorized access",
				message: "You must be logged in to access this resource",
				code: "UNAUTHORIZED",
			} as ErrorResponse);
			return;
		}

		try {
			// Extract pagination parameters using the utility
			const pagination = extractPaginationQuery(req);
			const baseUrl = buildBaseUrl(req);

			const messages = await this.chatService.getChatMessages(
				chatRoomId,
				userId,
				pagination,
				baseUrl,
			);

			res.json(messages);
		} catch (error) {
			if (error instanceof Error && error.message === "Chat room not found") {
				res.status(404).json({
					error: "Chat room not found",
					message: "The specified chat room does not exist",
					code: "NOT_FOUND",
				} as ErrorResponse);
				return;
			}

			if (error instanceof Error && error.message === "Access denied") {
				res.status(403).json({
					error: "Access denied",
					message: "You don't have permission to access this chat room",
				} as ErrorResponse);
				return;
			}

			logger.error(`Error fetching chat messages: ${error}`);
			res.status(500).json({
				error: "Internal server error",
				message: "Failed to fetch chat messages",
			} as ErrorResponse);
		}
	}

	/**
	 * Delete a chat room
	 */
	public async deleteChatById(req: Request, res: Response): Promise<void> {
		const { id: chatRoomId } = req.params;
		const userId = res.locals.user?.id;

		if (!userId) {
			res.status(401).json({
				error: "Unauthorized access",
				message: "You must be logged in to access this resource",
			} as ErrorResponse);
			return;
		}

		try {
			const deleted = await this.chatService.deleteChatRoom(chatRoomId, userId);

			if (!deleted) {
				res.status(404).json({
					error: "Chat room not found",
					message: "The specified chat room does not exist",
				} as ErrorResponse);
				return;
			}

			res.status(204).json({
				message: "Chat room deleted successfully",
			} as SuccessResponse);
		} catch (error) {
			logger.error(`Error deleting chat room: ${error}`);
			res.status(500).json({
				error: "Internal server error",
				message: "Failed to delete chat room",
			} as ErrorResponse);
		}
	}
}
