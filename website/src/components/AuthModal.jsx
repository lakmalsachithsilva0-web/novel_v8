import { useEffect, useRef, useState } from "react";
import { emailAuth, googleAuth, setToken } from "../api";

/**
 * Inkitt-style sign-in / sign-up modal.
 * Google: set VITE_GOOGLE_CLIENT_ID (Web client ID) in website/.env
 *         and the same ID in backend GOOGLE_CLIENT_IDS.
 * Then fully restart `npm run dev` (Vite only reads .env on start).
 */
export default function AuthModal({ open, mode = "signin", onClose, onSuccess }) {
  const [view, setView] = useState(mode); // signin | signup
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const googleBtnRef = useRef(null);
  const clientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID || "").trim();

  useEffect(() => {
    if (open) {
      setView(mode);
      setError("");
    }
  }, [open, mode]);

  useEffect(() => {
    if (!open || !clientId) return;
    const src = "https://accounts.google.com/gsi/client";
    function renderBtn() {
      if (!window.google?.accounts?.id || !googleBtnRef.current) return;
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
    }
    if (window.google?.accounts?.id) {
      renderBtn();
      return;
    }
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      existing.addEventListener("load", renderBtn);
      return () => existing.removeEventListener("load", renderBtn);
    }
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = renderBtn;
    document.body.appendChild(s);
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

        {clientId ? (
          <div className="google-btn-wrap" ref={googleBtnRef} style={{ display: "flex", justifyContent: "center" }} />
        ) : (
          <div className="auth-google-missing">
            <button
              type="button"
              className="auth-google-placeholder"
              onClick={() =>
                setError(
                  "Google is not configured. Create a Web OAuth client in Google Cloud Console, put the Client ID in website/.env as VITE_GOOGLE_CLIENT_ID=..., same value in backend/.env GOOGLE_CLIENT_IDS, then restart npm run dev and uvicorn."
                )
              }
              style={{
                width: "100%",
                maxWidth: 320,
                margin: "0 auto",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                padding: "10px 16px",
                border: "1px solid #dadce0",
                borderRadius: 4,
                background: "#fff",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 500,
                color: "#3c4043",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
              Continue with Google
            </button>
            <p className="meta auth-google-hint" style={{ marginTop: 8, fontSize: 12, textAlign: "center" }}>
              Button is ready. Set <code>VITE_GOOGLE_CLIENT_ID</code> in <code>website/.env</code> and restart Vite to activate real Google login.
            </p>
          </div>
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
