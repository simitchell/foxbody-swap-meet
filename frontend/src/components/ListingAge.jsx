import { formatListed, formatListedFull, isStale } from "../utils/listingAge";
import { AgeNote, AgeRow } from "./GlobalStyles/StyleListingFields";

export function ClockIcon({ size = 14 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 15 14" />
    </svg>
  );
}

// The last row of a card in Your Listings.
export function ListingAgeRow({ createdAt }) {
  return (
    <AgeRow $stale={isStale(createdAt)}>
      <ClockIcon />
      <span>{formatListed(createdAt)}</span>
    </AgeRow>
  );
}

// Under Replace photo while editing: an amber box once stale, else plain text.
export function ListingAgeNote({ createdAt }) {
  return (
    <AgeNote $stale={isStale(createdAt)}>
      <ClockIcon size={16} />
      <span>{formatListedFull(createdAt)}. Only you can see this.</span>
    </AgeNote>
  );
}
