import process from "node:process";
import { setTimeout } from "node:timers";
import { env } from "@config/env";
import { logger, server } from "./server";
import { registerConnectionHandlers } from "./sockets/connection.socket";
import { initSocket } from "./sockets/init.socket";

// Initialize Socket.IO with the HTTP server
initSocket(server);
registerConnectionHandlers();

// Start background workers (BullMQ) after sockets are initialized
await import("./queues/notification.queue");

server.listen(env.PORT, () => {
	const { NODE_ENV, HOST, PORT } = env;
	logger.info(`Matcha Server (${NODE_ENV}) running on http://${HOST}:${PORT}`);
	logger.info(`API Documentation available at http://${HOST}:${PORT}/api-docs`);
	logger.info(`Socket io started on ${server}`);
});

const onCloseSignal = () => {
	logger.info("SIGINT received, shutting down gracefully");
	server.close(() => {
		logger.info("Server closed");
		process.exit();
	});
	setTimeout(() => process.exit(1), 10000).unref();
};

process.on("SIGINT", onCloseSignal);
process.on("SIGTERM", onCloseSignal);
