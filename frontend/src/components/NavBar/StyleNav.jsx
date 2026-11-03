import styled from "styled-components";
import { navMenu } from "../GlobalStyles/breakpoints";

export const Nav = styled.nav`
  /* color-scheme: light dark; */
  position: absolute;
  top: 0;
  left: 0;
  z-index: 9999;
  width: 100%;
  min-height: 50px;
  background-color: #f2502c;
  display: flex;
  flex-direction: row;
  justify-content: space-between;

  a {
    color: #f5f5f5;
  }

  a:hover {
    color: #4e56f6;
  }

  .navCompanyName {
    p {
      font-size: 1.6rem;
      font-weight: bold;
      margin: auto;
      padding: 3px 10px;
      vertical-align: baseline;
    }
  }

  .searchBar {
    input {
      margin: auto;
      padding: .5rem;
      border-radius: 5px;
    }
    button {
      margin: 8px;
    }
  }

  .aboutUs {
    margin: 8px;
  }
  .howitworks {
    margin: 8px;
  }

  .navLink {
  }
`;

export const NavLeft = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-evenly;
  width: 60%;
  /* margin-left: 7.5%; */

  @media ${navMenu} {
    flex: 1;
    width: auto;
    justify-content: flex-start;

    .navCompanyName {
      display: none;
    }

    .searchBar {
      margin-left: 0.5rem;
    }
  }
`;

export const NavRight = styled.div`
  display: flex;
  flex-direction: row;
  width: 40%;
  /* margin-right: 7.5%; */
  /* text-align: right; */

  ul {
    display: flex;
    list-style: none;
    margin: auto;
    font-size: 1rem;
    padding: 3px 10px;
    vertical-align: baseline;
    justify-content: flex-start;
    width: 100%;
  }

  ul li {
    padding: 8px;
  }

  @media ${navMenu} {
    display: ${({ $open }) => ($open ? "flex" : "none")};
    position: absolute;
    top: 50px;
    left: 0;
    width: 100%;
    background-color: #f2502c;
    flex-direction: column;

    ul {
      flex-direction: column;
      padding: 0.25rem 0;
    }

    ul li {
      padding: 12px 16px;
    }
  }
`;

export const HamburgerButton = styled.button`
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  color: #f5f5f5;
  font-size: 1.5rem;
  padding: 8px;
  margin: auto 8px;
  line-height: 1;

  @media ${navMenu} {
    display: flex;
    align-items: center;
  }
`;
