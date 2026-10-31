import { API_BASE_URL } from "../config";
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Toast from "./Toast";
import EditListing, { ReplacePhotoInput } from "./EditListing";
import { ProgressDiv } from "./GlobalStyles/StyleUtility";
import conditionColor from "../utils/conditionColor";
import apiErrorMessage from "../utils/apiErrorMessage";
import { ConditionDot } from "./GlobalStyles/StyleCard";

import {
  DetailDescription,
  DetailImage,
  DetailInfoCard,
  DetailLeft,
  OwnerActions,
  DetailPrice,
  DetailRight,
  DetailSeller,
  DetailTitleBlock,
  DetailWrapper,
  ListingDetailHeader,
} from "./GlobalStyles/StyleListingDetail";

export default function ListingDetail() {
  const auth = localStorage.getItem("access_token");
  const [listingDetail, setListingDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [alert, setAlert] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [toast, setToast] = useState({
    open: Boolean(location.state?.toast),
    message: location.state?.toast || "",
    severity: "success",
  });

  const { id } = useParams();

  const getIndividualListing = async () => {
    try {
      const apiUrl = `${API_BASE_URL}/listing/${id}/`;
      const response = await fetch(apiUrl);
      const data = await response.json();
      setListingDetail(data);
    } catch (error) {
      console.error("Error fetching listing:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getIndividualListing();
  }, [id]);

  // Clear the one-shot toast from history so a reload doesn't show it again.
  useEffect(() => {
    if (location.state?.toast) {
      navigate(location.pathname, { replace: true, state: null });
    }
  }, []);

  // The save response is the updated listing, so use it directly instead of
  // fetching the listing again.
  const handleSaved = (updatedListing) => {
    setListingDetail(updatedListing);
    setIsEditing(false);
    setToast({
      open: true,
      message: "Listing updated successfully!",
      severity: "success",
    });
  };

  const handleDelete = async () => {
    const apiUrl = `${API_BASE_URL}/listing/${id}/`;
    try {
      const response = await fetch(apiUrl, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${auth}`,
        },
      });

      if (response.ok) {
        // The profile page shows this toast (see routes/profile.jsx).
        navigate("/profile", {
          state: { toast: `“${listingDetail.title}” was deleted.` },
        });
        return;
      }
      const body = await response.json().catch(() => null);
      setConfirmDelete(false);
      setToast({
        open: true,
        message: apiErrorMessage(body, "Couldn't delete your listing."),
        severity: "error",
      });
    } catch (error) {
      console.error("Error deleting listing:", error);
      setConfirmDelete(false);
      setToast({
        open: true,
        message: "Couldn't reach the server. Please try again.",
        severity: "error",
      });
    }
  };

  const isOwner = listingDetail?.username === localStorage.getItem("username");

  const handleAddToCart = async (e) => {
    e.preventDefault();
    setAlert(true);

    const url = `${API_BASE_URL}/cart/`;
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${auth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: parseInt(localStorage.getItem("userId")),
          cart_item: listingDetail.title,
          image_url: listingDetail.image_url,
          price: listingDetail.price,
          condition: listingDetail.condition,
        }),
      });

      if (!response.ok) {
        console.error("Failed to add to cart");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <>
      <Toast
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        onClose={() => setToast({ ...toast, open: false })}
      />
      <ListingDetailHeader>Listing Detail</ListingDetailHeader>

      {isLoading ? (
        <ProgressDiv>
          <CircularProgress />
        </ProgressDiv>
      ) : (
        <DetailWrapper>
          <DetailLeft>
            {listingDetail ? (
              <>
                <DetailImage>
                  <img src={listingDetail.image_url} alt={listingDetail.title} />
                </DetailImage>
                {isEditing && <ReplacePhotoInput />}
              </>
            ) : (
              <div>No detail found</div>
            )}
          </DetailLeft>

          <DetailRight>
            {listingDetail && isEditing ? (
              <EditListing
                listing={listingDetail}
                onSaved={handleSaved}
                onCancel={() => setIsEditing(false)}
              />
            ) : listingDetail ? (
              <>
                <DetailTitleBlock>
                  <h2>{listingDetail.title}</h2>
                </DetailTitleBlock>

                <DetailPrice>
                  <span>${listingDetail.price}</span>
                </DetailPrice>

                <DetailDescription>
                  <p className="label">Description</p>
                  <p className="body">{listingDetail.description}</p>
                </DetailDescription>

                <DetailInfoCard>
                  <div className="top-row">
                    <div className="cell">
                      <p className="label">Seller</p>
                      <p className="value">
                        {listingDetail.username}
                        {listingDetail.seller_state &&
                          ` · ${listingDetail.seller_state}`}
                      </p>
                    </div>
                    <div className="cell condition">
                      <p className="label">Condition</p>
                      <div className="condition-row">
                        <ConditionDot color={conditionColor(listingDetail.condition)} />
                        <p className="value">{listingDetail.condition}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bottom-row">
                    <p className="label">Listed by</p>
                    <div className="seller-row">
                      <div className="avatar">
                        {listingDetail.username?.slice(0, 2).toUpperCase()}
                      </div>
                      <p className="username">{listingDetail.username}</p>
                    </div>
                  </div>
                </DetailInfoCard>

                {isOwner ? (
                  <OwnerActions>
                    <Button
                      variant="contained"
                      type="button"
                      onClick={() => setIsEditing(true)}
                    >
                      Edit Listing
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      type="button"
                      onClick={() => setConfirmDelete(true)}
                    >
                      Delete Listing
                    </Button>
                  </OwnerActions>
                ) : (
                  <>
                    <Button
                      variant="contained"
                      fullWidth
                      type="button"
                      id="addToCartButton"
                      onClick={handleAddToCart}
                    >
                      Add to Cart
                    </Button>
                    {alert && (
                      <Alert severity="success">Added to your cart!</Alert>
                    )}
                  </>
                )}
              </>
            ) : (
              <div>No detail found</div>
            )}
          </DetailRight>
        </DetailWrapper>
      )}

      {/* zIndex above the nav (9999), which would otherwise paint over the
          dialog's dimmed backdrop. */}
      <Dialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        aria-labelledby="delete-dialog-title"
        sx={{ zIndex: 10000 }}
      >
        <DialogTitle id="delete-dialog-title">Delete this listing?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            “{listingDetail?.title}” will be removed from Fox Body Swap Meet.
            This can’t be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          {/* autoFocus on the safe choice, so pressing Enter keeps it. */}
          <Button
            variant="outlined"
            onClick={() => setConfirmDelete(false)}
            autoFocus
          >
            Keep it
          </Button>
          <Button variant="contained" color="error" onClick={handleDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
