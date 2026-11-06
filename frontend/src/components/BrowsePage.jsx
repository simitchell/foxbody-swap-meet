import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import { API_BASE_URL } from "../config";
import apiErrorMessage from "../utils/apiErrorMessage";
import {
  activeTags,
  readFilters,
  SORT_OPTIONS,
  withChanges,
  withoutFilters,
} from "../utils/browseFilters";
import BrowseActiveTags from "./BrowseActiveTags";
import BrowseFiltersDrawer from "./BrowseFiltersDrawer";
import BrowsePagination from "./BrowsePagination";
import BrowseSidebar from "./BrowseSidebar";
import ListingCard from "./ListingCard";
import Toast from "./Toast";
import { ProgressDiv } from "./GlobalStyles/StyleUtility";
import {
  BrowseContainer,
  BrowseEmpty,
  BrowseGrid,
  BrowseHeading,
  BrowseLayout,
  BrowseResults,
  FiltersButton,
  HeadingControls,
  CompactCount,
  SortField,
} from "./GlobalStyles/StyleBrowse";

// Matches ListingPagination's page_size in the backend.
const PAGE_SIZE = 24;

export default function BrowsePage() {
  // The single source of truth for filters. There's deliberately no copy in
  // useState that could drift from it, so the back button, refresh, and shared
  // links all work without extra code.
  const [searchParams, setSearchParams] = useSearchParams();
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [brands, setBrands] = useState([]);
  const [brandsStatus, setBrandsStatus] = useState("loading");
  const [toast, setToast] = useState({ open: false, message: "" });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const resultsTop = useRef(null);

  const query = searchParams.toString();
  const filters = readFilters(searchParams);
  const page = Number(searchParams.get("page")) || 1;
  const tags = activeTags(filters, brands);

  const showError = (message) => setToast({ open: true, message });

  useEffect(() => {
    const controller = new AbortController();
    const getBrands = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/brands/`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Brand list request failed");
        setBrands(await response.json());
        setBrandsStatus("loaded");
      } catch (error) {
        if (error.name === "AbortError") return;
        console.error("Error fetching brands:", error);
        setBrandsStatus("failed");
      }
    };
    getBrands();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    // A brand in the URL has to be checked against the list first.
    if (filters.brand.length > 0 && brandsStatus === "loading") return undefined;

    // A brand can be merged away after someone saves a link. The API would
    // reject it, so drop it quietly and show the rest of the search.
    if (brandsStatus === "loaded") {
      const known = filters.brand.filter((slug) =>
        brands.some((brand) => brand.slug === slug),
      );
      if (known.length !== filters.brand.length) {
        const params = new URLSearchParams(searchParams);
        params.delete("brand");
        known.forEach((slug) => params.append("brand", slug));
        setSearchParams(params, { replace: true });
        return undefined;
      }
    }

    // Cancels the previous request if the URL changes again. Otherwise a slow
    // old response could arrive last and overwrite the newer results.
    const controller = new AbortController();

    const getListings = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/listing/?${query}`, {
          signal: controller.signal,
        });
        // A page past the end, like an old link after listings sold.
        if (response.status === 404 && searchParams.has("page")) {
          const params = new URLSearchParams(searchParams);
          params.delete("page");
          setSearchParams(params, { replace: true });
          return;
        }
        const body = await response.json().catch(() => null);
        if (!response.ok) {
          showError(apiErrorMessage(body, "Couldn't load listings."));
          setIsLoading(false);
          return;
        }
        setResults(body);
        setIsLoading(false);
      } catch (error) {
        if (error.name === "AbortError") return;
        console.error("Error fetching listings:", error);
        showError("Couldn't reach the server. Please try again.");
        setIsLoading(false);
      }
    };

    getListings();
    return () => controller.abort();
  }, [query, brandsStatus]);

  // Back to the top of the results on a new page, but not on arriving here.
  const previousPage = useRef(page);
  useEffect(() => {
    if (previousPage.current !== page) {
      previousPage.current = page;
      resultsTop.current?.scrollIntoView();
    }
  }, [page]);

  const applyChanges = (changes) => setSearchParams(withChanges(searchParams, changes));
  const clearFilters = () => setSearchParams(withoutFilters(searchParams));
  const applyDraft = (draft) => {
    setDrawerOpen(false);
    // Skips adding a back-button step when nothing changed.
    if (draft.toString() !== query) setSearchParams(draft);
  };

  const count = results?.count ?? 0;
  const pageCount = Math.ceil(count / PAGE_SIZE);
  const firstShown = (page - 1) * PAGE_SIZE + 1;
  const lastShown = Math.min(page * PAGE_SIZE, count);
  const hasFitBrandOrCategory =
    filters.fits || filters.category.length > 0 || filters.brand.length > 0;

  return (
    <BrowseContainer>
      <BrowseLayout>
        <BrowseSidebar
          filters={filters}
          brands={brands}
          onChange={applyChanges}
          onClear={clearFilters}
        />

        <BrowseResults ref={resultsTop} $loading={isLoading && results !== null}>
          <BrowseHeading>
            <div>
              <h1>Browse Parts</h1>
              {results && count > 0 && (
                <p className="wideCount">
                  Showing {firstShown}–{lastShown} of {count}{" "}
                  {count === 1 ? "result" : "results"}
                </p>
              )}
            </div>
            <HeadingControls>
              <FiltersButton>
                <Button
                  variant="outlined"
                  type="button"
                  fullWidth
                  onClick={() => setDrawerOpen(true)}
                  startIcon={
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      aria-hidden="true"
                    >
                      <line x1="4" y1="6" x2="20" y2="6" />
                      <line x1="7" y1="12" x2="17" y2="12" />
                      <line x1="10" y1="18" x2="14" y2="18" />
                    </svg>
                  }
                >
                  Filters{tags.length > 0 && ` (${tags.length})`}
                </Button>
              </FiltersButton>
              <SortField>
                <label htmlFor="browse-sort">Sort</label>
                <select
                  id="browse-sort"
                  value={filters.ordering}
                  onChange={(e) => applyChanges({ ordering: e.target.value })}
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </SortField>
            </HeadingControls>
          </BrowseHeading>

          <BrowseActiveTags
            tags={tags}
            onRemove={applyChanges}
            onClear={clearFilters}
          />

          {results && count > 0 && (
            <CompactCount>
              {count} {count === 1 ? "result" : "results"}
              {pageCount > 1 && ` · page ${page} of ${pageCount}`}
            </CompactCount>
          )}

          {!results && isLoading && (
            <ProgressDiv>
              <CircularProgress />
            </ProgressDiv>
          )}

          {results && count === 0 && (
            <BrowseEmpty>
              <p className="message">
                {tags.length > 0
                  ? "No parts match those filters."
                  : "No parts have been listed yet."}
              </p>
              {hasFitBrandOrCategory && (
                <p className="note">
                  {"Some older listings don't have a category, fit or brand set yet."}
                </p>
              )}
              {tags.length > 0 && (
                <Button variant="outlined" type="button" onClick={clearFilters}>
                  Clear filters
                </Button>
              )}
            </BrowseEmpty>
          )}

          {results && count > 0 && (
            <>
              <BrowseGrid>
                {results.results.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </BrowseGrid>
              <BrowsePagination page={page} pageCount={pageCount} />
            </>
          )}
        </BrowseResults>
      </BrowseLayout>
      <BrowseFiltersDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        params={searchParams}
        brands={brands}
        currentCount={count}
        onApply={applyDraft}
      />
      <Toast
        open={toast.open}
        message={toast.message}
        severity="error"
        onClose={() => setToast({ ...toast, open: false })}
      />
    </BrowseContainer>
  );
}
