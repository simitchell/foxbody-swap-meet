import Button from "@mui/material/Button";
import { toggled } from "../utils/browseFilters";
import { CATEGORY_OPTIONS } from "../utils/listingChoices";
import {
  BrandFilter,
  ConditionChecks,
  KeywordField,
  PriceFields,
  StateFilter,
} from "./BrowseFilterFields";
import { FilterPanel } from "./GlobalStyles/StyleBrowse";

const FIT_CHOICES = [
  { value: "", label: "Any fit" },
  { value: "four_eye", label: "Four-eye '79–'86" },
  { value: "aero", label: "Aero '87–'93" },
];

// Desktop filters. Each change goes straight to the URL, so the results update
// right away and there's no Apply button.
export default function BrowseSidebar({ filters, brands, onChange, onClear }) {
  return (
    <FilterPanel aria-label="Filters">
      <KeywordField
        id="browse-keyword"
        value={filters.q}
        onChange={(q) => onChange({ q })}
      />

      <fieldset className="filterGroup">
        <legend>Fits my car</legend>
        {FIT_CHOICES.map((choice) => (
          <label key={choice.value} className="filterChoice">
            <input
              type="radio"
              name="browse-fits"
              checked={filters.fits === choice.value}
              onChange={() => onChange({ fits: choice.value })}
            />
            {choice.label}
          </label>
        ))}
        {(filters.fits === "four_eye" || filters.fits === "aero") && (
          <p className="filterHint">Includes parts that fit all Fox Bodies.</p>
        )}
      </fieldset>

      <fieldset className="filterGroup">
        <legend>Category</legend>
        {CATEGORY_OPTIONS.map((option) => (
          <label key={option.value} className="filterChoice">
            <input
              type="checkbox"
              checked={filters.category.includes(option.value)}
              onChange={() =>
                onChange({ category: toggled(filters.category, option.value) })
              }
            />
            {option.label}
          </label>
        ))}
      </fieldset>

      <BrandFilter
        id="browse-brand"
        brands={brands}
        selected={filters.brand}
        onChange={(brand) => onChange({ brand })}
      />

      <PriceFields
        idPrefix="browse"
        minPrice={filters.min_price}
        maxPrice={filters.max_price}
        onChange={onChange}
      />

      <ConditionChecks
        selected={filters.condition}
        onChange={(condition) => onChange({ condition })}
      />

      <StateFilter
        id="browse-state"
        value={filters.state}
        onChange={(state) => onChange({ state })}
      />

      <Button variant="outlined" type="button" onClick={onClear}>
        Clear all filters
      </Button>
    </FilterPanel>
  );
}
