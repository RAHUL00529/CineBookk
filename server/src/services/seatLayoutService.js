// /**
//  * Seats are derived from a screen's layout config and never stored.
//  * A seat id (e.g. "D9") is only meaningful relative to a screen.
//  */

// function validateScreen(screen) {
//   const {
//     rows,
//     seatsPerRow,
//     aisleAfter = [],
//     missingSeats = [],
//     tiers,
//   } = screen;

//   if (!Array.isArray(rows) || rows.length === 0) {
//     throw new Error("Screen layout: rows must be a non-empty array");
//   }
//   if (!Number.isInteger(seatsPerRow) || seatsPerRow < 1) {
//     throw new Error("Screen layout: seatsPerRow must be a positive integer");
//   }

//   const rowSet = new Set(rows);
//   if (rowSet.size !== rows.length) {
//     throw new Error("Screen layout: duplicate row names");
//   }

//   for (const pos of aisleAfter) {
//     if (!Number.isInteger(pos) || pos < 1 || pos > seatsPerRow - 1) {
//       throw new Error(`Screen layout: aisle position ${pos} is out of range`);
//     }
//   }

//   // Every row must belong to exactly one tier.
//   const seenRows = new Set();
//   for (const tier of tiers ?? []) {
//     for (const row of tier.rows) {
//       if (!rowSet.has(row)) {
//         throw new Error(
//           `Screen layout: tier "${tier.name}" has unknown row ${row}`,
//         );
//       }
//       if (seenRows.has(row)) {
//         throw new Error(`Screen layout: row ${row} is in more than one tier`);
//       }
//       seenRows.add(row);
//     }
//   }
//   for (const row of rows) {
//     if (!seenRows.has(row)) {
//       throw new Error(`Screen layout: row ${row} has no tier`);
//     }
//   }

//   // Missing seats must refer to real grid positions.
//   for (const id of missingSeats) {
//     const match = /^([A-Z]+)(\d+)$/.exec(id);
//     const ok =
//       match &&
//       rowSet.has(match[1]) &&
//       Number(match[2]) >= 1 &&
//       Number(match[2]) <= seatsPerRow;
//     if (!ok)
//       throw new Error(`Screen layout: missing seat ${id} is not in the grid`);
//   }
// }

// export function buildSeats(screen) {
//   validateScreen(screen);

//   const missing = new Set(screen.missingSeats ?? []);
//   const tierNameByRow = new Map();
//   for (const tier of screen.tiers) {
//     for (const row of tier.rows) tierNameByRow.set(row, tier.name);
//   }

//   const seats = [];
//   for (const row of screen.rows) {
//     for (let number = 1; number <= screen.seatsPerRow; number++) {
//       const id = `${row}${number}`;
//       if (missing.has(id)) continue;
//       seats.push({ id, row, number, tier: tierNameByRow.get(row) });
//     }
//   }
//   return seats;
// }

// export function getSeatById(screen, seatId) {
//   if (typeof seatId !== "string") return null;
//   return buildSeats(screen).find((s) => s.id === seatId) ?? null;
// }

// export function buildSeatMap(screen) {
//   const seats = buildSeats(screen);
//   const bySeatRow = Map.groupBy(seats, (s) => s.row);
//   return {
//     aisleAfter: screen.aisleAfter ?? [],
//     rows: screen.rows.map((row) => {
//       const rowSeats = bySeatRow.get(row) ?? [];
//       return { row, tier: rowSeats[0]?.tier, seats: rowSeats };
//     }),
//   };
// }

////////////////////////////////////////////////////////////////////////////////////////
/**
 * Expands a screen layout config into the list of real seats.
 * Seat ids are row letter + number, e.g. "D9". Numbers start at 1.
 */
export function buildSeats(screen) {
  const { rows, seatsPerRow, missingSeats = [], tiers } = screen;

  // row letter -> tier object, for quick lookup
  const tierByRow = new Map();
  for (const tier of tiers) {
    for (const row of tier.rows) {
      tierByRow.set(row, tier); 
    }
  }

  const missing = new Set(missingSeats);
  const seats = [];

  for (const row of rows) {
    const tier = tierByRow.get(row);
    if (!tier) {
      // Fail loudly: a row with no price would break pricing later
      throw new Error(`Row ${row} does not belong to any tier`);
    }

    for (let number = 1; number <= seatsPerRow; number++) {
      const id = `${row}${number}`;
      if (missing.has(id)) continue; // e.g. a wheelchair space

      seats.push({ id, row, number, tier: tier.name, price: tier.price });
    }
  }

  return seats;
}
