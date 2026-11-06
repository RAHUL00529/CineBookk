import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { getMovie } from "../api/movies.api.js";
import { getMovieShows } from "../api/shows.api.js";
import { getNextDays } from "../utils/dates.js";
import { getErrorMessage } from "../utils/errors.js";
import MovieBanner from "../components/movies/MovieBanner.jsx";
import DateStrip from "../components/shows/DateStrip.jsx";
import TheaterShowList from "../components/shows/TheaterShowList.jsx";
import Spinner from "../components/common/Spinner.jsx";
import ErrorBanner from "../components/common/ErrorBanner.jsx";

export default function MovieDetailPage() {
  const { id } = useParams();
  const days = useMemo(() => getNextDays(7), []);
  const [selectedDate, setSelectedDate] = useState(days[0].value);

  // Each state remembers WHICH request it answers, so loading can be derived
  const [movieState, setMovieState] = useState({
    id: null,
    movie: null,
    error: null,
  });
  const [showsState, setShowsState] = useState({
    id: null,
    date: null,
    theaters: [],
    error: null,
  });

  useEffect(() => {
    let ignore = false;
    getMovie(id)
      .then((movie) => {
        if (!ignore) setMovieState({ id, movie, error: null });
      })
      .catch((err) => {
        if (!ignore)
          setMovieState({ id, movie: null, error: getErrorMessage(err) });
      });
    return () => {
      ignore = true;
    };
  }, [id]);

  useEffect(() => {
    let ignore = false;
    getMovieShows(id, selectedDate)
      .then((data) => {
        if (!ignore)
          setShowsState({
            id,
            date: selectedDate,
            theaters: data.theaters,
            error: null,
          });
      })
      .catch((err) => {
        if (!ignore) {
          setShowsState({
            id,
            date: selectedDate,
            theaters: [],
            error: getErrorMessage(err),
          });
        }
      });
    return () => {
      ignore = true;
    };
  }, [id, selectedDate]);

  const movieLoading = movieState.id !== id;
  const showsLoading = showsState.id !== id || showsState.date !== selectedDate;

  if (movieLoading) return <Spinner />;

  if (movieState.error) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-6">
        <ErrorBanner message={movieState.error} />
      </main>
    );
  }

  return (
    <>
      <MovieBanner movie={movieState.movie} />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <DateStrip
          days={days}
          selected={selectedDate}
          onSelect={setSelectedDate}
        />
        <div className="mt-6">
          {showsLoading && <Spinner />}
          {!showsLoading && showsState.error && (
            <ErrorBanner message={showsState.error} />
          )}
          {!showsLoading && !showsState.error && (
            <TheaterShowList theaters={showsState.theaters} />
          )}
        </div>
      </main>
    </>
  );
}
