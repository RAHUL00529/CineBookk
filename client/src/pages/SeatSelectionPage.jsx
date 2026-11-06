// import { useCallback, useEffect, useMemo, useState } from "react";
// import { useParams, useSearchParams } from "react-router-dom";
// import { getShow } from "../api/shows.api.js";
// import { createHold } from "../api/holds.api.js";
// import { MAX_SEATS } from "../constants.js";
// import { formatShowDateTime } from "../utils/dates.js";
// import { getErrorMessage } from "../utils/errors.js";
// import SeatMap from "../components/seats/SeatMap.jsx";
// import Legend from "../components/seats/Legend.jsx";
// import SummaryBar from "../components/seats/SummaryBar.jsx";
// import Spinner from "../components/common/Spinner.jsx";
// import ErrorBanner from "../components/common/ErrorBanner.jsx";
// import { useSeatSocket } from "../hooks/useSeatSocket.js";

// // Dev-only: lets you see every seat state before locking and sockets exist
// function fakeStatuses(seats) {
//   const map = new Map();
//   seats.forEach((seat, i) => {
//     if (i % 9 === 4) map.set(seat.id, "booked");
//     else if (i % 13 === 6) map.set(seat.id, "locked");
//     else if (i % 29 === 10) map.set(seat.id, "held");
//   });
//   return map;
// }

// const byNaturalOrder = (a, b) =>
//   a.localeCompare(b, undefined, { numeric: true });

// function SeatSelection({ id }) {
//   const [params] = useSearchParams();
//   const demo = import.meta.env.DEV && params.has("demo");

//   const [state, setState] = useState({ id: null, data: null, error: null });
//   const [selected, setSelected] = useState(() => new Set());
//   const [busy, setBusy] = useState(false);
//   const [notice, setNotice] = useState(null);
//   const live = useSeatSocket(id);
//   // console.log("socket state:", live);

//   useEffect(() => {
//     let ignore = false;
//     getShow(id)
//       .then((data) => {
//         if (!ignore) setState({ id, data, error: null });
//       })
//       .catch((err) => {
//         if (!ignore) setState({ id, data: null, error: getErrorMessage(err) });
//       });
//     return () => {
//       ignore = true;
//     };
//   }, [id]);

//   const data = state.data;

//   // const statuses = useMemo(
//   //   () => (demo && data ? fakeStatuses(data.seats) : new Map()),
//   //   [demo, data],
//   // );

//   const statuses = useMemo(
//     () => (demo && data ? fakeStatuses(data.seats) : live.statuses),
//     [demo, data, live.statuses],
//   );
//   const priceById = useMemo(
//     () => new Map(data?.seats.map((s) => [s.id, s.price])),
//     [data],
//   );

//   // Stable function identity, so memoized seats are not re-rendered needlessly
//   const onToggle = useCallback((seatId) => {
//     setSelected((prev) => {
//       const next = new Set(prev);
//       if (next.has(seatId)) next.delete(seatId);
//       else if (next.size < MAX_SEATS) next.add(seatId);
//       return next;
//     });
//   }, []);
//   // Seats the user picked that someone else has since taken are dropped from view
//   const visibleSelected = useMemo(
//     () =>
//       new Set(
//         [...selected].filter((sid) => {
//           const s = statuses.get(sid);
//           return s !== "booked" && s !== "locked";
//         }),
//       ),
//     [selected, statuses],
//   );
//   async function handleProceed() {
//     const seatIds = [...visibleSelected].sort(byNaturalOrder);
//     if (seatIds.length === 0 || busy) return;

//     setBusy(true);
//     setNotice(null);
//     try {
//       const hold = await createHold(id, seatIds);
//       live.dispatch({
//         type: "mine",
//         seatIds: hold.seatIds,
//         expiresAt: hold.expiresAt,
//       });
//       setSelected(new Set()); // the seats are held now, not just selected
//       // Phase 5 will navigate to /checkout/:holdId. For now, confirm it worked:
//       setNotice({
//         type: "success",
//         text: `Seats held until ${new Date(hold.expiresAt).toLocaleTimeString()}. Checkout comes in Phase 5.`,
//       });
//     } catch (err) {
//       const conflicts = err.response?.data?.details?.conflicts;
//       if (err.response?.status === 409 && Array.isArray(conflicts)) {
//         // Deselect exactly the seats that were taken
//         setSelected((prev) => {
//           const next = new Set(prev);
//           conflicts.forEach((c) => next.delete(c));
//           return next;
//         });
//         setNotice({
//           type: "error",
//           text: `Seats ${conflicts.join(", ")} were just taken. Please choose other seats.`,
//         });
//       } else {
//         setNotice({ type: "error", text: getErrorMessage(err) });
//       }
//     } finally {
//       setBusy(false);
//     }
//   }

