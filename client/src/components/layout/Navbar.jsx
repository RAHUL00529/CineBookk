import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";
import ReelIcon from "./ReelIcon.jsx";

const linkClass = ({ isActive }) =>
  `border-b-2 py-5 text-sm font-medium ${
    isActive
      ? "border-brand text-brand"
      : "border-transparent text-gray-700 hover:text-brand"
  }`;

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2 py-3">
            <ReelIcon className="h-8 w-8 text-ink" />
            <span className="text-2xl font-extrabold tracking-tight text-ink">
              Cine<span className="text-brand">Book</span>
            </span>
          </Link>
          <nav className="flex gap-6">
            <NavLink to="/" end className={linkClass}>
              Movies
            </NavLink>
            {user && (
              <NavLink to="/bookings" className={linkClass}>
                My bookings
              </NavLink>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1 font-medium text-ink">
            Delhi
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z" />
              <circle cx="12" cy="10" r="2.5" />
            </svg>
          </span>
          {user ? (
            <>
              <span className="hidden text-gray-700 sm:inline">
                Hi, {user.name ?? user.email.split("@")[0]}
              </span>
              <button
                type="button"
                onClick={logout}
                className="rounded-full border border-gray-300 px-4 py-1.5 font-medium text-ink hover:border-brand hover:text-brand"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-2 rounded-full bg-brand px-5 py-2 font-semibold text-white shadow-sm hover:bg-brand-dark"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21a8 8 0 0 1 16 0" />
              </svg>
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
