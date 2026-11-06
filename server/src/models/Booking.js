// import mongoose from "mongoose";

// const SEAT_ID = /^[A-Z]+\d+$/;

// const seatsValidators = [
//   {
//     validator: (v) => Array.isArray(v) && v.length >= 1 && v.length <= 6,
//     message: "A booking must have 1 to 6 seats",
//   },
//   {
//     validator: (v) => v.every((s) => SEAT_ID.test(s)),
//     message: "Seat ids must look like A1 or D12",
//   },
//   {
//     // The unique index does NOT catch duplicates inside one document.
//     validator: (v) => new Set(v).size === v.length,
//     message: "Duplicate seats in one booking",
//   },
// ];

// const bookingSchema = new mongoose.Schema(
//   {
//     userId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },
//     showId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Show",
//       required: true,
//     },
//     seats: { type: [String], validate: seatsValidators },
//     amount: {
//       type: Number,
//       required: true,
//       min: 0,
//       validate: Number.isInteger,
//     },
//     paymentRef: { type: String, required: true, unique: true },
//   },
//   { timestamps: { createdAt: true, updatedAt: false } },
// );

// // THE double-booking guard. Mongo makes one index entry per seat in the
// // array (a "multikey" index), so the same {showId, seat} pair can exist
// // in only one booking, whatever else the Redis layer does.
// bookingSchema.index({ showId: 1, seats: 1 }, { unique: true });
// // "My bookings", newest first.
// bookingSchema.index({ userId: 1, createdAt: -1 });

// export const Booking = mongoose.model("Booking", bookingSchema);
////////////////////////////////////////////////////////////////////////////////
import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    showId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Show",
      required: true,
    },
    seats: {
      type: [String],
      required: true,
      validate: {
        validator: (v) => v.length > 0 && v.length <= 6,
        message: "A booking needs between 1 and 6 seats",
      },
    },
    amount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["confirmed", "cancelled"],
      default: "confirmed",
    },
    paymentRef: { type: String, required: true, unique: true },
  },
  { timestamps: true },
);

// The last line of defence against double booking.
bookingSchema.index(
  { showId: 1, seats: 1 },
  { unique: true, partialFilterExpression: { status: "confirmed" } },
);
bookingSchema.index({ userId: 1, createdAt: -1 }); // "my bookings, newest first"

export const Booking = mongoose.model("Booking", bookingSchema);
