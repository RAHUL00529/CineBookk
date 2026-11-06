// import { describe, it, expect } from "vitest";
// import { calculateAmount } from "../services/pricingService.js";
// import { DEFAULT_LAYOUT } from "../config/screenLayout.js";

// const show = (priceMultiplier) => ({ priceMultiplier });

// describe("calculateAmount", () => {
//   it("prices a standard seat", () => {
//     expect(calculateAmount(DEFAULT_LAYOUT, show(), ["D9"])).toBe(200);
//   });

//   it("prices a premium seat", () => {
//     expect(calculateAmount(DEFAULT_LAYOUT, show(), ["E1"])).toBe(350);
//   });

//   it("sums mixed tiers", () => {
//     expect(calculateAmount(DEFAULT_LAYOUT, show(), ["D9", "E1", "F2"])).toBe(
//       900,
//     );
//   });

//   it("applies the show multiplier", () => {
//     expect(calculateAmount(DEFAULT_LAYOUT, show(1.5), ["D9", "E1"])).toBe(825);
//   });

//   it("returns whole rupees (rounds per seat)", () => {
//     const total = calculateAmount(DEFAULT_LAYOUT, show(1.333), ["D9", "D10"]);
//     expect(Number.isInteger(total)).toBe(true);
//     expect(total).toBe(2 * Math.round(200 * 1.333));
//   });

//   it("treats a missing multiplier as 1", () => {
//     expect(calculateAmount(DEFAULT_LAYOUT, {}, ["D9"])).toBe(200);
//   });

//   it("rejects duplicate seat ids", () => {
//     expect(() => calculateAmount(DEFAULT_LAYOUT, show(), ["A1", "A1"])).toThrow(
//       /duplicate/i,
//     );
//   });

//   it("rejects unknown seat ids", () => {
//     expect(() => calculateAmount(DEFAULT_LAYOUT, show(), ["Z99"])).toThrow(
//       /Z99/,
//     );
//   });

//   it("rejects an empty selection", () => {
//     expect(() => calculateAmount(DEFAULT_LAYOUT, show(), [])).toThrow();
//   });

//   it("rejects an invalid multiplier", () => {
//     expect(() => calculateAmount(DEFAULT_LAYOUT, show(0), ["D9"])).toThrow();
//     expect(() => calculateAmount(DEFAULT_LAYOUT, show(-1), ["D9"])).toThrow();
//   });

//   it("throws ApiError with status 400 for bad input", () => {
//     try {
//       calculateAmount(DEFAULT_LAYOUT, show(), ["Z99"]);
//     } catch (e) {
//       expect(e.status).toBe(400);
//       return;
//     }
//     throw new Error("expected a throw");
//   });
// });

////////////////////////////////////////////////////////////////////////////////
import { describe, it, expect } from "vitest";
import { calculateAmount } from "../services/pricingService.js";

const screen = {
  name: "Screen 1",
  rows: ["A", "B", "C", "D", "E", "F"],
  seatsPerRow: 12,
  aisleAfter: [4, 8],
  missingSeats: ["A1"],
  tiers: [
    { name: "Premium", rows: ["E", "F"], price: 350 },
    { name: "Standard", rows: ["A", "B", "C", "D"], price: 200 },
  ],
};

describe("calculateAmount", () => {
  it("prices a single standard seat", () => {
    expect(calculateAmount(screen, ["B2"])).toBe(200);
  });

  it("adds up seats from different tiers", () => {
    expect(calculateAmount(screen, ["B2", "E1"])).toBe(550);
  });

  it("applies the show price multiplier", () => {
    expect(calculateAmount(screen, ["B2", "E1"], 1.5)).toBe(825);
  });

  it("rounds to a whole number (no floating point noise)", () => {
    // 200 * 1.1 is 220.00000000000003 in JavaScript
    expect(calculateAmount(screen, ["B2"], 1.1)).toBe(220);
  });

  it("rejects an empty selection", () => {
    expect(() => calculateAmount(screen, [])).toThrow(/at least one/);
  });

  it("rejects duplicate seat ids", () => {
    expect(() => calculateAmount(screen, ["B2", "B2"])).toThrow(/Duplicate/);
  });

  it("rejects seats that do not exist", () => {
    expect(() => calculateAmount(screen, ["Z99"])).toThrow(/Z99/);
  });

  it("rejects missing seats and wrong-case ids", () => {
    expect(() => calculateAmount(screen, ["A1"])).toThrow(/A1/);
    expect(() => calculateAmount(screen, ["b2"])).toThrow(/b2/);
  });
});
