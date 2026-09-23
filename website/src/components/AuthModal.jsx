import { useEffect, useRef, useState } from "react";
import { emailAuth, googleAuth, setToken } from "../api";

const GOOGLE_CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID || "").trim();

function loadGisScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }
    const existing = document.getElementById("google-gis");
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", reject);
      return;
    }
    const s = document.createElement("script");
    s.id = "google-gis";
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

export default function AuthModal({ open, mode = "signin", onClose, onSuccess }) {
  const [authMode, setAuthMode] = useState(mode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const googleBtnRef = useRef(null);

  useEffect(() => {
    if (open) {
      setAuthMode(mode);
      setError("");
    }
  }, [open, mode]);

  useEffect(() => {
    if (!open || !GOOGLE_CLIENT_ID) {
      setGoogleReady(false);
      return undefined;
    }
    let cancelled = false;
    (async () => {
      try {
        await loadGisScript();
        if (cancelled || !window.google?.accounts?.id) return;
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: async (response) => {
            if (!response?.credential) {
              setError("Google did not return a token.");
              return;
            }
            setLoading(true);
            setError("");
            try {
              const res = await googleAuth({ id_token: response.credential });
              const token = res?.access_token || res?.token;
              if (!token) throw new Error("No access token from server");
              setToken(token);
              await onSuccess?.(token, res);
            } catch (e) {
              setError(String(e.message || e));
            } finally {
              setLoading(false);
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        if (googleBtnRef.current) {
          googleBtnRef.current.innerHTML = "";
          window.google.accounts.id.renderButton(googleBtnRef.current, {
            theme: "filled_black",
            size: "large",
            width: 320,
            text: "continue_with",
            shape: "pill",
          });
        }
        if (!cancelled) setGoogleReady(true);
      } catch {
        if (!cancelled) {
          setGoogleReady(false);
          setError((prev) => prev || "Google Sign-In script failed to load.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, onSuccess]);

  if (!open) return null;

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const em = email.trim().toLowerCase();
      if (!em) throw new Error("Email is required");
      if (authMode === "signup") {
        if (!password || password.length < 8) {
          throw new Error("Password must be at least 8 characters (letter + number recommended).");
        }
      }
      const res = await emailAuth({
        email: em,
        password: password || undefined,
        display_name: displayName.trim() || em.split("@")[0],
      });
      const token = res?.access_token || res?.token;
      if (!token) throw new Error("No access token returned");
      setToken(token);
      await onSuccess?.(token, res);
    } catch (err) {
      const msg = String(err.message || err);
      if (msg.includes("401") || /invalid email or password/i.test(msg)) {
        setError(
          authMode === "signin"
            ? "Invalid email or password. If you only used Google before, use Google Sign-In or Sign up with a password."
            : msg
        );
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-overlay" role="dialog" aria-modal="true">
      <button type="button" className="auth-backdrop" aria-label="Close" onClick={onClose} />
      <div className="auth-card">
        <div className="auth-card-head">
          <h2>{authMode === "signup" ? "Create account" : "Sign in"}</h2>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
            ✕
          </button>
        </div>

        {error ? <div className="error-banner">{error}</div> : null}

        <div className="google-btn-wrap">
          {GOOGLE_CLIENT_ID ? (
            <div ref={googleBtnRef} className="google-btn-host" />
          ) : (
            <p className="meta">
              Google Sign-In needs <code>VITE_GOOGLE_CLIENT_ID</code> in website <code>.env</code>.
            </p>
          )}
          {GOOGLE_CLIENT_ID && !googleReady ? (
            <p className="meta">Loading Google…</p>
          ) : null}
        </div>

        <div className="auth-divider">
          <span>or email</span>
        </div>

        <form onSubmit={submit} className="auth-form">
          {authMode === "signup" ? (
            <label>
              Display name
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                autoComplete="name"
              />
            </label>
          ) : null}
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              autoComplete="email"
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={authMode === "signup" ? "Min 8 characters" : "Your password"}
              autoComplete={authMode === "signup" ? "new-password" : "current-password"}
              required={authMode === "signup"}
            />
          </label>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Please wait…" : authMode === "signup" ? "Sign up" : "Sign in"}
          </button>
        </form>

        <p className="auth-switch meta">
          {authMode === "signup" ? (
            <>
              Already have an account?{" "}
              <button type="button" className="link-btn" onClick={() => setAuthMode("signin")}>
                Sign in
              </button>
            </>
          ) : (
            <>
              New here?{" "}
              <button type="button" className="link-btn" onClick={() => setAuthMode("signup")}>
                Create account
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
