// import mongoose from "mongoose";

// const showSchema = new mongoose.Schema({
//   movieId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "Movie",
//     required: true,
//   },
//   theaterId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "Theater",
//     required: true,
//   },
//   screenName: { type: String, required: true },
//   startTime: { type: Date, required: true }, // stored in UTC
//   priceMultiplier: { type: Number, default: 1, min: 0.1, max: 5 },
// });

// // "Shows for movie X on date Y": range query on startTime.
// showSchema.index({ movieId: 1, startTime: 1 });
// // One screen cannot host two shows starting at the same time.
// showSchema.index(
//   { theaterId: 1, screenName: 1, startTime: 1 },
//   { unique: true },
// );

// export const Show = mongoose.model("Show", showSchema);
/////////////////////////////////////////////////////////////////////////////
import mongoose from "mongoose";

const showSchema = new mongoose.Schema(
  {
    movieId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Movie",
      required: true,
    },
    theaterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Theater",
      required: true,
    },
    screenName: { type: String, required: true },
    startTime: { type: Date, required: true }, // stored in UTC
    priceMultiplier: { type: Number, default: 1, min: 0 },
  },
  { timestamps: true },
);

showSchema.index({ movieId: 1, startTime: 1 }); // "shows for this movie on this date"
showSchema.index({ theaterId: 1, startTime: 1 });

export const Show = mongoose.model("Show", showSchema);
