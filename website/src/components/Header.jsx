import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import AuthModal from "./AuthModal";
import { getTags } from "../api";

/** Working nav only — Home merges Discover (no duplicate Discover tab) */
const MAIN_NAV = [
  { to: "/", label: "Home", end: true },
  { to: "/library", label: "Library" },
  { to: "/write", label: "Write" },
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
  const [categories, setCategories] = useState(FALLBACK_CATEGORIES);
  const catRef = useRef(null);
  const navigate = useNavigate();

  const isGuest =
    !user ||
    String(user.email || "").includes("guest") ||
    String(user.provider || "") === "guest";

  const initial = String(user?.display_name || user?.email || "U")
    .trim()
    .charAt(0)
    .toUpperCase();

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

          <Link to="/" className="logo" onClick={closeMenu}>
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
                  {categories.map((name) => (
                    <Link
                      key={name}
                      to={`/genres/${encodeURIComponent(name)}`}
                      onClick={closeMenu}
                    >
                      {name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link to="/account" className="nav-link-account" onClick={closeMenu}>
              Account
            </Link>

            <form className="nav-search mobile-only" onSubmit={submitSearch}>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search stories…"
                aria-label="Search"
              />
              <button type="submit" className="btn btn-primary btn-sm">
                Search
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
                  <Link to="/profile" className="btn btn-ghost" onClick={closeMenu}>
                    Profile
                  </Link>
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
              <button type="submit" className="btn btn-primary btn-sm">
                Search
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
            ) : (
              <div className="header-user-desktop desktop-only">
                <Link to="/profile" className="btn btn-ghost">
                  Profile
                </Link>
                <Link to="/account" className="btn btn-ghost">
                  More
                </Link>
                <button
                  type="button"
                  className="avatar-btn"
                  title={user?.display_name || user?.email}
                  onClick={() => navigate("/profile")}
                >
                  <span className="avatar-circle">{initial}</span>
                </button>
              </div>
            )}
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
