import { useEffect, useState } from "react";
import Autocomplete, { createFilterOptions } from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import { API_BASE_URL } from "../config";
import apiErrorMessage from "../utils/apiErrorMessage";
import apiFetch from "../utils/apiFetch";
import { BrandInput, FieldError } from "./GlobalStyles/StyleListingFields";

const defaultFilter = createFilterOptions();

const normalize = (text) => text.trim().replace(/\s+/g, " ").toLowerCase();

// Picks a brand, or suggests one that isn't listed. The choice reaches the form
// through a hidden input, so the forms read it like any other field. Blank
// means no brand, and on an edit that clears it.
export default function BrandField({ defaultSlug, defaultName }) {
  const [brands, setBrands] = useState([]);
  const [brand, setBrand] = useState(
    defaultSlug ? { slug: defaultSlug, name: defaultName } : null,
  );
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const getBrands = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/brands/`);
        if (!response.ok || cancelled) return;
        const data = await response.json();
        if (!cancelled) setBrands(data);
      } catch (fetchError) {
        // The field still works: a seller can type a name and choose "Add".
        console.error("Error fetching brands:", fetchError);
      }
    };
    getBrands();
    return () => {
      cancelled = true;
    };
  }, []);

  const suggestBrand = async (name) => {
    setIsSuggesting(true);
    setError("");
    try {
      const response = await apiFetch("/brands/suggest/", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        setBrand(null);
        setError(apiErrorMessage(body, "Couldn't add that brand."));
        return;
      }
      setBrand(body);
    } catch (suggestError) {
      console.error("Error suggesting brand:", suggestError);
      setBrand(null);
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setIsSuggesting(false);
    }
  };

  // A pending brand isn't in the public list, but it can be this listing's.
  const options =
    brand && !brands.some((option) => option.slug === brand.slug)
      ? [...brands, brand]
      : brands;

  return (
    <div className="field">
      <label htmlFor="listing-brand">Brand (optional)</label>
      <input type="hidden" name="brand" value={brand?.slug ?? ""} />
      <BrandInput>
        <Autocomplete
          id="listing-brand"
          options={options}
          value={brand}
          loading={isSuggesting}
          autoHighlight
          selectOnFocus
          clearOnBlur
          handleHomeEndKeys
          isOptionEqualToValue={(option, value) => option.slug === value.slug}
          getOptionLabel={(option) => option.name}
          filterOptions={(list, state) => {
            const filtered = defaultFilter(list, state);
            const typed = state.inputValue.trim().replace(/\s+/g, " ");
            const isListed = list.some(
              (option) => normalize(option.name) === normalize(typed),
            );
            // The extra option is only offered when nothing already matches.
            if (typed && !isListed) {
              filtered.push({ isNew: true, newName: typed, name: `Add “${typed}”` });
            }
            return filtered;
          }}
          onChange={(_event, option) => {
            setError("");
            if (option?.isNew) {
              setBrand(null);
              suggestBrand(option.newName);
            } else {
              setBrand(option);
            }
          }}
          noOptionsText="No brands found"
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Search brands"
              inputProps={{
                ...params.inputProps,
                "aria-describedby": error
                  ? "listing-brand-hint listing-brand-error"
                  : "listing-brand-hint",
              }}
            />
          )}
        />
      </BrandInput>
      <small id="listing-brand-hint" className="brandHint">
        Not in the list? Type the name and choose “Add …”. Leave blank if unbranded
        or unknown.
      </small>
      {error && <FieldError id="listing-brand-error">{error}</FieldError>}
    </div>
  );
}
