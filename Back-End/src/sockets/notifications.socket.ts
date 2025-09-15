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

		logger.info(`[NotificationSocket] Sending notification to user ${userId} in room ${userRoom}`, {
			notificationId: notification.id,
			type: notification.type,
		});

		// Emit to the user's personal room
		getIO().to(userRoom).emit("notification", notification);

		logger.debug(`[NotificationSocket] Notification emitted successfully`, {
			userId,
			notificationId: notification.id,
			type: notification.type,
		});
	} catch (error) {
		logger.error(`[NotificationSocket] Error emitting notification to user ${userId}:`, error);
	}
}

/**
 * Emit notification read event to a specific user
 */
export function emitNotificationRead(userId: string, notificationId: string): void {
	try {
		const userRoom = `user_${userId}`;

		logger.info(`[NotificationSocket] Sending read confirmation to user ${userId}`, {
			notificationId,
		});

		getIO().to(userRoom).emit("notification:read", { notificationId });
	} catch (error) {
		logger.error(`[NotificationSocket] Error emitting read confirmation to user ${userId}:`, error);
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
		logger.error(
			`[NotificationSocket] Error emitting all-read confirmation to user ${userId}:`,
			error,
		);
	}
}

/**
 * Handle notification-related socket events for a connected user
 */
export function setupNotificationHandlers(socket: Socket): void {
	logger.info(`[NotificationSocket] Setting up notification handlers for user ${socket.userId}`);

	const notificationRepository = new NotificationRepository(pool);

	// Handle notification acknowledgments (for delivery confirmation)
	socket.on("notification:ack", async (data: { notificationId: string }) => {
		try {
			logger.info(`[NotificationSocket] Notification acknowledged by user ${socket.userId}`, {
				notificationId: data.notificationId,
			});

			// Mark notification as delivered in the database
			await notificationRepository.markDelivered(data.notificationId);

			logger.debug(`[NotificationSocket] Notification marked as delivered`, {
				notificationId: data.notificationId,
				userId: socket.userId,
			});
		} catch (error) {
			logger.error(`[NotificationSocket] Error marking notification as delivered:`, error);
		}
	});

	// Handle read receipts (optional - if you want real-time read status)
	socket.on("notification:markRead", async (data: { notificationId: string }) => {
		try {
			logger.info(`[NotificationSocket] User ${socket.userId} marking notification as read`, {
				notificationId: data.notificationId,
			});

			// You could call your notification service here to mark as read
			// and then emit the confirmation back
			emitNotificationRead(socket.userId, data.notificationId);
		} catch (error) {
			logger.error(`[NotificationSocket] Error handling read receipt:`, error);
		}
	});

	logger.debug(`[NotificationSocket] Notification handlers set up for user ${socket.userId}`);
}
