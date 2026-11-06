import { useState } from "react";
import React from "react";
import { Nav, NavLeft, NavRight, HamburgerButton } from "./StyleNav";
import Button from "@mui/material/Button";
import { Link, useNavigate } from "react-router-dom";
import { LogoSVGSmall } from "../../../public/FoxBodySwapMeetLogoSmall";
import { useAuth } from "../../AuthContext";


export default function MainNav() {
  const { isAuth, username } = useAuth();
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Always a fresh search: this is the quick, broad tool, so it starts from
  // everything rather than narrowing whatever filters happen to be on. The
  // sidebar is there for narrowing.
  const runSearch = () => {
    const term = search.trim();
    navigate(term ? `/browse?${new URLSearchParams({ q: term })}` : "/browse");
    setSearch("");
  };

  return (
    <Nav>
      <NavLeft>
        <div className="navCompanyName">
          <Link to="/">{LogoSVGSmall}</Link>
        </div>
        <div className="searchBar">
          <input
            type="search"
            placeholder="Search Listings"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") runSearch();
            }}
          />
          <Button
            variant="contained"
            size="small"
            type="button"
            onClick={runSearch}
          >
            Search
          </Button>
        </div>
      </NavLeft>
      <HamburgerButton
        aria-label="Toggle navigation"
        onClick={() => setMenuOpen((prev) => !prev)}
      >
        {menuOpen ? "✕" : "☰"}
      </HamburgerButton>
      <NavRight $open={menuOpen}>
        <ul>
          <li>
            <Link to="/browse">Browse</Link>
          </li>
          <li>
            <Link to="/aboutus">About Us</Link>
          </li>
          <li>
            <Link to="/howitworks">How It Works</Link>
          </li>
          {isAuth ? (
            <>
              <li>
                <Link to="/cart">Cart</Link>
              </li>
              <li>
                <Link to="/profile">{username}</Link>
              </li>
            </>
          ) : (
            <li>
              <Link to="/login">Log In or Register</Link>
            </li>
          )}
          {isAuth ? (
            <>
              <li>
                <Link to="/logout">Logout</Link>
              </li>
            </>
          ) : null}
        </ul>
      </NavRight>
    </Nav>
  );
}
