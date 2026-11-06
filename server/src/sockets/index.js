import { Server } from "socket.io";
import { parse } from "cookie";
import { env } from "../config/env.js";
import { AUTH_COOKIE_NAME } from "../config/constants.js";
import { verifySession } from "../services/tokenService.js";
import { SAFE_ID } from "../middleware/auth.js";
import { registerSeatEvents } from "./seatEvents.js";
let io = null;

export function initSockets(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: env.CLIENT_ORIGIN, credentials: true },
  });

  // Runs once per connection attempt, before "connection" fires
  io.use((socket, next) => {
    const token = parse(socket.handshake.headers.cookie ?? "")[
      AUTH_COOKIE_NAME
    ];
    const id = token ? verifySession(token) : null;
    if (!id || !SAFE_ID.test(id)) return next(new Error("Login required"));

    socket.data.userId = id; // same role as req.user.id in REST
    next();
  });

  //   io.on("connection", (socket) => {
  //     console.log(`socket connected: user ${socket.data.userId}`);
  //     socket.on("disconnect", (reason) => {
  //       console.log(
  //         `socket disconnected: user ${socket.data.userId} (${reason})`,
  //       );
  //     });
  //   });
  io.on("connection", (socket) => {
    console.log(`socket connected: user ${socket.data.userId}`);
    registerSeatEvents(socket);
    socket.on("disconnect", (reason) => {
      console.log(
        `socket disconnected: user ${socket.data.userId} (${reason})`,
      );
    });
  });
  return io;
}

// Other files (controllers) call this to broadcast. Null until the server starts.
export const getIO = () => io;
