import styled from "styled-components";
import { CardContainer } from "./StyleCard";

export const HomeContainer = styled.div`
  .listingHeader {
    text-align: center;
    margin: 3rem;
  }

  /* Phones: heading on the left, listing count on the right. */
  @media (max-width: 640px) {
    .listingHeader {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 12px;
      margin: 24px 16px 12px;
      text-align: left;
    }
    .listingHeader h2 {
      margin: 0;
    }
    /* Two classes, so it beats DisplayListings' own .listingCount { display: none }. */
    .listingHeader .listingCount {
      display: inline;
      color: #6b7280;
      font-size: 14px;
      white-space: nowrap;
    }
    /* The shared grid has 16px of padding; drop the top part here so the gap
       under the heading row is just its 12px margin. The selector below is
       the grid's own generated class, so this only applies inside the homepage. */
    ${CardContainer} {
      padding-top: 0;
    }
  }
`;

export const HomeWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  margin: 0 10%;
  /* $justify is a transient prop: styled-components reads it here but doesn't
     pass it on to the DOM <div>. */
  justify-content: ${({ $justify }) => $justify};

  @media (max-width: 640px) {
    margin: 0 1rem;
    /* Signed out on a phone, MobileWelcome replaces this block. */
    display: ${({ $hideOnPhone }) => ($hideOnPhone ? "none" : "flex")};
  }
`;

export const HomeWelcome = styled.div`
  ul {
    list-style-type: none;
    padding-left: 0; /* line up with the paragraph above (browsers indent <ul>) */
    li {
      margin-bottom: 1rem;
    }
  }
`;

export const HomeLogin = styled.div`
  flex: 0 0 280px;
  max-width: 100%;
`;

// Phone-only welcome card for signed-out visitors. Hidden above 640px, where
// the full welcome text + login form (HomeWrapper) shows instead.
export const MobileWelcome = styled.section`
  display: none;

  @media (max-width: 640px) {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin: 16px 16px 0;
    padding: 20px;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
  }

  h1 {
    margin: 0;
    font-size: 22px;
    font-weight: 600;
    line-height: 1.25;
  }

  .tagline {
    margin: 0;
    color: #4b5563;
    font-size: 15px;
  }

  .actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .actions a {
    min-height: 46px;
  }

  .newHere {
    margin: 0;
    text-align: center;
    color: #6b7280;
    font-size: 14px;
  }
`;
