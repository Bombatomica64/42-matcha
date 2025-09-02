import type { Socket } from "socket.io";
import { io } from "./init.socket";
import { logger } from "../server";


io.on("connection", (socket: Socket) => {
	logger.info(`New socket connection: ${socket.id}`);

	socket.on("disconnect", () => {
		logger.info(`Socket disconnected: ${socket.id}`);
	});
});
