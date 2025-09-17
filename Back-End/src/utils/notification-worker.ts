import { pool } from "../database";
import { NotificationRepository } from "../repositories/notification.repository";
import { logger } from "../server";
import { emitNotificationToUser } from "../sockets/notifications.socket";
import type { NotificationDTO, NotificationType } from "../types/notification";

/**
 * Worker-side implementation for creating and emitting notifications.
 * Split from the public emitter to avoid circular deps when used by BullMQ worker.
 */
export async function createAndEmitNotification(
	userId: string,
	actorId: string | null,
	type: NotificationType,
	metadata?: Record<string, unknown>,
): Promise<NotificationDTO> {
	if (!userId || typeof userId !== "string") {
		throw new Error("Invalid userId provided");
	}
	if (actorId && typeof actorId !== "string") {
		throw new Error("Invalid actorId provided");
	}
	if (!type || !["LIKE", "PROFILE_VIEW", "MATCH", "UNLIKE"].includes(type)) {
		throw new Error(`Invalid notification type: ${type}`);
	}

	const notificationRepository = new NotificationRepository(pool);
	logger.info({ userId, type, actorId, metadata }, `[NotificationWorker] Creating notification`);

	const created = await notificationRepository.create({
		user_id: userId,
		actor_id: actorId,
		type,
		metadata: metadata || null,
	});

	const dto: NotificationDTO = {
		id: created.id,
		user_id: created.user_id,
		actor_id: created.actor_id,
		type: created.type as NotificationType,
		read_at: created.read_at,
		delivered_at: created.delivered_at,
		status: created.status as "pending" | "sent" | "failed",
		metadata: created.metadata,
		created_at: created.created_at,
	};

	try {
		emitNotificationToUser(userId, dto);
	} catch (err) {
		logger.error({ err }, `[NotificationWorker] Socket emit failed`);
		try {
			await notificationRepository.markFailed(dto.id);
		} catch (dbErr) {
			logger.error({ err: dbErr }, `[NotificationWorker] Failed to mark notification as failed in DB`);
		}
	}

	return dto;
}
