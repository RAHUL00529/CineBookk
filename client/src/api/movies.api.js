import { http } from "./http.js";

export const getMovies = () =>
  http.get("/movies").then((res) => res.data.movies);

export const getMovie = (id) =>
  http.get(`/movies/${id}`).then((res) => res.data.movie);
