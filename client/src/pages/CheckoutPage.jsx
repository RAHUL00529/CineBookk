import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getHold, cancelHold } from "../api/holds.api.js";
import { getShow } from "../api/shows.api.js";
import { createBooking } from "../api/bookings.api.js";
import { useDeadlineCountdown } from "../hooks/useDeadlineCountdown.js";
import { formatShowDateTime } from "../utils/dates.js";
import { getErrorMessage } from "../utils/errors.js";
import Spinner from "../components/common/Spinner.jsx";
import ErrorBanner from "../components/common/ErrorBanner.jsx";

const formatClock = (s) =>
  `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

function Checkout({ holdId }) {
  const navigate = useNavigate();
  const [state, setState] = useState({
    holdId: null,
    hold: null,
    show: null,
    deadline: null,
    error: null,
  });
  // Generated once per visit and reused on retries: this is the idempotency key
  const [paymentRef] = useState(() => `mock_${crypto.randomUUID()}`);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  //   const [booking, setBooking] = useState(null);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const hold = await getHold(holdId);
        // Taken right after the response, before the second request
        const deadline = Date.now() + hold.remainingMs;
        const show = await getShow(hold.showId);
        if (!ignore) setState({ holdId, hold, show, deadline, error: null });
      } catch (err) {
        if (!ignore) {
          setState({
            holdId,
            hold: null,
            show: null,
            deadline: null,
            error: getErrorMessage(err),
          });
        }
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [holdId]);

  const secondsLeft = useDeadlineCountdown(state.deadline);
  const showId = state.hold?.showId;

  const backToSeats = (notice) =>
    navigate(`/shows/${showId}/seats`, { replace: true, state: { notice } });

  // Time ran out: go back to the seat page (unless a payment is in flight or done)
  //   useEffect(() => {
  //     if (secondsLeft === 0 && !busy && !booking && showId) {
  //       navigate(`/shows/${showId}/seats`, {
  //         replace: true,
  //         state: {
  //           notice: {
  //             type: "error",
  //             text: "Your seat hold expired. Please choose your seats again.",
  //           },
  //         },
  //       });
  //     }
  //   }, [secondsLeft, busy, showId, navigate]);
  useEffect(() => {
    if (secondsLeft === 0 && !busy && showId) {
      navigate(`/shows/${showId}/seats`, {
        replace: true,
        state: {
          notice: {
            type: "error",
            text: "Your seat hold expired. Please choose your seats again.",
          },
        },
      });
    }
  }, [secondsLeft, busy, showId, navigate]);

  async function handlePay() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      //   setBooking(await createBooking(holdId, paymentRef));
      //   setBusy(false);
      const booking = await createBooking(holdId, paymentRef);
      navigate(`/bookings/${booking._id}/confirmed`, { replace: true });
    } catch (err) {
      const status = err.response?.status;
      if (status === 410) {
        return backToSeats({
          type: "error",
          text: "Your seat hold expired before payment. Please choose again.",
        });
      }
      if (status === 409) {
        return backToSeats({
          type: "error",
          text: "Some seats were just booked by someone else.",
        });
      }
      // Network or server error: the same paymentRef makes a retry safe
      setError(getErrorMessage(err));
      setBusy(false);
      //   navigate(`/bookings/${booking._id}/confirmed`, { replace: true });
    }
  }

  async function handleCancel() {
    setBusy(true);
    try {
      await cancelHold(holdId);
    } catch {
      // Already gone (410) or offline: the locks expire by themselves anyway
    }
    backToSeats(null);
  }

  if (state.holdId !== holdId) return <Spinner />;

  if (state.error) {
    return (
      <main className="mx-auto max-w-md px-4 py-10">
        <ErrorBanner message={state.error} />
        <Link to="/" className="mt-4 inline-block text-sm text-brand underline">
          Back to movies
        </Link>
      </main>
    );
  }

  const { hold, show } = state;

  //   // Temporary: 5.5 replaces this with a redirect to the confirmation page
  //   if (booking) {
  //     return (
  //       <main className="mx-auto max-w-md px-4 py-10 text-center">
  //         <h1 className="text-xl font-bold text-ink">Booking confirmed</h1>
  //         <p className="mt-2 text-sm text-gray-600">
  //           Seats {booking.seats.join(", ")} · ₹{booking.amount}
  //         </p>
  //         <p className="mt-1 text-xs text-gray-500">Booking id: {booking._id}</p>
  //       </main>
  //     );
  //   }

  return (
    <main className="mx-auto max-w-md px-4 py-8">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-ink">Review and pay</h1>

        <div className="mt-4 text-sm">
          <p className="font-semibold text-ink">{show.movie.title}</p>
          <p className="text-gray-600">
            {formatShowDateTime(show.show.startTime)}
          </p>
          <p className="text-gray-600">
            {show.theater.name}, {show.theater.city} · {show.show.screenName}
          </p>
        </div>

        <dl className="mt-4 space-y-1 border-t pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-600">Seats ({hold.seatIds.length})</dt>
            <dd className="font-medium text-ink">{hold.seatIds.join(", ")}</dd>
          </div>
          <div className="flex justify-between text-base">
            <dt className="font-semibold text-ink">Total</dt>
            <dd className="font-semibold text-ink">₹{hold.amount}</dd>
          </div>
        </dl>

        <p
          role="timer"
          className="mt-4 rounded bg-amber-50 p-2 text-center text-sm text-amber-800"
        >
          Complete payment in{" "}
          <span className="font-bold">{formatClock(secondsLeft ?? 0)}</span>
        </p>

        {error && (
          <div className="mt-4">
            <ErrorBanner message={error} />
          </div>
        )}

        <button
          type="button"
          onClick={handlePay}
          disabled={busy || secondsLeft === 0}
          className="mt-4 w-full rounded-lg bg-brand px-4 py-2 font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
        >
          {busy ? "Processing..." : `Pay ₹${hold.amount} (mock)`}
        </button>
        <button
          type="button"
          onClick={handleCancel}
          disabled={busy}
          className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 font-medium text-ink hover:border-brand disabled:opacity-50"
        >
          Cancel and release seats
        </button>
        <p className="mt-3 text-center text-xs text-gray-500">
          Demo project: no real payment is taken.
        </p>
      </div>
    </main>
  );
}

export default function CheckoutPage() {
  const { holdId } = useParams();
  // key={holdId}: a different hold starts with fresh state and a fresh paymentRef
  return <Checkout key={holdId} holdId={holdId} />;
}
