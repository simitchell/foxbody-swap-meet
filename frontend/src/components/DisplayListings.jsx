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
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  const getInfo = async () => {
    try {
      const apiUrl = `${API_BASE_URL}/listing/`;
      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();
      setListingData(data);
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
            {listingData.length} {listingData.length === 1 ? "listing" : "listings"}
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
