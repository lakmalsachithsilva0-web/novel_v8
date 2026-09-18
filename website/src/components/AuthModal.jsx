import { useEffect, useRef, useState } from "react";
import { emailAuth, googleAuth, setToken } from "../api";
import { GOOGLE_WEB_CLIENT_ID } from "../config";

export default function AuthModal({ open, mode = "signin", onClose, onSuccess }) {
  const [view, setView] = useState(mode);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const googleBtnRef = useRef(null);
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
              if (!token) throw new Error("No token from Google");
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
          theme: "filled_black",
          size: "large",
          width: 320,
          text: view === "signup" ? "signup_with" : "signin_with",
        });
      } catch (e) {
        console.error(e);
      }
    }

    if (window.google?.accounts?.id) {
      renderBtn();
      return () => {
        cancelled = true;
      };
    }
    let s = document.querySelector(`script[src="${src}"]`);
    if (!s) {
      s = document.createElement("script");
      s.src = src;
      s.async = true;
      document.body.appendChild(s);
    }
    s.addEventListener("load", renderBtn);
    return () => {
      cancelled = true;
      s.removeEventListener("load", renderBtn);
    };
  }, [open, clientId, view, onClose, onSuccess]);

  if (!open) return null;

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (password.length < 6) throw new Error("Password must be at least 6 characters");
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
        <h2 className="auth-title">{view === "signin" ? "Sign in" : "Create account"}</h2>
        <form className="auth-modal-form" onSubmit={onSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          {view === "signup" && (
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
            />
          )}
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete={view === "signup" ? "new-password" : "current-password"}
          />
          {error && <div className="error-banner">{error}</div>}
          <button type="submit" className="auth-submit" disabled={busy}>
            {busy ? "…" : view === "signin" ? "Sign in" : "Sign up"}
          </button>
        </form>
        <div className="auth-divider">
          <span>Or</span>
        </div>
        <div className="google-btn-wrap" ref={googleBtnRef} />
        <p className="auth-switch">
          {view === "signin" ? (
            <>
              New here?{" "}
              <button type="button" className="linkish" onClick={() => setView("signup")}>
                Sign up
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
