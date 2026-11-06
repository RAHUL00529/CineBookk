// import mongoose from "mongoose";

// const screenSchema = new mongoose.Schema(
//   { name: { type: String, required: true, trim: true } },
//   { _id: false },
// );

// const theaterSchema = new mongoose.Schema({
//   name: { type: String, required: true, trim: true },
//   city: { type: String, required: true, trim: true },
//   screens: {
//     type: [screenSchema],
//     validate: [(v) => v.length > 0, "A theater needs at least one screen"],
//   },
// });

// theaterSchema.index({ city: 1, name: 1 }, { unique: true });

// export const Theater = mongoose.model("Theater", theaterSchema);
/////////////////////////////////////////////////////////////////////////////////////////
import mongoose from "mongoose";

const tierSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    rows: { type: [String], required: true },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const screenSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    rows: { type: [String], required: true },
    seatsPerRow: { type: Number, required: true, min: 1 },
    aisleAfter: { type: [Number], default: [] },
    missingSeats: { type: [String], default: [] },
    tiers: { type: [tierSchema], required: true },
  },
  { _id: false },
);

const theaterSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true, index: true },
    screens: { type: [screenSchema], required: true },
  },
  { timestamps: true },
);

export const Theater = mongoose.model("Theater", theaterSchema);
