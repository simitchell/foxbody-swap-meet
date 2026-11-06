import { API_BASE_URL } from "../config";
import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import CircularProgress from "@mui/material/CircularProgress";
import {
  DisplayListingsContainer,
  ProgressDiv,
} from "./GlobalStyles/StyleDisplayListing";
import { CardContainer, NoDataDiv } from "./GlobalStyles/StyleCard";
import ListingCard from "./ListingCard";

export default function DisplayListings() {
  const [listingData, setListingData] = useState([]);
  const [listingCount, setListingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  const getInfo = async () => {
    try {
      // TODO(PR 4): replace with the 12 newest. Until then this shows the newest
      // 100, the most one page can hold, while the count stays the full total.
      const apiUrl = `${API_BASE_URL}/listing/?page_size=100`;
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

  return (
    <DisplayListingsContainer>
      <div className="listingHeader">
        <h2>Current Listings</h2>
        {/* Only once loaded, so it never flashes "0 listings". Hidden unless
            a page shows it (the homepage does, on phones). */}
        {!isLoading && (
          <span className="listingCount">
            {listingCount} {listingCount === 1 ? "listing" : "listings"}
          </span>
        )}
      </div>
      {isLoading ? (
        <ProgressDiv>
          <CircularProgress />
        </ProgressDiv>
      ) : (
        <div>
          {listingData.length > 0 ? (
            <CardContainer>
              {listingData.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </CardContainer>
          ) : (
            <NoDataDiv>No listings found</NoDataDiv>
          )}
        </div>
      )}
    </DisplayListingsContainer>
  );
}
