import Seat from "./Seat.jsx";

export default function SeatRow({
  row,
  seatsPerRow,
  seatByNumber,
  aisleAfter,
  selected,
  statuses,
  onToggle,
}) {
  const cells = [];

  for (let n = 1; n <= seatsPerRow; n++) {
    const seat = seatByNumber.get(n);

    if (seat) {
      const status = selected.has(seat.id)
        ? "selected"
        : (statuses.get(seat.id) ?? "available");
      cells.push(
        <Seat key={n} seat={seat} status={status} onToggle={onToggle} />,
      );
    } else {
      // A missing seat (e.g. a wheelchair space): keep the slot so seats stay aligned
      cells.push(<div key={n} className="h-8 w-8" aria-hidden="true" />);
    }

    if (aisleAfter.includes(n)) {
      cells.push(<div key={`aisle-${n}`} className="w-4" aria-hidden="true" />);
    }
  }

  return (
    <div
      role="group"
      aria-label={`Row ${row}`}
      className="flex items-center justify-center gap-1.5"
    >
      <span className="w-5 text-xs text-gray-400" aria-hidden="true">
        {row}
      </span>
      {cells}
    </div>
  );
}
