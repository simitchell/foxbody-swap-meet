import { API_BASE_URL } from "../config";
import { handleSessionExpired } from "./session";

// The login and refresh endpoints answer 401 for bad credentials / a dead
// refresh token. Refreshing in response to those would loop, so skip them.
const NO_REFRESH_PATHS = ["/token/", "/token/refresh/"];

// The one refresh currently in flight, shared by everyone who needs it.
//
// Why only one: with ROTATE_REFRESH_TOKENS + BLACKLIST_AFTER_ROTATION, each
// refresh token works exactly once. The server answers with a new pair and
// blacklists the old refresh token. If two requests 401 at the same time and
// each started its own refresh with the same old token, the first would win and
// the second would be rejected as blacklisted, and we'd log the user out even
// though their session is fine. So the second caller waits on the first
// caller's promise instead of starting another.
let refreshPromise = null;

async function requestNewTokens() {
  const refresh = localStorage.getItem("refresh_token");
  if (!refresh) return false;
  try {
    const response = await fetch(`${API_BASE_URL}/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });
    if (!response.ok) return false; // expired or blacklisted
    const { access, refresh: newRefresh } = await response.json();
    localStorage.setItem("access_token", access);
    // Rotation issues a new refresh token every time and the old one is now
    // blacklisted, so we must keep the new one.
    if (newRefresh) localStorage.setItem("refresh_token", newRefresh);
    return true;
  } catch {
    return false; // network error
  }
}

// Resolves true if we now have a fresh access token, false otherwise.
export function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = requestNewTokens().finally(() => {
      refreshPromise = null; // allow a new refresh the next time one is needed
    });
  }
  return refreshPromise;
}

function buildRequest(options, token) {
  const headers = new Headers(options.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  // A JSON string body gets a JSON Content-Type. A FormData body gets none:
  // the browser has to write "multipart/form-data; boundary=…" itself, and a
  // hand-set Content-Type would leave out the boundary and break the upload.
  if (typeof options.body === "string" && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return { ...options, headers };
}

// fetch() for our API. Takes a path like "/cart/", adds the base URL and the
// Bearer token, and quietly renews an expired access token and retries once.
// Returns the Response, so callers keep their response.ok / apiErrorMessage code.
export default async function apiFetch(path, options = {}) {
  const url = `${API_BASE_URL}${path}`;
  const sentToken = localStorage.getItem("access_token");
  const response = await fetch(url, buildRequest(options, sentToken));

  if (response.status !== 401 || !sentToken || NO_REFRESH_PATHS.includes(path)) {
    return response;
  }

  // Another request may have already refreshed while this one was in flight.
  // If the stored token changed, just retry with it rather than refreshing again.
  const refreshed =
    localStorage.getItem("access_token") !== sentToken ||
    (await refreshAccessToken());

  if (!refreshed) {
    handleSessionExpired();
    return response; // the original 401, so callers' error handling still works
  }

  // Retry once. If this one 401s too, hand it back rather than looping.
  return fetch(url, buildRequest(options, localStorage.getItem("access_token")));
}
