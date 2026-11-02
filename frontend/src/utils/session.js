export const AUTH_KEYS = ["username", "userId", "access_token", "refresh_token"];

export function clearAuth() {
  AUTH_KEYS.forEach((key) => localStorage.removeItem(key));
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
