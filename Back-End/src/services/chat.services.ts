import type { components, PaginatedResponse } from "@generated/typescript/api";
import type { ChatMessageRepository } from "@repositories/chatMessage.repository";
import type { ChatRoomRepository } from "@repositories/chatRoom.repository";
import { logger } from "../server";

type ChatRoom = components["schemas"]["ChatRoom"];
type ChatMessage = components["schemas"]["ChatMessage"];
type PaginationRequest = components["schemas"]["PaginationQuery"];

export class ChatService {
	private chatRoomRepository: ChatRoomRepository;
	private chatMessageRepository: ChatMessageRepository;

	constructor(
		chatRoomRepository: ChatRoomRepository,
		chatMessageRepository: ChatMessageRepository,
	) {
		this.chatRoomRepository = chatRoomRepository;
		this.chatMessageRepository = chatMessageRepository;
	}

	/**
	 * Get all chat rooms for a user
	 */
	public async getUserChatRooms(userId: string): Promise<ChatRoom[]> {
		return this.chatRoomRepository.findByUserId(userId);
	}

	/**
	 * Get a specific chat room by ID (with access control)
	 */
	public async getChatRoomById(chatRoomId: string, userId: string): Promise<ChatRoom | null> {
		const chatRoom = await this.chatRoomRepository.findById(chatRoomId);

		if (!chatRoom) {
			return null;
		}

		// Check if user has access to this chat room
		if (chatRoom.user1_id !== userId && chatRoom.user2_id !== userId) {
			throw new Error("Access denied");
		}

		return chatRoom;
	}

	/**
	 * Create a new chat room between two users
	 */
	public async createChatRoom(user1Id: string, user2Id: string): Promise<ChatRoom> {
		// Check if chat room already exists
		const existingChatRoom = await this.chatRoomRepository.findByUserIds(user1Id, user2Id);

		if (existingChatRoom) {
			return existingChatRoom;
		}

		return this.chatRoomRepository.createChatRoom(user1Id, user2Id);
	}

	/**
	 * Get messages for a chat room with access control and pagination
	 */
	public async getChatMessages(
		roomId: string,
		userId: string,
		pagination: PaginationRequest,
		baseUrl: string,
	): Promise<PaginatedResponse<ChatMessage>> {
		// First verify user has access to this chat room
		const chatRoom = await this.getChatRoomById(roomId, userId);

		if (!chatRoom) {
			throw new Error("Chat room not found");
		}

		return this.chatMessageRepository.getByChatId(roomId, pagination, baseUrl);
	}

	/**
	 * Send a message in a chat room
	 */
	public async sendMessage(
		roomId: string,
		userId: string,
		messageData: Partial<ChatMessage>,
	): Promise<ChatMessage> {
		// Verify user has access to this chat room
		const chatRoom = await this.getChatRoomById(roomId, userId);

		if (!chatRoom) {
			throw new Error("Chat room not found");
		}

		// Create the message
		const messageToCreate = {
			...messageData,
			chat_room_id: roomId,
			sender_id: userId,
		};

		return this.chatMessageRepository.create(messageToCreate);
	}

	/**
	 * Delete a chat room (with access control)
	 */
	public async deleteChatRoom(chatRoomId: string, userId: string): Promise<boolean> {
		// Verify user has access to this chat room
		const chatRoom = await this.getChatRoomById(chatRoomId, userId);

		if (!chatRoom) {
			return false;
		}

		return this.chatRoomRepository.deleteChatRoom(chatRoomId);
	}

	/**
	 * Mark messages as read
	 */
	public async markMessagesAsRead(
		chatRoomId: string,
		userId: string,
		messageIds: string[],
	): Promise<boolean> {
		try {
			// Verify user has access to this chat room
			const chatRoom = await this.getChatRoomById(chatRoomId, userId);

			if (!chatRoom) {
				throw new Error("Chat room not found");
			}

			const result = await this.chatMessageRepository.markMessagesAsRead(messageIds);

			return result;
		} catch (error) {
			logger.error("Error marking messages as read:", error);
			return false;
		}
	}
}
