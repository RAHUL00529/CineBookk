import { randomUUID } from "node:crypto";
import { redis } from "../config/redis.js";
import { MAX_SEATS, HOLD_TTL_MS, HOLD_GRACE_MS } from "../config/constants.js";
import { Show } from "../models/Show.js";
import { Theater } from "../models/Theater.js";
import { Booking } from "../models/Booking.js";
import { ApiError } from "../utils/ApiError.js";
import { buildSeats } from "./seatLayoutService.js";
import { calculateAmount } from "./pricingService.js";

export const seatKey = (showId, seatId) => `lock:show:${showId}:seat:${seatId}`;
export const holdKey = (holdId) => `hold:${holdId}`;

const seatIdFromKey = (key) => key.split(":seat:")[1];

function validateSeatIds(seatIds) {
  if (!Array.isArray(seatIds) || seatIds.length === 0) {
    throw new ApiError(400, "Select at least one seat");
  }
  if (seatIds.length > MAX_SEATS) {
    throw new ApiError(400, `You can select at most ${MAX_SEATS} seats`);
  }
  if (new Set(seatIds).size !== seatIds.length) {
    throw new ApiError(400, "Duplicate seats in request");
  }
}

// Finds the show and its screen. No time check, so it works for viewing any show.
async function findShowAndScreen(showId) {
  const show = await Show.findById(showId).lean();
  if (!show) throw new ApiError(404, "Show not found");

  const theater = await Theater.findById(show.theaterId).lean();
  const screen = theater?.screens.find((s) => s.name === show.screenName);
  if (!screen) {
    // Bad data, not a bad request: becomes a logged 500
    throw new Error(
      `Show ${show._id} references missing screen "${show.screenName}"`,
    );
  }
  return { show, screen };
}

// Same as above, but refuses shows that have already started (used when locking).
export async function loadShowAndScreen(showId) {
  const found = await findShowAndScreen(showId);
  if (found.show.startTime <= new Date()) {
    throw new ApiError(400, "This show has already started");
  }
  return found;
}

// ttlMs is overridable so tests can use a 1 second lock instead of waiting 5 minutes
export async function lockSeats(
  userId,
  showId,
  seatIds,
  { ttlMs = HOLD_TTL_MS } = {},
) {
  validateSeatIds(seatIds);
  const { show, screen } = await loadShowAndScreen(showId);

  // Only ids that exist on this screen may become Redis keys
  const validIds = new Set(buildSeats(screen).map((s) => s.id));
  const unknown = seatIds.filter((id) => !validIds.has(id));
  if (unknown.length > 0) {
    throw new ApiError(400, `Unknown seats: ${unknown.join(", ")}`);
  }

  // Cheap early exit. The Mongo unique index is still the final guard.
  const booked = await Booking.find({
    showId,
    status: "confirmed",
    seats: { $in: seatIds },
  })
    .select("seats")
    .lean();
  if (booked.length > 0) {
    const bookedSet = new Set(booked.flatMap((b) => b.seats));
    throw new ApiError(409, "Some seats are already booked", {
      conflicts: seatIds.filter((id) => bookedSet.has(id)),
    });
  }

  const amount = calculateAmount(screen, seatIds, show.priceMultiplier);

  const holdId = randomUUID();
  const holdValue = `${holdId}:${userId}`;
  const keys = seatIds.map((id) => seatKey(showId, id));

  // Taken BEFORE the lock, so the client never believes it has more time than Redis gives
  const expiresAt = Date.now() + ttlMs;

  const taken = await redis.lockSeats(keys.length, ...keys, holdValue, ttlMs);
  if (taken.length > 0) {
    throw new ApiError(409, "Some seats were just taken", {
      conflicts: taken.map(seatIdFromKey),
    });
  }

  await redis.set(
    holdKey(holdId),
    JSON.stringify({
      userId: String(userId),
      showId: String(showId),
      seatIds,
      expiresAt,
    }),
    "PX",
    ttlMs + HOLD_GRACE_MS,
  );

  return { holdId, expiresAt, amount, seatIds };
}
export async function releaseHold(userId, holdId) {
  const raw = await redis.get(holdKey(holdId));
  if (!raw) throw new ApiError(410, "Hold no longer exists");

  const hold = JSON.parse(raw);
  if (hold.userId !== String(userId)) {
    throw new ApiError(403, "This hold is not yours");
  }

  const keys = hold.seatIds.map((id) => seatKey(hold.showId, id));
  // Deletes only the seats we still own. An expired seat that someone else
  // locked in the meantime is left alone.
  // const released = await redis.releaseIfOwner(
  //   keys.length,
  //   ...keys,
  //   `${holdId}:${userId}`,
  // );
  // await redis.del(holdKey(holdId));

  // return { showId: hold.showId, seatIds: hold.seatIds, released };
  const releasedKeys = await redis.releaseIfOwner(
    keys.length,
    ...keys,
    `${holdId}:${userId}`,
  );
  await redis.del(holdKey(holdId));

  return {
    showId: hold.showId,
    seatIds: releasedKeys.map(seatIdFromKey), // only seats we really freed
    released: releasedKeys.length,
  };
}

export async function getSnapshot(userId, showId) {
  const { screen } = await findShowAndScreen(showId);

  const bookings = await Booking.find({ showId, status: "confirmed" })
    .select("seats")
    .lean();
  const booked = bookings.flatMap((b) => b.seats);
  const bookedSet = new Set(booked);

  // Only ask Redis about seats that are not already booked
  const freeIds = buildSeats(screen)
    .map((s) => s.id)
    .filter((id) => !bookedSet.has(id));

  // One round trip: GET (who holds it) and PTTL (ms left) for every free seat
  const pipeline = redis.pipeline();
  for (const id of freeIds) {
    const key = seatKey(showId, id);
    pipeline.get(key);
    pipeline.pttl(key);
  }
  const results = await pipeline.exec(); // [[err, value], ...], two per seat

  const now = Date.now();
  const mineSuffix = `:${userId}`;
  const locked = [];
  freeIds.forEach((seatId, i) => {
    const value = results[i * 2][1];
    const ttl = results[i * 2 + 1][1];
    if (value === null || ttl <= 0) return; // not locked
    locked.push({
      seatId,
      expiresAt: now + ttl,
      mine: value.endsWith(mineSuffix),
    });
  });

  return { booked, locked };
}
export async function getHold(userId, holdId) {
  const raw = await redis.get(holdKey(holdId));
  if (!raw) throw new ApiError(410, "Hold no longer exists");

  const hold = JSON.parse(raw);
  if (hold.userId !== String(userId)) {
    throw new ApiError(403, "This hold is not yours");
  }

  // The record outlives the locks by a grace period, so confirm the locks are still ours
  const keys = hold.seatIds.map((id) => seatKey(hold.showId, id));
  const stillOurs = await redis.verifyOwnership(
    keys.length,
    ...keys,
    `${holdId}:${userId}`,
  );
  if (stillOurs !== 1 || hold.expiresAt <= Date.now()) {
    throw new ApiError(410, "Hold has expired");
  }

  const { show, screen } = await findShowAndScreen(hold.showId);
  const amount = calculateAmount(screen, hold.seatIds, show.priceMultiplier);

  return {
    holdId,
    showId: hold.showId,
    seatIds: hold.seatIds,
    amount,
    expiresAt: hold.expiresAt,
    remainingMs: hold.expiresAt - Date.now(),
  };
}
