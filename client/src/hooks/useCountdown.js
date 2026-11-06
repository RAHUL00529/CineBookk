import { useEffect, useState } from "react";

// Counts down whole seconds. start(n) begins an n-second countdown.
export function useCountdown() {
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [secondsLeft]);

  return { secondsLeft, start: setSecondsLeft };
}
