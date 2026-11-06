import { useEffect, useRef, useState } from "react";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import { toggled } from "../utils/browseFilters";
import { CONDITION_OPTIONS } from "../utils/listingChoices";
import US_STATES from "../utils/usStates";
import { BrandOption, BrowseBrandInput } from "./GlobalStyles/StyleBrowse";

const DEBOUNCE_MS = 300;

// Debounced: it waits until typing pauses, so "hood" is one search rather than
// four, one per letter.
//
// live: the phone panel only edits a draft, so it updates on every keystroke.
// Otherwise tapping "Show results" within the wait could lose the last word.
export function KeywordField({ id, value, onChange, live = false }) {
  const [text, setText] = useState(value);
  const lastSent = useRef(value);
  // The timer calls the newest onChange. An older one holds older URL params, so
  // a filter clicked during the wait would be undone.
  const latestOnChange = useRef(onChange);
  latestOnChange.current = onChange;

  // Follow outside changes, like removing the tag or a navbar search. Our own
  // change coming back is skipped, or it would erase what's been typed since.
  useEffect(() => {
    if (value !== lastSent.current) {
      lastSent.current = value;
      setText(value);
    }
  }, [value]);

  useEffect(() => {
    const trimmed = text.trim();
    if (trimmed === lastSent.current) return undefined;
    const timer = setTimeout(() => {
      lastSent.current = trimmed;
      latestOnChange.current(trimmed);
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [text]);

  return (
    <div className="filterField">
      <label htmlFor={id}>Keyword</label>
      <input
        id={id}
        type="search"
        placeholder="Title or description"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          if (live) {
            lastSent.current = e.target.value.trim();
            onChange(e.target.value.trim());
          }
        }}
      />
    </div>
  );
}

export function BrandFilter({ id, brands, selected, onChange, large = false }) {
  const value = brands.filter((brand) => selected.includes(brand.slug));

  return (
    <div className="filterField">
      <label htmlFor={id}>Brand</label>
      <BrowseBrandInput $large={large}>
        <Autocomplete
          id={id}
          multiple
          filterSelectedOptions
          options={brands}
          value={value}
          size="small"
          isOptionEqualToValue={(option, chosen) => option.slug === chosen.slug}
          getOptionLabel={(option) => option.name}
          noOptionsText="No brands found"
          // MUI's default would sit behind the phone Filters panel and the nav.
          slotProps={{ popper: { sx: { zIndex: 10001 } } }}
          onChange={(_event, chosen) =>
            onChange(chosen.map((brand) => brand.slug))
          }
          renderOption={(props, option) => (
            <li {...props} key={option.slug}>
              <BrandOption>
                {option.name} <span>({option.listing_count})</span>
              </BrandOption>
            </li>
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder={value.length ? "" : "Any brand"}
            />
          )}
        />
      </BrowseBrandInput>
      <p className="filterHint">Pick one or more, e.g. Trick Flow, Saleen, McLeod.</p>
    </div>
  );
}

// Only applies on blur or Enter, so typing "500" doesn't search for 5, then 50.
// live: the phone panel edits a draft instead, and a tap on a button doesn't
// reliably blur an input on iOS, so it updates on every keystroke.
function PriceInput({ id, label, placeholder, value, onCommit, live }) {
  const [text, setText] = useState(value);

  useEffect(() => setText(value), [value]);

  const commit = () => {
    if (text !== value) onCommit(text);
  };

  return (
    <>
      <label htmlFor={id} className="visuallyHidden">
        {label}
      </label>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        placeholder={placeholder}
        value={text}
        // Prices are whole dollars, and the API rejects anything else.
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, "");
          setText(digits);
          if (live) onCommit(digits);
        }}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
        }}
      />
    </>
  );
}

export function PriceFields({ idPrefix, minPrice, maxPrice, onChange, live = false }) {
  return (
    <fieldset className="filterGroup">
      <legend>Price</legend>
      <div className="priceRow">
        <PriceInput
          id={`${idPrefix}-min-price`}
          label="Minimum price"
          placeholder="$ Min"
          live={live}
          value={minPrice}
          onCommit={(value) => onChange({ min_price: value })}
        />
        <span aria-hidden="true">–</span>
        <PriceInput
          id={`${idPrefix}-max-price`}
          label="Maximum price"
          placeholder="$ Max"
          live={live}
          value={maxPrice}
          onCommit={(value) => onChange({ max_price: value })}
        />
      </div>
    </fieldset>
  );
}

export function ConditionChecks({ selected, onChange }) {
  return (
    <fieldset className="filterGroup">
      <legend>Condition</legend>
      {CONDITION_OPTIONS.map((option) => (
        <label key={option.value} className="filterChoice">
          <input
            type="checkbox"
            checked={selected.includes(option.value)}
            onChange={() => onChange(toggled(selected, option.value))}
          />
          {option.label}
        </label>
      ))}
    </fieldset>
  );
}

export function StateFilter({ id, value, onChange }) {
  return (
    <div className="filterField">
      <label htmlFor={id}>{"Seller's state"}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Any state</option>
        {US_STATES.map(([code, name]) => (
          <option key={code} value={code}>
            {name}
          </option>
        ))}
      </select>
    </div>
  );
}
