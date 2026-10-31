import { API_BASE_URL } from "../config";
import { useRef, useState } from "react";
import Button from "@mui/material/Button";
import { EditForm } from "./GlobalStyles/StyleUtility";
import { ReplacePhotoLabel } from "./GlobalStyles/StyleListingDetail";
import Toast from "./Toast";
import apiErrorMessage from "../utils/apiErrorMessage";

// The photo input lives in the left column, outside the <form>. Its form
// attribute points at this id, so the browser still treats it as one of the
// form's fields and includes it in the form's data.
export const EDIT_LISTING_FORM_ID = "edit-listing-form";

// Edit form for a listing. ListingDetail owns the listing data and edit mode;
// this just edits what it's given and reports back through onSaved/onCancel.
export default function EditListing({ listing, onSaved, onCancel }) {
  const auth = localStorage.getItem("access_token");
  const updateForm = useRef(null);
  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "error",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(updateForm.current);

    // Send only the fields the user changed, like ProfileForm. PATCH updates
    // just those fields; PUT would replace the whole listing, so anything
    // missing would be wiped or rejected.
    const changes = new FormData();
    for (const [name, value] of formData.entries()) {
      if (value instanceof File) {
        // An empty File means no new photo was chosen.
        if (value.size > 0) changes.append(name, value);
      } else if (value !== String(listing[name] ?? "")) {
        changes.append(name, value);
      }
    }
    if ([...changes.keys()].length === 0) {
      setToast({ open: true, severity: "error", message: "No changes to save." });
      return;
    }

    const url = `${API_BASE_URL}/listing/${listing.id}/`;
    try {
      const response = await fetch(url, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${auth}`,
        },
        body: changes,
      });

      if (!response.ok) {
        // Includes a flagged photo: image moderation's ValidationError comes
        // back as a 400 that apiErrorMessage turns into readable text.
        const body = await response.json().catch(() => null);
        setToast({
          open: true,
          severity: "error",
          message: apiErrorMessage(body, "Couldn't update your listing."),
        });
        return;
      }

      onSaved(await response.json());
    } catch (error) {
      console.error("Error updating listing:", error);
      setToast({
        open: true,
        severity: "error",
        message: "Couldn't reach the server. Please try again.",
      });
    }
  };

  return (
    <>
      <EditForm
        id={EDIT_LISTING_FORM_ID}
        onSubmit={(e) => handleSubmit(e)}
        ref={updateForm}
      >
        <h2>Edit listing</h2>
        <label className="field">
          Listing title
          <input type="text" name="title" defaultValue={listing.title ?? ""} />
        </label>
        <div className="row2">
          <label className="field">
            Price
            <input
              type="number"
              name="price"
              defaultValue={listing.price ?? ""}
            />
          </label>
          <label className="field">
            Condition
            <select name="condition" defaultValue={listing.condition}>
              <option value="new">New</option>
              <option value="great">Great</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
            </select>
          </label>
        </div>
        <label className="field">
          Description
          <textarea
            name="description"
            maxLength="250"
            defaultValue={listing.description ?? ""}
          />
        </label>
        <small className="hint">Up to 250 characters.</small>
        <div className="actions">
          {/* type="button" so Cancel doesn't submit the form. */}
          <Button variant="outlined" type="button" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="contained" type="submit">
            Save changes
          </Button>
        </div>
      </EditForm>
      <Toast
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        onClose={() => setToast({ ...toast, open: false })}
      />
    </>
  );
}

// Shown under the photo while editing. Unmounts when editing ends, so the
// chosen file and its name reset on Cancel or Save.
export function ReplacePhotoInput() {
  const [fileName, setFileName] = useState("");

  return (
    <ReplacePhotoLabel>
      {/* Visually hidden rather than display: none, so it can still be
          reached with the keyboard. */}
      <input
        type="file"
        name="image_url"
        accept="image/jpeg, image/png, image/gif"
        form={EDIT_LISTING_FORM_ID}
        onChange={(e) => setFileName(e.target.files[0]?.name ?? "")}
      />
      <span className="action">Replace photo</span>
      {fileName && <span className="fileName">{fileName}</span>}
    </ReplacePhotoLabel>
  );
}
