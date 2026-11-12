import styled from "styled-components";

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
`;
