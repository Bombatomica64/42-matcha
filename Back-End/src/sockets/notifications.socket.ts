import type { Socket } from "socket.io";
import { pool } from "../database";
import { NotificationRepository } from "../repositories/notification.repository";
import { logger } from "../server";
import type { NotificationDTO } from "../types/notification";
import { getIO } from "./init.socket";

/**
 * Emit a notification to a specific user via Socket.IO
 */
export function emitNotificationToUser(userId: string, notification: NotificationDTO): void {
	try {
		const userRoom = `user_${userId}`;

		logger.info({ notificationId: notification.id, type: notification.type, userId, room: userRoom }, `[NotificationSocket] Sending notification`);

		// Emit to the user's personal room
		getIO().to(userRoom).emit("notification", notification);

		logger.debug({ userId, notificationId: notification.id, type: notification.type }, `[NotificationSocket] Notification emitted successfully`);
	} catch (error) {
		logger.error({ err: error, userId }, `[NotificationSocket] Error emitting notification`);
	}
}

/**
 * Emit notification read event to a specific user
 */
export function emitNotificationRead(userId: string, notificationId: string): void {
	try {
		const userRoom = `user_${userId}`;

		logger.info({ userId, notificationId }, `[NotificationSocket] Sending read confirmation`);

		getIO().to(userRoom).emit("notification:read", { notificationId });
	} catch (error) {
		logger.error({ err: error, userId }, `[NotificationSocket] Error emitting read confirmation`);
	}
}

/**
 * Emit all notifications read event to a specific user
 */
export function emitAllNotificationsRead(userId: string): void {
	try {
		const userRoom = `user_${userId}`;

		logger.info(`[NotificationSocket] Sending all-read confirmation to user ${userId}`);

		getIO().to(userRoom).emit("notifications:allRead");
	} catch (error) {
		logger.error({ err: error, userId }, `[NotificationSocket] Error emitting all-read confirmation`);
	}
}

/**
 * Handle notification-related socket events for a connected user
 */
export function setupNotificationHandlers(socket: Socket): void {
	logger.info({ userId: socket.userId }, `[NotificationSocket] Setting up notification handlers`);

	const notificationRepository = new NotificationRepository(pool);

	// Handle notification acknowledgments (for delivery confirmation)
	socket.on("notification:ack", async (data: { notificationId: string }) => {
		try {
			logger.info({ userId: socket.userId, notificationId: data.notificationId }, `[NotificationSocket] Notification acknowledged`);

			// Mark notification as delivered in the database
			await notificationRepository.markDelivered(data.notificationId);

			logger.debug({ notificationId: data.notificationId, userId: socket.userId }, `[NotificationSocket] Notification marked as delivered`);
		} catch (error) {
			logger.error({ err: error }, `[NotificationSocket] Error marking notification as delivered`);
		}
	});

	// Handle read receipts (optional - if you want real-time read status)
	socket.on("notification:markRead", async (data: { notificationId: string }) => {
		try {
			logger.info({ userId: socket.userId, notificationId: data.notificationId }, `[NotificationSocket] Marking notification as read`);

			// You could call your notification service here to mark as read
			// and then emit the confirmation back
			emitNotificationRead(socket.userId, data.notificationId);
		} catch (error) {
			logger.error({ err: error }, `[NotificationSocket] Error handling read receipt`);
		}
	});

	logger.debug({ userId: socket.userId }, `[NotificationSocket] Notification handlers set up`);
}
