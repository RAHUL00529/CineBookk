export const SEAT_CLASS = {
  available:
    "border-gray-400 bg-white text-ink enabled:hover:border-brand enabled:hover:text-brand",
  selected: "border-brand bg-brand text-white",
  held: "border-2 border-dashed border-brand bg-brand/10 text-brand",
  locked:
    "cursor-not-allowed border-gray-300 text-gray-400 bg-[repeating-linear-gradient(45deg,#e5e7eb_0,#e5e7eb_3px,#ffffff_3px,#ffffff_6px)]",
  booked: "cursor-not-allowed border-gray-300 bg-gray-300 text-gray-500",
};

// Used in aria-labels, so screen readers hear the state
export const SEAT_LABEL = {
  available: "available",
  selected: "selected",
  held: "held by you",
  locked: "held by someone else",
  booked: "booked",
};
