import { Link, NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { resolveAssetUrl } from "../api";

const links = [
  { to: "/", label: "Discover", end: true },
  { to: "/library", label: "Library" },
  { to: "/write", label: "Write" },
  { to: "/search", label: "Explore" },
  { to: "/notifications", label: "Notifications" },
];

export default function Shell({ user, isRealUser, onOpenAuth, children }) {
  const [q, setQ] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  function onSearch(e) {
    e.preventDefault();
    if (q.trim()) {
      navigate(`/search?q=${encodeURIComponent(q.trim())}`);
      setMenuOpen(false);
    }
  }

  const initial = (user?.display_name || user?.username || user?.email || "G").charAt(0).toUpperCase();

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="site-header-inner">
          <Link to="/" className="logo" onClick={() => setMenuOpen(false)}>
            NovelHub
          </Link>

          <nav className={`site-nav${menuOpen ? " open" : ""}`}>
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                onClick={() => setMenuOpen(false)}
              >
                {l.label}
              </NavLink>
            ))}
            <NavLink to="/more" onClick={() => setMenuOpen(false)}>
              Account
            </NavLink>
          </nav>

          <form className="header-search" onSubmit={onSearch}>
            <span className="search-icon" aria-hidden>
              ⌕
            </span>
            <input
              type="search"
              placeholder="Search stories…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </form>

          <div className="header-actions">
            {isRealUser ? (
              <Link to="/more" className="avatar-btn" title={user?.display_name || "Account"}>
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
            <button
              type="button"
              className="nav-toggle"
              aria-label="Menu"
              onClick={() => setMenuOpen((o) => !o)}
            >
              <span />
            </button>
          </div>
        </div>
      </header>

      <main className="main">{children}</main>

      <footer className="site-footer">
        <div className="site-footer-inner">
          <div>
            <strong style={{ color: "var(--text)" }}>NovelHub</strong>
            <span style={{ marginLeft: 8 }}>Stories from the same library as the app.</span>
          </div>
          <div style={{ display: "flex", gap: 20 }}>
            <Link to="/">Discover</Link>
            <Link to="/write">Write</Link>
            <Link to="/search">Explore</Link>
            <Link to="/more">Account</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
