import { useEffect, useRef, useState } from "react";
import { emailAuth, googleAuth, setToken } from "../api";
import { GOOGLE_WEB_CLIENT_ID } from "../config";

/**
 * Inkitt-style sign-in / sign-up modal.
 * Google client ID comes from website/src/config.js (always set for local),
 * optionally overridden by VITE_GOOGLE_CLIENT_ID in website/.env
 */
export default function AuthModal({ open, mode = "signin", onClose, onSuccess }) {
  const [view, setView] = useState(mode); // signin | signup
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const googleBtnRef = useRef(null);
  // Always a non-empty Web client ID (from config fallback)
  const clientId = GOOGLE_WEB_CLIENT_ID;

  useEffect(() => {
    if (open) {
      setView(mode);
      setError("");
    }
  }, [open, mode]);

  useEffect(() => {
    if (!open || !clientId) return;
    const src = "https://accounts.google.com/gsi/client";
    let cancelled = false;

    function renderBtn() {
      if (cancelled || !window.google?.accounts?.id || !googleBtnRef.current) return;
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response) => {
            if (!response?.credential) return;
            setBusy(true);
            setError("");
            try {
              const res = await googleAuth({ id_token: response.credential });
              const token = res?.token || res?.access_token;
              if (!token) throw new Error("No token from Google login");
              setToken(token);
              await onSuccess?.(token, res);
              onClose?.();
            } catch (e) {
              setError(String(e.message || e));
            } finally {
              setBusy(false);
            }
          },
        });
        googleBtnRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: "outline",
          size: "large",
          width: 320,
          text: view === "signup" ? "signup_with" : "signin_with",
        });
        setGoogleReady(true);
      } catch (e) {
        console.error("Google button render failed", e);
        setError(
          "Google button failed to load. In Google Cloud Console, open the Web OAuth client and add Authorized JavaScript origins: http://localhost:5173 and http://127.0.0.1:5173"
        );
      }
    }

    if (window.google?.accounts?.id) {
      renderBtn();
      return () => {
        cancelled = true;
      };
    }

    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      if (window.google?.accounts?.id) renderBtn();
      else existing.addEventListener("load", renderBtn);
      return () => {
        cancelled = true;
        existing.removeEventListener("load", renderBtn);
      };
    }

    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = renderBtn;
    s.onerror = () =>
      setError("Could not load Google script. Check your network / ad-blocker.");
    document.body.appendChild(s);
    return () => {
      cancelled = true;
    };
  }, [open, clientId, view, onClose, onSuccess]);

  if (!open) return null;

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (password.length < 6) {
        throw new Error("Password must be at least 6 characters");
      }
      const res = await emailAuth({
        email: email.trim(),
        display_name: username.trim() || email.split("@")[0],
        username: username.trim(),
        password,
        mode: view === "signup" ? "register" : "login",
      });
      const token = res?.token || res?.access_token;
      if (!token) throw new Error("No token returned");
      setToken(token);
      await onSuccess?.(token, res);
      onClose?.();
    } catch (err) {
      setError(String(err.message || err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="auth-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <h2 className="auth-title">
          {view === "signin" ? "Sign in to NovelHub" : "Sign up with email"}
        </h2>

        <form className="auth-modal-form" onSubmit={onSubmit}>
          <input
            type="email"
            placeholder={view === "signin" ? "E-mail or Username" : "Enter your E-mail"}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          {view === "signup" && (
            <input
              type="text"
              placeholder="Pick a Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
            />
          )}
          <input
            type="password"
            placeholder={view === "signin" ? "Password" : "Pick a Password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete={view === "signup" ? "new-password" : "current-password"}
          />

          {error && <div className="error-banner auth-error">{error}</div>}

          <button type="submit" className="auth-submit" disabled={busy}>
            {busy ? "…" : view === "signin" ? "Sign in" : "Sign up"}
          </button>
        </form>

        <div className="auth-divider">
          <span>Or</span>
        </div>

        {/* Always render the Google button host — client ID is always set via config.js */}
        <div
          className="google-btn-wrap"
          ref={googleBtnRef}
          style={{ display: "flex", justifyContent: "center", minHeight: 44 }}
        />
        {!googleReady && (
          <p className="meta" style={{ textAlign: "center", fontSize: 12, marginTop: 6 }}>
            Loading Google…
          </p>
        )}

        <p className="auth-switch">
          {view === "signin" ? (
            <>
              You can also{" "}
              <button type="button" className="linkish" onClick={() => setView("signup")}>
                sign up
              </button>
            </>
          ) : (
            <>
              Have an account?{" "}
              <button type="button" className="linkish" onClick={() => setView("signin")}>
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
