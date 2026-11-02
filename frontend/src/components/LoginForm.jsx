import { API_BASE_URL } from "../config";
import { useEffect, useState } from "react";
import Button from "@mui/material/Button";
import {
  Form,
  FormCard,
  FormContainer,
} from "../components/GlobalStyles/StyleUtility";
import { Link, useSearchParams } from "react-router-dom";
import Toast from "./Toast";

const DEFAULT_AFTER_LOGIN = "/profile/";

// Only follow ?next= if it's a path on this site. Otherwise someone could send
// a link like foxbodyswapmeet.com/login?next=https://evil.example, and after a
// real login on our real page the user would land on a look-alike site that
// asks for their password again (an "open redirect"). "//evil.example" is the
// sneaky form: browsers read it as a full URL on another host, and they treat
// "/\evil.example" the same way, so both are rejected.
function safeNextPath(next) {
  if (
    next &&
    next.startsWith("/") &&
    !next.startsWith("//") &&
    !next.startsWith("/\\")
  ) {
    return next;
  }
  return DEFAULT_AFTER_LOGIN;
}

export default function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [searchParams] = useSearchParams();
  const [toast, setToast] = useState({ open: false, message: "", severity: "info" });

  const showError = (message) =>
    setToast({ open: true, message, severity: "error" });

  // Set by handleSessionExpired just before it redirected here. Read it once,
  // then remove it so a reload doesn't show the message again.
  useEffect(() => {
    if (sessionStorage.getItem("session_expired")) {
      sessionStorage.removeItem("session_expired");
      setToast({
        open: true,
        message: "Your session expired. Please log in again.",
        severity: "info",
      });
    }
  }, []);

  const handleChangeUsername = (e) => {
    setUsername(e.target.value);
  };

  const handleChangePassword = (e) => {
    setPassword(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const user = {
      username,
      password,
    };
    const url = `${API_BASE_URL}/token/`;
    let response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(user),
      });
    } catch {
      showError("Couldn't reach the server. Please try again.");
      return;
    }
    const data = await response.json().catch(() => ({}));
    const { access, refresh, userId } = data;
    if (!response.ok || access === undefined) {
      showError("You have entered an invalid username or password.");
      return;
    }
    localStorage.clear();
    localStorage.setItem("username", username);
    localStorage.setItem("userId", userId);
    localStorage.setItem("access_token", access);
    localStorage.setItem("refresh_token", refresh);
    // Full page load, so AuthContext re-reads the new tokens from scratch.
    window.location.assign(safeNextPath(searchParams.get("next")));
  };

  return (
    <FormContainer>
      <Toast
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        onClose={() => setToast({ ...toast, open: false })}
      />
      <FormCard>
        <Form onSubmit={handleSubmit}>
          <h2>Log In</h2>
          <label>Username</label>
          <input
            type="text"
            name="username"
            value={username}
            onChange={handleChangeUsername}
          />
          <label>Password</label>
          <input
            type="password"
            name="password"
            value={password}
            onChange={handleChangePassword}
          />
          <Button variant="contained" type="submit">
            Login
          </Button>
          <p>
            <Link to="./register">Register</Link> as a new user
          </p>
        </Form>
      </FormCard>
    </FormContainer>
  );
}
