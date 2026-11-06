import FITMENT from "../utils/fitment";
import { FitPill } from "./GlobalStyles/StyleCard";

// Both labels are always in the page, and CSS shows the one that fits.
export default function FitTag({ fits }) {
  const fit = FITMENT[fits];
  if (!fit) return null;

  return (
    <FitPill $background={fit.background} $color={fit.color}>
      <span className="fitLong">{fit.label}</span>
      <span className="fitShort">{fit.short}</span>
    </FitPill>
  );
}
