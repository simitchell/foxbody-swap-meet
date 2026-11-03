export const AUTH_KEYS = ["username", "userId", "access_token", "refresh_token"];

export function clearAuth() {
  AUTH_KEYS.forEach((key) => localStorage.removeItem(key));
}

// Saves a new session from a /token/ or /register/ response. Both login and
// registration go through here, so they always store exactly the same keys.
// Callers then do a full page load so AuthContext re-reads the new tokens.
export function startSession({ access, refresh, userId, username }) {
  clearAuth();
  localStorage.setItem("username", username);
  localStorage.setItem("userId", userId);
  localStorage.setItem("access_token", access);
  localStorage.setItem("refresh_token", refresh);
}

// Called by apiFetch when the session can't be renewed (the refresh token is
// missing, expired, or blacklisted). Signs out and sends the user to log in,
// remembering where they were so LoginForm can bring them back.
export function handleSessionExpired() {
  clearAuth();
  const { pathname, search } = window.location;
  if (pathname.startsWith("/login")) return; // already there

  // LoginForm reads this flag once to show "Your session expired". It lives in
  // sessionStorage (this tab only, gone when the tab closes) because the full
  // page load below wipes all React state.
  sessionStorage.setItem("session_expired", "1");
  // A full page load (not React Router's navigate) also resets every
  // component's state, so nothing keeps showing data from the old session.
  window.location.assign(`/login?next=${encodeURIComponent(pathname + search)}`);
}
