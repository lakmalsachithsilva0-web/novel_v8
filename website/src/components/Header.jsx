import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import AuthModal from "./AuthModal";
import { getTags } from "../api";

/** Keep core reading destinations aligned with the Flutter app. */
const MAIN_NAV = [
  { to: "/", label: "Discover", end: true },
  { to: "/genres/Stories", label: "Stories" },
  { to: "/community", label: "Community" },
  { to: "/write", label: "For writers" },
];

const FALLBACK_CATEGORIES = [
  "Romance",
  "Fantasy",
  "Thriller",
  "Mystery",
  "Sci-Fi",
  "Young Adult",
  "Horror",
  "LGBTQ+",
  "Werewolves",
  "Adventure",
  "Drama",
  "Humor",
];

export default function Header({ user, onLogout, onAuthSuccess }) {
  const [q, setQ] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("signin");
  const [catOpen, setCatOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [categories, setCategories] = useState(FALLBACK_CATEGORIES);
  const catRef = useRef(null);
  const moreRef = useRef(null);
  const navigate = useNavigate();

  const isGuest =
    !user ||
    String(user.email || "").includes("guest") ||
    String(user.provider || "") === "guest";

  useEffect(() => {
    let cancelled = false;
    getTags()
      .then((res) => {
        const items = res?.items || res || [];
        const names = (Array.isArray(items) ? items : [])
          .map((t) => (typeof t === "string" ? t : t?.name))
          .filter(Boolean);
        if (!cancelled && names.length) {
          setCategories([...new Set(names)].slice(0, 24));
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle("nav-open", menuOpen);
    return () => document.body.classList.remove("nav-open");
  }, [menuOpen]);

  useEffect(() => {
    function onDoc(e) {
      if (catRef.current && !catRef.current.contains(e.target)) setCatOpen(false);
      if (moreRef.current && !moreRef.current.contains(e.target)) setMoreOpen(false);
    }
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  function submitSearch(e) {
    e.preventDefault();
    const term = q.trim();
    setMenuOpen(false);
    setCatOpen(false);
    navigate(term ? `/?q=${encodeURIComponent(term)}` : "/");
  }

  function openAuth(mode) {
    setAuthMode(mode);
    setAuthOpen(true);
  }

  function closeMenu() {
    setMenuOpen(false);
    setCatOpen(false);
    setMoreOpen(false);
  }

  return (
    <>
      <header className="site-header site-header--pro">
        <div className="header-bar">
          <button
            type="button"
            className="menu-toggle"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? "✕" : "☰"}
          </button>

          <Link to="/" className="logo" onClick={closeMenu} aria-label="NovelHub home">
            <span className="logo-word">NovelHub</span>
          </Link>

          <nav className={`nav-links ${menuOpen ? "open" : ""}`} aria-label="Main">
            {MAIN_NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => (isActive ? "active" : undefined)}
                onClick={closeMenu}
              >
                {item.label}
              </NavLink>
            ))}

            <div className={`nav-dropdown ${catOpen ? "open" : ""}`} ref={catRef}>
              <button
                type="button"
                className="nav-dropdown-btn"
                aria-expanded={catOpen}
                onClick={(e) => {
                  e.stopPropagation();
                  setCatOpen((v) => !v);
                }}
              >
                Categories ▾
              </button>
              {catOpen && (
                <div className="nav-dropdown-panel categories-panel">
                  <div className="categories-panel-heading"><span className="eyebrow">FIND YOUR NEXT READ</span><strong>Browse by genre</strong></div>
                  <div className="categories-panel-grid">
                    {categories.map((name) => (
                      <Link
                        key={name}
                        to={`/genres/${encodeURIComponent(name)}`}
                        onClick={closeMenu}
                      >
                        <span>{name}</span><span aria-hidden="true">›</span>
                      </Link>
                    ))}
                  </div>
                  <Link className="categories-all-link" to="/" onClick={closeMenu}>Explore all stories <span aria-hidden="true">→</span></Link>
                </div>
              )}
            </div>

            <form className="nav-search mobile-only" onSubmit={submitSearch}>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search stories…"
                aria-label="Search"
              />
              <button type="submit" className="search-icon-btn" aria-label="Search stories" title="Search stories">
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <circle cx="10.8" cy="10.8" r="6.8" />
                  <path d="m16 16 4.2 4.2" />
                </svg>
              </button>
            </form>

            <div className="nav-auth mobile-only">
              {isGuest ? (
                <>
                  <button type="button" className="btn btn-ghost" onClick={() => { closeMenu(); openAuth("signin"); }}>
                    Sign in
                  </button>
                  <button type="button" className="btn btn-primary" onClick={() => { closeMenu(); openAuth("signup"); }}>
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => {
                      closeMenu();
                      onLogout?.();
                      navigate("/");
                    }}
                  >
                    Log out
                  </button>
                </>
              )}
            </div>
          </nav>

          <div className="header-actions">
            <form className="header-search desktop-only" onSubmit={submitSearch}>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search stories…"
                aria-label="Search"
              />
              <button type="submit" className="search-icon-btn" aria-label="Search stories" title="Search stories">
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <circle cx="10.8" cy="10.8" r="6.8" />
                  <path d="m16 16 4.2 4.2" />
                </svg>
              </button>
            </form>

            {isGuest ? (
              <div className="header-auth-desktop desktop-only">
                <button type="button" className="btn btn-ghost" onClick={() => openAuth("signin")}>
                  Sign in
                </button>
                <button type="button" className="btn btn-primary" onClick={() => openAuth("signup")}>
                  Sign up
                </button>
              </div>
            ) : null}
            <div className={`header-more ${moreOpen ? "open" : ""}`} ref={moreRef}>
              <button
                type="button"
                className="header-more-toggle"
                aria-label="More options"
                aria-expanded={moreOpen}
                onClick={() => setMoreOpen((open) => !open)}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="5" r="1.8" />
                  <circle cx="12" cy="12" r="1.8" />
                  <circle cx="12" cy="19" r="1.8" />
                </svg>
              </button>
              {moreOpen && (
                <div className="header-more-menu" role="menu">
                  <Link role="menuitem" to="/library" onClick={closeMenu}>My library</Link>
                  {user && !isGuest ? <Link role="menuitem" to="/profile" onClick={closeMenu}>My profile</Link> : null}
                  <Link role="menuitem" to="/notifications" onClick={closeMenu}>Notifications</Link>
                  <Link role="menuitem" to="/account" onClick={closeMenu}>Account & settings</Link>
                  <Link role="menuitem" to="/community" onClick={closeMenu}>Community</Link>
                  <Link role="menuitem" to="/contests" onClick={closeMenu}>Writing contests</Link>
                  {user && !isGuest ? (
                    <button type="button" role="menuitem" onClick={() => { closeMenu(); onLogout?.(); navigate("/"); }}>Sign out</button>
                  ) : (
                    <button type="button" role="menuitem" onClick={() => { closeMenu(); openAuth("signin"); }}>Sign in</button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {menuOpen && (
        <button type="button" className="nav-backdrop" aria-label="Close" onClick={closeMenu} />
      )}

      <AuthModal
        open={authOpen}
        mode={authMode}
        onClose={() => setAuthOpen(false)}
        onSuccess={async (token, res) => {
          await onAuthSuccess?.(token, res);
          setAuthOpen(false);
          navigate("/", { replace: true });
        }}
      />
    </>
  );
}
