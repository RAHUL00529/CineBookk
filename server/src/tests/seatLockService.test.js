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
import {
  lockSeats,
  releaseHold,
  getSnapshot,
  seatKey,
  holdKey,
} from "../services/seatLockService.js";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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

async function createShow({ startsInMs = 24 * 60 * 60_000 } = {}) {
  const theater = await Theater.create({
    name: `Test Cinema ${new mongoose.Types.ObjectId()}`,
    city: "Delhi",
    screens: [SCREEN],
  });
  const show = await Show.create({
    movieId: new mongoose.Types.ObjectId(),
    theaterId: theater._id,
    screenName: SCREEN.name,
    startTime: new Date(Date.now() + startsInMs),
    priceMultiplier: 1,
  });
  return String(show._id);
}

// Test-only helper: SCAN is fine here, we never use it in request handlers
async function deleteLocksForShow(id) {
  for await (const keys of redis.scanStream({
    match: `lock:show:${id}:seat:*`,
    count: 100,
  })) {
    if (keys.length > 0) await redis.del(...keys);
  }
}

// Remember each hold so afterEach can delete its record
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
  await deleteLocksForShow(showId);
  if (holdIds.length > 0) await redis.del(...holdIds.map(holdKey));
});

afterAll(async () => {
  await clearTestDb();
  await disconnectTestDb();
  await redis.quit();
});

describe("lockSeats", () => {
  it("locks seats and computes the amount on the server", async () => {
    const hold = await lock("userA", ["D1", "E1"]); // 200 + 350
    expect(hold.amount).toBe(550);
    expect(hold.expiresAt).toBeGreaterThan(Date.now());

    expect(
      await redis.exists(seatKey(showId, "D1"), seatKey(showId, "E1")),
    ).toBe(2);
    const record = JSON.parse(await redis.get(holdKey(hold.holdId)));
    expect(record).toMatchObject({
      userId: "userA",
      showId,
      seatIds: ["D1", "E1"],
    });
  });

  it("is all-or-nothing: one taken seat means nothing is locked", async () => {
    await lock("userA", ["D1", "D2"]);

    await expect(lock("userB", ["D2", "D3"])).rejects.toMatchObject({
      status: 409,
      details: { conflicts: ["D2"] },
    });
    expect(await redis.exists(seatKey(showId, "D3"))).toBe(0);
  });

  it("makes a seat lockable again after the lock expires", async () => {
    await lock("userA", ["D1"], { ttlMs: 300 });
    await sleep(500);
    await expect(lock("userB", ["D1"])).resolves.toBeDefined();
  });

  it("rejects seats that are already booked in Mongo", async () => {
    await Booking.create({
      userId: new mongoose.Types.ObjectId(),
      showId,
      seats: ["D1"],
      amount: 200,
      paymentRef: "mock_booked",
    });

    await expect(lock("userA", ["D1", "D2"])).rejects.toMatchObject({
      status: 409,
      details: { conflicts: ["D1"] },
    });
    expect(await redis.exists(seatKey(showId, "D2"))).toBe(0);
  });

  it("rejects bad input with a 400", async () => {
    await expect(lock("userA", [])).rejects.toMatchObject({ status: 400 });
    await expect(lock("userA", ["D1", "D1"])).rejects.toMatchObject({
      status: 400,
    });
    await expect(lock("userA", ["Z99"])).rejects.toMatchObject({ status: 400 });
    await expect(
      lock("userA", ["A1", "A2", "A3", "A4", "A5", "A6", "A7"]),
    ).rejects.toMatchObject({ status: 400 });
  });

  it("rejects a show that has already started", async () => {
    showId = await createShow({ startsInMs: -60_000 });
    await expect(lock("userA", ["D1"])).rejects.toMatchObject({
      status: 400,
      message: "This show has already started",
    });
  });
});

describe("releaseHold", () => {
  it("lets the owner release, and the seats become lockable", async () => {
    const hold = await lock("userA", ["D1", "D2"]);
    const result = await releaseHold("userA", hold.holdId);

    expect(result.released).toBe(2);
    expect(await redis.exists(holdKey(hold.holdId))).toBe(0);
    await expect(lock("userB", ["D1", "D2"])).resolves.toBeDefined();
  });

  it("refuses a wrong owner and leaves the locks alone", async () => {
    const hold = await lock("userA", ["D1"]);

    await expect(releaseHold("userB", hold.holdId)).rejects.toMatchObject({
      status: 403,
    });
    expect(await redis.exists(seatKey(showId, "D1"))).toBe(1);
  });

  it("returns 410 for a hold that does not exist", async () => {
    await expect(releaseHold("userA", "no-such-hold")).rejects.toMatchObject({
      status: 410,
    });
  });

  it("does not delete the next user's lock after our own expired", async () => {
    const aHold = await lock("userA", ["D1"], { ttlMs: 300 });
    await sleep(500);
    await lock("userB", ["D1"]);

    // const result = await releaseHold("userA", aHold.holdId);
    // expect(result.released).toBe(0);
    const result = await releaseHold("userA", aHold.holdId);
    expect(result.released).toBe(0);
    expect(result.seatIds).toEqual([]); // B's seat must not be reported as freed
    expect(await redis.exists(seatKey(showId, "D1"))).toBe(1);
  });
});

describe("getSnapshot", () => {
  it("reports booked seats and locked seats with a mine flag", async () => {
    await Booking.create({
      userId: new mongoose.Types.ObjectId(),
      showId,
      seats: ["A1"],
      amount: 200,
      paymentRef: "mock_snapshot",
    });
    await lock("userA", ["D1"]);

    const asA = await getSnapshot("userA", showId);
    expect(asA.booked).toEqual(["A1"]);
    expect(asA.locked).toHaveLength(1);
    expect(asA.locked[0]).toMatchObject({ seatId: "D1", mine: true });
    expect(asA.locked[0].expiresAt).toBeGreaterThan(Date.now());

    const asB = await getSnapshot("userB", showId);
    expect(asB.locked[0].mine).toBe(false);
  });

  it("is empty for a show nobody has touched", async () => {
    expect(await getSnapshot("userA", showId)).toEqual({
      booked: [],
      locked: [],
    });
  });
});
