import http from "node:http";
import { randomUUID } from "node:crypto";
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
import { app } from "../app.js";
import { redis } from "../config/redis.js";
import { Theater } from "../models/Theater.js";
import { Show } from "../models/Show.js";
import { lockSeats, holdKey } from "../services/seatLockService.js";
import { AUTH_COOKIE_NAME } from "../config/constants.js";
import { signSession } from "../services/tokenService.js";

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

let server;
let base;
let showId;
let holdIds;

const newUser = () => String(new mongoose.Types.ObjectId());
const newRef = () => `mock_${randomUUID()}`;

async function api(method, path, user, body) {
  const res = await fetch(base + path, {
    method,
    headers: {
      "content-type": "application/json",
      ...(user && { cookie: `${AUTH_COOKIE_NAME}=${signSession(user)}` }),
    },
    body: body && JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() };
}

async function lock(user, seatIds) {
  const hold = await lockSeats(user, showId, seatIds);
  holdIds.push(hold.holdId);
  return hold;
}

beforeAll(async () => {
  await connectTestDb();
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  base = `http://localhost:${server.address().port}/api`;
});

beforeEach(async () => {
  await clearTestDb();
  const theater = await Theater.create({
    name: `Booking Route Cinema ${new mongoose.Types.ObjectId()}`,
    city: "Delhi",
    screens: [SCREEN],
  });
  const show = await Show.create({
    movieId: new mongoose.Types.ObjectId(), // no Movie document: populate gives null
    theaterId: theater._id,
    screenName: SCREEN.name,
    startTime: new Date(Date.now() + 24 * 60 * 60_000),
    priceMultiplier: 1,
  });
  showId = String(show._id);
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
  await new Promise((resolve) => server.close(resolve));
  await clearTestDb();
  await disconnectTestDb();
  await redis.quit();
});

describe("POST /bookings", () => {
  it("needs login", async () => {
    const res = await api("POST", "/bookings", null, {
      holdId: randomUUID(),
      paymentRef: newRef(),
    });
    expect(res.status).toBe(401);
  });

  it("rejects a bad body and an unknown field with 400", async () => {
    const user = newUser();
    const bad = await api("POST", "/bookings", user, {
      holdId: "nope",
      paymentRef: "x",
    });
    expect(bad.status).toBe(400);
    const extra = await api("POST", "/bookings", user, {
      holdId: randomUUID(),
      paymentRef: newRef(),
      amount: 1,
    });
    expect(extra.status).toBe(400);
  });

  it("creates a booking (201) and a retry returns the same one (200)", async () => {
    const user = newUser();
    const hold = await lock(user, ["D1", "E1"]);
    const paymentRef = newRef();

    const first = await api("POST", "/bookings", user, {
      holdId: hold.holdId,
      paymentRef,
    });
    expect(first.status).toBe(201);
    expect(first.body.booking).toMatchObject({
      seats: ["D1", "E1"],
      amount: 550,
      status: "confirmed",
    });

    const retry = await api("POST", "/bookings", user, {
      holdId: hold.holdId,
      paymentRef,
    });
    expect(retry.status).toBe(200);
    expect(retry.body.booking._id).toBe(first.body.booking._id);
  });

  it("returns 410 for a hold that never existed", async () => {
    const res = await api("POST", "/bookings", newUser(), {
      holdId: randomUUID(),
      paymentRef: newRef(),
    });
    expect(res.status).toBe(410);
  });

  it("returns 403 when confirming someone else's hold", async () => {
    const hold = await lock(newUser(), ["D1"]);
    const res = await api("POST", "/bookings", newUser(), {
      holdId: hold.holdId,
      paymentRef: newRef(),
    });
    expect(res.status).toBe(403);
  });
});

describe("booking history", () => {
  it("lists only my bookings, newest first", async () => {
    const me = newUser();
    const other = newUser();
    const h1 = await lock(me, ["D1"]);
    await api("POST", "/bookings", me, {
      holdId: h1.holdId,
      paymentRef: newRef(),
    });
    const h2 = await lock(me, ["D2"]);
    await api("POST", "/bookings", me, {
      holdId: h2.holdId,
      paymentRef: newRef(),
    });
    const h3 = await lock(other, ["D3"]);
    await api("POST", "/bookings", other, {
      holdId: h3.holdId,
      paymentRef: newRef(),
    });

    const res = await api("GET", "/bookings/me", me);
    expect(res.status).toBe(200);
    expect(res.body.bookings.map((b) => b.seats[0])).toEqual(["D2", "D1"]);
  });

  it("GET /bookings/:id works for the owner and is 404 for anyone else", async () => {
    const owner = newUser();
    const hold = await lock(owner, ["D1"]);
    const created = await api("POST", "/bookings", owner, {
      holdId: hold.holdId,
      paymentRef: newRef(),
    });
    const id = created.body.booking._id;

    expect((await api("GET", `/bookings/${id}`, owner)).status).toBe(200);
    expect((await api("GET", `/bookings/${id}`, newUser())).status).toBe(404);
    expect((await api("GET", `/bookings/${id}`, null)).status).toBe(401);
  });
});
