import { Movie } from "../models/Movie.js";
import { ApiError } from "../utils/ApiError.js";

export async function listMovies(req, res) {
  const { language } = req.valid.query;
  const filter = language ? { language } : {};

  const movies = await Movie.find(filter)
    .collation({ locale: "en", strength: 2 }) // case-insensitive match: "hindi" finds "Hindi"
    .sort({ releaseDate: -1, title: 1 })
    .lean();

  res.json({ movies });
}

export async function getMovie(req, res) {
  const movie = await Movie.findById(req.valid.params.id).lean();
  if (!movie) throw new ApiError(404, "Movie not found");

  res.json({ movie });
}
