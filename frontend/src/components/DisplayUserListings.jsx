import { API_BASE_URL } from "../config";
import { CardContainer, NoDataDiv } from "./GlobalStyles/StyleCard";
import ListingCard from "./ListingCard";
import { useState, useEffect } from "react";
import React from "react";
import CircularProgress from "@mui/material/CircularProgress";
import { useLocation } from "react-router-dom";
import {
  DisplayListingsContainer,
  ProgressDiv,
} from "./GlobalStyles/StyleDisplayListing";

export default function DisplayUserListings({ onCountChange }) {
  const [listingData, setListingData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  const getInfo = async () => {
    // console.log("here");
    try {
      const apiUrl = `${API_BASE_URL}/listing/`;
      const response = await fetch(apiUrl);
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
            <ListingCard key={listing.id} listing={listing} showSeller={false} />
          ))}
        </CardContainer>
      )}
      {isLoading
        ? null
        : filteredListings.length === 0 && <NoDataDiv>No data found</NoDataDiv>}
    </DisplayListingsContainer>
  );
}
