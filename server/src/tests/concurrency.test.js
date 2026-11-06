import mongoose from "mongoose";
import Redis from "ioredis";
import { describe, it, expect, beforeAll, afterEach, afterAll } from "vitest";
import {
  connectTestDb,
  clearTestDb,
  disconnectTestDb,
} from "../tests/helpers/testDb.js";
import { env } from "../config/env.js";
import { redis } from "../config/redis.js";
import { Theater } from "../models/Theater.js";
import { Show } from "../models/Show.js";
import { Booking } from "../models/Booking.js";
import { lockSeats, seatKey, holdKey } from "../services/seatLockService.js";

const SCREEN = {
  name: "Screen 1",
  rows: ["A", "B", "C", "D", "E", "F"],
  seatsPerRow: 12,
  aisleAfter: [4, 8],
  missingSeats: [],
  tiers: [
    { name: "Premium", rows: ["E", "F"], price: 350 },
    { name: "Standard", rows: ["A", "B", "C", "D"], price: 200 },
  ],
};

const REQUESTS = 100;
const createdShowIds = [];
const createdHoldIds = [];

async function createShow() {
  const theater = await Theater.create({
    name: `Race Cinema ${new mongoose.Types.ObjectId()}`,
    city: "Delhi",
    screens: [SCREEN],
  });
  const show = await Show.create({
    movieId: new mongoose.Types.ObjectId(),
    theaterId: theater._id,
    screenName: SCREEN.name,
    startTime: new Date(Date.now() + 24 * 60 * 60_000),
    priceMultiplier: 1,
  });
  const id = String(show._id);
  createdShowIds.push(id);
  return id;
}

// Sends every call at once, then waits for all of them to finish
async function race(calls) {
  const results = await Promise.allSettled(calls);
  const won = results.filter((r) => r.status === "fulfilled");
  const lost = results.filter((r) => r.status === "rejected");
  won.forEach((r) => createdHoldIds.push(r.value.holdId));
  return { won, lost };
}

// The BROKEN version, kept only to show what the Lua script prevents.
// The gap between EXISTS and SET is where a second request slips in.
async function naiveLock(client, showId, seatId, owner) {
  const key = seatKey(showId, seatId);
  if (await client.exists(key)) return false;
  await client.set(key, owner, "PX", 60_000);
  return true;
}

beforeAll(connectTestDb);

afterEach(async () => {
  await clearTestDb();
  for (const id of createdShowIds.splice(0)) {
    for await (const keys of redis.scanStream({
      match: `lock:show:${id}:seat:*`,
      count: 100,
    })) {
      if (keys.length > 0) await redis.del(...keys);
    }
  }
  const holds = createdHoldIds.splice(0);
  if (holds.length > 0) await redis.del(...holds.map(holdKey));
});

afterAll(async () => {
  await clearTestDb();
  await disconnectTestDb();
  await redis.quit();
});

describe("concurrent seat locking", () => {
  it("NAIVE check-then-set lets several users win (the bug we avoid)", async () => {
    const showId = await createShow();
    const calls = Array.from({ length: REQUESTS }, (_, i) =>
      naiveLock(redis, showId, "D5", `naive${i}`),
    );
    const winners = (await Promise.all(calls)).filter(Boolean).length;

    console.log(`[naive] ${winners} of ${REQUESTS} requests "won" seat D5`);
    expect(winners).toBeGreaterThanOrEqual(1); // we expect > 1, which is the bug
  });

  it(`${REQUESTS} parallel requests for one seat: exactly 1 wins`, async () => {
    const showId = await createShow();
    const { won, lost } = await race(
      Array.from({ length: REQUESTS }, (_, i) =>
        lockSeats(`user${i}`, showId, ["D5"]),
      ),
    );

    console.log(`[lua] ${won.length} won, ${lost.length} lost`);
    expect(won).toHaveLength(1);
    expect(lost).toHaveLength(REQUESTS - 1);
    expect(lost.every((r) => r.reason.status === 409)).toBe(true);
    expect(await redis.exists(seatKey(showId, "D5"))).toBe(1);
  });

  it("50 separate Redis connections racing for one seat: exactly 1 wins", async () => {
    const showId = await createShow();
    const clients = Array.from({ length: 50 }, () => {
      const c = new Redis(env.REDIS_URL);
      // Scripts are defined per client, so reuse the same Lua source
      c.defineCommand("lockSeats", {
        lua: redis.scriptsSet.lockSeats.lua,
      });
      return c;
    });

    try {
      const key = seatKey(showId, "D6");
      const results = await Promise.all(
        clients.map((c, i) => c.lockSeats(1, key, `hold${i}:user${i}`, 60_000)),
      );
      const winners = results.filter((conflicts) => conflicts.length === 0);

      console.log(`[lua, 50 connections] ${winners.length} won`);
      expect(winners).toHaveLength(1);
    } finally {
      await Promise.all(clients.map((c) => c.quit()));
    }
  });

  it("50 requests for overlapping multi-seat sets: no seat has two owners", async () => {
    const showId = await createShow();
    // Every request wants 3 of seats D1..D5, so most sets overlap
    const sets = [
      ["D1", "D2", "D3"],
      ["D2", "D3", "D4"],
      ["D3", "D4", "D5"],
      ["D1", "D3", "D5"],
      ["D1", "D2", "D5"],
    ];
    const { won } = await race(
      Array.from({ length: 50 }, (_, i) =>
        lockSeats(`user${i}`, showId, sets[i % sets.length]),
      ),
    );

    // Every seat in a winning hold must appear in only ONE winning hold
    const owners = new Map();
    for (const { value } of won) {
      for (const seatId of value.seatIds) {
        expect(owners.has(seatId)).toBe(false);
        owners.set(seatId, value.holdId);
      }
    }
    // And Redis must agree with the winners
    for (const [seatId, holdId] of owners) {
      const stored = await redis.get(seatKey(showId, seatId));
      expect(stored.startsWith(holdId)).toBe(true);
    }
    console.log(
      `[lua, overlapping] ${won.length} holds won, ${owners.size} seats locked`,
    );
    expect(won.length).toBeGreaterThanOrEqual(1);
  });

  it("the Mongo unique index also stops a double booking", async () => {
    const showId = await createShow();
    const make = (ref) => ({
      userId: new mongoose.Types.ObjectId(),
      showId,
      seats: ["D5"],
      amount: 200,
      paymentRef: ref,
    });
    await Booking.init();

    const results = await Promise.allSettled(
      Array.from({ length: 20 }, (_, i) => Booking.create(make(`pay_${i}`))),
    );
    const ok = results.filter((r) => r.status === "fulfilled").length;

    console.log(`[mongo] ${ok} of 20 inserts succeeded`);
    expect(ok).toBe(1);
    expect(await Booking.countDocuments({ showId })).toBe(1);
  });
});
