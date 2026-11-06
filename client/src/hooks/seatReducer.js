export const initialSeatState = {
  connection: "connecting", // "connecting" | "live" | "reconnecting" | "error"
  error: null,
  booked: new Set(),
  locked: new Map(), // seatId -> { expiresAt, mine }
  clockOffset: 0,
};

export function seatReducer(state, action) {
  switch (action.type) {
    case "connection":
      return {
        ...state,
        connection: action.status,
        error: action.error ?? null,
      };

    // Replaces the WHOLE map: used on first join and after every reconnect
    case "snapshot":
      return {
        ...state,
        connection: "live",
        error: null,
        booked: new Set(action.snapshot.booked),
        locked: new Map(
          action.snapshot.locked.map((l) => [
            l.seatId,
            { expiresAt: l.expiresAt, mine: l.mine },
          ]),
        ),
        clockOffset: action.snapshot.serverNow - Date.now(),
      };

    case "locked": {
      const locked = new Map(state.locked);
      for (const id of action.seatIds) {
        // The broadcast has no user id, so keep "mine" if we already knew it
        const mine = locked.get(id)?.mine ?? false;
        locked.set(id, { expiresAt: action.expiresAt, mine });
      }
      return { ...state, locked };
    }

    case "released": {
      const locked = new Map(state.locked);
      for (const id of action.seatIds) locked.delete(id);
      return { ...state, locked };
    }
    case "expire": {
      const locked = new Map(state.locked);
      for (const [id, { expiresAt }] of locked) {
        if (expiresAt <= action.serverTime) locked.delete(id);
      }
      return locked.size === state.locked.size ? state : { ...state, locked };
    }
    // After our own POST /holds succeeds: these seats are definitely ours
    case "mine": {
      const locked = new Map(state.locked);
      for (const id of action.seatIds) {
        locked.set(id, { expiresAt: action.expiresAt, mine: true });
      }
      return { ...state, locked };
    }
    // Seats were confirmed as a booking: they are permanently taken now.
    // Remove any lock record for them (the booked set takes priority anyway).
    case "booked": {
      const booked = new Set(state.booked);
      const locked = new Map(state.locked);
      for (const id of action.seatIds) {
        booked.add(id);
        locked.delete(id);
      }
      return { ...state, booked, locked };
    }

    default:
      return state;
    // return {
    //   connection: state.connection,
    //   error: state.error,
    //   statuses,
    //   state,
    //   dispatch,
    // };
  }
}
