import mongoose from "mongoose";
import { connectDb } from "../config/db.js";
import { Movie } from "../models/Movie.js";
import { Theater } from "../models/Theater.js";
import { Show } from "../models/Show.js";

const IST_OFFSET_MIN = 330;
const DAYS = 7;
const SLOTS = [
  [9, 30],
  [12, 45],
  [16, 0],
  [19, 15],
  [22, 30],
];

const istToUtc = (y, m, d, h, min) =>
  new Date(Date.UTC(y, m, d, h, min) - IST_OFFSET_MIN * 60_000);

async function refresh() {
  await connectDb();
  console.log("Database:", mongoose.connection.name);

  const movies = await Movie.find().sort({ title: 1 }).lean();
  const theaters = await Theater.find().sort({ name: 1 }).lean();
  if (movies.length === 0 || theaters.length === 0) {
    throw new Error("No movies or theaters. Run the seed script first.");
  }

  const now = new Date();
  const istNow = new Date(now.getTime() + IST_OFFSET_MIN * 60_000);
  const y = istNow.getUTCFullYear();
  const m = istNow.getUTCMonth();
  const d = istNow.getUTCDate();

  const candidates = [];
  let screenIndex = 0;
  for (const theater of theaters) {
    for (const screen of theater.screens) {
      for (let day = 0; day < DAYS; day++) {
        SLOTS.forEach(([h, min], slot) => {
          const startTime = istToUtc(y, m, d + day, h, min);
          if (startTime <= now) return;
          candidates.push({
            movieId: movies[(day + slot + screenIndex) % movies.length]._id,
            theaterId: theater._id,
            screenName: screen.name,
            startTime,
            priceMultiplier: slot >= 3 ? 1.2 : 1,
          });
        });
      }
      screenIndex++;
    }
  }

  // Skip any show whose screen and start time already exist
  const existing = await Show.find({ startTime: { $gt: now } })
    .select("theaterId screenName startTime")
    .lean();
  const key = (s) => `${s.theaterId}|${s.screenName}|${s.startTime.getTime()}`;
  const taken = new Set(existing.map(key));
  const fresh = candidates.filter((c) => !taken.has(key(c)));

  if (fresh.length > 0) await Show.insertMany(fresh);
  console.log(
    `Added ${fresh.length} shows (${candidates.length - fresh.length} already existed)`,
  );
}

refresh()
  .catch((err) => {
    console.error("Refresh failed:", err.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
