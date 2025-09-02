import { Server } from "socket.io";
import { app } from "../server";
import { createServer } from "node:http";

const server = createServer(app);

const io = new Server(server, {
  transports: ['webtransport', 'websocket', 'polling'],
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true, // Required for HTTP-only cookies
    allowedHeaders: ["Content-Type", "Authorization", "x-new-access-token"],
  },
});

export { io, server };