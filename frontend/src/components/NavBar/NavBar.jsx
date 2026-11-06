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
  const [lastSearch, setLastSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleChangeSearch = (e) => {
    setSearch(e.target.value);
    setLastSearch(e.target.value);
  };

  const handleSearchClick = (e) => {
    if (search === "") {
      navigate(`/search/${lastSearch}`);
    } else {
      navigate(`search/${search}`);
      setSearch("");
    }
  };

  const handleEnter = (e) => {
    const code = e.keyCode || e.which;
    if (code === 13) {
      navigate(`/search/${search}`);
      setSearch("");
    } else {
      navigate("/");
    }
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
            onChange={handleChangeSearch}
            onKeyDown={handleEnter}
          />
          <Button
            variant="contained"
            size="small"
            type="button"
            onClick={(e) => {
              handleSearchClick(e);
            }}
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
