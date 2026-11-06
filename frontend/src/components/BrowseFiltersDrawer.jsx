import { useEffect, useState } from "react";
import Button from "@mui/material/Button";
import Drawer from "@mui/material/Drawer";
import { API_BASE_URL } from "../config";
import {
  readFilters,
  toggled,
  withChanges,
  withoutFilters,
} from "../utils/browseFilters";
import { CATEGORY_OPTIONS } from "../utils/listingChoices";
import {
  BrandFilter,
  ConditionChecks,
  KeywordField,
  PriceFields,
  StateFilter,
} from "./BrowseFilterFields";
import { DrawerBody, DrawerFooter, DrawerHeader } from "./GlobalStyles/StyleBrowse";

const COUNT_DEBOUNCE_MS = 300;

const FIT_CHOICES = [
  { value: "", label: "Any" },
  { value: "four_eye", label: "Four-eye", hint: "'79–'86" },
  { value: "aero", label: "Aero", hint: "'87–'93" },
];

// Lives inside the Drawer, so it starts fresh from the URL each time it opens.
function FiltersPanel({ params, brands, currentCount, onApply, onClose }) {
  // A draft, not the URL. On a phone the grid is hidden behind this panel, so
  // reloading it on every tap would be wasted work, and closing the panel
  // should be able to throw the changes away.
  const [draft, setDraft] = useState(() => new URLSearchParams(params));
  const [draftCount, setDraftCount] = useState(currentCount);

  const filters = readFilters(draft);
  const draftQuery = draft.toString();
  const urlQuery = params.toString();
  const fitHint = FIT_CHOICES.find((choice) => choice.value === filters.fits)?.hint;

  const change = (changes) => setDraft((current) => withChanges(current, changes));

  useEffect(() => {
    if (draftQuery === urlQuery) {
      setDraftCount(currentCount);
      return undefined;
    }

    setDraftCount(null);
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      // Only the total is needed, so ask for the smallest possible page.
      const countParams = new URLSearchParams(draftQuery);
      countParams.set("page_size", "1");
      try {
        const response = await fetch(`${API_BASE_URL}/listing/?${countParams}`, {
          signal: controller.signal,
        });
        if (!response.ok) return;
        const body = await response.json();
        setDraftCount(body.count);
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Error counting listings:", error);
        }
      }
    }, COUNT_DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [draftQuery, urlQuery, currentCount]);

  let showLabel = "Show results";
  if (draftCount !== null) {
    showLabel = `Show ${draftCount} ${draftCount === 1 ? "result" : "results"}`;
  }

  return (
    <>
      <DrawerHeader>
        <h2 id="browse-filters-title">Filters</h2>
        <button type="button" aria-label="Close filters" onClick={onClose}>
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <line x1="6" y1="6" x2="18" y2="18" />
            <line x1="18" y1="6" x2="6" y2="18" />
          </svg>
        </button>
      </DrawerHeader>

      <DrawerBody>
        <KeywordField
          id="drawer-keyword"
          live
          value={filters.q}
          onChange={(q) => change({ q })}
        />

        <fieldset className="filterGroup">
          <legend>Fits my car</legend>
          <div className="fitToggle">
            {FIT_CHOICES.map((choice) => (
              <button
                key={choice.value}
                type="button"
                aria-pressed={filters.fits === choice.value}
                onClick={() => change({ fits: choice.value })}
              >
                {choice.label}
              </button>
            ))}
          </div>
          {fitHint && (
            <p className="filterHint">
              {fitHint}, plus parts that fit all Fox Bodies.
            </p>
          )}
        </fieldset>

        <fieldset className="filterGroup">
          <legend>Category</legend>
          <div className="categoryChips">
            {CATEGORY_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={filters.category.includes(option.value)}
                onClick={() =>
                  change({ category: toggled(filters.category, option.value) })
                }
              >
                {option.label}
              </button>
            ))}
          </div>
        </fieldset>

        <BrandFilter
          id="drawer-brand"
          large
          brands={brands}
          selected={filters.brand}
          onChange={(brand) => change({ brand })}
        />

        <PriceFields
          idPrefix="drawer"
          live
          minPrice={filters.min_price}
          maxPrice={filters.max_price}
          onChange={change}
        />

        <ConditionChecks
          selected={filters.condition}
          onChange={(condition) => change({ condition })}
        />

        <StateFilter
          id="drawer-state"
          value={filters.state}
          onChange={(state) => change({ state })}
        />
      </DrawerBody>

      <DrawerFooter>
        <Button
          type="button"
          onClick={() => setDraft((current) => withoutFilters(current))}
        >
          Clear all
        </Button>
        <Button
          type="button"
          variant="contained"
          onClick={() => onApply(draft)}
        >
          {showLabel}
        </Button>
      </DrawerFooter>
    </>
  );
}

// MUI's Drawer brings the focus trap, Escape to close, scroll locking, and the
// backdrop, all of which are easy to get subtly wrong by hand.
export default function BrowseFiltersDrawer({
  open,
  onClose,
  params,
  brands,
  currentCount,
  onApply,
}) {
  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      aria-labelledby="browse-filters-title"
      // Above the nav's z-index of 9999, like the delete dialog and the toast.
      sx={{ zIndex: 10000 }}
      PaperProps={{
        sx: {
          borderRadius: "16px 16px 0 0",
          display: "flex",
          flexDirection: "column",
          height: "calc(100% - 64px)",
          // Landscape phones: every pixel counts, so use the whole screen.
          "@media (max-height: 500px)": { borderRadius: 0, height: "100%" },
        },
      }}
    >
      <FiltersPanel
        params={params}
        brands={brands}
        currentCount={currentCount}
        onApply={onApply}
        onClose={onClose}
      />
    </Drawer>
  );
}
