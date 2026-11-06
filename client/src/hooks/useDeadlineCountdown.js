import { useEffect, useState } from "react";

// deadline: a local Date.now()-style timestamp (or null while loading).
// Returns whole seconds left, never below 0, or null if there is no deadline yet.
export function useDeadlineCountdown(deadline) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (deadline == null) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [deadline]);

  if (deadline == null) return null;
  return Math.max(Math.ceil((deadline - now) / 1000), 0);
}
