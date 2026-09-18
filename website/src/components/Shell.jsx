import { Link, NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { resolveAssetUrl } from "../api";

const tabs = [
  { to: "/library", label: "Library", icon: IconLibrary },
  { to: "/", label: "Home", icon: IconHome, end: true },
  { to: "/write", label: "Write", icon: IconWrite },
  { to: "/notifications", label: "Alerts", icon: IconBell },
  { to: "/more", label: "More", icon: IconMore },
];

export default function Shell({ user, isRealUser, onOpenAuth, onLogout, children }) {
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  function onSearch(e) {
    e.preventDefault();
    if (q.trim()) navigate(`/search?q=${encodeURIComponent(q.trim())}`);
  }

  const initial =
    (user?.display_name || user?.username || user?.email || "G").charAt(0).toUpperCase();

  return (
    <div className="app-shell">
      <header className="top-header">
        <div className="top-header-inner">
          <Link to="/" className="logo">
            NovelHub
          </Link>
          <form className="header-search" onSubmit={onSearch}>
            <span className="search-icon" aria-hidden>
              ⌕
            </span>
            <input
              type="search"
              placeholder="Search stories, authors…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </form>
          <div className="header-actions">
            {isRealUser ? (
              <Link to="/more" className="avatar-btn" title={user?.display_name || "Profile"}>
                {user?.photo_url ? (
                  <img src={resolveAssetUrl(user.photo_url)} alt="" />
                ) : (
                  initial
                )}
              </Link>
            ) : (
              <>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => onOpenAuth("signin")}>
                  Sign in
                </button>
                <button type="button" className="btn btn-primary btn-sm" onClick={() => onOpenAuth("signup")}>
                  Sign up
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="main">{children}</main>

      <nav className="bottom-nav" aria-label="Main">
        <div className="bottom-nav-inner">
          {tabs.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.end}
              className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
            >
              <t.icon />
              <span>{t.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}

function IconLibrary() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}
function IconHome() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}
function IconWrite() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}
function IconBell() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}
function IconMore() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="1" fill="currentColor" />
      <circle cx="19" cy="12" r="1" fill="currentColor" />
      <circle cx="5" cy="12" r="1" fill="currentColor" />
    </svg>
  );
}
