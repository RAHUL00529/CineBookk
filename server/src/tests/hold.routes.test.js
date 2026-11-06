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

let server;
let base;
let showId;
let holdIds;

async function api(method, path, user, body) {
  const res = await fetch(base + path, {
    method,
    headers: {
      "content-type": "application/json",
      // ...(user && { "x-dev-user-id": user }),
      ...(user && { cookie: `${AUTH_COOKIE_NAME}=${signSession(user)}` }),
    },
    body: body && JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() };
}

async function createHold(user, seatIds) {
  const res = await api("POST", "/holds", user, { showId, seatIds });
  if (res.status === 201) holdIds.push(res.body.holdId);
  return res;
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
    name: `Route Cinema ${new mongoose.Types.ObjectId()}`,
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

describe("auth and validation", () => {
  it("rejects requests without the dev header", async () => {
    const res = await api("POST", "/holds", null, { showId, seatIds: ["D1"] });
    expect(res.status).toBe(401);
  });

  it("rejects a user id that could fake the mine check", async () => {
    const res = await api("POST", "/holds", "a:b", { showId, seatIds: ["D1"] });
    expect(res.status).toBe(401);
  });

  it("rejects a malformed body with 400", async () => {
    const res = await api("POST", "/holds", "userA", { showId, seatIds: "D1" });
    expect(res.status).toBe(400);
  });

  it("rejects a malformed hold id with 400", async () => {
    const res = await api("GET", "/holds/not-a-uuid", "userA");
    expect(res.status).toBe(400);
  });
});

describe("hold lifecycle over HTTP", () => {
  it("creates a hold and the owner can read it back", async () => {
    const created = await createHold("userA", ["D1", "E1"]);
    expect(created.status).toBe(201);
    expect(created.body.amount).toBe(550);

    const read = await api("GET", `/holds/${created.body.holdId}`, "userA");
    expect(read.status).toBe(200);
    expect(read.body).toMatchObject({
      showId,
      seatIds: ["D1", "E1"],
      amount: 550,
      expiresAt: created.body.expiresAt,
    });
    expect(read.body.remainingMs).toBeGreaterThan(0);
  });

  it("returns 409 with the conflicting seats", async () => {
    await createHold("userA", ["D1", "D2"]);
    const res = await createHold("userB", ["D2", "D3"]);
    expect(res.status).toBe(409);
    expect(res.body.details.conflicts).toEqual(["D2"]);
  });

  it("forbids reading or cancelling someone else's hold", async () => {
    const { body } = await createHold("userA", ["D1"]);
    expect((await api("GET", `/holds/${body.holdId}`, "userB")).status).toBe(
      403,
    );
    expect((await api("DELETE", `/holds/${body.holdId}`, "userB")).status).toBe(
      403,
    );
  });

  it("returns 410 for a hold that never existed", async () => {
    const res = await api("GET", `/holds/${randomUUID()}`, "userA");
    expect(res.status).toBe(410);
  });

  it("returns 410 after the locks expire, even inside the grace period", async () => {
    const hold = await lockSeats("userA", showId, ["D1"], { ttlMs: 300 });
    holdIds.push(hold.holdId);
    await sleep(500);

    const res = await api("GET", `/holds/${hold.holdId}`, "userA");
    expect(res.status).toBe(410);
  });

  it("cancel frees the seats and the hold is gone", async () => {
    const { body } = await createHold("userA", ["D1"]);

    const cancel = await api("DELETE", `/holds/${body.holdId}`, "userA");
    expect(cancel.status).toBe(200);
    expect(cancel.body.released).toBe(1);

    expect((await api("GET", `/holds/${body.holdId}`, "userA")).status).toBe(
      410,
    );
    expect((await createHold("userB", ["D1"])).status).toBe(201);
  });
});

describe("GET /shows/:id/seats", () => {
  it("needs auth and reports locks with the mine flag", async () => {
    await createHold("userA", ["D1"]);
    const url = `/shows/${showId}/seats`;

    expect((await api("GET", url, null)).status).toBe(401);

    const asA = await api("GET", url, "userA");
    expect(asA.body.locked[0]).toMatchObject({ seatId: "D1", mine: true });
    const asB = await api("GET", url, "userB");
    expect(asB.body.locked[0].mine).toBe(false);
  });
});
