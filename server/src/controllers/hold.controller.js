import {
  lockSeats,
  releaseHold,
  getHold,
} from "../services/seatLockService.js";
import {
  broadcastSeatsLocked,
  broadcastSeatsReleased,
} from "../sockets/broadcast.js";

// export async function createHold(req, res) {
//   const { showId, seatIds } = req.valid.body;
//   // Identity comes from req.user, never from the request body
//   const hold = await lockSeats(req.user.id, showId, seatIds);
//   res.status(201).json(hold); // { holdId, expiresAt, amount, seatIds }
// }

// export async function cancelHold(req, res) {
//   const { holdId } = req.valid.params;
//   const { released } = await releaseHold(req.user.id, holdId);
//   // Phase 4 will use the showId and seatIds from this result to broadcast seat-released
//   res.json({ released });
// }

export async function createHold(req, res) {
  const { showId, seatIds } = req.valid.body;
  const hold = await lockSeats(req.user.id, showId, seatIds);
  broadcastSeatsLocked(showId, hold.seatIds, hold.expiresAt);
  res.status(201).json(hold);
}

export async function cancelHold(req, res) {
  const { holdId } = req.valid.params;
  const { showId, seatIds, released } = await releaseHold(req.user.id, holdId);
  broadcastSeatsReleased(showId, seatIds);
  res.json({ released });
}
export async function readHold(req, res) {
  const hold = await getHold(req.user.id, req.valid.params.holdId);
  res.json(hold);
}
