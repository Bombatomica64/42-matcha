import { isPlatformServer } from "@angular/common";
import { inject, PLATFORM_ID } from "@angular/core";
import type { ResolveFn } from "@angular/router";
import { firstValueFrom } from "rxjs";
import type { components } from "../../types/api";
import {
	type HttpEndpoint,
	type HttpMethod,
	HttpRequestService,
} from "../services/http-request";

type ChatMessage = components["schemas"]["ChatMessage"];

const __resolverIdentity: unknown = null as unknown as ResolveFn<unknown>;

export interface ChatPrefetchData {
	roomId: string;
	messagesAsc: ChatMessage[];
}

export const chatMessagesResolver: ResolveFn<ChatPrefetchData | null> = async (
	route,
) => {
	const roomId = route.paramMap.get("id");
	if (!roomId) return null;
	const platformId = inject(PLATFORM_ID);
	const http = inject(HttpRequestService);
	try {
		// Always fetch on server; on client you may choose to rely on component logic
		if (isPlatformServer(platformId)) {
			const query = `?page=1&limit=30&sort=created_at&order=desc`;
			const data = await firstValueFrom(
				http.requestParams(
					query,
					`/chat/${roomId}/messages` as HttpEndpoint,
					"GET" as HttpMethod,
				),
			);
			const arr: ChatMessage[] = Array.isArray(data)
				? (data as ChatMessage[])
				: [];
			const asc = [...arr].reverse();
			return { roomId, messagesAsc: asc };
		}
	} catch {
		// swallow; component will fallback to client fetch
	}
	return null;
};
