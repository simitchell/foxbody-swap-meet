// Read-only helpers for the JWTs SimpleJWT issues.
//
// A JWT is three base64url chunks joined by dots: header.payload.signature.
// The payload is plain JSON anyone can read, e.g.
//   { "token_type": "access", "exp": 1767312000, "iat": 1767139200,
//     "jti": "…", "user_id": 7 }
// `exp` is the expiry time in seconds since 1970 (Unix time).
//
// Decoding is NOT verifying. We never check the signature here (we don't have
// the server's secret key, and shouldn't). Someone could hand-edit a token's
// `exp` and this code would believe it. That's fine: we only use it to decide
// whether it's worth *trying* the token. The server verifies the signature on
// every request and is the real authority.

export function decodeJwtPayload(token) {
  try {
    const payload = token.split(".")[1];
    // base64url uses - and _ instead of + and /, and drops the = padding.
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    // atob returns one character per byte; TextDecoder turns those bytes back
    // into UTF-8 text so non-ASCII claims decode correctly.
    const bytes = Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null; // missing, garbled, or not a JWT at all
  }
}

// True if the token is missing, unreadable, or expires within `skewSeconds`.
// The skew treats "about to expire" as expired, which covers clock drift
// between this device and the server and the time the request spends in flight.
export function isTokenExpired(token, skewSeconds = 30) {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== "number") return true;
  return payload.exp - skewSeconds <= Date.now() / 1000;
}
