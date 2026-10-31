import styled from "styled-components";

// Page column: everything on the profile page stacks inside this, 24px apart.
export const ProfileContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 1100px;
  margin: 0 auto;
  padding: 32px 24px;

  @media (max-width: 640px) {
    padding: 24px 16px;
  }
`;

// Shared card look, matching the cart and listing-detail panels.
export const Panel = styled.section`
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 24px 28px;

  h2 {
    font-size: 18px;
    font-weight: 600;
    margin: 0 0 16px;
  }

  @media (max-width: 640px) {
    padding: 20px;
  }
`;

export const WelcomePanel = styled(Panel)`
  h1 {
    font-size: 26px;
    font-weight: 600;
    margin: 0 0 8px;
  }

  p {
    color: #4b5563;
    margin: 0;
    line-height: 1.5;
  }
`;

// Side-by-side panels. align-items: stretch keeps both the height of the
// taller one; flex-wrap stacks them once there isn't room for both.
export const PanelRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  align-items: stretch;
`;

// flex-grow 999 means this panel takes nearly all the spare width, so Seller
// Tools stays near its 260px basis. min-width: 0 lets long content shrink
// instead of pushing the row wider than the screen.
export const InfoPanel = styled(Panel)`
  flex: 999 1 420px;
  min-width: 0;
`;

export const ToolsPanel = styled(Panel)`
  flex: 1 1 260px;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;

  /* 4px + the 12px gap = the same 16px under the heading as Current Information. */
  h2 {
    margin-bottom: 4px;
  }

  /* margin-top: auto pushes this to the bottom of the stretched panel. */
  .listingCount {
    margin: auto 0 0;
    padding-top: 8px;
    font-size: 13px;
    color: #6b7280;
  }
`;

// View mode: label/value pairs. max-content sizes the label column to the
// longest label, and the value column takes the rest.
export const InfoList = styled.dl`
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  column-gap: 24px;
  row-gap: 12px;
  margin: 0;

  dt {
    color: #6b7280;
  }

  dd {
    color: #111;
    margin: 0;
    overflow-wrap: anywhere;
  }

  /* Keep line breaks the user typed in their bio. */
  .bio {
    white-space: pre-line;
  }

  .empty {
    color: #9ca3af;
  }

  /* On phones the longest label would squeeze values into a sliver, so stack
     each label above its value instead. */
  @media (max-width: 640px) {
    grid-template-columns: minmax(0, 1fr);
    row-gap: 2px;

    dt {
      font-size: 13px;
    }

    dd + dt {
      margin-top: 12px;
    }
  }
`;
