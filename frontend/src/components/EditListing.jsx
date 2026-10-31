import { API_BASE_URL } from "../config";
import { useRef, useState } from "react";
import Button from "@mui/material/Button";
import { Form } from "../components/GlobalStyles/StyleUtility";
import Toast from "./Toast";
import apiErrorMessage from "../utils/apiErrorMessage";

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
    const url = `${API_BASE_URL}/listing/${listing.id}/`;
    try {
      const response = await fetch(url, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${auth}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        console.error("Failed to update listing:", body);
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
      <Form onSubmit={(e) => handleSubmit(e)} ref={updateForm}>
        <label>Listing Title</label>
        <input type="text" name="title" defaultValue={listing.title ?? ""} />
        <label>Price</label>
        <input type="number" name="price" defaultValue={listing.price ?? ""} />
        <label>Description</label>
        <textarea
          name="description"
          maxLength="250"
          defaultValue={listing.description ?? ""}
        />
        <label>Condition</label>
        <select name="condition" defaultValue={listing.condition}>
          <option value="new">New</option>
          <option value="great">Great</option>
          <option value="good">Good</option>
          <option value="fair">Fair</option>
        </select>
        <label>Upload Image</label>
        <input
          type="file"
          name="image_url"
          accept="image/jpeg, image/png, image/gif"
        />
        <input type="hidden" name="user" value={localStorage.getItem("userId")} />
        <input type="hidden" name="username" value={localStorage.getItem("username")} />
        <Button variant="outlined" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="contained" type="submit">
          Update Listing
        </Button>
      </Form>
      <Toast
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        onClose={() => setToast({ ...toast, open: false })}
      />
    </>
  );
}
