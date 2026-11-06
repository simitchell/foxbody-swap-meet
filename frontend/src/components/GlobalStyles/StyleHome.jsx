import styled from "styled-components";
import { CardContainer } from "./StyleCard";
import { phone, compactHome } from "./breakpoints";

export const HomeContainer = styled.div``;

export const FreshSection = styled.section`
  margin: 3rem auto 0;
  max-width: 1100px;
  padding: 0 24px;

  @media ${compactHome} {
    margin-top: 24px;
    padding: 0 16px;
  }
`;

export const FreshHeading = styled.div`
  align-items: baseline;
  display: flex;
  gap: 16px;
  justify-content: space-between;
  margin-bottom: 16px;

  h2 {
    font-size: 24px;
    font-weight: 600;
    margin: 0;
  }

  p {
    color: #4b5563;
    font-size: 14px;
    margin: 4px 0 0;
  }

  .browseAll {
    flex: 0 0 auto;
    font-size: 15px;
    font-weight: 500;
    white-space: nowrap;
  }

  .compact {
    display: none;
  }

  @media ${compactHome} {
    margin-bottom: 4px;

    h2 {
      font-size: 20px;
    }

    p,
    .wide {
      display: none;
    }

    .compact {
      display: inline;
    }

    /* A 44px tap height without making the row look any taller. */
    .browseAll {
      align-items: center;
      display: inline-flex;
      font-size: 14px;
      min-height: 44px;
    }
  }
`;

// 4 x 3 on desktop. The shared grid's mid sizes give 3 or 4 columns, or 2 at
// the narrow end, and all of those divide 12 into even rows.
export const FreshGrid = styled(CardContainer)`
  padding: 0;

  @media (min-width: 1024px) {
    gap: 24px;
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  @media ${phone} {
    padding: 0;

    /* 8 on phones, four even rows. CSS rather than asking the server for fewer:
       one request, no resize listener, and nothing shifts as the page loads. */
    > a:nth-child(n + 9) {
      display: none;
    }
  }
`;

export const BrowseAllRow = styled.div`
  display: flex;
  justify-content: center;
  padding: 32px 0 40px;

  a {
    color: #fff;
    min-height: 46px;
    padding: 0 28px;
  }

  a:hover {
    color: #fff;
  }

  @media ${phone} {
    padding-top: 24px;

    a {
      min-height: 48px;
      width: 100%;
    }
  }
`;

export const FreshEmpty = styled.div`
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 40px 20px;
  text-align: center;

  p {
    font-size: 16px;
    font-weight: 500;
    margin: 0 0 8px;
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

  /* Too narrow for text + login side by side (the row would wrap below
     ~830px): stack them and center the login card under the text, instead of
     letting flex-wrap drop it alone on the left. 860 rather than 830 leaves
     room for a desktop scrollbar, which narrows the layout but not the width
     a media query sees. */
  @media (max-width: 860px) {
    flex-direction: column;
    align-items: center;
  }

  @media ${phone} {
    margin: 0 1rem;
  }

  /* Signed out on a phone (portrait or landscape), MobileWelcome replaces
     this block. Signed in, it still shows. */
  @media ${compactHome} {
    display: ${({ $hideOnPhone }) => ($hideOnPhone ? "none" : "flex")};
  }
`;

export const HomeWelcome = styled.div`
  /* Grow to fill the row, but shrink down to 360px before wrapping.
     min-width: 0 lets it go below its content's natural width (flex items
     default to min-width: auto, which would keep the long paragraph at full
     width and force the login card onto its own line). */
  flex: 1 1 360px;
  min-width: 0;

  /* Stacked (see HomeWrapper): in a column the flex-basis would set a 360px
     height, so turn it off. */
  @media (max-width: 860px) {
    flex: none;
  }

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

  /* Stacked: centered under the text, a bit wider than in the row. */
  @media (max-width: 860px) {
    flex: none;
    width: 100%;
    max-width: 420px;
  }
`;

// Phone-only welcome card for signed-out visitors (portrait and landscape).
// Hidden elsewhere, where the full welcome text + login form (HomeWrapper)
// shows instead.
export const MobileWelcome = styled.section`
  display: none;

  @media ${compactHome} {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin: 16px 16px 0;
    padding: 20px;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
  }

  /* Landscape phones: the card is only visible here via compactHome, so this
     only matters there. Cap and center it so the buttons aren't stretched
     across an 844px-wide screen. */
  @media (min-width: 641px) {
    max-width: 560px;
    margin: 16px auto 0;
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
