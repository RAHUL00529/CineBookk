// import { useEffect, useState } from "react";
// import { io } from "socket.io-client";

// const INITIAL = { status: "connecting", snapshot: null, error: null };

// export function useSeatSocket(showId) {
//   const [state, setState] = useState(INITIAL);

//   useEffect(() => {
//     // Same origin as the page, so Vite's proxy forwards it and the cookie is sent
//     const socket = io({ withCredentials: true });

//     // Runs on first connect AND on every reconnect: this is the resync
//     const join = () => {
//       socket.emit("join-show", { showId }, (res) => {
//         if (!res.ok)
//           setState((s) => ({ ...s, status: "error", error: res.error }));
//       });
//     };

//     socket.on("connect", join);
//     socket.on("seat-snapshot", (snapshot) =>
//       setState({ status: "live", snapshot, error: null }),
//     );
//     socket.on("disconnect", () =>
//       setState((s) => ({ ...s, status: "reconnecting" })),
//     );
//     socket.on("connect_error", (err) =>
//       setState((s) => ({ ...s, status: "error", error: err.message })),
//     );

//     return () => {
//       socket.off();
//       socket.close();
//     };
//   }, [showId]);

//   return state;
// }
//////////////////////////////////////////////////////////

import { useEffect, useMemo, useReducer } from "react";
import { io } from "socket.io-client";
import { initialSeatState, seatReducer } from "./seatReducer.js";

export function useSeatSocket(showId) {
  const [state, dispatch] = useReducer(seatReducer, initialSeatState);

  useEffect(() => {
    const socket = io({ withCredentials: true });

    // Runs on first connect AND every reconnect: the server forgets our room
    const join = () => {
      socket.emit("join-show", { showId }, (res) => {
        if (!res.ok) {
          dispatch({ type: "connection", status: "error", error: res.error });
        }
      });
    };

    socket.on("connect", join);
    socket.on("seat-snapshot", (snapshot) =>
      dispatch({ type: "snapshot", snapshot }),
    );
    socket.on("seat-locked", ({ seatIds, expiresAt }) =>
      dispatch({ type: "locked", seatIds, expiresAt }),
    );
    socket.on("seat-released", ({ seatIds }) =>
      dispatch({ type: "released", seatIds }),
    );
    socket.on("seat-booked", ({ seatIds }) =>
      dispatch({ type: "booked", seatIds }),
    );
    socket.on("disconnect", () =>
      dispatch({ type: "connection", status: "reconnecting" }),
    );
    socket.on("connect_error", (err) =>
      dispatch({ type: "connection", status: "error", error: err.message }),
    );

    return () => {
      socket.off();
      socket.close();
    };
  }, [showId]);

  useEffect(() => {
    if (state.locked.size === 0) return;

    const nextExpiry = Math.min(
      ...[...state.locked.values()].map((l) => l.expiresAt),
    );
    const delay =
      Math.max(nextExpiry - (Date.now() + state.clockOffset), 0) + 50;

    const id = setTimeout(
      () =>
        dispatch({
          type: "expire",
          serverTime: Date.now() + state.clockOffset,
        }),
      delay,
    );
    return () => clearTimeout(id);
  }, [state.locked, state.clockOffset]);

  // Booked wins over everything; "held" means locked by me
  const statuses = useMemo(() => {
    const map = new Map();
    for (const [seatId, { mine }] of state.locked) {
      map.set(seatId, mine ? "held" : "locked");
    }
    for (const seatId of state.booked) map.set(seatId, "booked");
    return map;
  }, [state.booked, state.locked]);

  return {
    connection: state.connection,
    error: state.error,
    statuses,
    state,
    dispatch,
  };
}
