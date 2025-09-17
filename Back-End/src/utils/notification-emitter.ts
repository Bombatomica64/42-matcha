import { pool } from "../database";
import { enqueueNotification } from "../queues/notification.queue";
import { NotificationRepository } from "../repositories/notification.repository";
import { logger } from "../server";
import { emitNotificationToUser } from "../sockets/notifications.socket";
import type { NotificationDTO, NotificationType } from "../types/notification";

/**
 * Helper function to create and emit notifications
 * Use this when you need to send notifications for user actions
 */
export async function createAndEmitNotification(
	userId: string,
	actorId: string | null,
	type: NotificationType,
	metadata?: Record<string, unknown>,
): Promise<NotificationDTO> {
	// Input validation
	if (!userId || typeof userId !== "string") {
		throw new Error("Invalid userId provided");
	}

	if (actorId && typeof actorId !== "string") {
		throw new Error("Invalid actorId provided");
	}

	if (!type || !["LIKE", "PROFILE_VIEW", "MATCH", "UNLIKE"].includes(type)) {
		throw new Error(`Invalid notification type: ${type}`);
	}

	try {
		const notificationRepository = new NotificationRepository(pool);

		logger.info({ userId, type, actorId, metadata }, `[NotificationEmitter] Creating notification`);

		// Insert notification into database
		const createdNotification = await notificationRepository.create({
			user_id: userId,
			actor_id: actorId,
			type,
			metadata: metadata || null,
		});

		// Convert database row to DTO format
		const notificationDTO: NotificationDTO = {
			id: createdNotification.id,
			user_id: createdNotification.user_id,
			actor_id: createdNotification.actor_id,
			type: createdNotification.type as NotificationType,
			read_at: createdNotification.read_at,
			delivered_at: createdNotification.delivered_at,
			status: createdNotification.status as "pending" | "sent" | "failed",
			metadata: createdNotification.metadata,
			created_at: createdNotification.created_at,
		};

		// Emit the notification to the user in real-time
		try {
			emitNotificationToUser(userId, notificationDTO);

			// Note: Notification will be marked as delivered when the client acknowledges it
			// via the 'notification:ack' socket event handled in setupNotificationHandlers
		} catch (socketError) {
			// If socket emission fails, mark notification as failed
			logger.error({ err: socketError }, `[NotificationEmitter] Failed to emit notification via socket`);

			try {
				await notificationRepository.markFailed(notificationDTO.id);
			} catch (dbError) {
				logger.error({ err: dbError }, `[NotificationEmitter] Failed to mark notification as failed in DB`);
			}

			// Don't throw here - notification was saved to DB, socket failure is not critical
		}

		logger.info({ notificationId: notificationDTO.id, userId, type }, `[NotificationEmitter] Notification created and emitted successfully`);

		return notificationDTO;
	} catch (error) {
		logger.error({ err: error, userId }, `[NotificationEmitter] Error creating notification`);
		throw error;
	}
}

/**
 * Helper functions for specific notification types
 */
export const NotificationEmitter = {
	/**
	 * Emit a "like received" notification
	 */
	async like(userId: string, actorId: string): Promise<NotificationDTO> {
		await enqueueNotification({
			userId,
			actorId,
			type: "LIKE",
			metadata: { action: "liked_profile" },
		});
		// Optionally return a lightweight DTO or fetch latest; keeping current signature for compatibility:
		return {
			id: "",
			user_id: userId,
			actor_id: actorId,
			type: "LIKE",
			read_at: null,
			delivered_at: null,
			status: "pending",
			metadata: { action: "liked_profile" },
			created_at: new Date().toISOString(),
		} as NotificationDTO;
	},

	/**
	 * Emit a "profile viewed" notification
	 */
	async profileView(userId: string, actorId: string): Promise<NotificationDTO> {
		await enqueueNotification({
			userId,
			actorId,
			type: "PROFILE_VIEW",
			metadata: { action: "viewed_profile" },
		});
		return {
			id: "",
			user_id: userId,
			actor_id: actorId,
			type: "PROFILE_VIEW",
			read_at: null,
			delivered_at: null,
			status: "pending",
			metadata: { action: "viewed_profile" },
			created_at: new Date().toISOString(),
		} as NotificationDTO;
	},

	/**
	 * Emit a "match" notification
	 */
	async match(userId: string, actorId: string): Promise<NotificationDTO> {
		await enqueueNotification({ userId, actorId, type: "MATCH", metadata: { action: "matched" } });
		return {
			id: "",
			user_id: userId,
			actor_id: actorId,
			type: "MATCH",
			read_at: null,
			delivered_at: null,
			status: "pending",
			metadata: { action: "matched" },
			created_at: new Date().toISOString(),
		} as NotificationDTO;
	},

	/**
	 * Emit an "unlike" notification
	 */
	async unlike(userId: string, actorId: string): Promise<NotificationDTO> {
		await enqueueNotification({
			userId,
			actorId,
			type: "UNLIKE",
			metadata: { action: "unliked_profile" },
		});
		return {
			id: "",
			user_id: userId,
			actor_id: actorId,
			type: "UNLIKE",
			read_at: null,
			delivered_at: null,
			status: "pending",
			metadata: { action: "unliked_profile" },
			created_at: new Date().toISOString(),
		} as NotificationDTO;
	},
};
