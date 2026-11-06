// import mongoose from "mongoose";

// const movieSchema = new mongoose.Schema({
//   title: { type: String, required: true, trim: true },
//   description: { type: String, default: "" },
//   durationMin: {
//     type: Number,
//     required: true,
//     min: 1,
//     validate: Number.isInteger,
//   },
//   language: { type: String, required: true, trim: true },
//   genres: { type: [String], default: [] },
//   posterUrl: { type: String, default: "" },
//   releaseDate: { type: Date },
// });

// movieSchema.index({ title: 1 });

// export const Movie = mongoose.model("Movie", movieSchema);
////////////////////////////////////////////////////////////////////////////

import mongoose from "mongoose";

const movieSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, index: true },
    description: { type: String, required: true },
    durationMin: { type: Number, required: true, min: 1 },
    language: { type: String, required: true },
    genres: [String],
    posterUrl: String,
    releaseDate: Date,
  },
  { timestamps: true },
);

export const Movie = mongoose.model("Movie", movieSchema);
