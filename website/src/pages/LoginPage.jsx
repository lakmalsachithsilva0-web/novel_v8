import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { emailLogin, guestLogin, googleAuth, setToken } from "../api";

const GOOGLE_CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID || "").trim();

function loadGoogleScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }
    const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", reject);
      return;
    }
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

export default function LoginPage({ onSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const googleBtnRef = useRef(null);
  const googleReady = useRef(false);

  async function finish(token) {
    setToken(token);
    try {
      await onSuccess?.(token);
    } catch {
      /* still navigate — token is set */
    }
    navigate("/", { replace: true });
  }

  async function handleGoogleCredential(response) {
    const idToken = response?.credential;
    if (!idToken) {
      setError("Google sign-in returned no credential");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await googleAuth({ id_token: idToken });
      const token = res?.access_token || res?.token || res?.accessToken;
      if (!token) throw new Error("No token from Google auth");
      await finish(token);
    } catch (err) {
      setError(String(err.message || err));
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !googleBtnRef.current || googleReady.current) return;
    let cancelled = false;
    (async () => {
      try {
        await loadGoogleScript();
        if (cancelled || !window.google?.accounts?.id) return;
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCredential,
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
          width: 320,
        });
        googleReady.current = true;
      } catch (e) {
        console.warn("Google Identity Services failed to load", e);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await emailLogin(email.trim(), password);
      const token = res?.access_token || res?.token || res?.accessToken;
      if (!token) throw new Error("No token returned — check email/password");
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
      const res = await guestLogin();
      const token = res?.access_token || res?.token;
      if (!token) throw new Error("Guest login failed");
      await finish(token);
    } catch (err) {
      setError(String(err.message || err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container page narrow">
      <h1>Sign in</h1>
      <p className="meta">Same auth as the mobile app and admin panel.</p>

      {GOOGLE_CLIENT_ID ? (
        <div className="auth-google-wrap" style={{ marginBottom: 16 }}>
          <div ref={googleBtnRef} />
          <p className="meta" style={{ marginTop: 8, fontSize: 12 }}>
            Or use email below
          </p>
        </div>
      ) : (
        <p className="meta" style={{ marginBottom: 12, color: "#b45309" }}>
          Google Sign-In is not configured. Set <code>VITE_GOOGLE_CLIENT_ID</code> in{" "}
          <code>website/.env</code> (see SETUP_GUIDE).
        </p>
      )}

      <form className="auth-form" onSubmit={onSubmit}>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </label>
        {error && <div className="error-banner">{error}</div>}
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
        <button type="button" className="btn" disabled={busy} onClick={asGuest}>
          Continue as guest
        </button>
      </form>
    </div>
  );
}
