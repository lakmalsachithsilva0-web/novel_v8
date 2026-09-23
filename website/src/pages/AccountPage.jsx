import { Link } from "react-router-dom";
import { isGuestUser } from "../utils/guest";

/**
 * Flutter "More" tab — same groups: Profile, Support, Settings, Legal, Account.
 */
const SECTIONS = [
  {
    title: "Profile",
    items: [
      { to: "/profile", label: "View profile" },
      { to: "/library", label: "Library" },
      { to: "/manage-stories", label: "My stories / Write" },
      { to: "/account/stats", label: "Reading stats" },
    ],
  },
  {
    title: "Support",
    items: [
      { to: "/account/help", label: "Help Center" },
      { to: "/account/contact", label: "Contact us" },
    ],
  },
  {
    title: "Settings",
    items: [
      { to: "/account/notifications", label: "Notifications" },
      { to: "/account/language", label: "Language" },
      { to: "/account/genres", label: "Favourite genres" },
      { to: "/account/warnings", label: "Content warnings" },
    ],
  },
  {
    title: "Legal",
    items: [
      { to: "/account/terms", label: "Terms of Service" },
      { to: "/account/privacy", label: "Privacy Policy" },
      { to: "/account/cookies", label: "Cookie preferences" },
    ],
  },
];

function StaticInfo({ title, children }) {
  return (
    <div className="container page">
      <Link to="/account" className="meta">
        ← Back to Account
      </Link>
      <h1>{title}</h1>
      <div className="card-panel">{children}</div>
    </div>
  );
}

export function AccountHelp() {
  return (
    <StaticInfo title="Help Center">
      <p>Browse free stories from Home, save them in Library, and write from Write.</p>
      <p className="meta">Same backend and database as the mobile app.</p>
    </StaticInfo>
  );
}

export function AccountContact() {
  return (
    <StaticInfo title="Contact us">
      <p>Email support through your app store listing or project maintainer.</p>
      <p className="meta">For account issues, try Sign out and Sign in again.</p>
    </StaticInfo>
  );
}

export function AccountStats({ user }) {
  return (
    <StaticInfo title="Reading stats">
      <p>Chapters read: {user?.chapters_read ?? user?.chaptersRead ?? "—"}</p>
      <p className="meta">Detailed streaks sync from the same API as the Flutter app when available.</p>
      <Link to="/library">Open library</Link>
    </StaticInfo>
  );
}

export function AccountSimple({ title, body }) {
  return (
    <StaticInfo title={title}>
      <p>{body}</p>
    </StaticInfo>
  );
}

export default function AccountPage({ user, onLogout }) {
  const guest = isGuestUser(user);

  return (
    <div className="container page account-page">
      <h1>Account &amp; More</h1>
      <p className="meta">
        {guest
          ? "You are browsing as a guest. Sign in for full profile and library sync."
          : `Signed in as ${user?.display_name || user?.email}`}
      </p>

      {guest ? (
        <div className="guest-lock" style={{ marginBottom: 24 }}>
          <Link className="btn btn-primary" to="/login">
            Sign in
          </Link>
        </div>
      ) : null}

      {SECTIONS.map((sec) => (
        <section key={sec.title} className="account-section card-panel">
          <h2>{sec.title}</h2>
          <ul className="account-menu">
            {sec.items.map((item) => (
              <li key={item.to}>
                <Link to={item.to}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {!guest ? (
        <section className="account-section card-panel">
          <h2>Change accounts</h2>
          <button type="button" className="btn btn-ghost" onClick={() => onLogout?.()}>
            Sign out
          </button>
        </section>
      ) : null}
    </div>
  );
}
