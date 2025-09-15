import { type JobsOptions, type Processor, Queue, QueueEvents, Worker } from "bullmq";
import { createAndEmitNotification } from "../utils/notification-worker";

const connection = { connection: { url: process.env.REDIS_URL || "redis://redis:6379" } };

export const NOTIFICATION_QUEUE = "notifications" as const;

export type NotificationJobData = {
	userId: string;
	actorId: string | null;
	type: "LIKE" | "PROFILE_VIEW" | "MATCH" | "UNLIKE";
	metadata?: Record<string, unknown>;
};

export const notificationQueue = new Queue<NotificationJobData>(NOTIFICATION_QUEUE, connection);

// Processor function
const processor: Processor<NotificationJobData> = async (job) => {
	const { userId, actorId, type, metadata } = job.data;
	await createAndEmitNotification(userId, actorId, type, metadata);
};

// Worker to process jobs
export const notificationWorker = new Worker<NotificationJobData>(
	NOTIFICATION_QUEUE,
	processor,
	connection,
);

// Optional: listen to queue events
export const notificationEvents = new QueueEvents(NOTIFICATION_QUEUE, connection);

export async function enqueueNotification(data: NotificationJobData, opts?: JobsOptions) {
	return notificationQueue.add("notify", data, {
		attempts: 3,
		backoff: { type: "exponential", delay: 2000 },
		removeOnComplete: 1000,
		removeOnFail: 1000,
		...opts,
	});
}
