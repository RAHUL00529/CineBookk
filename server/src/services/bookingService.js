import { Booking } from "../models/Booking.js";
import { ApiError } from "../utils/ApiError.js";
import { getHold, releaseHold } from "./seatLockService.js";

/**
 * Turns a valid hold into a confirmed booking.
 * Returns { booking, created }. created is false when this payment already
 * produced the booking (a retry or a double click).
 */
export async function confirmBooking(userId, holdId, paymentRef) {
  const findMine = () => Booking.findOne({ userId, paymentRef }).lean();

  // 1. getHold checks: hold exists, is ours, not expired, we still own every
  //    Redis lock. It also recomputes the amount from the seat tiers.
  let hold;
  try {
    hold = await getHold(userId, holdId);
  } catch (err) {
    // The hold is gone. Maybe an earlier attempt already succeeded
    // (the user paid, the response was lost, and they retried).
    if (err.status === 410) {
      const done = await findMine();
      if (done) return { booking: done, created: false };
    }
    throw err;
  }

  // 2. Insert into Mongo FIRST. This is the real commit. The unique index
  //    guarantees that only one booking can ever own a seat.
  let booking;
  try {
    const doc = await Booking.create({
      userId,
      showId: hold.showId,
      seats: hold.seatIds,
      amount: hold.amount,
      paymentRef,
    });
    booking = doc.toObject();
  } catch (err) {
    if (err.code !== 11000) throw err;
    // Duplicate key: either a parallel request with the same paymentRef won,
    // or a different booking took one of these seats.
    const done = await findMine();
    if (done) return { booking: done, created: false };
    throw new ApiError(409, "Some seats were just booked by someone else");
  }

  // 3. Free the Redis locks. The booking is already saved, so a failure here
  //    must NOT fail the request. The locks simply expire on their own.
  try {
    await releaseHold(userId, holdId);
  } catch (err) {
    console.error("Cleanup failed (locks will expire):", err.message);
  }

  return { booking, created: true };
}
