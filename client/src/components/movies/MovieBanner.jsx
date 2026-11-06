import PosterImage from "./PosterImage.jsx";
import { formatDuration } from "../../utils/formatDuration.js";
import { formatReleaseDate } from "../../utils/dates.js";

export default function MovieBanner({ movie }) {
  const meta = [
    formatDuration(movie.durationMin),
    movie.genres.join(", "),
    movie.releaseDate && formatReleaseDate(movie.releaseDate),
  ].filter(Boolean);

  return (
    <section className="bg-gradient-to-r from-ink to-black text-white">
      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-8">
        <div className="aspect-[2/3] w-32 shrink-0 overflow-hidden rounded-lg sm:w-44">
          <PosterImage movie={movie} />
        </div>
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">{movie.title}</h1>
          <span className="mt-3 inline-block rounded bg-white/15 px-2 py-0.5 text-sm">
            {movie.language}
          </span>
          <p className="mt-3 text-sm text-gray-300">{meta.join(" • ")}</p>
          <h2 className="mt-5 font-semibold">About the movie</h2>
          <p className="mt-1 max-w-xl text-sm text-gray-300">
            {movie.description}
          </p>
        </div>
      </div>
    </section>
  );
}
