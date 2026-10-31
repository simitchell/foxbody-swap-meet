import styled from "styled-components";

export const ListingDetailHeader = styled.h2`
  display: flex;
  justify-content: center;
  margin-bottom: 1.5rem;
`;

export const DetailWrapper = styled.div`
  display: flex;
  flex-direction: row;
  max-width: 1100px;
  margin: 0 auto;
  border: 0.5px solid #e0e0e0;
  border-radius: 12px;
  overflow: hidden;
  min-height: 420px;
`;

export const DetailLeft = styled.div`
  width: 55%;
  background: #f5f5f5;
  display: flex;
  /* Column so Replace photo sits under the photo, not beside it. */
  flex-direction: column;
  gap: 12px;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  border-right: 0.5px solid #e0e0e0;
`;

export const DetailImage = styled.div`
  width: 100%;
  aspect-ratio: 4 / 3;
  border-radius: 8px;
  overflow: hidden;
  background: #e8e8e8;
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

export const DetailRight = styled.div`
  width: 45%;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

export const DetailTitleBlock = styled.div`
  h2 {
    font-size: 22px;
    font-weight: 500;
    margin: 0;
    line-height: 1.3;
  }
`;

export const DetailPrice = styled.div`
  display: inline-block;
  align-self: flex-start;
  background: #eaf3de;
  border: 0.5px solid #c0dd97;
  border-radius: 8px;
  padding: 0.6rem 1rem;

  span {
    font-size: 28px;
    font-weight: 500;
    color: #3b6d11;
  }
`;

export const DetailDescription = styled.div`
  p.label {
    font-size: 12px;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin: 0 0 6px 0;
  }
  p.body {
    font-size: 15px;
    line-height: 1.6;
    margin: 0;
  }
`;

export const DetailInfoCard = styled.div`
  border: 0.5px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;

  .top-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    border-bottom: 0.5px solid #e0e0e0;
  }

  .cell {
    padding: 0.75rem 1rem;

    p.label {
      font-size: 11px;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin: 0 0 3px 0;
    }

    p.value {
      font-size: 14px;
      font-weight: 500;
      margin: 0;
    }

    &.condition p.value {
      text-transform: capitalize;
    }

    &:first-child {
      border-right: 0.5px solid #e0e0e0;
    }
  }

  .condition-row {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 2px;
  }

  .bottom-row {
    padding: 0.75rem 1rem;
    background: #f9f9f9;

    p.label {
      font-size: 11px;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin: 0 0 4px 0;
    }

    .seller-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .avatar {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: #dbeafe;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 500;
      color: #1e40af;
    }

    p.username {
      font-size: 14px;
      margin: 0;
    }
  }
`;

export const DetailSeller = styled.div``;

// Owner's Edit / Delete buttons, in the spot where buyers see Add to Cart.
// flex: 1 splits the row evenly; wrap lets them stack if there's no room.
export const OwnerActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;

  > * {
    flex: 1;
  }
`;

// Dashed, button-style label around a hidden file input. Clicking anywhere on
// the label opens the file picker, because a label activates its input.
export const ReplacePhotoLabel = styled.label`
  /* Anchors the absolutely positioned (hidden) input inside the label. */
  position: relative;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px;
  border: 1.5px dashed #9ca3af;
  border-radius: 8px;
  background: white;
  color: #1976d2;
  font-weight: 500;
  cursor: pointer;

  &:hover {
    border-color: #1976d2;
  }

  /* The hidden input can still take keyboard focus; show it on the label. */
  &:focus-within {
    outline: 2px solid #1976d2;
    outline-offset: 2px;
  }

  input {
    position: absolute;
    width: 1px;
    height: 1px;
    opacity: 0;
    overflow: hidden;
  }

  .fileName {
    font-size: 13px;
    font-weight: 400;
    color: #6b7280;
    overflow-wrap: anywhere;
  }
`;
