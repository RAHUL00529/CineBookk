import { getIO } from "./index.js";
import { showRoom } from "./seatEvents.js";

// getIO() is null in unit tests that never start a server, so every call is guarded
export function broadcastSeatsLocked(showId, seatIds, expiresAt) {
  getIO()?.to(showRoom(showId)).emit("seat-locked", { seatIds, expiresAt });
}

export function broadcastSeatsReleased(showId, seatIds) {
  if (seatIds.length === 0) return; // nothing was freed, nothing to say
  getIO()?.to(showRoom(showId)).emit("seat-released", { seatIds });
}
export function broadcastSeatsBooked(showId, seatIds) {
  getIO()?.to(showRoom(showId)).emit("seat-booked", { seatIds });
}
