import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Toast from "../components/Toast";
import ProfileForm from "../components/ProfileForm";
import SellerTools from "../components/SellerTools";
import DisplayUserListings from "../components/DisplayUserListings";
import {
  ProfileContainer,
  WelcomePanel,
  PanelRow,
  InfoPanel,
} from "../components/GlobalStyles/StyleProfile";

export default function Profile() {
  // Lives here because two siblings need it: SellerTools turns editing on,
  // ProfileForm shows the form while it's on.
  const [isEditing, setIsEditing] = useState(false);
  // Reported by DisplayUserListings once its fetch finishes.
  const [listingCount, setListingCount] = useState(null);
  // A one-shot message passed in by the page that sent us here, e.g. after
  // deleting a listing.
  const location = useLocation();
  const navigate = useNavigate();
  const [toast, setToast] = useState({
    open: Boolean(location.state?.toast),
    message: location.state?.toast || "",
  });

  // Clear the one-shot toast from history so a reload doesn't show it again.
  useEffect(() => {
    if (location.state?.toast) {
      navigate(location.pathname, { replace: true, state: null });
    }
  }, []);

  return (
    <ProfileContainer>
      <Toast
        open={toast.open}
        message={toast.message}
        onClose={() => setToast({ ...toast, open: false })}
      />
      <WelcomePanel>
        <h1>Welcome back, {localStorage.getItem("username")}!</h1>
        <p>
          This is your profile page, where you can update your information and
          manage your listings. New here?{" "}
          <Link to="/howitworks">How it Works</Link> covers how to be a great
          buyer and seller on Fox Body Swap Meet.
        </p>
      </WelcomePanel>

      <PanelRow>
        <InfoPanel>
          <ProfileForm
            isEditing={isEditing}
            onDone={() => setIsEditing(false)}
          />
        </InfoPanel>
        <SellerTools
          isEditing={isEditing}
          onEdit={() => setIsEditing(true)}
          listingCount={listingCount}
        />
      </PanelRow>

      <DisplayUserListings onCountChange={setListingCount} />
    </ProfileContainer>
  );
}
