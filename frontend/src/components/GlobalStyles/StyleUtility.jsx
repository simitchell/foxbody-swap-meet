import styled from "styled-components";

// Centers a form page's content and keeps it off the screen edges on phones.
export const FormContainer = styled.div`
  max-width: 420px;
  margin: 0 auto 24px;
  padding: 0 16px;
`;

// White card that holds a form. Inputs and the submit button fill the card at a
// touch-friendly height; 16px input text stops iOS Safari zooming on focus.
export const FormCard = styled.div`
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 24px 20px;

  input,
  select {
    width: 100%;
    height: 46px;
    font-size: 16px;
  }

  button {
    width: 100%;
    height: 46px;
  }

  p {
    text-align: center;
  }

  /* Intro blurb under a form's title: body-sized text, not a heading. */
  h3 {
    font-size: 0.95rem;
    font-weight: 400;
    color: #555;
    margin: 0 0 1rem;
  }
`;

export const Form = styled.form`
  margin: auto;
  padding: auto;
  max-width: 45ch;
  display: flex;
  flex-direction: column;
  input,
  textarea {
    padding: 0.5rem;
    border-radius: 5px;
  }

  button {
    margin-top: 1rem;
    /* justify-content: space-around; */
  }
`;

export const ProgressDiv = styled.div`
  margin: auto;
  padding: auto;
  text-align: center;
  font-weight: bold;
`

// Panel form shared by the profile and listing edit forms. Each .field is a <label> wrapping its input, which ties the two
// together for screen readers and click-to-focus without needing ids.
export const EditForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;

  h2 {
    font-size: 18px;
    font-weight: 600;
    margin: 0;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 14px;
    color: #374151;
  }

  input,
  select,
  textarea {
    width: 100%;
    box-sizing: border-box;
    padding: 8px 10px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    /* 16px stops iOS Safari zooming in when an input is focused. */
    font-size: 16px;
    font-family: inherit;
    background-color: white;
  }

  textarea {
    min-height: 96px;
    resize: vertical;
  }

  /* minmax(0, 1fr) lets columns shrink below their content's width. */
  .row2,
  .row3 {
    display: grid;
    gap: 16px;
  }

  .row2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .row3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  @media (max-width: 640px) {
    .row2,
    .row3 {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  .hint {
    font-size: 13px;
    color: #6b7280;
    margin-top: -8px;
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 8px;
  }
`;
