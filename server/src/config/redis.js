import { readFileSync } from "node:fs";
import Redis from "ioredis";
import { env } from "./env.js";

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
});

redis.on("connect", () => console.log("Redis connected"));
redis.on("error", (err) => console.error("Redis error:", err.message));

// Read a .lua file that sits next to src/config (../lua/<name>.lua)
const loadLua = (name) =>
  readFileSync(new URL(`../lua/${name}.lua`, import.meta.url), "utf8");

// After this, redis.lockSeats(...) behaves like a built-in command.
// ioredis sends the script once, then calls it by its hash afterwards.
redis.defineCommand("lockSeats", { lua: loadLua("lockSeats") });
redis.defineCommand("verifyOwnership", { lua: loadLua("verifyOwnership") });
redis.defineCommand("releaseIfOwner", { lua: loadLua("releaseIfOwner") });
