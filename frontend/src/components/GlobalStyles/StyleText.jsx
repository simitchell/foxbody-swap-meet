import styled from "styled-components";
import { phone } from "./breakpoints";

// A centered column of reading text, about 65 characters per line.
//
// The 16px side gutter keeps text off the screen edges on phones. box-sizing is
// border-box everywhere (index.css), so padding comes out of the box's width;
// adding the 32px to max-width keeps the desktop line length the same.
//
// $gutter={false} drops it where the parent already has side spacing, like the
// homepage's welcome block, so the gutter doesn't double up.
export const Text = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: ${({ $gutter = true }) => ($gutter ? "calc(65ch + 32px)" : "65ch")};
  padding: ${({ $gutter = true }) => ($gutter ? "0 16px" : "0")};
  /* Horizontal only, as in #45: a vertical auto margin would soak up spare
     height if a parent ever became a flex container. */
  margin: 0 auto;

  @media ${phone} {
    /* Browsers indent lists 40px, and each nested list another 40px. On a
       phone that's a big bite out of the line, so use 20px, which still
       leaves room for the bullet. Nested lists match this rule too. */
    ul {
      padding-left: 20px;
    }

    /* The default h2 is 24px with ~20px margins. 20px matches the homepage's
       Fresh Listings heading on phones and stays under its 22px h1. */
    h2 {
      font-size: 20px;
      margin: 16px 0 8px;
    }
  }
`;
