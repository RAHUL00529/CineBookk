import { memo } from "react";
import { SEAT_CLASS, SEAT_LABEL } from "./seatStyles.js";

function Seat({ seat, status, onToggle }) {
  const selectable = status === "available" || status === "selected";

  return (
    <button
      type="button"
      disabled={!selectable}
      aria-pressed={status === "selected"}
      aria-label={`Row ${seat.row} seat ${seat.number}, ${SEAT_LABEL[status]}`}
      onClick={() => onToggle(seat.id)}
      className={`flex h-8 w-8 items-center justify-center rounded-md border text-xs font-medium ${SEAT_CLASS[status]}`}
    >
      {status === "booked" ? "✕" : seat.number}
    </button>
  );
}

export default memo(Seat);
