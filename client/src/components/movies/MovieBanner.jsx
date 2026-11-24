import PosterImage from "./PosterImage.jsx";
import { formatDuration } from "../../utils/formatDuration.js";
import { formatReleaseDate } from "../../utils/dates.js";

// Small stroke icons. currentColor lets the parent set the colour.
const Icon = ({ children, className = "h-4 w-4" }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

const ClockIcon = () => (
  <Icon>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Icon>
);
const FilmIcon = ({ className }) => (
  <Icon className={className}>
    <rect x="3" y="8" width="18" height="12" rx="2" />
    <path d="M3 8l3-4h4L7 8M10 8l3-4h4l-3 4" />
  </Icon>
);
const CalendarIcon = () => (
  <Icon>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </Icon>
);

export default function MovieBanner({ movie }) {
  const meta = [
    { icon: <ClockIcon />, text: formatDuration(movie.durationMin) },
    { icon: <FilmIcon />, text: movie.genres.join(", ") },
    movie.releaseDate && {
      icon: <CalendarIcon />,
      text: formatReleaseDate(movie.releaseDate),
    },
  ].filter(Boolean);

  return (
    <section
      className="text-white"
      style={{
        // Layer 1: warm glow on the right. Layer 2: dark base colour.
        background:
          "radial-gradient(circle at 85% 65%, rgba(255,140,60,0.5), transparent 45%), linear-gradient(90deg, #0b1820, #12232c 60%, #1d2230)",
        borderBottomLeftRadius: "50% 24px",
        borderBottomRightRadius: "50% 24px",
        // A shadow follows the curve, so this draws the pink line under it
        boxShadow: "0 3px 0 0 rgba(248,68,100,0.85)",
      }}
    >
      <div className="mx-auto flex max-w-6xl gap-5 px-4 py-8 sm:gap-8 sm:pb-12">
        <div className="aspect-[2/3] w-28 shrink-0 self-start overflow-hidden rounded-2xl ring-2 ring-white/30 sm:w-52">
          <PosterImage movie={movie} className="text-lg sm:text-2xl" />
        </div>

        <div className="min-w-0">
          <div className="flex items-stretch gap-3">
            <span
              className="w-1.5 shrink-0 rounded-full bg-brand"
              aria-hidden="true"
            />
            <h1 className="text-2xl font-bold sm:text-4xl">{movie.title}</h1>
          </div>

          <span className="mt-4 inline-block rounded-full bg-white/15 px-4 py-1 text-sm font-medium">
            {movie.language}
          </span>

          <ul className="mt-4 flex flex-wrap items-center gap-y-2 text-sm sm:text-base">
            {meta.map((item, i) => (
              <li key={item.text} className="flex items-center">
                {i > 0 && (
                  <span
                    className="mx-3 h-5 w-px bg-white/30"
                    aria-hidden="true"
                  />
                )}
                <span className="flex items-center gap-1.5">
                  {item.icon}
                  {item.text}
                </span>
              </li>
            ))}
          </ul>

          <h2 className="mt-6 flex items-center gap-2 text-lg font-bold">
            <FilmIcon className="h-5 w-5 text-brand" />
            About the movie
          </h2>
          <p className="mt-1 max-w-md text-sm text-gray-300 sm:text-base">
            {movie.description}
          </p>
        </div>
      </div>
    </section>
  );
}
