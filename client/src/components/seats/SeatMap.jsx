import { useMemo } from "react";
import SeatRow from "./SeatRow.jsx";

// Purely presentational: draws what it is given and owns no state
export default function SeatMap({
  screen,
  seats,
  priceMultiplier,
  statuses,
  selected,
  onToggle,
}) {
  // Group rows into tier sections, back row first (the design puts the screen at the bottom)
  const sections = useMemo(() => {
    const byRow = new Map();
    for (const seat of seats) {
      if (!byRow.has(seat.row)) {
        byRow.set(seat.row, {
          tier: seat.tier,
          price: seat.price,
          seatByNumber: new Map(),
        });
      }
      byRow.get(seat.row).seatByNumber.set(seat.number, seat);
    }

    const result = [];
    for (const row of [...screen.rows].reverse()) {
      const info = byRow.get(row);
      if (!info) continue;

      const entry = { row, seatByNumber: info.seatByNumber };
      const last = result.at(-1);
      if (last && last.tier === info.tier) {
        last.rows.push(entry);
      } else {
        result.push({ tier: info.tier, price: info.price, rows: [entry] });
      }
    }
    return result;
  }, [screen.rows, seats]);

  return (
    <div className="overflow-x-auto">
      <div className="mx-auto w-max space-y-8 px-2 py-6">
        {sections.map((section) => (
          <section key={section.tier} aria-label={`${section.tier} seats`}>
            <h2 className="mb-3 text-center text-sm font-bold uppercase text-ink">
              {section.tier} : ₹{Math.round(section.price * priceMultiplier)}
            </h2>
            <div className="space-y-2">
              {section.rows.map(({ row, seatByNumber }) => (
                <SeatRow
                  key={row}
                  row={row}
                  seatsPerRow={screen.seatsPerRow}
                  seatByNumber={seatByNumber}
                  aisleAfter={screen.aisleAfter}
                  selected={selected}
                  statuses={statuses}
                  onToggle={onToggle}
                />
              ))}
            </div>
          </section>
        ))}

        <div className="pt-4">
          <div
            aria-hidden="true"
            className="mx-auto h-4 w-3/4 rounded-b-[50%] bg-brand/25 shadow-md"
          />
          <p className="mt-2 text-center text-xs font-semibold tracking-wide text-brand">
            SCREEN THIS WAY
          </p>
        </div>
      </div>
    </div>
  );
}
