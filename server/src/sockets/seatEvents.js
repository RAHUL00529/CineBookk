import { z } from "zod";
import { objectId } from "../utils/schemas.js";
import { getSnapshot } from "../services/seatLockService.js";
import { ApiError } from "../utils/ApiError.js";

export const showRoom = (showId) => `show:${showId}`;

const joinPayload = z.strictObject({ showId: objectId });

// Always answers through ack, so the client knows what happened
const reply = (ack, payload) => typeof ack === "function" && ack(payload);

export function registerSeatEvents(socket) {
  socket.on("join-show", async (payload, ack) => {
    const parsed = joinPayload.safeParse(payload);
    if (!parsed.success) {
      return reply(ack, { ok: false, error: "Invalid show id" });
    }
    const { showId } = parsed.data;

    try {
      // Build the snapshot first: if the show doesn't exist, we never join
      const snapshot = await getSnapshot(socket.data.userId, showId);

      // Leave other show rooms (never leave the socket's own private room)
      for (const room of socket.rooms) {
        if (room.startsWith("show:")) socket.leave(room);
      }
      await socket.join(showRoom(showId));

      //   socket.emit("seat-snapshot", snapshot);
      socket.emit("seat-snapshot", { ...snapshot, serverNow: Date.now() });
      reply(ack, { ok: true });
    } catch (err) {
      if (err instanceof ApiError) {
        return reply(ack, { ok: false, error: err.message });
      }
      console.error("join-show failed:", err);
      reply(ack, { ok: false, error: "Could not join this show" });
    }
  });

  socket.on("leave-show", (payload, ack) => {
    const parsed = joinPayload.safeParse(payload);
    if (parsed.success) socket.leave(showRoom(parsed.data.showId));
    reply(ack, { ok: parsed.success });
  });
}
