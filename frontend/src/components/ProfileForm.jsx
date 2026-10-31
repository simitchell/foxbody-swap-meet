import { API_BASE_URL } from "../config";
import React from "react";
import { useState, useEffect, useRef } from "react";
import { useRevalidator, useParams, useNavigate } from "react-router-dom";
import { EditForm, ProgressDiv } from "./GlobalStyles/StyleUtility";
import { InfoList } from "./GlobalStyles/StyleProfile";
// import { Button } from "./GlobalStyles/StyleUtility";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Toast from "./Toast";
import StateSelect from "./StateSelect";
import apiErrorMessage from "../utils/apiErrorMessage";

// Newest year first, back to 1979 (the first Fox body model year). Matches the
// limits the backend enforces on enthusiast_since.
const FOX_BODY_FIRST_YEAR = 1979;
const ENTHUSIAST_YEARS = Array.from(
  { length: new Date().getFullYear() - FOX_BODY_FIRST_YEAR + 1 },
  (_, i) => new Date().getFullYear() - i
);

// Empty values show a muted dash instead of a blank row.
function show(value) {
  return value ? value : <span className="empty">—</span>;
}

export default function ProfileDetail({ isEditing, onDone }) {
  const [profileDetail, setProfileDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const updateForm = useRef(null);
  const auth = localStorage.getItem("access_token");
  const revalidator = useRevalidator();
  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  // const [alertContent, setAlertContent] = useState('');

  const { id } = useParams();

  const getIndividualProfile = async () => {
    try {
      const apiUrl = `${API_BASE_URL}/profile/${localStorage.getItem(
        "userId"
      )}/`;
      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${auth}`,
        },
      });
      const data = await response.json();
      setProfileDetail(data);
      // console.log(data);
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load once on mount. (Depending on profileDetail re-fetched forever, since
  // the fetch itself sets profileDetail. Saves update it from the response.)
  useEffect(() => {
    getIndividualProfile();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(updateForm.current);

    // Send only the fields the user changed, so editing one field never
    // overwrites the others. (Inputs are prefilled from the saved profile, so
    // "changed" means different from what's saved; emptying a field clears it.)
    const changes = new FormData();
    for (const [name, value] of formData.entries()) {
      if (name === "user") continue;
      if (value !== String(profileDetail?.[name] ?? "")) {
        changes.append(name, value);
      }
    }
    if ([...changes.keys()].length === 0) {
      setToast({ open: true, message: "No changes to save.", severity: "error" });
      return;
    }

    const response = await handlePatch(changes);
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setToast({
        open: true,
        message: apiErrorMessage(body, "Couldn't update your profile."),
        severity: "error",
      });
      return;
    }
    setProfileDetail(await response.json());
    onDone();
    setToast({
      open: true,
      message: "Profile information updated successfully!",
      severity: "success",
    });
  };

  const handlePatch = async (formData) => {
    const apiUrl = `${API_BASE_URL}/profile/${localStorage.getItem(
      "userId"
    )}/`;
    return fetch(apiUrl, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${auth}`,
      },
      body: formData,
    });
  };

  const fullName = [profileDetail?.first_name, profileDetail?.last_name]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <h2>Current Information</h2>

      {isLoading ? (
        <ProgressDiv>
          <CircularProgress />
        </ProgressDiv>
      ) : !isEditing ? (
        profileDetail ? (
          <InfoList>
            <dt>Name</dt>
            <dd>{show(fullName)}</dd>
            <dt>Member since</dt>
            <dd>{show(profileDetail.member_since)}</dd>
            <dt>Fox body enthusiast since</dt>
            <dd>{show(profileDetail.enthusiast_since)}</dd>
            <dt>Street</dt>
            <dd>{show(profileDetail.street)}</dd>
            <dt>City</dt>
            <dd>{show(profileDetail.city)}</dd>
            <dt>State</dt>
            <dd>{show(profileDetail.state)}</dd>
            <dt>ZIP</dt>
            <dd>{show(profileDetail.zip_code)}</dd>
            <dt>Birthdate</dt>
            <dd>{show(profileDetail.birthdate)}</dd>
            <dt>Bio</dt>
            <dd className="bio">{show(profileDetail.bio)}</dd>
          </InfoList>
        ) : (
          <p>Couldn&apos;t load your profile information.</p>
        )
      ) : (
        /* Prefilled from the saved profile (remounts when it loads) so the diff in
           handleSubmit can tell what the user actually changed. */
        <EditForm
          key={[
            profileDetail?.first_name,
            profileDetail?.last_name,
            profileDetail?.enthusiast_since,
            profileDetail?.street,
            profileDetail?.city,
            profileDetail?.state,
            profileDetail?.zip_code,
            profileDetail?.birthdate,
            profileDetail?.bio,
          ].join("|")}
          onSubmit={(e) => handleSubmit(e)}
          ref={updateForm}
        >
          <div className="row2">
            <label className="field">
              First name
              <input
                type="text"
                name="first_name"
                maxLength="150"
                defaultValue={profileDetail?.first_name || ""}
              />
            </label>
            <label className="field">
              Last name
              <input
                type="text"
                name="last_name"
                maxLength="150"
                defaultValue={profileDetail?.last_name || ""}
              />
            </label>
          </div>
          <label className="field">
            Fox body enthusiast since
            <select
              name="enthusiast_since"
              defaultValue={profileDetail?.enthusiast_since ?? ""}
            >
              <option value="">Select a year</option>
              {ENTHUSIAST_YEARS.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Street
            <input
              type="text"
              name="street"
              maxLength="100"
              defaultValue={profileDetail?.street || ""}
            />
          </label>
          <div className="row3">
            <label className="field">
              City
              <input
                type="text"
                name="city"
                maxLength="50"
                defaultValue={profileDetail?.city || ""}
              />
            </label>
            <label className="field">
              State
              <StateSelect defaultValue={profileDetail?.state || ""} />
            </label>
            <label className="field">
              ZIP code
              <input
                type="text"
                name="zip_code"
                defaultValue={profileDetail?.zip_code || ""}
                inputMode="numeric"
                maxLength="10"
                pattern="\d{5}(-\d{4})?"
                title="12345 or 12345-6789"
              />
            </label>
          </div>
          <small className="hint">Your state is shown on your listings.</small>
          <label className="field">
            Birthdate
            <input
              type="date"
              name="birthdate"
              defaultValue={profileDetail?.birthdate || ""}
            />
          </label>
          <label className="field">
            Bio
            <textarea name="bio" defaultValue={profileDetail?.bio || ""} />
          </label>
          <input
            type="hidden"
            name="user"
            value={localStorage.getItem("userId")}
          />
          <div className="actions">
            {/* type="button" so Cancel doesn't submit the form. */}
            <Button variant="outlined" type="button" onClick={onDone}>
              Cancel
            </Button>
            <Button variant="contained" type="submit">
              Save changes
            </Button>
          </div>
        </EditForm>
      )}

      <Toast
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        onClose={() => setToast({ ...toast, open: false })}
      />
    </>
  );
}
