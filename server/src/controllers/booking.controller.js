import { Booking } from "../models/Booking.js";
import "../models/Show.js"; // register models so populate can find them
import "../models/Movie.js";
import "../models/Theater.js";
import { ApiError } from "../utils/ApiError.js";
import { confirmBooking } from "../services/bookingService.js";
import { broadcastSeatsBooked } from "../sockets/broadcast.js";

const POPULATE = {
  path: "showId",
  select: "startTime screenName movieId theaterId",
  populate: [
    { path: "movieId", select: "title posterUrl language" },
    { path: "theaterId", select: "name city" },
  ],
};

// Shapes a booking for the client. Populated fields can be null if the show was deleted.
function present(b) {
  const show = b.showId && typeof b.showId === "object" ? b.showId : null;
  return {
    _id: String(b._id),
    seats: b.seats,
    amount: b.amount,
    status: b.status,
    createdAt: b.createdAt,
    show: show && {
      _id: String(show._id),
      startTime: show.startTime,
      screenName: show.screenName,
    },
    movie: show?.movieId ?? null,
    theater: show?.theaterId ?? null,
  };
}

export async function createBooking(req, res) {
  const { holdId, paymentRef } = req.valid.body;
  const { booking, created } = await confirmBooking(
    req.user.id,
    holdId,
    paymentRef,
  );

  // Only announce a NEW booking, never a replay
  if (created) broadcastSeatsBooked(String(booking.showId), booking.seats);

  const full = await Booking.findById(booking._id).populate(POPULATE).lean();
  res.status(created ? 201 : 200).json({ booking: present(full) });
}

export async function listMyBookings(req, res) {
  const bookings = await Booking.find({ userId: req.user.id })
    .sort({ createdAt: -1 })
    .populate(POPULATE)
    .lean();
  res.json({ bookings: bookings.map(present) });
}

export async function getBooking(req, res) {
  const booking = await Booking.findOne({
    _id: req.valid.params.id,
    userId: req.user.id, // the owner check lives inside the query
  })
    .populate(POPULATE)
    .lean();
  if (!booking) throw new ApiError(404, "Booking not found");
  res.json({ booking: present(booking) });
}
