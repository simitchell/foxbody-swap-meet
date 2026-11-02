export const AUTH_KEYS = ["username", "userId", "access_token", "refresh_token"];

export function clearAuth() {
  AUTH_KEYS.forEach((key) => localStorage.removeItem(key));
}

// Called by apiFetch when the session can't be renewed.
// Step 1 placeholder: clears the dead tokens. Step 2 adds the Toast flag and
// the redirect to /login?next=…
export function handleSessionExpired() {
  clearAuth();
  console.warn("Session expired; signed out.");
}
