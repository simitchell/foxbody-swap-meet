import apiFetch from "../utils/apiFetch";
import { CardContainer, NoDataDiv } from "./GlobalStyles/StyleCard";
import ListingCard from "./ListingCard";
import { ListingAgeRow } from "./ListingAge";
import { useState, useEffect } from "react";
import React from "react";
import CircularProgress from "@mui/material/CircularProgress";
import { useLocation } from "react-router-dom";
import {
  DisplayListingsContainer,
  ProgressDiv,
} from "./GlobalStyles/StyleDisplayListing";

// showListingAge: only the profile page passes it, so listing dates stay on
// the seller's own dashboard.
export default function DisplayUserListings({ onCountChange, showListingAge }) {
  const [listingData, setListingData] = useState([]);
  const [listingCount, setListingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  const getInfo = async () => {
    // console.log("here");
    try {
      // Signed in, because the API only sends dates to a listing's owner.
      const userId = localStorage.getItem("userId");
      const response = await apiFetch(`/listing/?user=${userId}&page_size=100`);
      // An expired session is already on its way to the login page.
      if (!response.ok) return;
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
  }, [location.pathname, location.state]);

  // Tell the page how many listings this user has, so Seller Tools can show
  // the count without fetching the listings a second time.
  useEffect(() => {
    if (!isLoading) onCountChange?.(listingCount);
  }, [isLoading, listingCount, onCountChange]);

  return (
    <DisplayListingsContainer>
      <div className="listingHeader">
        <h2>Your Listings</h2>
      </div>
      {isLoading ? (
        <ProgressDiv>
          <CircularProgress />
        </ProgressDiv>
      ) : (
        <CardContainer>
          {listingData.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              ownerMeta={
                showListingAge && listing.created_at !== undefined ? (
                  <ListingAgeRow createdAt={listing.created_at} />
                ) : undefined
              }
            />
          ))}
        </CardContainer>
      )}
      {isLoading
        ? null
        : listingData.length === 0 && <NoDataDiv>No data found</NoDataDiv>}
    </DisplayListingsContainer>
  );
}
