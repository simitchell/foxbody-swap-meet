import styled from "styled-components";

export const CartDiv = styled.div`
  width: 100%;
`;

export const CartOuterContainer = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 1.5rem;
  width: 90%;
  max-width: 1100px;
  margin: 2rem auto;

  @media (max-width: 768px) {
    flex-direction: column;
    /* flex-start would size each column to its content, and the cart's nowrap
       titles would push the page, and Remove, past the screen edge. */
    align-items: stretch;
  }
`;

export const CartMain = styled.div`
  flex: 1 1 auto;
  min-width: 0;
`;

export const CartHeader = styled.div`
  display: flex;
  align-items: baseline;
  gap: 0.6rem;
  margin-bottom: 1rem;

  h1 {
    font-size: 22px;
    font-weight: 600;
    margin: 0;
    color: #111;
  }

  .itemCount {
    font-size: 14px;
    color: #6b7280;
  }
`;

export const CartPanel = styled.div`
  background-color: white;
  border: 0.5px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
`;

export const CartItem = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;

  & + & {
    border-top: 0.5px solid #e5e7eb;
  }
`;

export const CartImg = styled.div`
  width: 72px;
  aspect-ratio: 1 / 1;
  flex-shrink: 0;
  display: flex;
  overflow: hidden;

  img {
    object-fit: cover;
    width: 100%;
    height: 100%;
    border-radius: 10px;
  }
`;

export const CartItemInfo = styled.div`
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
`;

export const ConditionPill = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  width: fit-content;
  background: #eaf3de;
  border: 0.5px solid #c0dd97;
  border-radius: 8px;
  padding: 3px 10px;
  font-size: 12px;
  font-weight: 500;
  color: #3b6d11;
  text-transform: capitalize;
`;

export const CartItemTitle = styled.div`
  font-weight: 600;
  color: #111;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  /* One line leaves too little of the title to read on a phone. */
  @media (max-width: 768px) {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    white-space: normal;
  }
`;

export const CartItemPrice = styled.div`
  flex-shrink: 0;
  font-weight: 600;
  color: #111;
`;

export const RemoveButton = styled.button`
  flex-shrink: 0;
  border: none;
  background: none;
  padding: 0;
  font-size: 13px;
  color: #9ca3af;
  cursor: pointer;

  &:hover {
    color: #6b7280;
    text-decoration: underline;
  }
`;

export const CartSummary = styled.div`
  flex: 0 0 300px;
  background-color: white;
  border: 0.5px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.25rem;

  h2 {
    font-size: 17px;
    font-weight: 600;
    margin: 0 0 1rem;
    color: #111;
  }

  button {
    width: 100%;
    margin-top: 1rem;
  }

  @media (max-width: 768px) {
    flex: 1 1 auto;
  }
`;

export const ProgressDiv = styled.div`
  margin: auto;
  padding: auto;
  text-align: center;
  font-weight: bold;
`;

export const RowItems = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
`;

export const RowTaxes = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
`;

export const RowShipping = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
`;

export const RowTotal = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  border-top: 1px solid black;
  font-weight: bold;
`;
