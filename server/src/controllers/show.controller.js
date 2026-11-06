import { Movie } from "../models/Movie.js";
import { Show } from "../models/Show.js";
import { ApiError } from "../utils/ApiError.js";
import { istDayRange } from "../utils/dates.js";
import { buildSeats } from "../services/seatLayoutService.js";
import { Theater } from "../models/Theater.js"; // registers the model so populate can find it
import { getSnapshot } from "../services/seatLockService.js";

export async function listMovieShows(req, res) {
  const { id } = req.valid.params;
  const { date } = req.valid.query;

  if (!(await Movie.exists({ _id: id }))) {
    throw new ApiError(404, "Movie not found");
  }

  const { start, end } = istDayRange(date);
  const from = new Date(Math.max(start.getTime(), Date.now())); // hide started shows

  const shows = await Show.find({
    movieId: id,
    startTime: { $gte: from, $lt: end },
  })
    .sort({ startTime: 1 })
    .populate("theaterId", "name city") // one extra query for all shows, not one per show
    .lean();

  const byTheater = new Map();
  for (const show of shows) {
    const key = String(show.theaterId._id);
    if (!byTheater.has(key)) {
      byTheater.set(key, { theater: show.theaterId, shows: [] });
    }
    byTheater.get(key).shows.push({
      _id: show._id,
      screenName: show.screenName,
      startTime: show.startTime,
      priceMultiplier: show.priceMultiplier,
    });
  }

  res.json({ date, theaters: [...byTheater.values()] });
}

export async function getShow(req, res) {
  const show = await Show.findById(req.valid.params.id)
    .populate("movieId", "title durationMin language")
    .populate("theaterId")
    .lean();
  if (!show) throw new ApiError(404, "Show not found");

  const theater = show.theaterId;
  const screen = theater.screens.find((s) => s.name === show.screenName);
  if (!screen) {
    // Bad data, not a bad request: becomes a logged 500
    throw new Error(
      `Show ${show._id} references missing screen "${show.screenName}"`,
    );
  }

  res.json({
    show: {
      _id: show._id,
      startTime: show.startTime,
      screenName: show.screenName,
      priceMultiplier: show.priceMultiplier,
    },
    movie: show.movieId,
    theater: { _id: theater._id, name: theater.name, city: theater.city },
    screen: {
      name: screen.name,
      rows: screen.rows,
      seatsPerRow: screen.seatsPerRow,
      aisleAfter: screen.aisleAfter,
      tiers: screen.tiers,
    },
    seats: buildSeats(screen),
  });
}

export async function getSeats(req, res) {
  const snapshot = await getSnapshot(req.user.id, req.valid.params.id);
  res.json(snapshot); // { booked: [...], locked: [{ seatId, expiresAt, mine }] }
}
