import { API_BASE_URL } from "../config";
import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import { NoDataDiv, ProgressDiv, SearchHeader } from "./GlobalStyles/StyleSearch";
import { CardContainer } from "./GlobalStyles/StyleCard";
import ListingCard from "./ListingCard";
import CircularProgress from '@mui/material/CircularProgress';


export default function Search() {
  const params = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [listingSearch, setListingSearch] = useState();
  const [search, setSearch] = useState("");
  const [lastSearch, setLastSearch] = useState("");
  const navigate = useNavigate();

  async function getSearch() {
    const url = `${API_BASE_URL}/listing/?search=${params.search}`;
    try {
      const response = await fetch(url);
      const result = await response.json();
      setListingSearch(result);
      console.log(result);
      return result;
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }
  useEffect(() => {
    getSearch();
  }, [params.search]);

  return (
    <div>
      <SearchHeader>
        <h2>Search Results</h2>
        <h3>Results matching "{params.search}"</h3>
      </SearchHeader>
      {isLoading ? (
        <ProgressDiv><CircularProgress /></ProgressDiv>
      ) : listingSearch ? (
        <CardContainer>
          {listingSearch.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </CardContainer>
      ) : (
        <div>No items matching search parameters</div>
      )}
      {!isLoading && listingSearch.length === 0 && (
        <NoDataDiv>No data found</NoDataDiv>
      )}
    </div>
  );
  
}
