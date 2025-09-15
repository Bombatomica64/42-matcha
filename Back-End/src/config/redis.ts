import IORedis, { type Redis, type RedisOptions } from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://redis:6379";

let client: Redis | null = null;
let subscriber: Redis | null = null;

export function getRedisClient(): Redis {
	if (!client) {
		client = new IORedis(
			REDIS_URL as string,
			{
				maxRetriesPerRequest: 2,
				enableReadyCheck: true,
				lazyConnect: false,
			} as RedisOptions,
		);
	}
	return client;
}

export function getRedisSubscriber(): Redis {
	if (!subscriber) {
		subscriber = new IORedis(REDIS_URL as string);
	}
	return subscriber;
}

export const redisKeys = {
	user: (id: string) => `user:${id}`,
};
