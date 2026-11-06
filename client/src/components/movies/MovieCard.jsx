import { Link } from "react-router-dom";
import { formatDuration } from "../../utils/formatDuration.js";
import PosterImage from "./PosterImage.jsx";

// Same title always gives the same colour, so placeholders look varied but stable
// function posterGradient(title) {
//   const hue = [...title].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 0);
//   return `linear-gradient(160deg, hsl(${hue} 60% 38%), hsl(${(hue + 40) % 360} 55% 18%))`;
// }

export default function MovieCard({ movie }) {
  return (
    <Link to={`/movies/${movie._id}`} className="block">
      <div className="relative aspect-[2/3] overflow-hidden rounded-lg">
        {/* {movie.posterUrl ? (
          <img
            src={movie.posterUrl}
            alt={`${movie.title} poster`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center p-4 text-center text-lg font-bold text-white"
            style={{ background: posterGradient(movie.title) }}
          >
            {movie.title}
          </div>
        )} */}
        <PosterImage movie={movie} />
        <div className="absolute inset-x-0 bottom-0 bg-black/70 px-2 py-1 text-xs text-white">
          {movie.language} · {formatDuration(movie.durationMin)}
        </div>
      </div>
      <h2 className="mt-2 truncate text-sm font-semibold text-ink">
        {movie.title}
      </h2>
      <p className="truncate text-sm text-gray-500">
        {movie.genres.join(" / ")}
      </p>
    </Link>
  );
}
