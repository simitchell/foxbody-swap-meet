import { API_BASE_URL } from "../config";
import { useEffect, useRef, useState } from "react";
import React from "react";
import { Form, FormCard, FormContainer } from "./GlobalStyles/StyleUtility";
// import { Button } from "./GlobalStyles/StyleUtility";
import Button from "@mui/material/Button";
import { Link, Navigate } from "react-router-dom";
import StateSelect from "./StateSelect";
import { startSession } from "../utils/session";

export default function RegisterForm() {
  const auth = localStorage.getItem("access_token");
  // const navigate = Navigate();
  const updateForm = useRef(null);
  const [errors, setErrors] = useState([]);
  // The Turnstile widget inserts its own hidden "cf-turnstile-response" input
  // into the form once a human passes the check, so handleSubmit doesn't need
  // to read this directly — it's only used to disable the submit button
  // until that's happened.
  const [turnstileVerified, setTurnstileVerified] = useState(false);
  const turnstileRef = useRef(null);
  const turnstileWidgetId = useRef(null);

  useEffect(() => {
    // index.html loads Turnstile in explicit mode, so draw the widget here,
    // once this form exists. The script loads async and may not be ready
    // when the form first mounts, so wait for window.turnstile.
    let cancelled = false;
    let timer;
    const renderWidget = () => {
      if (cancelled) return;
      if (!window.turnstile) {
        timer = setTimeout(renderWidget, 100);
        return;
      }
      turnstileWidgetId.current = window.turnstile.render(turnstileRef.current, {
        sitekey: import.meta.env.VITE_TURNSTILE_SITE_KEY,
        callback: () => setTurnstileVerified(true),
        // An expired or failed check leaves a token the backend will reject.
        "expired-callback": () => setTurnstileVerified(false),
        "error-callback": () => setTurnstileVerified(false),
      });
    };
    renderWidget();
    return () => {
      cancelled = true;
      clearTimeout(timer);
      if (turnstileWidgetId.current !== null) {
        window.turnstile.remove(turnstileWidgetId.current);
        turnstileWidgetId.current = null;
      }
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);
    const formData = new FormData(updateForm.current);

    const url = `${API_BASE_URL}/register/`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        // Authorization: `Bearer ${auth}`,
      },
      body: formData,
    });

    if (!response.ok) {
      // DRF returns field-keyed error arrays, e.g. {"password": ["too short"]}.
      let messages = ["Registration failed. Please try again."];
      try {
        const body = await response.json();
        const collected = Object.values(body).flat();
        if (collected.length) messages = collected.map(String);
      } catch {
        // non-JSON error response; keep the generic message
      }
      setErrors(messages);
      // Turnstile tokens are single-use, so get a fresh one before the user
      // fixes the form and resubmits.
      if (turnstileWidgetId.current !== null) {
        window.turnstile.reset(turnstileWidgetId.current);
      }
      setTurnstileVerified(false);
      return;
    }

    // /register/ returns the same tokens as /token/, so the new user is
    // logged in right away. If they're missing (e.g. an older backend still
    // deploying), fall back to the login page rather than saving a broken
    // session.
    const data = await response.json().catch(() => ({}));
    if (!data.access || !data.refresh) {
      window.location.assign("/login");
      return;
    }
    startSession(data);
    // The profile page reads this once to open in "finish your profile" mode.
    // sessionStorage, because the full page load below wipes React state.
    sessionStorage.setItem("just_registered", "1");
    // Full page load, so AuthContext re-reads the new tokens (same as login).
    window.location.assign("/profile/");
  };

  return (
    <FormContainer>
      <FormCard>
        <Form onSubmit={(e) => handleSubmit(e)} ref={updateForm}>
          <h2>Register a new user</h2>
          <h3>
            Once your account is created, you&apos;ll be signed in right away
            and taken to your profile to fill in the rest.
          </h3>
          <label>Username</label>
          <input type="text" name="username" />
          <label>Email</label>
          <input type="email" name="email" />
          <label>Password</label>
          <input type="password" name="password" />
          <label>State</label>
          <StateSelect />
          <small>
            Optional. Your state is shown on your listings so buyers know roughly
            where you are.
          </small>
          {/* Honeypot: hidden from sighted/keyboard users via CSS + tabIndex,
              not type="hidden", since bots specifically skip type="hidden"
              fields. Real users never see or fill this; bots that auto-fill
              every input on the page do. */}
          <div
            style={{
              position: "absolute",
              left: "-9999px",
              width: "1px",
              height: "1px",
              overflow: "hidden",
            }}
            aria-hidden="true"
          >
            <label htmlFor="website">Website</label>
            <input
              type="text"
              id="website"
              name="website"
              tabIndex="-1"
              autoComplete="off"
            />
          </div>
          <div ref={turnstileRef} />
          {errors.length > 0 && (
            <ul style={{ color: "red", margin: "0.5rem 0", paddingLeft: "1.25rem" }}>
              {errors.map((msg, i) => (
                <li key={i}>{msg}</li>
              ))}
            </ul>
          )}
          <Button variant="contained" type="submit" disabled={!turnstileVerified}>
            Register User
          </Button>
          <p>
            <Link to="/Login">Login</Link> for existing users
          </p>
        </Form>
      </FormCard>
    </FormContainer>
  );
}

//