//   if (state.id !== id) return <Spinner />;

//   if (state.error) {
//     return (
//       <main className="mx-auto max-w-4xl px-4 py-6">
//         <ErrorBanner message={state.error} />
//       </main>
//     );
//   }

//   const seatIds = [...visibleSelected].sort(byNaturalOrder);
//   // Display only. The server recomputes the real amount from the seat tiers.
//   const total = Math.round(
//     seatIds.reduce((sum, sid) => sum + (priceById.get(sid) ?? 0), 0) *
//       data.show.priceMultiplier,
//   );

//   return (
//     <>
//       <div className="border-b bg-white px-4 py-3 text-center">
//         <h1 className="font-bold text-ink">{data.movie.title}</h1>
//         <p className="text-xs text-gray-500">
//           {formatShowDateTime(data.show.startTime)} at {data.theater.name},{" "}
//           {data.theater.city} · {data.show.screenName}
//         </p>
//       </div>

//       <main className="mx-auto max-w-4xl px-4">
//         {demo && (
//           <p className="mt-3 rounded bg-amber-50 p-2 text-center text-xs text-amber-800">
//             Demo mode: seat statuses are fake
//           </p>
//         )}
//         {live.connection !== "live" && (
//           <p
//             role="status"
//             className="mt-3 rounded bg-amber-50 p-2 text-center text-xs text-amber-800"
//           >
//             {live.connection === "error"
//               ? `Live updates unavailable: ${live.error}`
//               : "Reconnecting to live seat updates..."}
//           </p>
//         )}
//         <SeatMap
//           screen={data.screen}
//           seats={data.seats}
//           priceMultiplier={data.show.priceMultiplier}
//           statuses={statuses}
//           selected={visibleSelected}
//           onToggle={onToggle}
//         />
//         <Legend />
//       </main>

//       <SummaryBar seatIds={seatIds} total={total} />
//     </>
//   );
// }

// export default function SeatSelectionPage() {
//   const { id } = useParams();
//   // key={id}: a different show starts with a fresh selection
//   return <SeatSelection key={id} id={id} />;
// }

////////////////////////////////////
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  useParams,
  useSearchParams,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { getShow } from "../api/shows.api.js";
import { createHold } from "../api/holds.api.js";
import { MAX_SEATS } from "../constants.js";
import { formatShowDateTime } from "../utils/dates.js";
import { getErrorMessage } from "../utils/errors.js";
import SeatMap from "../components/seats/SeatMap.jsx";
import Legend from "../components/seats/Legend.jsx";
import SummaryBar from "../components/seats/SummaryBar.jsx";
import Spinner from "../components/common/Spinner.jsx";
import ErrorBanner from "../components/common/ErrorBanner.jsx";
import { useSeatSocket } from "../hooks/useSeatSocket.js";

// Dev-only: lets you see every seat state before locking and sockets exist
function fakeStatuses(seats) {
  const map = new Map();
  seats.forEach((seat, i) => {
    if (i % 9 === 4) map.set(seat.id, "booked");
    else if (i % 13 === 6) map.set(seat.id, "locked");
    else if (i % 29 === 10) map.set(seat.id, "held");
  });
  return map;
}

const byNaturalOrder = (a, b) =>
  a.localeCompare(b, undefined, { numeric: true });

