import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyBookings } from "../api/bookings.api.js";
import { getErrorMessage } from "../utils/errors.js";
import BookingDetails from "../components/bookings/BookingDetails.jsx";
import Spinner from "../components/common/Spinner.jsx";
import ErrorBanner from "../components/common/ErrorBanner.jsx";

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;
    getMyBookings()
      .then((data) => {
        if (!ignore) setBookings(data);
      })
      .catch((err) => {
        if (!ignore) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="mb-4 text-xl font-bold text-ink">My bookings</h1>
      {loading && <Spinner />}
      {error && <ErrorBanner message={error} />}
      {!loading && !error && bookings.length === 0 && (
        <p className="py-8 text-center text-gray-600">
          No bookings yet.{" "}
          <Link to="/" className="text-brand underline">
            Browse movies
          </Link>
        </p>
      )}
      <ul className="space-y-4">
        {bookings.map((b) => (
          <li
            key={b._id}
            className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
          >
            <BookingDetails booking={b} />
            <p className="mt-2 text-xs text-gray-500">
              Booked on {new Date(b.createdAt).toLocaleDateString()} · id{" "}
              {b._id}
            </p>
          </li>
        ))}
      </ul>
    </main>
  );
}
