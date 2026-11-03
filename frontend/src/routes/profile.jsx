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
  // Set by RegisterForm just before it loaded this page. Read once here and
  // cleared in the effect below, so a reload shows the normal profile.
  const [justRegistered] = useState(
    () => sessionStorage.getItem("just_registered") === "1"
  );
  // Lives here because two siblings need it: SellerTools turns editing on,
  // ProfileForm shows the form while it's on. New users start in the form.
  const [isEditing, setIsEditing] = useState(justRegistered);
  // Reported by DisplayUserListings once its fetch finishes.
  const [listingCount, setListingCount] = useState(null);
  // A one-shot message passed in by the page that sent us here, e.g. after
  // deleting a listing.
  const location = useLocation();
  const navigate = useNavigate();
  const [toast, setToast] = useState({
    open: Boolean(location.state?.toast) || justRegistered,
    message:
      location.state?.toast ||
      (justRegistered
        ? "Welcome! Your account is ready. Fill in as much of your profile as you like; every field is optional."
        : ""),
  });

  // Clear the one-shot messages so a reload doesn't show them again.
  useEffect(() => {
    sessionStorage.removeItem("just_registered");
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
        <h1>
          {justRegistered ? "Welcome" : "Welcome back"},{" "}
          {localStorage.getItem("username")}!
        </h1>
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
