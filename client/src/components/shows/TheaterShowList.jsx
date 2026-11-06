import { Link } from "react-router-dom";
import { formatShowTime } from "../../utils/dates.js";

export default function TheaterShowList({ theaters }) {
  if (theaters.length === 0) {
    return (
      <p className="py-10 text-center text-gray-500">
        No shows available for the selected date.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {theaters.map(({ theater, shows }) => (
        <section key={theater._id}>
          <h2 className="font-semibold text-ink">{theater.name}</h2>
          <p className="text-xs text-gray-500">{theater.city}</p>
          <div className="mt-2 flex flex-wrap gap-3">
            {shows.map((show) => (
              <Link
                key={show._id}
                to={`/shows/${show._id}/seats`}
                className="rounded-lg border border-gray-300 px-5 py-2 text-center hover:border-brand"
              >
                <span className="block text-sm font-semibold text-ink">
                  {formatShowTime(show.startTime)}
                </span>
                <span className="block text-[10px] uppercase text-gray-500">
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
