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
  background-color: white;
  border: 0.5px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;

  .cardImage {
    width: 100%;
    aspect-ratio: 4 / 3;
    margin: auto;
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

  .seller {
    font-size: 12px;
    color: #9ca3af;
    margin-top: 0.45rem;
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
