import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
// import { Button } from "../components/GlobalStyles/StyleUtility";
import Button from "@mui/material/Button";
import { EditForm } from "../components/GlobalStyles/StyleUtility";
import { CreateListingContainer } from "./GlobalStyles/StyleCreateListing";
import BrandField from "./BrandField";
import CategoryField from "./CategoryField";
import FitsField from "./FitsField";
import Toast from "./Toast";
import apiErrorMessage from "../utils/apiErrorMessage";
import apiFetch from "../utils/apiFetch";
import {
  focusFirstChoiceError,
  listingChoiceErrors,
} from "../utils/listingChoices";

export default function ListingForm() {
  const navigate = useNavigate();
  const updateForm = useRef(null);
  const [toast, setToast] = useState({ open: false, message: "" });
  const [choiceErrors, setChoiceErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(updateForm.current);

    const errors = listingChoiceErrors(formData);
    setChoiceErrors(errors);
    if (Object.keys(errors).length > 0) {
      focusFirstChoiceError(updateForm.current, errors);
      return;
    }

    try {
      const data = await apiFetch("/listing/", {
        method: "POST",
        body: formData,
      });

      const newListing = await data.json();

      if (!data.ok) {
        console.error("Failed to create listing:", newListing);
        setToast({
          open: true,
          message: apiErrorMessage(newListing, "Couldn't create your listing."),
        });
        return;
      }

      updateForm.current.reset();
      navigate(`/listingdetail/${newListing.id}`, {
        state: { toast: "Listing created successfully!" },
      });
    } catch (error) {
      console.error("Error creating listing:", error);
      setToast({
        open: true,
        message: "Couldn't reach the server. Please try again.",
      });
    }
  };

  return (
    <CreateListingContainer>
      <div className="createListingWrapper">
        <div className="createListingIntro">
          <h2>Got some fox body stuff for sale?</h2>
          <h3>Get started liquidating that stockpile today!</h3>
          <ul>
            <li>Fill out the form</li>
            <li>Put it up for sale</li>
            <li>Get paid!</li>
          </ul>
        </div>
        <div className="createListingForm">
          <EditForm onSubmit={(e) => handleSubmit(e)} ref={updateForm}>
            <h2>Create a listing</h2>
            <label className="field">
              Listing title
              <input type="text" name="title" />
            </label>
            <div className="row2">
              <BrandField />
              <CategoryField
                error={choiceErrors.category}
                onChange={() =>
                  setChoiceErrors((errors) => ({ ...errors, category: undefined }))
                }
              />
            </div>
            <FitsField
              error={choiceErrors.fits}
              onChange={() =>
                setChoiceErrors((errors) => ({ ...errors, fits: undefined }))
              }
            />
            <div className="row2 keepOnPhone">
              <label className="field">
                Price
                <input type="number" name="price" />
              </label>
              <label className="field">
                Condition
                <select name="condition" defaultValue="good">
                  <option value="new">New</option>
                  <option value="great">Great</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                </select>
              </label>
            </div>
            <label className="field">
              Description
              <textarea name="description" maxLength="250" />
            </label>
            <small className="hint">Up to 250 characters.</small>
            <label className="field">
              Upload image
              <input
                type="file"
                name="image_url"
                accept="image/jpeg, image/png, image/gif"
              />
            </label>
            <input
              type="hidden"
              name="user"
              value={localStorage.getItem("userId")}
            />
            <input
              type="hidden"
              name="username"
              value={localStorage.getItem("username")}
            />
            <div className="actions">
              <Button variant="contained" type="submit">
                Post Listing
              </Button>
            </div>
          </EditForm>
        </div>
      </div>
      <Toast
        open={toast.open}
        message={toast.message}
        severity="error"
        onClose={() => setToast({ ...toast, open: false })}
      />
    </CreateListingContainer>
  );
}
