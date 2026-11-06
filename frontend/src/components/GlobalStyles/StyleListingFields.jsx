import styled from "styled-components";

export const FieldError = styled.span`
  font-size: 13px;
  color: #c62828;
`;

export const InfoNote = styled.div`
  background: #e8f1fb;
  border: 1px solid #c7d7ee;
  border-radius: 8px;
  color: #0d47a1;
  font-size: 14px;
  line-height: 1.4;
  padding: 12px;
`;

// && outranks EditForm's general select rule.
export const CategorySelect = styled.select`
  && {
    border: ${({ $invalid }) =>
      $invalid ? "1.5px solid #c62828" : "1px solid #d1d5db"};
    color: ${({ $empty }) => ($empty ? "#6b7280" : "#111")};
    height: 42px;

    @media (max-width: 640px) {
      height: 44px;
    }
  }
`;

export const FitsFieldset = styled.fieldset`
  border: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 0;
  min-width: 0;
  padding: 0;

  legend {
    color: #374151;
    font-size: 14px;
    margin-bottom: 6px;
    padding: 0;
  }
`;

// The whole card is a <label>, so tapping anywhere on it picks the radio.
export const FitCard = styled.label`
  align-items: flex-start;
  background: ${({ $selected }) => ($selected ? "#f5f9ff" : "#fff")};
  /* The padding shrinks as the border grows, so the text doesn't shift. */
  border: ${({ $selected }) =>
    $selected ? "2px solid #1976d2" : "1px solid #d1d5db"};
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  gap: 12px;
  min-height: 44px;
  padding: ${({ $selected }) => ($selected ? "11px 13px" : "12px 14px")};

  /* && undoes EditForm's full-width inputs. */
  && input {
    flex: 0 0 auto;
    margin: 3px 0 0;
    padding: 0;
    width: auto;
  }

  .fitText {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .fitTitle {
    color: #111;
    font-size: 15px;
    font-weight: 500;
  }

  .fitExample {
    color: #4b5563;
    font-size: 13px;
  }
`;

export const AgeRow = styled.div`
  align-items: center;
  border-top: 1px solid #f0f1f3;
  color: ${({ $stale }) => ($stale ? "#8a4b00" : "#4b5563")};
  display: flex;
  font-size: 12px;
  gap: 6px;
  margin-top: 8px;
  padding-top: 8px;

  svg {
    flex: 0 0 auto;
  }
`;

export const AgeNote = styled.div`
  align-items: center;
  align-self: stretch;
  color: ${({ $stale }) => ($stale ? "#8a4b00" : "#4b5563")};
  display: flex;
  font-size: 13px;
  gap: 8px;

  svg {
    flex: 0 0 auto;
  }

  ${({ $stale }) =>
    $stale &&
    `
    background: #fff8ee;
    border: 1px solid #f5dfc0;
    border-radius: 8px;
    padding: 10px 12px;
  `}
`;

// MUI's input inside our forms. The && rules undo EditForm's input styles, which
// would otherwise draw a second border inside MUI's.
export const BrandInput = styled.div`
  && .MuiOutlinedInput-root {
    background: #fff;
    font-family: inherit;
    border-radius: 6px;
    min-height: 42px;
    padding-bottom: 0;
    padding-left: 10px;
    padding-top: 0;

    @media (max-width: 640px) {
      min-height: 44px;
    }
  }

  && .MuiOutlinedInput-notchedOutline {
    border-color: #d1d5db;
  }

  && input {
    background: transparent;
    border: none;
    /* 16px stops iOS Safari zooming in when the input is focused. */
    font-size: 16px;
    padding: 8px 0;
  }

  && + .brandHint {
    color: #6b7280;
    font-size: 12px;
  }
`;
