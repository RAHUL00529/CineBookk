const IST_OFFSET_MS = 330 * 60_000; // UTC+5:30, no daylight saving
const DAY_MS = 24 * 60 * 60_000;

function parts(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return { y, m, d };
}

// "2026-02-31" has the right shape but is not a real date
export function isRealDate(dateStr) {
  const { y, m, d } = parts(dateStr);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

// The UTC instants where this calendar day in India starts and ends
export function istDayRange(dateStr) {
  const { y, m, d } = parts(dateStr);
  const start = new Date(Date.UTC(y, m - 1, d) - IST_OFFSET_MS);
  return { start, end: new Date(start.getTime() + DAY_MS) };
}
