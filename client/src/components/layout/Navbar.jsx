import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";

const linkClass = ({ isActive }) =>
  `text-sm font-medium ${isActive ? "text-brand" : "text-gray-700 hover:text-brand"}`;

export default function Navbar() {
  const { user, logout } = useAuth();
  return (
    <header>
      <div className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link
            to="/"
            className="text-2xl font-extrabold tracking-tight text-ink"
          >
            Cine<span className="text-brand">Book</span>
          </Link>
          {/* <span className="text-sm text-gray-600">Delhi</span>
          "Hi, name" and Login arrive in Phase 3 */}
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-600">Delhi</span>
            {user ? (
              <>
                <span className="hidden text-gray-700 sm:inline">
                  Hi, {user.name ?? user.email.split("@")[0]}
                </span>
                <button
                  type="button"
                  onClick={logout}
                  className="rounded border border-gray-300 px-3 py-1 font-medium text-ink hover:border-brand hover:text-brand"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="rounded bg-brand px-3 py-1 font-medium text-white hover:bg-brand-dark"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
      <div className="bg-surface">
        <nav className="mx-auto flex max-w-6xl gap-6 px-4 py-2">
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
    </header>
  );
}
