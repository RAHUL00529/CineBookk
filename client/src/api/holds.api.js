import { http } from "./http.js";

// Returns { holdId, expiresAt, amount, seatIds }
export const createHold = (showId, seatIds) =>
  http.post("/holds", { showId, seatIds }).then((res) => res.data);

export const getHold = (holdId) =>
  http.get(`/holds/${holdId}`).then((res) => res.data);

export const cancelHold = (holdId) =>
  http.delete(`/holds/${holdId}`).then((res) => res.data);
