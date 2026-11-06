import { describe, it, expect } from "vitest";
import { isRealDate, istDayRange } from "../utils/dates.js";

describe("istDayRange", () => {
  it("starts at midnight IST, which is 18:30 UTC the day before", () => {
    const { start, end } = istDayRange("2026-10-23");
    expect(start.toISOString()).toBe("2026-10-22T18:30:00.000Z");
    expect(end.toISOString()).toBe("2026-10-23T18:30:00.000Z");
  });

  it("rolls over month ends", () => {
    const { start } = istDayRange("2026-11-01");
    expect(start.toISOString()).toBe("2026-10-31T18:30:00.000Z");
  });
});

describe("isRealDate", () => {
  it("accepts real dates, including a leap day", () => {
    expect(isRealDate("2026-10-23")).toBe(true);
    expect(isRealDate("2028-02-29")).toBe(true);
  });

  it("rejects impossible dates", () => {
    expect(isRealDate("2026-02-31")).toBe(false);
    expect(isRealDate("2027-02-29")).toBe(false);
    expect(isRealDate("2026-13-01")).toBe(false);
  });
});
