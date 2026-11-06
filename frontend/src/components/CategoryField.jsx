import { useState } from "react";
import { CATEGORY_OPTIONS } from "../utils/listingChoices";
import { CategorySelect, FieldError } from "./GlobalStyles/StyleListingFields";

export default function CategoryField({ defaultValue = "", error, onChange }) {
  const [value, setValue] = useState(defaultValue);

  return (
    <div className="field">
      <label htmlFor="listing-category">Category</label>
      <CategorySelect
        id="listing-category"
        name="category"
        value={value}
        aria-required="true"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? "listing-category-error" : undefined}
        $invalid={Boolean(error)}
        $empty={!value}
        onChange={(e) => {
          setValue(e.target.value);
          onChange?.();
        }}
      >
        <option value="" disabled>
          Choose a category
        </option>
        {CATEGORY_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </CategorySelect>
      {error && <FieldError id="listing-category-error">{error}</FieldError>}
    </div>
  );
}
