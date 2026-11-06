import mongoose from "mongoose";
import {
  describe,
  it,
  expect,
  beforeAll,
  beforeEach,
  afterEach,
  afterAll,
} from "vitest";
import {
  connectTestDb,
  clearTestDb,
  disconnectTestDb,
} from "../tests/helpers/testDb.js";
import { redis } from "../config/redis.js";
import { Theater } from "../models/Theater.js";
import { Show } from "../models/Show.js";
import { Booking } from "../models/Booking.js";
import { lockSeats, seatKey, holdKey } from "../services/seatLockService.js";
import { confirmBooking } from "../services/bookingService.js";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// Bookings need real ObjectIds as user ids
const newUser = () => String(new mongoose.Types.ObjectId());

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

let showId;
let holdIds;

async function createShow() {
  const theater = await Theater.create({
    name: `Booking Cinema ${new mongoose.Types.ObjectId()}`,
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
  return String(show._id);
}

async function lock(userId, seatIds, options) {
  const hold = await lockSeats(userId, showId, seatIds, options);
  holdIds.push(hold.holdId);
  return hold;
}

beforeAll(connectTestDb);

beforeEach(async () => {
  await clearTestDb();
  showId = await createShow();
  holdIds = [];
});

afterEach(async () => {
  for await (const keys of redis.scanStream({
    match: `lock:show:${showId}:seat:*`,
    count: 100,
  })) {
    if (keys.length > 0) await redis.del(...keys);
  }
  if (holdIds.length > 0) await redis.del(...holdIds.map(holdKey));
});

afterAll(async () => {
  await clearTestDb();
  await disconnectTestDb();
  await redis.quit();
});

describe("confirmBooking", () => {
  it("saves the booking and frees the Redis locks", async () => {
    const user = newUser();
    const hold = await lock(user, ["D1", "E1"]); // 200 + 350

    const { booking, created } = await confirmBooking(
      user,
      hold.holdId,
      "mock_happy",
    );

    expect(created).toBe(true);
    expect(booking).toMatchObject({
      seats: ["D1", "E1"],
      amount: 550,
      status: "confirmed",
    });
    expect(String(booking.userId)).toBe(user);
    expect(
      await redis.exists(seatKey(showId, "D1"), seatKey(showId, "E1")),
    ).toBe(0);
    expect(await redis.exists(holdKey(hold.holdId))).toBe(0);
  });

  it("refuses someone else's hold", async () => {
    const hold = await lock(newUser(), ["D1"]);
    await expect(
      confirmBooking(newUser(), hold.holdId, "mock_thief"),
    ).rejects.toMatchObject({ status: 403 });
    expect(await Booking.countDocuments()).toBe(0);
  });

  it("refuses an expired hold", async () => {
    const user = newUser();
    const hold = await lock(user, ["D1"], { ttlMs: 300 });
    await sleep(500);

    await expect(
      confirmBooking(user, hold.holdId, "mock_late"),
    ).rejects.toMatchObject({ status: 410 });
    expect(await Booking.countDocuments()).toBe(0);
  });

  it("refuses when our lock expired and another user took the seat", async () => {
    const a = newUser();
    const aHold = await lock(a, ["D1"], { ttlMs: 300 });
    await sleep(500);
    await lock(newUser(), ["D1"]); // B now owns the lock

    await expect(
      confirmBooking(a, aHold.holdId, "mock_a"),
    ).rejects.toMatchObject({ status: 410 });
    expect(await redis.exists(seatKey(showId, "D1"))).toBe(1); // B's lock survives
  });

  it("is idempotent: a retry with the same paymentRef returns the same booking", async () => {
    const user = newUser();
    const hold = await lock(user, ["D1"]);

    const first = await confirmBooking(user, hold.holdId, "mock_retry");
    const second = await confirmBooking(user, hold.holdId, "mock_retry"); // hold is gone now

    expect(second.created).toBe(false);
    expect(String(second.booking._id)).toBe(String(first.booking._id));
    expect(await Booking.countDocuments()).toBe(1);
  });

  it("10 parallel confirms of one hold create exactly one booking", async () => {
    const user = newUser();
    const hold = await lock(user, ["D1", "D2"]);

    const results = await Promise.all(
      Array.from({ length: 10 }, () =>
        confirmBooking(user, hold.holdId, "mock_parallel"),
      ),
    );

    expect(results.filter((r) => r.created)).toHaveLength(1);
    expect(new Set(results.map((r) => String(r.booking._id))).size).toBe(1);
    expect(await Booking.countDocuments()).toBe(1);
  });

  it("falls back to the Mongo unique index if a seat was booked behind our back", async () => {
    const user = newUser();
    const hold = await lock(user, ["D1"]);
    await Booking.create({
      userId: new mongoose.Types.ObjectId(),
      showId,
      seats: ["D1"],
      amount: 200,
      paymentRef: "mock_other",
    });

    await expect(
      confirmBooking(user, hold.holdId, "mock_mine"),
    ).rejects.toMatchObject({ status: 409 });
  });
});
