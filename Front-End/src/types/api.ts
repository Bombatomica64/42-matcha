/**
 * Extended types for better TypeScript support
 * This file provides generic variants of the generated OpenAPI types
 */

// Re-export the generated types
export * from "./api-nonextended";

import type { components } from "./api-nonextended";

// Generic pagination response type
export interface PaginatedResponse<T> {
	data: T[];
	meta: components["schemas"]["PaginationMeta"];
	links: components["schemas"]["PaginationLinks"];
}

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
export type { NewChatMessagePayload, TypingPayload };
