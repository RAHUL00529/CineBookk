// Simple film-reel icon. Uses currentColor so the parent decides the colour.
export default function ReelIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true">
      <circle
        cx="100"
        cy="100"
        r="92"
        fill="none"
        stroke="currentColor"
        strokeWidth="10"
      />
      <circle cx="100" cy="100" r="12" fill="currentColor" />
      {[
        [100, 50],
        [147.6, 84.5],
        [129.4, 140.5],
        [70.6, 140.5],
        [52.4, 84.5],
      ].map(([cx, cy]) => (
        <circle
          key={`${cx}-${cy}`}
          cx={cx}
          cy={cy}
          r="18"
          fill="currentColor"
        />
      ))}
    </svg>
  );
}
