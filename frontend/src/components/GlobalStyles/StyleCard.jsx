import styled from "styled-components";

export const CardContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 400px));
  gap: 1.5rem;
  justify-content: center;
  max-width: 1400px;
  margin: auto;
  padding: 1rem;

  a {
    color: inherit;
    text-decoration: none;
  }

  a:hover .card {
    box-shadow: rgba(100, 100, 111, 0.2) 0px 7px 29px 0px;
  }

  /* Tablets and landscape phones. auto-fill counts how many columns fit
     using each track's MAX size, so with minmax(280px, 400px) two columns
     need ~856px and anything narrower gets one 400px column. With 1fr as
     the max, it counts using the 220px min instead, then stretches the
     columns to fill the row. */
  @media (min-width: 641px) and (max-width: 1023px) {
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 16px;
  }

  /* Phones: two equal columns. minmax(0, 1fr) rather than plain 1fr, because
     1fr won't shrink a column below its content's natural width (e.g. a long
     one-line title), which would push the grid wider than the screen. */
  @media (max-width: 640px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
    padding: 1rem 16px;
  }
`;

export const Card = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  /* Fills its grid row, so cards end level even if one has an extra line. */
  height: 100%;
  background-color: white;
  border: 0.5px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;

  .cardImage {
    width: 100%;
    aspect-ratio: 4 / 3;
    overflow: hidden;

    img {
      object-fit: cover;
      width: 100%;
      height: 100%;
    }
  }

  .cardBody {
    padding: 0.85rem 1rem 1rem;
  }

  h2 {
    font-size: 17px;
    font-weight: 600;
    margin: 0 0 0.6rem;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: #111;
  }

  .cardMeta {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .conditionRow {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 13px;
    color: #6b7280;
  }

  .cardFit {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-top: 8px;
    min-height: 22px;
  }

  .cardCategory {
    /* min-width: 0 lets the text shrink and show "…" next to the tag. */
    min-width: 0;
    overflow: hidden;
    font-size: 12px;
    font-weight: 500;
    color: #374151;
    /* Up to two lines, or a long brand would hide the category. */
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
  }

  /* Phones: cards are ~165px wide in the 2-column grid, so compact them. */
  @media (max-width: 640px) {
    .cardImage {
      aspect-ratio: 1 / 1;
    }

    .cardBody {
      padding: 10px 10px 12px;
    }

    /* Up to two lines, then "…". min-height reserves both lines, so cards
       in the same row line up even when one title is short. */
    h2 {
      font-size: 14px;
      line-height: 1.3;
      min-height: 2.6em;
      margin: 0 0 8px;
      text-align: left;
      white-space: normal;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
      line-clamp: 2;
    }

    /* Same row when they fit. flex-wrap is the safety net: a long pair drops
       the condition to the next line instead of overflowing the card. */
    .cardMeta {
      flex-wrap: wrap;
      gap: 4px 8px;
    }

    .conditionRow {
      font-size: 12px;
      white-space: nowrap;
    }

    /* Category on one line, tag on the next. */
    .cardFit {
      flex-direction: column;
      align-items: flex-start;
      gap: 6px;
      min-height: 46px;
    }

    .cardCategory {
      max-width: 100%;
    }
  }
`;

export const PriceBadge = styled.span`
  display: inline-block;
  background: #eaf3de;
  border: 0.5px solid #c0dd97;
  border-radius: 8px;
  padding: 3px 10px;
  font-size: 13px;
  font-weight: 500;
  color: #3b6d11;
`;

export const FitPill = styled.span`
  display: inline-block;
  flex-shrink: 0;
  background: ${({ $background }) => $background};
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 12px;
  font-weight: 500;
  color: ${({ $color }) => $color};
  white-space: nowrap;

  .fitShort {
    display: none;
  }

  @media (max-width: 640px) {
    .fitLong {
      display: none;
    }

    .fitShort {
      display: inline;
    }
  }
`;

export const ConditionDot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${({ color }) => color};
  flex-shrink: 0;
  display: inline-block;
`;

export const NoDataDiv = styled.div`
  margin: auto;
  padding: auto;
  text-align: center;
  font-weight: bold;
`;
