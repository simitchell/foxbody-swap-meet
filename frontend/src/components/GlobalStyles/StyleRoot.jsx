import styled from "styled-components";
import { compactHome } from "./breakpoints";

export const StyleRoot = styled.div`
  /* background-color: blue; */
  width: 500px;
  max-width: 80%;
  /* Horizontal only: this is a flex item in #root's column, where a vertical
     auto margin would soak up leftover height and move the logo per page. */
  margin: 0 auto;
  padding: 2rem;
  h2 {
    text-align: right;
  }

  /* Phones, portrait and landscape: the banner took ~140px (portrait) to
     ~190px (landscape) before any content. Less padding and a smaller logo
     roughly halve that. */
  @media ${compactHome} {
    padding: 8px 16px;
  }
`;

export const Logo = styled.div`
  height: auto;
  width: 100%;
  max-width: 600px;

  svg {
    max-width: 100%;
    overflow: hidden;
  }

  @media ${compactHome} {
    max-width: 240px;
    margin: 0 auto;
  }
`;