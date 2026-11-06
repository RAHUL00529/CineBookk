import { MAX_SEATS } from "../../constants.js";

export default function SummaryBar({ seatIds, total, onProceed, busy }) {
  const atLimit = seatIds.length >= MAX_SEATS;

  return (
    <div className="sticky bottom-0 border-t bg-white">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3">
        <div className="text-sm">
          {seatIds.length === 0 ? (
            <p className="text-gray-500">Select seats to continue</p>
          ) : (
            <>
              <p className="font-semibold text-ink">
                {seatIds.length} {seatIds.length === 1 ? "seat" : "seats"}:{" "}
                {seatIds.join(", ")}
              </p>
              <p className="text-gray-600">₹{total}</p>
            </>
          )}
          {atLimit && (
            <p role="status" className="text-amber-700">
              Maximum {MAX_SEATS} seats per booking
            </p>
          )}
        </div>
        {/* Wired to POST /holds in Phase 4 */}
        {/* <button
          type="button"
          disabled
          className="rounded-lg bg-ink px-6 py-2 font-semibold text-white disabled:opacity-40"
        >
          Proceed
        </button> */}

        <button
          type="button"
          onClick={onProceed}
          disabled={seatIds.length === 0 || busy}
          className="rounded-lg bg-ink px-6 py-2 font-semibold text-white disabled:opacity-40"
        >
          {busy ? "Holding..." : "Proceed"}
        </button>
      </div>
    </div>
  );
}
