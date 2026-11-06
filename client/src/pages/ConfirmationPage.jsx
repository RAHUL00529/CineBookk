import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getBooking } from "../api/bookings.api.js";
import { getErrorMessage } from "../utils/errors.js";
import BookingDetails from "../components/bookings/BookingDetails.jsx";
import Spinner from "../components/common/Spinner.jsx";
import ErrorBanner from "../components/common/ErrorBanner.jsx";

function Confirmation({ id }) {
  const [state, setState] = useState({ id: null, booking: null, error: null });

  useEffect(() => {
    let ignore = false;
    getBooking(id)
      .then((booking) => {
        if (!ignore) setState({ id, booking, error: null });
      })
      .catch((err) => {
        if (!ignore)
          setState({ id, booking: null, error: getErrorMessage(err) });
      });
    return () => {
      ignore = true;
    };
  }, [id]);

  if (state.id !== id) return <Spinner />;

  if (state.error) {
    return (
      <main className="mx-auto max-w-md px-4 py-10">
        <ErrorBanner message={state.error} />
      </main>
    );
  }

  const { booking } = state;
  return (
    <main className="mx-auto max-w-md px-4 py-8">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-green-700">Booking confirmed</h1>
        <p className="mt-1 text-xs text-gray-500">Booking id: {booking._id}</p>
        <div className="mt-4 border-t pt-4">
          <BookingDetails booking={booking} />
        </div>
        <div className="mt-6 flex gap-3 text-sm">
          <Link
            to="/bookings"
            className="flex-1 rounded-lg bg-brand px-4 py-2 text-center font-semibold text-white hover:bg-brand-dark"
          >
            My bookings
          </Link>
          <Link
            to="/"
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-center font-medium text-ink hover:border-brand"
          >
            Book more
          </Link>
        </div>
        <p className="mt-3 text-center text-xs text-gray-500">
          Demo project: no real payment was taken.
        </p>
      </div>
    </main>
  );
}

export default function ConfirmationPage() {
  const { id } = useParams();
  return <Confirmation key={id} id={id} />;
}
