import styled from "styled-components";

export const HomeContainer = styled.div`
  .listingHeader {
    text-align: center;
    margin: 3rem;
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

  @media (max-width: 640px) {
    margin: 0 1rem;
  }
`;

export const HomeWelcome = styled.div`
  ul {
    list-style-type: none;
    li {
      margin-bottom: 1rem;
    }
  }
`;

export const HomeLogin = styled.div`
  flex: 0 0 280px;
  max-width: 100%;
`;
