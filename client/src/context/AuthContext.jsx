import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthContext } from "../context/authContext.js";
import { getMe, logout as logoutRequest } from "../api/auth.api.js";

export function AuthProvider({ children }) {
  const [state, setState] = useState({ user: null, loading: true });

  // Ask the server who we are, once, when the app loads
  useEffect(() => {
    let ignore = false;
    getMe()
      .then((user) => {
        if (!ignore) setState({ user, loading: false });
      })
      .catch(() => {
        // 401 = not logged in. Network errors also land here: treat as logged out.
        if (!ignore) setState({ user: null, loading: false });
      });
    return () => {
      ignore = true;
    };
  }, []);

  const login = useCallback((user) => setState({ user, loading: false }), []);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      // Even if the request fails, forget the user in this tab
      setState({ user: null, loading: false });
    }
  }, []);

  const value = useMemo(
    () => ({ user: state.user, loading: state.loading, login, logout }),
    [state, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
