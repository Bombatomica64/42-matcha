import { env } from "./config/env";
import { app, logger } from "./server";
import process from "process";
import { setTimeout } from "timers";

const server = app.listen(env.PORT, () => {
	const { NODE_ENV, HOST, PORT } = env;
	logger.info(`Matcha Server (${NODE_ENV}) running on http://${HOST}:${PORT}`);
	logger.info(`API Documentation available at http://${HOST}:${PORT}/api-docs`);
});

const onCloseSignal = () => {
	logger.info("SIGINT received, shutting down gracefully");
	server.close(() => {
		logger.info("Server closed");
		process.exit();
	});
	setTimeout(() => process.exit(1), 10000).unref(); // Force shutdown after 10s
};

process.on("SIGINT", onCloseSignal);
process.on("SIGTERM", onCloseSignal);
