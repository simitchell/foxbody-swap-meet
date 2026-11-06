const STALE_AFTER_DAYS = 60;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

// Counts calendar days, so yesterday evening is "1 day ago" this morning.
// round, not floor: a day with a clock change isn't exactly 24 hours long.
function daysAgo(createdAt) {
  const elapsed = startOfDay(new Date()) - startOfDay(new Date(createdAt));
  return Math.round(elapsed / MS_PER_DAY);
}

function describe(createdAt, alwaysShowYear) {
  // Null means it was posted before we recorded dates.
  if (!createdAt) return "before Nov 2026";

  const days = daysAgo(createdAt);
  if (days <= 0) return "today";

  const date = new Date(createdAt);
  const showYear =
    alwaysShowYear || date.getFullYear() !== new Date().getFullYear();
  const dateText = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(showYear && { year: "numeric" }),
  });
  return `${dateText} · ${days} ${days === 1 ? "day" : "days"} ago`;
}

// "Listed Sep 2 · 65 days ago", for cards.
export function formatListed(createdAt) {
  return `Listed ${describe(createdAt, false)}`;
}

// "Listed Sep 2, 2026 · 65 days ago", for the edit form.
export function formatListedFull(createdAt) {
  return `Listed ${describe(createdAt, true)}`;
}

// "Sep 2, 2026 · 65 days ago", for a row already labeled "Listed".
export function formatListedValue(createdAt) {
  const text = describe(createdAt, true);
  return text[0].toUpperCase() + text.slice(1);
}

export function isStale(createdAt) {
  return Boolean(createdAt) && daysAgo(createdAt) >= STALE_AFTER_DAYS;
}
