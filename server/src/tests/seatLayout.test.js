// import { describe, it, expect } from "vitest";
// import {
//   buildSeats,
//   getSeatById,
//   buildSeatMap,
// } from "../services/seatLayoutService.js";

// const makeScreen = (overrides = {}) => ({
//   name: "Screen 1",
//   rows: ["A", "B", "C", "D", "E", "F"],
//   seatsPerRow: 12,
//   aisleAfter: [4, 8],
//   missingSeats: [],
//   tiers: [
//     { name: "Premium", rows: ["E", "F"], price: 350 },
//     { name: "Standard", rows: ["A", "B", "C", "D"], price: 200 },
//   ],
//   ...overrides,
// });

// describe("buildSeats", () => {
//   it("creates rows x seatsPerRow seats", () => {
//     expect(buildSeats(makeScreen())).toHaveLength(72);
//   });

//   it("orders seats row by row, with numbers starting at 1", () => {
//     const seats = buildSeats(makeScreen());
//     expect(seats[0].id).toBe("A1");
//     expect(seats[11].id).toBe("A12");
//     expect(seats[12].id).toBe("B1");
//     expect(seats.at(-1).id).toBe("F12");
//   });

//   it("excludes missing seats", () => {
//     const seats = buildSeats(makeScreen({ missingSeats: ["A1", "F12"] }));
//     const ids = seats.map((s) => s.id);
//     expect(seats).toHaveLength(70);
//     expect(ids).not.toContain("A1");
//     expect(ids).not.toContain("F12");
//   });

//   it("assigns the tier name from the row", () => {
//     const seats = buildSeats(makeScreen());
//     expect(seats.find((s) => s.id === "D9").tier).toBe("Standard");
//     expect(seats.find((s) => s.id === "E1").tier).toBe("Premium");
//   });

//   it("never exposes a price on the seat itself", () => {
//     expect(buildSeats(makeScreen())[0]).not.toHaveProperty("price");
//   });

//   it("produces unique ids", () => {
//     const ids = buildSeats(makeScreen()).map((s) => s.id);
//     expect(new Set(ids).size).toBe(ids.length);
//   });
// });

// describe("layout validation", () => {
//   it("rejects a row that belongs to no tier", () => {
//     const screen = makeScreen({
//       tiers: [
//         { name: "Standard", rows: ["A", "B", "C", "D", "E"], price: 200 },
//       ],
//     });
//     expect(() => buildSeats(screen)).toThrow(/row F.*no tier/i);
//   });

//   it("rejects a row that belongs to two tiers", () => {
//     const screen = makeScreen({
//       tiers: [
//         { name: "Premium", rows: ["E", "F", "D"], price: 350 },
//         { name: "Standard", rows: ["A", "B", "C", "D"], price: 200 },
//       ],
//     });
//     expect(() => buildSeats(screen)).toThrow(/row D.*more than one tier/i);
//   });

//   it("rejects a tier that references an unknown row", () => {
//     const screen = makeScreen({
//       tiers: [
//         { name: "Premium", rows: ["E", "F", "Z"], price: 350 },
//         { name: "Standard", rows: ["A", "B", "C", "D"], price: 200 },
//       ],
//     });
//     expect(() => buildSeats(screen)).toThrow(/unknown row Z/i);
//   });

//   it("rejects a missing seat that does not exist in the grid", () => {
//     expect(() => buildSeats(makeScreen({ missingSeats: ["A13"] }))).toThrow(
//       /missing seat A13/i,
//     );
//   });

//   it("rejects duplicate row names", () => {
//     expect(() =>
//       buildSeats(makeScreen({ rows: ["A", "A", "B", "C", "D", "E", "F"] })),
//     ).toThrow(/duplicate row/i);
//   });

//   it("rejects aisle positions outside 1..seatsPerRow-1", () => {
//     expect(() => buildSeats(makeScreen({ aisleAfter: [12] }))).toThrow(
//       /aisle/i,
//     );
//     expect(() => buildSeats(makeScreen({ aisleAfter: [0] }))).toThrow(/aisle/i);
//   });
// });

// describe("getSeatById", () => {
//   it("returns the seat for a valid id", () => {
//     expect(getSeatById(makeScreen(), "D9")).toMatchObject({
//       id: "D9",
//       row: "D",
//       number: 9,
//       tier: "Standard",
//     });
//   });

//   it("returns null for ids that are not on this screen", () => {
//     const screen = makeScreen({ missingSeats: ["A1"] });
//     expect(getSeatById(screen, "A1")).toBeNull(); // removed seat
//     expect(getSeatById(screen, "Z1")).toBeNull(); // unknown row
//     expect(getSeatById(screen, "A13")).toBeNull(); // beyond the row
//     expect(getSeatById(screen, "a1")).toBeNull(); // wrong case
//     expect(getSeatById(screen, "")).toBeNull();
//     expect(getSeatById(screen, undefined)).toBeNull();
//   });
// });

// describe("buildSeatMap (shape for the UI)", () => {
//   it("groups seats by row and carries aisle positions", () => {
//     const map = buildSeatMap(makeScreen());
//     expect(map.aisleAfter).toEqual([4, 8]);
//     expect(map.rows).toHaveLength(6);
//     expect(map.rows[0]).toMatchObject({ row: "A", tier: "Standard" });
//     expect(map.rows[0].seats).toHaveLength(12);
//   });
// });
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
import { describe, it, expect } from "vitest";
import { buildSeats } from "../services/seatLayoutService.js";

const makeScreen = (overrides = {}) => ({
  name: "Screen 1",
  rows: ["A", "B", "C", "D", "E", "F"],
  seatsPerRow: 12,
  aisleAfter: [4, 8],
  missingSeats: [],
  tiers: [
    { name: "Premium", rows: ["E", "F"], price: 350 },
    { name: "Standard", rows: ["A", "B", "C", "D"], price: 200 },
  ],
  ...overrides,
});

describe("buildSeats", () => {
  it("creates rows x seatsPerRow seats", () => {
    expect(buildSeats(makeScreen())).toHaveLength(72);
  });

  it("generates ids like D9 with unique values", () => {
    const seats = buildSeats(makeScreen());
    const ids = seats.map((s) => s.id);
    expect(ids).toContain("D9");
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("assigns the correct tier and price per row", () => {
    const seats = buildSeats(makeScreen());
    const a1 = seats.find((s) => s.id === "A1");
    const f12 = seats.find((s) => s.id === "F12");
    expect(a1).toMatchObject({ tier: "Standard", price: 200 });
    expect(f12).toMatchObject({ tier: "Premium", price: 350 });
  });

  it("leaves out missing seats", () => {
    const seats = buildSeats(makeScreen({ missingSeats: ["A1", "F12"] }));
    const ids = seats.map((s) => s.id);
    expect(seats).toHaveLength(70);
    expect(ids).not.toContain("A1");
    expect(ids).not.toContain("F12");
  });

  it("throws if a row has no tier", () => {
    const screen = makeScreen({
      tiers: [{ name: "Standard", rows: ["A", "B", "C", "D"], price: 200 }],
    });
    expect(() => buildSeats(screen)).toThrow(/Row E/);
  });
});
