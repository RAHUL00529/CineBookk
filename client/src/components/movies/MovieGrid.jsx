import MovieCard from "./MovieCard.jsx";

export default function MovieGrid({ movies }) {
  if (movies.length === 0) {
    return (
      <p className="py-8 text-center text-gray-600">
        No movies available right now.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {movies.map((movie) => (
        <MovieCard key={movie._id} movie={movie} />
      ))}
    </div>
  );
}
