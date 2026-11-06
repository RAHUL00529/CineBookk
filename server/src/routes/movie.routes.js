import { Router } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate.js";
import { idParams } from "../utils/schemas.js";
import { dateString } from "../utils/schemas.js"; // extend your existing schemas import
import { listMovies, getMovie } from "../controllers/movie.controller.js";
import { listMovieShows } from "../controllers/show.controller.js";

const router = Router();

const listQuery = z.object({
  //   language: z.string().trim().min(1).max(30).optional(),
  language: z.string().trim().min(1).max(30).optional(),
});
const showsQuery = z.strictObject({ date: dateString });

router.get("/", validate({ query: listQuery }), listMovies);
router.get("/:id", validate({ params: idParams }), getMovie);
router.get(
  "/:id/shows",
  validate({ params: idParams, query: showsQuery }),
  listMovieShows,
);

export default router;
