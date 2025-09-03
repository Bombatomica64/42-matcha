import type { Socket } from "socket.io";
import { logger } from "../server";
import { io } from "./init.socket";

io.on("connection", (socket: Socket) => {
	logger.info(`New socket connection: ${socket.id}`);

	socket.on("disconnect", () => {
		logger.info(`Socket disconnected: ${socket.id}`);
	});
});
