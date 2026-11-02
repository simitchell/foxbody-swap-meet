import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { Text } from "./GlobalStyles/StyleText";

export default function LogoutPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // logout() updates the context, so the navbar flips to signed-out without
    // a page reload.
    logout().then(() => navigate("/", { replace: true }));
  }, [logout, navigate]);

  return (
    <Text>
      <h1>Logout</h1>
      <p>You have been successfully logged out.</p>
      <Link to="/">Login</Link>
    </Text>
  );
}
