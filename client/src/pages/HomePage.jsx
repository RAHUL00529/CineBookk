import { useEffect, useState } from "react";
import { getMovies } from "../api/movies.api.js";
import { getErrorMessage } from "../utils/errors.js";
import MovieGrid from "../components/movies/MovieGrid.jsx";
import Spinner from "../components/common/Spinner.jsx";
import ErrorBanner from "../components/common/ErrorBanner.jsx";
import HeroBanner from "../components/movies/HeroBanner.jsx";
import FilmStrip from "../components/layout/FilmStrip.jsx";

export default function HomePage() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false; // ignore responses that arrive after cleanup

    getMovies()
      .then((data) => {
        if (!ignore) setMovies(data);
      })
      .catch((err) => {
        if (!ignore) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  return (
    // <main className="mx-auto max-w-6xl px-4 py-6">
    //   <h1 className="mb-4 text-xl font-bold text-ink">Now Showing</h1>
    //   {loading && <Spinner />}
    //   {error && <ErrorBanner message={error} />}
    //   {!loading && !error && <MovieGrid movies={movies} />}
    // </main>
    <>
      <HeroBanner />
      <div className="relative overflow-hidden">
        <FilmStrip className="pointer-events-none absolute -left-12 top-40 hidden h-96 -rotate-45 text-brand/10 lg:block" />
        <FilmStrip className="pointer-events-none absolute -right-12 bottom-0 hidden h-96 -rotate-45 text-brand/10 lg:block" />

        <main className="mx-auto max-w-6xl px-4 py-8">
          <h2 className="mb-5 flex items-center gap-3 text-2xl font-bold text-ink">
            <span
              className="h-7 w-1.5 rounded-full bg-brand"
              aria-hidden="true"
            />
            Now Showing
          </h2>
          {loading && <Spinner />}
          {error && <ErrorBanner message={error} />}
          {!loading && !error && <MovieGrid movies={movies} />}
        </main>
      </div>
    </>
  );
}
