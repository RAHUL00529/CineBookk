import { formatShowDateTime } from "../../utils/dates.js";

export default function BookingDetails({ booking }) {
  const { movie, theater, show } = booking;
  return (
    <div className="text-sm">
      <p className="font-semibold text-ink">
        {movie?.title ?? "Movie no longer listed"}
      </p>
      {show ? (
        <p className="text-gray-600">{formatShowDateTime(show.startTime)}</p>
      ) : (
        <p className="text-gray-500">Show details unavailable</p>
      )}
      {theater && show && (
        <p className="text-gray-600">
          {theater.name}, {theater.city} · {show.screenName}
        </p>
      )}
      <p className="mt-2 text-gray-700">
        Seats: <span className="font-medium">{booking.seats.join(", ")}</span>
      </p>
      <p className="text-gray-700">
        Paid: <span className="font-medium">₹{booking.amount}</span>
      </p>
    </div>
  );
}
