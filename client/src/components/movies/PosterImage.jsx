// Same title always gives the same colour, so placeholders look varied but stable
function posterGradient(title) {
  const hue = [...title].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 0);
  return `linear-gradient(160deg, hsl(${hue} 60% 38%), hsl(${(hue + 40) % 360} 55% 18%))`;
}

// Fills its parent, so the parent decides the size and shape
export default function PosterImage({ movie }) {
  if (movie.posterUrl) {
    return (
      <img
        src={movie.posterUrl}
        alt={`${movie.title} poster`}
        className="h-full w-full object-cover"
      />
    );
  }
  return (
    <div
      className="flex h-full w-full items-center justify-center p-4 text-center font-bold text-white"
      style={{ background: posterGradient(movie.title) }}
    >
      {movie.title}
    </div>
  );
}
