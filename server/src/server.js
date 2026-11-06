import http from "node:http";
import mongoose from "mongoose";
import { app } from "./app.js";
import { env } from "./config/env.js";
import { connectDb } from "./config/db.js";
import { redis } from "./config/redis.js";
import { initSockets, getIO } from "./sockets/index.js";

const server = http.createServer(app);
initSockets(server);

async function start() {
  await connectDb();
  server.listen(env.PORT, () => {
    console.log(`Server listening on http://localhost:${env.PORT}`);
  });
}

// function shutdown(signal) {
//   console.log(`${signal} received, shutting down`);
//   server.close(async () => {
//     await mongoose.disconnect();
//     await redis.quit();
//     process.exit(0);
//   });
//   setTimeout(() => process.exit(1), 10_000).unref();
// }

function shutdown(signal) {
  console.log(`${signal} received, shutting down`);
  getIO().close(async () => {
    await mongoose.disconnect();
    await redis.quit();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

start().catch((err) => {
  console.error("Failed to start server:", err.message);
  process.exit(1);
});
