import { Link } from "react-router-dom";
import { resolveAssetUrl } from "../api";

const links = [
  { to: "/profile", label: "Profile", icon: "👤" },
  { to: "/library", label: "Library", icon: "📚" },
  { to: "/write", label: "Write & manage stories", icon: "✍️" },
  { to: "/notifications", label: "Notifications", icon: "🔔" },
  { to: "/search", label: "Search & explore", icon: "🔍" },
];

export default function MorePage({ user, isRealUser, onLogout, onOpenAuth }) {
  const name = user?.display_name || user?.username || (isRealUser ? "Reader" : "Guest");
  const photo = resolveAssetUrl(user?.photo_url || "");

  return (
    <div className="container" style={{ paddingTop: 20, maxWidth: 560, paddingBottom: 40 }}>
      <div
        className="panel"
        style={{
          display: "flex",
          gap: 16,
          alignItems: "center",
          marginBottom: 24,
          background: "linear-gradient(135deg, var(--purple-dim), var(--card))",
        }}
      >
        <div
          className="avatar-btn"
          style={{ width: 56, height: 56, fontSize: "1.25rem" }}
        >
          {photo ? <img src={photo} alt="" /> : name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 style={{ fontFamily: "var(--display)", fontSize: "1.2rem" }}>{name}</h2>
          <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
            {isRealUser ? user?.email || "Signed in" : "Browsing as guest"}
          </p>
        </div>
      </div>

      <div className="menu-list">
        {links.map((l) => (
          <Link key={l.to} to={l.to} className="menu-item">
            <span className="menu-icon">{l.icon}</span>
            <span style={{ fontWeight: 600 }}>{l.label}</span>
          </Link>
        ))}
      </div>

      <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 10 }}>
        {isRealUser ? (
          <button type="button" className="btn btn-ghost" onClick={onLogout}>
            Sign out
          </button>
        ) : (
          <>
            <button type="button" className="btn btn-primary" onClick={() => onOpenAuth("signin")}>
              Sign in
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => onOpenAuth("signup")}>
              Create account
            </button>
          </>
        )}
      </div>
    </div>
  );
}
