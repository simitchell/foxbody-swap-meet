import { API_BASE_URL } from "../config";
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import CircularProgress from "@mui/material/CircularProgress";
import {
  DisplayListingsContainer,
  ProgressDiv,
} from "./GlobalStyles/StyleDisplayListing";
import {
  CardContainer,
  Card,
  PriceBadge,
  ConditionDot,
  NoDataDiv,
} from "./GlobalStyles/StyleCard";
import conditionColor from "../utils/conditionColor";

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
                <Link to={`/listingdetail/${listing.id}`} key={listing.id}>
                  <Card className="card">
                    <div className="cardImage">
                      <img src={listing.image_url} alt={listing.title} />
                    </div>
                    <div className="cardBody">
                      <h2>{listing.title}</h2>
                      <div className="cardMeta">
                        <PriceBadge>${listing.price}</PriceBadge>
                        <span className="conditionRow">
                          <ConditionDot
                            color={conditionColor(listing.condition)}
                          />
                          {listing.condition}
                        </span>
                      </div>
                      <p className="seller">
                        {listing.username}
                        {listing.seller_state && ` · ${listing.seller_state}`}
                      </p>
                    </div>
                  </Card>
                </Link>
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
