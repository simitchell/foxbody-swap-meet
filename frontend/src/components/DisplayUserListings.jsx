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
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  const getInfo = async () => {
    // console.log("here");
    try {
      // Signed in, because the API only sends dates to a listing's owner.
      const response = await apiFetch("/listing/");
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
  }, [location.pathname, location.state]);

  // Filter listings created by user_id
  const filteredListings = listingData.filter(
    (listing) => listing.username === localStorage.getItem("username"),
  );

  // Tell the page how many listings this user has, so Seller Tools can show
  // the count without fetching the listings a second time.
  useEffect(() => {
    if (!isLoading) onCountChange?.(filteredListings.length);
  }, [isLoading, filteredListings.length, onCountChange]);

  // console.log(filteredListings);

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
          {filteredListings.map((listing) => (
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
        : filteredListings.length === 0 && <NoDataDiv>No data found</NoDataDiv>}
    </DisplayListingsContainer>
  );
}
