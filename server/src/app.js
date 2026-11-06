import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "./config/env.js";
import { redis } from "./config/redis.js";
import movieRoutes from "./routes/movie.routes.js";
import showRoutes from "./routes/show.routes.js";
import holdRoutes from "./routes/hold.routes.js";
import authRoutes from "./routes/auth.routes.js";
import bookingRoutes from "./routes/booking.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { ApiError } from "./utils/ApiError.js";

export const app = express();
app.set("trust proxy", 1);

app.use(helmet());
app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

const withTimeout = (promise, ms = 2000) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), ms),
    ),
  ]);

const pingMongo = async () => {
  await mongoose.connection.db.command({ ping: 1 });
};
const pingRedis = async () => {
  await redis.ping();
};

app.get("/api/health", async (_req, res) => {
  const [mongo, cache] = await Promise.allSettled([
    withTimeout(pingMongo()),
    withTimeout(pingRedis()),
  ]);

  const mongoUp = mongo.status === "fulfilled";
  const redisUp = cache.status === "fulfilled";
  const ok = mongoUp && redisUp;

  res.status(ok ? 200 : 503).json({
    status: ok ? "ok" : "degraded",
    mongo: mongoUp ? "up" : "down",
    redis: redisUp ? "up" : "down",
    uptimeSeconds: Math.round(process.uptime()),
  });
});
app.use("/api/movies", movieRoutes);
app.use("/api/shows", showRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/holds", holdRoutes);

app.use("/api/bookings", bookingRoutes);

app.use("/api", (_req, _res, next) =>
  next(new ApiError(404, "Route not found")),
);

if (env.NODE_ENV === "production") {
  const clientDist = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../../client/dist",
  );
  app.use(express.static(clientDist));
  // React Router handles page URLs like /movies/123, so send them index.html.
  // Express 5 needs this wildcard syntax: a bare "*" is invalid.
  app.get("/{*splat}", (_req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

app.use(errorHandler);
