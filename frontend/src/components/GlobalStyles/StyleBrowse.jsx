import styled from "styled-components";
import { navMenu } from "./breakpoints";
import { CardContainer } from "./StyleCard";

export const BrowseContainer = styled.div`
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 24px 48px;

  @media ${navMenu} {
    padding: 0 0 40px;
  }
`;

export const BrowseLayout = styled.div`
  align-items: flex-start;
  display: flex;
  gap: 32px;
`;

// Each field is shared with the phone Filters panel, so the classes live here.
export const FilterPanel = styled.aside`
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  display: flex;
  flex: 0 0 260px;
  flex-direction: column;
  font-size: 14px;
  gap: 22px;
  padding: 20px;

  @media ${navMenu} {
    display: none;
  }

  .filterField {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .filterField > label,
  .filterGroup legend {
    font-weight: 600;
  }

  .filterGroup {
    border: none;
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin: 0;
    min-width: 0;
    padding: 0;
  }

  .filterGroup legend {
    margin-bottom: 8px;
    padding: 0;
  }

  .filterChoice {
    align-items: center;
    cursor: pointer;
    display: flex;
    gap: 8px;
  }

  .filterHint {
    color: #6b7280;
    font-size: 12px;
    line-height: 1.4;
    margin: 2px 0 0;
  }

  input[type="search"],
  input[type="text"],
  select {
    background: #fff;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    box-sizing: border-box;
    font-family: inherit;
    font-size: 14px;
    height: 38px;
    min-width: 0;
    padding: 0 10px;
    width: 100%;
  }

  .priceRow {
    align-items: center;
    display: grid;
    gap: 8px;
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  }

  .visuallyHidden {
    height: 1px;
    overflow: hidden;
    position: absolute;
    width: 1px;
  }
`;

// MUI's input. The && rules undo the panel's input styles, which would otherwise
// draw a second border inside MUI's.
export const BrowseBrandInput = styled.div`
  && .MuiOutlinedInput-root {
    background: #fff;
    border-radius: 6px;
    font-family: inherit;
    font-size: 14px;
    min-height: 38px;
    padding-bottom: 3px;
    padding-top: 3px;
  }

  && .MuiOutlinedInput-notchedOutline {
    border-color: #d1d5db;
  }

  && input {
    background: transparent;
    border: none;
    height: auto;
    padding: 4px;
    width: 0;
  }

  .MuiChip-root {
    font-family: inherit;
    height: 24px;
    max-width: 170px;
  }
`;

export const BrandOption = styled.span`
  font-size: 14px;

  span {
    color: #6b7280;
  }
`;

export const TagRow = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;

  @media ${navMenu} {
    margin: 12px 0 0;
    padding: 0 16px;
  }

  .clearLink {
    background: none;
    border: none;
    color: #1565c0;
    cursor: pointer;
    font-size: 13px;
    margin-left: 4px;
    padding: 4px;
  }
`;

export const FilterTag = styled.button`
  background: ${({ $background }) => $background ?? "#fff"};
  border: 1px solid ${({ $background }) => ($background ? "transparent" : "#d1d5db")};
  border-radius: 999px;
  color: ${({ $color }) => $color ?? "#374151"};
  font-size: 13px;
  font-weight: 500;
  height: 32px;
  padding: 0 12px;
  white-space: nowrap;
`;

export const SortField = styled.div`
  align-items: center;
  display: flex;
  flex: 0 0 auto;
  font-size: 14px;
  gap: 8px;

  label {
    color: #4b5563;
  }

  select {
    background: #fff;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-family: inherit;
    font-size: 14px;
    height: 38px;
    padding: 0 8px;
  }
`;

export const BrowseEmpty = styled.div`
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 40px 20px;
  text-align: center;

  @media ${navMenu} {
    margin: 16px;
  }

  .message {
    font-size: 16px;
    font-weight: 500;
    margin: 0 0 8px;
  }

  .note {
    color: #6b7280;
    font-size: 13px;
    margin: 0 0 16px;
  }
`;

// Leaves a little room above the heading after scrolling back to it.
export const BrowseResults = styled.div`
  flex: 1;
  min-width: 0;
  scroll-margin-top: 70px;
  opacity: ${({ $loading }) => ($loading ? 0.5 : 1)};
  transition: opacity 0.15s;
`;

export const BrowseHeading = styled.div`
  align-items: flex-end;
  display: flex;
  gap: 16px;
  justify-content: space-between;
  margin-bottom: 16px;

  h1 {
    font-size: 26px;
    font-weight: 600;
    margin: 0;
  }

  p {
    color: #4b5563;
    font-size: 14px;
    margin: 4px 0 0;
  }

  .compactCount {
    display: none;
  }

  @media ${navMenu} {
    padding: 0 16px;
    margin-bottom: 0;

    h1 {
      font-size: 22px;
    }

    .wideCount {
      display: none;
    }

    .compactCount {
      display: block;
    }
  }
`;

// Three columns in the space beside the filters. Smaller screens keep the
// shared grid's own sizes.
export const BrowseGrid = styled(CardContainer)`
  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 20px;
    padding: 0;
  }
`;

export const NumberedPages = styled.nav`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding-top: 24px;
  font-size: 14px;

  a,
  span {
    align-items: center;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    box-sizing: border-box;
    color: #111;
    display: flex;
    font-weight: 400;
    height: 40px;
    justify-content: center;
    min-width: 40px;
    padding: 0 12px;
  }

  a[aria-current="page"] {
    background: #1976d2;
    border-color: #1976d2;
    color: #fff;
    font-weight: 500;
  }

  .disabled {
    color: #6b7280;
  }

  .ellipsis {
    background: none;
    border: none;
    min-width: 24px;
    padding: 0;
  }

  @media ${navMenu} {
    display: none;
  }
`;

export const CompactPages = styled.nav`
  display: none;

  @media ${navMenu} {
    align-items: center;
    display: grid;
    gap: 8px;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    padding: 8px 16px 0;
  }

  a,
  .disabled {
    align-items: center;
    background: #fff;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    box-sizing: border-box;
    color: #1976d2;
    display: flex;
    font-size: 15px;
    font-weight: 500;
    height: 46px;
    justify-content: center;
  }

  .disabled {
    color: #6b7280;
  }

  .current {
    color: #374151;
    font-size: 14px;
    text-align: center;
  }
`;
