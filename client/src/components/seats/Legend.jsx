import { SEAT_CLASS } from "./seatStyles.js";

const ITEMS = [
  ["available", "Available"],
  ["selected", "Selected"],
  ["held", "Held by you"],
  ["locked", "Held by someone else"],
  ["booked", "Booked"],
];

export default function Legend() {
  return (
    <ul className="flex flex-wrap justify-center gap-x-5 gap-y-2 border-t py-4 text-xs text-gray-600">
      {ITEMS.map(([status, label]) => (
        <li key={status} className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className={`flex h-5 w-5 items-center justify-center rounded border text-[10px] ${SEAT_CLASS[status]}`}
          >
            {status === "booked" ? "✕" : ""}
          </span>
          {label}
        </li>
      ))}
    </ul>
  );
}
