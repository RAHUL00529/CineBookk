// Purely decorative film strip; colour comes from the parent via currentColor
export default function FilmStrip({ className = "" }) {
  return (
    <svg viewBox="0 0 120 400" className={className} aria-hidden="true">
      <rect width="120" height="400" rx="8" fill="currentColor" />
      {Array.from({ length: 10 }, (_, i) => (
        <g key={i}>
          <rect
            x="8"
            y={12 + i * 40}
            width="18"
            height="24"
            rx="4"
            fill="white"
          />
          <rect
            x="94"
            y={12 + i * 40}
            width="18"
            height="24"
            rx="4"
            fill="white"
          />
        </g>
      ))}
    </svg>
  );
}
