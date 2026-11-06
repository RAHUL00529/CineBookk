// The layout is FROZEN once bookings exist. Changing it can orphan booked seats.
function deepFreeze(obj) {
  Object.values(obj).forEach((v) => {
    if (v && typeof v === "object") deepFreeze(v);
  });
  return Object.freeze(obj);
}

export const DEFAULT_LAYOUT = deepFreeze({
  name: "Standard Screen",
  rows: ["A", "B", "C", "D", "E", "F"],
  seatsPerRow: 12,
  aisleAfter: [4, 8],
  missingSeats: [],
  tiers: [
    { name: "Premium", rows: ["E", "F"], price: 350 },
    { name: "Standard", rows: ["A", "B", "C", "D"], price: 200 },
  ],
});
