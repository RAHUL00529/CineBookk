const IST_OFFSET_MS = 330 * 60_000; // UTC+5:30, no daylight saving
const DAY_MS = 24 * 60 * 60_000;

// The next `count` calendar days in India, starting with today in India.
// value is "YYYY-MM-DD", which is exactly what the API expects.
export function getNextDays(count = 7) {
  const istNow = new Date(Date.now() + IST_OFFSET_MS);
  const base = Date.UTC(
    istNow.getUTCFullYear(),
    istNow.getUTCMonth(),
    istNow.getUTCDate(),
  );

  return Array.from({ length: count }, (_, i) => {
    const d = new Date(base + i * DAY_MS);
    return {
      value: d.toISOString().slice(0, 10),
      day: d.getUTCDate(),
      weekday: d.toLocaleDateString("en-US", {
        weekday: "short",
        timeZone: "UTC",
      }),
      month: d
        .toLocaleDateString("en-US", { month: "short", timeZone: "UTC" })
        .toUpperCase(),
    };
  });
}

// "2026-10-23T13:45:00.000Z" -> "07:15 PM"
export function formatShowTime(iso) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });
}

export function formatReleaseDate(iso) {
  return new Date(iso).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC", // release dates are stored as midnight UTC
  });
}

// "2026-10-23T13:45:00.000Z" -> "Oct 23, 2026, 07:15 PM" (always in India time)
export function formatShowDateTime(iso) {
  return new Date(iso).toLocaleString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });
}
