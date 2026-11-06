// // import { Routes, Route } from "react-router-dom";
// // import HomePage from "./pages/HomePage.jsx";

// // export default function App() {
// //   return (
// //     <Routes>
// //       <Route path="/" element={<HomePage />} />
// //     </Routes>
// //   );
// // }
// //////////////////////////////////////////////////////
// import { Routes, Route } from "react-router-dom";
// import Navbar from "./components/layout/Navbar.jsx";
// import HomePage from "./pages/HomePage.jsx";
// import MovieDetailPage from "./pages/MovieDetailPage.jsx";
// import SeatSelectionPage from "./pages/SeatSelectionPage.jsx";

// export default function App() {
//   return (
//     <div className="min-h-screen bg-white text-ink">
//       <Navbar />
//       <Routes>
//         <Route path="/" element={<HomePage />} />
//         <Route path="/shows/:id/seats" element={<SeatSelectionPage />} />
//         <Route
//           path="*"
//           element={<p className="p-8 text-center">Page not found</p>}
//         />
//         <Route path="/movies/:id" element={<MovieDetailPage />} />
//       </Routes>
//     </div>
//   );
// }
////////////////////////////////////////////////////////////
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/layout/Navbar.jsx";
import ProtectedRoute from "./components/layout/ProtectedRoute.jsx";
import HomePage from "./pages/HomePage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import MovieDetailPage from "./pages/MovieDetailPage.jsx";
import SeatSelectionPage from "./pages/SeatSelectionPage.jsx";
import CheckoutPage from "./pages/CheckoutPage.jsx";
import ConfirmationPage from "./pages/ConfirmationPage.jsx";
import MyBookingsPage from "./pages/MyBookingsPage.jsx";

export default function App() {
  return (
    <div className="min-h-screen bg-white text-ink">
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/movies/:id" element={<MovieDetailPage />} />
        <Route
          path="/shows/:id/seats"
          element={
            <ProtectedRoute>
              <SeatSelectionPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/checkout/:holdId"
          element={
            <ProtectedRoute>
              <CheckoutPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bookings"
          element={
            <ProtectedRoute>
              <MyBookingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bookings/:id/confirmed"
          element={
            <ProtectedRoute>
              <ConfirmationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="*"
          element={<p className="p-8 text-center">Page not found</p>}
        />
      </Routes>
    </div>
  );
}
