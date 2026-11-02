import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { API_BASE_URL } from "./config";
import { refreshAccessToken } from "./utils/apiFetch";
import { isTokenExpired } from "./utils/jwt";
import { clearAuth } from "./utils/session";

// The single source of truth for "is someone signed in?". Components read
// isAuth / username from useAuth() instead of poking at localStorage, so the
// whole UI agrees and updates together.
const AuthContext = createContext({ isAuth: false, username: "", logout: () => {} });

const SIGNED_OUT = { isAuth: false, username: "" };

// Runs before the first render, so the navbar is right on first paint instead
// of flashing "sammitchell" and then correcting itself.
function readStoredAuth() {
  // The refresh token decides whether a session can still exist. If it's
  // missing or past its exp, nothing can renew the session: this visitor is
  // simply signed out. No redirect, since they may just be browsing.
  if (isTokenExpired(localStorage.getItem("refresh_token"))) {
    clearAuth();
    return SIGNED_OUT;
  }
  return { isAuth: true, username: localStorage.getItem("username") || "" };
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(readStoredAuth);

  useEffect(() => {
    // Refresh token still good but the access token has expired: renew it now
    // in the background, so the first click doesn't have to wait for a 401 +
    // refresh + retry. This shares apiFetch's single in-flight refresh, so a
    // page that also makes a request on load still causes only one refresh.
    if (!auth.isAuth || !isTokenExpired(localStorage.getItem("access_token"))) return;
    refreshAccessToken().then((ok) => {
      if (!ok) {
        // e.g. the refresh token was blacklisted by a logout elsewhere.
        clearAuth();
        setAuth(SIGNED_OUT);
      }
    });
  }, [auth.isAuth]);

  const logout = useCallback(async () => {
    const refresh = localStorage.getItem("refresh_token");
    const access = localStorage.getItem("access_token");
    // Sign out locally first: the UI updates immediately and a second call
    // (React StrictMode runs effects twice in dev) finds nothing to do.
    clearAuth();
    setAuth(SIGNED_OUT);
    if (!refresh) return;
    try {
      // Blacklist the refresh token so it can't be used again, even if copied.
      await fetch(`${API_BASE_URL}/logout/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${access}`,
        },
        body: JSON.stringify({ refresh_token: refresh }),
      });
    } catch (error) {
      console.error("Logout request failed:", error);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ ...auth, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
