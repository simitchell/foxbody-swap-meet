import { useState } from "react";
import { FIT_OPTIONS } from "../utils/listingChoices";
import {
  FieldError,
  FitCard,
  FitsFieldset,
} from "./GlobalStyles/StyleListingFields";

// Nothing is preselected on purpose: an honest answer beats a default. The
// examples stay visible everywhere because this is the easiest choice to get
// wrong.
export default function FitsField({ defaultValue = "", error, onChange }) {
  const [value, setValue] = useState(defaultValue);

  return (
    <FitsFieldset aria-describedby={error ? "listing-fits-error" : undefined}>
      <legend>Which cars does it fit?</legend>
      {FIT_OPTIONS.map((option) => (
        <FitCard key={option.value} $selected={value === option.value}>
          <input
            type="radio"
            name="fits"
            value={option.value}
            checked={value === option.value}
            onChange={() => {
              setValue(option.value);
              onChange?.();
            }}
          />
          <span className="fitText">
            <span className="fitTitle">{option.title}</span>
            <span className="fitExample">{option.example}</span>
          </span>
        </FitCard>
      ))}
      {error && <FieldError id="listing-fits-error">{error}</FieldError>}
    </FitsFieldset>
  );
}
