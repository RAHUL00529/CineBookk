import { Link } from "react-router-dom";
import { formatShowTime } from "../../utils/dates.js";

const Svg = ({ children, className = "h-5 w-5" }) => (
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

export default function TheaterShowList({ theaters }) {
  if (theaters.length === 0) {
    return (
      <p className="py-10 text-center text-gray-500">
        No shows available for the selected date.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      {theaters.map(({ theater, shows }) => (
        <section key={theater._id} className="max-w-xl">
          <h3 className="flex items-center gap-2 text-xl font-bold text-ink">
            <Svg className="h-6 w-6 text-brand">
              <path d="M3 10l9-6 9 6M5 10v9M19 10v9M9 10v9M15 10v9M3 21h18" />
            </Svg>
            {theater.name}
          </h3>
          <p className="mt-1 flex items-center gap-2 text-gray-600">
            <Svg className="h-4 w-4 text-brand">
              <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z" />
              <circle cx="12" cy="10" r="2.5" />
            </Svg>
            {theater.city}
          </p>
          <hr className="my-4" />
          <div className="flex flex-wrap gap-3">
            {shows.map((show) => (
              <Link
                key={show._id}
                to={`/shows/${show._id}/seats`}
                className="rounded-xl border border-brand/30 bg-brand/10 px-6 py-3 text-center transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                <span className="flex items-center justify-center gap-1.5 font-bold text-ink">
                  <Svg className="h-4 w-4">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 2" />
                  </Svg>
                  {formatShowTime(show.startTime)}
                </span>
                <span className="block text-[11px] font-semibold uppercase text-brand">
                  {show.screenName}
                </span>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
