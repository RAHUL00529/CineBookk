import { http } from "./http.js";

// Returns { date, theaters: [{ theater, shows: [...] }] }
export const getMovieShows = (movieId, date) =>
  http
    .get(`/movies/${movieId}/shows`, { params: { date } })
    .then((res) => res.data);

// Returns { show, movie, theater, screen, seats }
export const getShow = (id) => http.get(`/shows/${id}`).then((res) => res.data);
