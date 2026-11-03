// Shared media queries, used as `@media ${phone} { ... }` in styled-components.

export const phone = "(max-width: 640px)";

// Portrait phones, plus landscape phones (wide but short). In a media query a
// comma means OR. A landscape iPhone is 844–932px wide, the same as a tablet
// or small laptop, so width alone can't tell them apart; its ~390–430px height
// can.
export const compactHome =
  "(max-width: 640px), (max-height: 500px) and (orientation: landscape)";

// Below desktop width the full nav link row doesn't fit in its 40% column
// (signed in, five links ran off a landscape phone's screen), so the nav
// collapses to the hamburger menu. Matches the card grid's 641–1023 range.
export const navMenu = "(max-width: 1023px)";
