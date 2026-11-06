// import { buildSeats } from "./seatLayoutService.js";
// import { ApiError } from "../utils/ApiError.js";

// export function calculateAmount(layout, show, seatIds) {
//   if (!Array.isArray(seatIds) || seatIds.length === 0) {
//     throw new ApiError(400, "Select at least one seat");
//   }
//   if (new Set(seatIds).size !== seatIds.length) {
//     throw new ApiError(400, "Duplicate seat ids in request");
//   }

//   const multiplier = show?.priceMultiplier ?? 1;
//   if (!Number.isFinite(multiplier) || multiplier <= 0) {
//     throw new ApiError(500, "Show has an invalid price multiplier");
//   }

//   // Build once, look up many times.
//   const seatById = new Map(buildSeats(layout).map((s) => [s.id, s]));
//   const priceByTier = new Map(layout.tiers.map((t) => [t.name, t.price]));

//   let total = 0;
//   for (const id of seatIds) {
//     const seat = seatById.get(id);
//     if (!seat) throw new ApiError(400, `Unknown seat ${id}`);
//     total += Math.round(priceByTier.get(seat.tier) * multiplier);
//   }
//   return total;
// }

///////////////////////////////////////////////////////////////////////////////////////////////
import { buildSeats } from "./seatLayoutService.js";

/**
 * Total price in whole rupees for the given seats on a screen.
 * Throws if the seat list is empty, has duplicates, or has unknown seats.
 */
export function calculateAmount(screen, seatIds, priceMultiplier = 1) {
  if (!Array.isArray(seatIds) || seatIds.length === 0) {
    throw new Error("Select at least one seat");
  }
  if (new Set(seatIds).size !== seatIds.length) {
    throw new Error("Duplicate seat ids");
  }

  const seatById = new Map(buildSeats(screen).map((s) => [s.id, s]));

  const invalid = seatIds.filter((id) => !seatById.has(id));
  if (invalid.length > 0) {
    throw new Error(`Invalid seat ids: ${invalid.join(", ")}`);
  }

  const base = seatIds.reduce((sum, id) => sum + seatById.get(id).price, 0);
  return Math.round(base * priceMultiplier);
}
