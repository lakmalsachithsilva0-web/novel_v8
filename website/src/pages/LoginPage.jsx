import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { emailAuth, guestLogin, setToken } from "../api";

export default function LoginPage({ onSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [mode, setMode] = useState("login");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function finish(token) {
    setToken(token);
    try {
      await onSuccess?.(token);
    } catch {
      // Keep the API token if the profile refresh is briefly unavailable.
    }
    navigate("/", { replace: true });
  }

  async function onSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await emailAuth({
        email: email.trim().toLowerCase(),
        password,
        display_name: displayName.trim(),
        mode,
      });
      const token = response?.access_token || response?.token || response?.accessToken;
      if (!token) throw new Error("The server did not return a session token.");
      await finish(token);
    } catch (err) {
      setError(String(err.message || err));
    } finally {
      setBusy(false);
    }
  }

  async function asGuest() {
    setBusy(true);
    setError("");
    try {
      const response = await guestLogin();
      const token = response?.access_token || response?.token;
      if (!token) throw new Error("Guest sign-in failed. Please try again.");
      await finish(token);
    } catch (err) {
      setError(String(err.message || err));
    } finally {
      setBusy(false);
    }
  }

  const registering = mode === "register";

  return (
    <div className="container page narrow login-page">
      <span className="eyebrow">NOVELHUB</span>
      <h1>{registering ? "Create your account" : "Welcome back"}</h1>
      <p className="meta">Pick up your reading and writing wherever you left off.</p>
      <form className="auth-form" onSubmit={onSubmit}>
        {registering ? (
          <label>
            Display name
            <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} autoComplete="name" />
          </label>
        ) : null}
        <label>
          Email
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={registering ? 8 : 1}
            required
            autoComplete={registering ? "new-password" : "current-password"}
          />
        </label>
        {error ? <div className="error-banner" role="alert">{error}</div> : null}
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? "Please wait…" : registering ? "Create account" : "Sign in"}
        </button>
        <button type="button" className="btn btn-ghost" disabled={busy} onClick={asGuest}>
          Continue as guest
        </button>
      </form>
      <p className="meta auth-page-switch">
        {registering ? "Already have an account? " : "New to NovelHub? "}
        <button
          type="button"
          className="link-btn"
          onClick={() => { setMode(registering ? "login" : "register"); setError(""); }}
        >
          {registering ? "Sign in" : "Create an account"}
        </button>
      </p>
    </div>
  );
}
