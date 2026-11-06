import mongoose from "mongoose";
import { env } from "../config/env.js";
import { connectDb } from "../config/db.js";
import { redis } from "../config/redis.js";
import { Booking } from "../models/Booking.js";

if (env.NODE_ENV === "production") {
  console.error("Refusing to run reset in production");
  process.exit(1);
}

const showId = process.argv[2]; // optional

if (showId && !mongoose.isValidObjectId(showId)) {
  console.error(`"${showId}" is not a valid show id`);
  process.exit(1);
}

async function deleteByPattern(pattern) {
  let count = 0;
  // SCAN is fine in a dev tool. We never use it in request handlers.
  for await (const keys of redis.scanStream({ match: pattern, count: 100 })) {
    if (keys.length > 0) count += await redis.del(...keys);
  }
  return count;
}

async function reset() {
  await connectDb();
  console.log("Database:", mongoose.connection.name);

  const { deletedCount } = await Booking.deleteMany(showId ? { showId } : {});
  console.log(`Deleted ${deletedCount} bookings`);

  const lockKeys = await deleteByPattern(
    showId ? `lock:show:${showId}:seat:*` : "lock:show:*",
  );
  console.log(`Deleted ${lockKeys} seat locks`);

  if (!showId) {
    console.log(`Deleted ${await deleteByPattern("hold:*")} holds`);
  }
}

reset()
  .catch((err) => {
    console.error("Reset failed:", err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
    await redis.quit();
  });
