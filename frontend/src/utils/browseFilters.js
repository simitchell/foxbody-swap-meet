import FITMENT from "./fitment";
import { formatPrice } from "./formatPrice";
import { CATEGORY_OPTIONS, CONDITION_OPTIONS } from "./listingChoices";

// Helpers for /browse, where the URL's query string holds every filter. The
// names match the listing API's params, so the page can forward them as they are.

const FILTER_KEYS = [
  "q",
  "min_price",
  "max_price",
  "condition",
  "category",
  "brand",
  "fits",
  "state",
];

export const DEFAULT_ORDERING = "-listed";

export const SORT_OPTIONS = [
  { value: "-listed", label: "Newest" },
  { value: "price", label: "Price: low to high" },
  { value: "-price", label: "Price: high to low" },
];

export function readFilters(params) {
  return {
    q: params.get("q") ?? "",
    min_price: params.get("min_price") ?? "",
    max_price: params.get("max_price") ?? "",
    condition: params.getAll("condition"),
    category: params.getAll("category"),
    brand: params.getAll("brand"),
    fits: params.get("fits") ?? "",
    state: params.get("state") ?? "",
    ordering: params.get("ordering") ?? DEFAULT_ORDERING,
  };
}

// Returns new params with the changes applied. Always drops page, because page
// 3 of the old results may not exist in the new ones. Empty values and the
// default sort stay out of the URL, which keeps links short.
export function withChanges(params, changes) {
  const next = new URLSearchParams(params);
  next.delete("page");
  Object.entries(changes).forEach(([key, value]) => {
    next.delete(key);
    if (key === "ordering" && value === DEFAULT_ORDERING) return;
    const values = Array.isArray(value) ? value : [value];
    values.filter(Boolean).forEach((item) => next.append(key, item));
  });
  return next;
}

// Keeps the sort, since that's not a filter.
export function withoutFilters(params) {
  const next = new URLSearchParams(params);
  next.delete("page");
  FILTER_KEYS.forEach((key) => next.delete(key));
  return next;
}

export function toggled(list, value) {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

function priceLabel(min, max) {
  if (min && max) return `${formatPrice(min)}–${formatPrice(max)}`;
  if (max) return `Under ${formatPrice(max)}`;
  return `${formatPrice(min)} and up`;
}

function labelFor(options, value) {
  return options.find((option) => option.value === value)?.label ?? value;
}

// One entry per removable pill. `changes` is what removing it applies.
export function activeTags(filters, brands) {
  const tags = [];
  const without = (list, item) => list.filter((value) => value !== item);

  if (filters.q) {
    tags.push({ id: "q", label: `“${filters.q}”`, changes: { q: "" } });
  }
  if (filters.fits) {
    tags.push({
      id: "fits",
      label: `Fits: ${FITMENT[filters.fits]?.label ?? filters.fits}`,
      fits: filters.fits,
      changes: { fits: "" },
    });
  }
  filters.category.forEach((value) => {
    tags.push({
      id: `category-${value}`,
      label: labelFor(CATEGORY_OPTIONS, value),
      changes: { category: without(filters.category, value) },
    });
  });
  filters.brand.forEach((value) => {
    tags.push({
      id: `brand-${value}`,
      label: brands.find((brand) => brand.slug === value)?.name ?? value,
      changes: { brand: without(filters.brand, value) },
    });
  });
  if (filters.min_price || filters.max_price) {
    tags.push({
      id: "price",
      label: priceLabel(filters.min_price, filters.max_price),
      changes: { min_price: "", max_price: "" },
    });
  }
  filters.condition.forEach((value) => {
    tags.push({
      id: `condition-${value}`,
      label: labelFor(CONDITION_OPTIONS, value),
      changes: { condition: without(filters.condition, value) },
    });
  });
  if (filters.state) {
    tags.push({ id: "state", label: filters.state, changes: { state: "" } });
  }
  return tags;
}
