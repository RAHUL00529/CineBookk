import { http } from "./http.js";

// Returns the booking object
export const createBooking = (holdId, paymentRef) =>
  http
    .post("/bookings", { holdId, paymentRef })
    .then((res) => res.data.booking);

export const getBooking = (id) =>
  http.get(`/bookings/${id}`).then((res) => res.data.booking);

export const getMyBookings = () =>
  http.get("/bookings/me").then((res) => res.data.bookings);