function SeatSelection({ id }) {
  const [params] = useSearchParams();
  const demo = import.meta.env.DEV && params.has("demo");

  const [state, setState] = useState({ id: null, data: null, error: null });
  const [selected, setSelected] = useState(() => new Set());
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [notice, setNotice] = useState(location.state?.notice ?? null);
  // const [notice, setNotice] = useState(null);

  const live = useSeatSocket(id);

  useEffect(() => {
    let ignore = false;
    getShow(id)
      .then((data) => {
        if (!ignore) setState({ id, data, error: null });
      })
      .catch((err) => {
        if (!ignore) setState({ id, data: null, error: getErrorMessage(err) });
      });
    return () => {
      ignore = true;
    };
  }, [id]);

  const data = state.data;

  const statuses = useMemo(
    () => (demo && data ? fakeStatuses(data.seats) : live.statuses),
    [demo, data, live.statuses],
  );
  const priceById = useMemo(
    () => new Map(data?.seats.map((s) => [s.id, s.price])),
    [data],
  );

  // Stable function identity, so memoized seats are not re-rendered needlessly
  const onToggle = useCallback((seatId) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(seatId)) next.delete(seatId);
      else if (next.size < MAX_SEATS) next.add(seatId);
      return next;
    });
  }, []);

  // Seats the user picked that someone else has since taken are dropped from view
  const visibleSelected = useMemo(
    () =>
      new Set(
        [...selected].filter((sid) => {
          const s = statuses.get(sid);
          return s !== "booked" && s !== "locked";
        }),
      ),
    [selected, statuses],
  );

  async function handleProceed() {
    const seatIds = [...visibleSelected].sort(byNaturalOrder);
    if (seatIds.length === 0 || busy) return;

    setBusy(true);
    setNotice(null);
    // try {
    //   const hold = await createHold(id, seatIds);
    //   live.dispatch({
    //     type: "mine",
    //     seatIds: hold.seatIds,
    //     expiresAt: hold.expiresAt,
    //   });
    //   setSelected(new Set()); // the seats are held now, not just selected
    //   // Phase 5 will navigate to /checkout/:holdId. For now, confirm it worked:
    //   setNotice({
    //     type: "success",
    //     text: `Seats held until ${new Date(hold.expiresAt).toLocaleTimeString()}. Checkout comes in Phase 5.`,
    //   });
    // } catch (err) {
    //   const conflicts = err.response?.data?.details?.conflicts;
    //   if (err.response?.status === 409 && Array.isArray(conflicts)) {
    //     // Deselect exactly the seats that were taken
    //     setSelected((prev) => {
    //       const next = new Set(prev);
    //       conflicts.forEach((c) => next.delete(c));
    //       return next;
    //     });
    //     setNotice({
    //       type: "error",
    //       text: `Seats ${conflicts.join(", ")} were just taken. Please choose other seats.`,
    //     });
    //   } else {
    //     setNotice({ type: "error", text: getErrorMessage(err) });
    //   }
    // } finally {
    //   setBusy(false);
    // }
    let hold;
    try {
      hold = await createHold(id, seatIds);
    } catch (err) {
      const conflicts = err.response?.data?.details?.conflicts;
      if (err.response?.status === 409 && Array.isArray(conflicts)) {
        setSelected((prev) => {
          const next = new Set(prev);
          conflicts.forEach((c) => next.delete(c));
          return next;
        });
        setNotice({
          type: "error",
          text: `Seats ${conflicts.join(", ")} were just taken. Please choose other seats.`,
        });
      } else {
        setNotice({ type: "error", text: getErrorMessage(err) });
      }
      setBusy(false);
      return;
    }

    // live.dispatch({
    //   type: "mine",
    //   seatIds: hold.seatIds,
    //   expiresAt: hold.expiresAt,
    // });
    // setSelected(new Set());
    // setNotice({
    //   type: "success",
    //   text: `Seats held until ${new Date(hold.expiresAt).toLocaleTimeString()}. Checkout comes in Phase 5.`,
    // });
    // setBusy(false);
    navigate(`/checkout/${hold.holdId}`);
  }

  if (state.id !== id) return <Spinner />;

  if (state.error) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-6">
        <ErrorBanner message={state.error} />
      </main>
    );
  }

  const seatIds = [...visibleSelected].sort(byNaturalOrder);
  // Display only. The server recomputes the real amount from the seat tiers.
  const total = Math.round(
    seatIds.reduce((sum, sid) => sum + (priceById.get(sid) ?? 0), 0) *
      data.show.priceMultiplier,
  );

  return (
    <>
      <div className="border-b bg-white px-4 py-3 text-center">
        <h1 className="font-bold text-ink">{data.movie.title}</h1>
        <p className="text-xs text-gray-500">
          {formatShowDateTime(data.show.startTime)} at {data.theater.name},{" "}
          {data.theater.city} · {data.show.screenName}
        </p>
      </div>

      <main className="mx-auto max-w-4xl px-4">
        {demo && (
          <p className="mt-3 rounded bg-amber-50 p-2 text-center text-xs text-amber-800">
            Demo mode: seat statuses are fake
          </p>
        )}
        {live.connection !== "live" && (
          <p
            role="status"
            className="mt-3 rounded bg-amber-50 p-2 text-center text-xs text-amber-800"
          >
            {live.connection === "error"
              ? `Live updates unavailable: ${live.error}`
              : "Reconnecting to live seat updates..."}
          </p>
        )}
        {notice && (
          <p
            role="status"
            className={`mt-3 rounded p-2 text-center text-xs ${
              notice.type === "error"
                ? "bg-red-50 text-red-700"
                : "bg-green-50 text-green-800"
            }`}
          >
            {notice.text}
          </p>
        )}
        <SeatMap
          screen={data.screen}
          seats={data.seats}
          priceMultiplier={data.show.priceMultiplier}
          statuses={statuses}
          selected={visibleSelected}
          onToggle={onToggle}
        />
        <Legend />
      </main>

      <SummaryBar
        seatIds={seatIds}
        total={total}
        onProceed={handleProceed}
        busy={busy}
      />
    </>
  );
}

export default function SeatSelectionPage() {
  const { id } = useParams();
  // key={id}: a different show starts with a fresh selection
  return <SeatSelection key={id} id={id} />;
}
