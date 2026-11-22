import { Link } from "react-router-dom";
import { formatDuration } from "../../utils/formatDuration.js";
import PosterImage from "./PosterImage.jsx";

export default function MovieCard({ movie }) {
  return (
    <Link
      to={`/movies/${movie._id}`}
      className="group block overflow-hidden rounded-xl bg-white shadow-md transition duration-200 hover:-translate-y-1 hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      <div className="relative aspect-[5/4] overflow-hidden">
        <PosterImage movie={movie} className="text-lg" />
        <div className="absolute inset-x-0 bottom-0 flex items-center gap-1.5 bg-black/60 px-3 py-1.5 text-xs font-medium text-white">
          <svg
            viewBox="0 0 24 24"
            className="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>
          {movie.language} • {formatDuration(movie.durationMin)}
        </div>
      </div>
      <div className="px-3 py-3">
        <h3 className="truncate text-sm font-semibold text-ink">
          {movie.title}
        </h3>
        <p className="truncate text-sm text-gray-500">
          {movie.genres.join(" / ")}
        </p>
      </div>
    </Link>
  );
}
