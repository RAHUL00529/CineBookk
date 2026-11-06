// import { useEffect, useState } from "react";
// import { http } from "../api/http.js";

// export default function HomePage() {
//   const [health, setHealth] = useState(null);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     http
//       .get("/health")
//       .then((res) => setHealth(res.data))
//       .catch(() => setError("Cannot reach the server"));
//   }, []);

//   return (
//     <main className="mx-auto max-w-xl p-8">
//       <h1 className="text-3xl font-bold">Movie Booking</h1>
//       <p className="mt-4 text-gray-600">Server status</p>
//       {error && <p className="mt-2 text-red-600">{error}</p>}
//       {health && (
//         <pre className="mt-2 rounded bg-gray-100 p-4 text-sm">
//           {JSON.stringify(health, null, 2)}
//         </pre>
//       )}
//     </main>
//   );
// }
///////////////////////////////////////////////////////////////////////////
import { useEffect, useState } from "react";
import { getMovies } from "../api/movies.api.js";
import { getErrorMessage } from "../utils/errors.js";
import MovieGrid from "../components/movies/MovieGrid.jsx";
import Spinner from "../components/common/Spinner.jsx";
import ErrorBanner from "../components/common/ErrorBanner.jsx";

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
    <main className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="mb-4 text-xl font-bold text-ink">Now Showing</h1>
      {loading && <Spinner />}
      {error && <ErrorBanner message={error} />}
      {!loading && !error && <MovieGrid movies={movies} />}
    </main>
  );
}
