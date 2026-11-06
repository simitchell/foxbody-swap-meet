import { API_BASE_URL } from "../config";
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import { useAuth } from "../AuthContext";
import { ProgressDiv } from "./GlobalStyles/StyleDisplayListing";
import {
  BrowseAllRow,
  FreshEmpty,
  FreshGrid,
  FreshHeading,
  FreshSection,
} from "./GlobalStyles/StyleHome";
import ListingCard from "./ListingCard";

const FRESH_LISTINGS = 12;

// The homepage's newest listings. Everything else is on /browse. "Newest" means
// bumped_at, so a listing with a future paid bump shows up here again.
export default function DisplayListings() {
  const { isAuth } = useAuth();
  const [listingData, setListingData] = useState([]);
  const [listingCount, setListingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  const getInfo = async () => {
    try {
      const apiUrl = `${API_BASE_URL}/listing/?page_size=${FRESH_LISTINGS}&ordering=-listed`;
      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();
      setListingData(data.results);
      setListingCount(data.count);
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getInfo();
  }, [location.state]);

  const browseAllText = `Browse all ${listingCount} ${
    listingCount === 1 ? "listing" : "listings"
  } →`;

  return (
    <FreshSection aria-labelledby="fresh-listings-heading">
      <FreshHeading>
        <div>
          <h2 id="fresh-listings-heading">Fresh Listings</h2>
          <p>The {FRESH_LISTINGS} newest parts on the swap meet.</p>
        </div>
        {/* Only once loaded, so it never flashes "Browse all 0 listings". */}
        {!isLoading && listingCount > 0 && (
          <Link to="/browse" className="browseAll">
            <span className="wide">{browseAllText}</span>
            <span className="compact">Browse all →</span>
          </Link>
        )}
      </FreshHeading>
      {isLoading ? (
        <ProgressDiv>
          <CircularProgress />
        </ProgressDiv>
      ) : listingData.length > 0 ? (
        <>
          <FreshGrid>
            {listingData.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </FreshGrid>
          <BrowseAllRow>
            <Button component={Link} to="/browse" variant="contained">
              {browseAllText}
            </Button>
          </BrowseAllRow>
        </>
      ) : (
        <FreshEmpty>
          <p>No listings yet. Be the first to post one!</p>
          {isAuth && <Link to="/createlisting">Create a Listing</Link>}
        </FreshEmpty>
      )}
    </FreshSection>
  );
}
