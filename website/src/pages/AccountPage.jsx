import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { isGuestUser } from "../utils/guest";

/** Same FAQ content as Flutter HelpCenterScreen */
const FAQ = {
  "Account & Login": [
    {
      q: "How do I sign in with Google?",
      a: "On the login screen choose Continue with Google, pick your account, and complete the one-time profile form if this is your first visit. Later logins skip the form.",
    },
    {
      q: "Why am I asked to complete my profile?",
      a: "Only the first time you sign in with Google or email. We store display name and preferences so we do not ask again on that account.",
    },
    {
      q: "How do I sign out?",
      a: "Open Account (More) → Change accounts → Sign out. Reading progress stays linked to your account.",
    },
    {
      q: "Can I delete my account?",
      a: "Use Contact us and request account deletion. An admin will process the request.",
    },
  ],
  Reading: [
    {
      q: "How does reading progress work?",
      a: "Progress is saved per chapter as you read and when you track a story in Library. Resume continues where you left off on web and mobile.",
    },
    {
      q: "How are reading stats calculated?",
      a: "Chapters read, completed books and day streak come from your library activity stored on the same server as the Flutter app.",
    },
  ],
  "Writing & Stories": [
    {
      q: "How do I publish a story?",
      a: "Open Write → create a story, add chapters, then publish. Stories use the same database as the mobile app.",
    },
    {
      q: "Where do likes and reviews appear?",
      a: "Your actions show under Profile. Interactions on your stories appear in notifications when enabled.",
    },
  ],
  "Notifications & Privacy": [
    {
      q: "What is Activity?",
      a: "Activity lists likes, comments, reviews, saves and follows related to your account when available from the API.",
    },
    {
      q: "How do I manage notification settings?",
      a: "Account → Settings → Notifications. Toggle reading reminders, new releases, recommendations and system messages (stored locally on web).",
    },
    {
      q: "Who can see my profile?",
      a: "Public profile shows display name, bio, and published stories. Email is only visible to you when signed in.",
    },
  ],
};

const TERMS = [
  { t: "1. Acceptance", b: "By using NovelHub you agree to these terms. If you do not agree, do not use the service." },
  { t: "2. Use of Service", b: "You must be at least 13 years old. Use the platform only for lawful purposes." },
  { t: "3. User Content", b: "You retain ownership of content you post, and grant us a license to host and display it to provide the service." },
  { t: "4. Termination", b: "We may suspend or terminate accounts that violate these terms or harm other users." },
];

const PRIVACY = [
  { t: "1. Information We Collect", b: "We collect account details you provide (name, email) and usage data needed for reading progress and recommendations." },
  { t: "2. How We Use Information", b: "We use data to provide and improve NovelHub, sync library progress, and communicate about the service." },
  { t: "3. Information Sharing", b: "We do not sell your personal information. Data may be processed by trusted infrastructure partners." },
  { t: "4. Your Rights", b: "You can access, update, or request deletion of your information via Contact us." },
];

const GENRES = [
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

const WARNINGS = ["Violence", "Strong language", "Sexual content", "Gore", "Abuse", "Suicide themes"];

function PageShell({ title, children }) {
  return (
    <div className="container page faq-page">
      <Link to="/account" className="page-back">
        ← Back to Account
      </Link>
      <h1>{title}</h1>
      {children}
    </div>
  );
}

export function AccountHelp() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState({});

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return FAQ;
    const out = {};
    Object.entries(FAQ).forEach(([cat, items]) => {
      const match = items.filter(
        (it) => it.q.toLowerCase().includes(q) || it.a.toLowerCase().includes(q)
      );
      if (match.length) out[cat] = match;
    });
    return out;
  }, [query]);

  function toggle(key) {
    setOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <PageShell title="Help Center">
      <input
        className="faq-search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search help topics…"
        aria-label="Search help"
      />
      {Object.keys(filtered).length === 0 ? (
        <p className="meta">No results. Try another keyword.</p>
      ) : (
        Object.entries(filtered).map(([cat, items]) => (
          <div key={cat} className="faq-cat">
            <h2 className="faq-cat-title">{cat}</h2>
            {items.map((it) => {
              const key = `${cat}:${it.q}`;
              const isOpen = !!open[key];
              return (
                <div key={key} className={`faq-item ${isOpen ? "open" : ""}`}>
                  <button type="button" className="faq-q" onClick={() => toggle(key)}>
                    <span>{it.q}</span>
                    <span>{isOpen ? "−" : "+"}</span>
                  </button>
                  <div className="faq-a">{it.a}</div>
                </div>
              );
            })}
          </div>
        ))
      )}
    </PageShell>
  );
}

export function AccountContact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  function submit(e) {
    e.preventDefault();
    setSent(true);
  }

  return (
    <PageShell title="Contact us">
      <div className="card-panel">
        {sent ? (
          <p>
            Thanks — your message was recorded in this browser session. For production support, email
            your project maintainer or use the in-app contact channel.
          </p>
        ) : (
          <form className="contact-form" onSubmit={submit}>
            <label>
              Name
              <input value={name} onChange={(e) => setName(e.target.value)} required />
            </label>
            <label>
              Email
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>
            <label>
              Message
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} required />
            </label>
            <button type="submit" className="btn btn-primary">
              Send message
            </button>
          </form>
        )}
      </div>
    </PageShell>
  );
}

export function AccountStats({ user }) {
  return (
    <PageShell title="Reading stats">
      <div className="profile-stat-row">
        <div className="profile-stat-card">
          <strong>{user?.chapters_read ?? user?.chaptersRead ?? 0}</strong>
          <span>Chapters read</span>
        </div>
        <div className="profile-stat-card">
          <strong>{user?.day_streak ?? user?.dayStreak ?? 0}</strong>
          <span>Day streak</span>
        </div>
        <div className="profile-stat-card">
          <strong>{user?.social_karma ?? user?.socialKarma ?? 0}</strong>
          <span>Social karma</span>
        </div>
      </div>
      <p className="meta" style={{ marginTop: 16 }}>
        Stats come from the same <code>/api/me</code> data used by the Flutter app when you are signed in.
      </p>
      <Link className="btn btn-primary" to="/library" style={{ marginTop: 12, display: "inline-flex" }}>
        Open library
      </Link>
    </PageShell>
  );
}

export function AccountNotifications() {
  const [flags, setFlags] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("nh_notif") || "{}");
    } catch {
      return {};
    }
  });
  function toggle(key) {
    setFlags((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem("nh_notif", JSON.stringify(next));
      return next;
    });
  }
  const rows = [
    ["reading", "Reading reminders"],
    ["releases", "New releases"],
    ["recs", "Recommendations"],
    ["system", "System messages"],
  ];
  return (
    <PageShell title="Notifications">
      <div className="account-section">
        {rows.map(([key, label]) => (
          <div key={key} className="toggle-row">
            <span>{label}</span>
            <button
              type="button"
              className={`toggle-switch ${flags[key] ? "on" : ""}`}
              aria-pressed={!!flags[key]}
              onClick={() => toggle(key)}
            />
          </div>
        ))}
      </div>
      <p className="meta">Preferences are saved in this browser (same idea as Flutter settings toggles).</p>
    </PageShell>
  );
}

export function AccountGenres() {
  const [selected, setSelected] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("nh_genres") || "[]");
    } catch {
      return [];
    }
  });
  function toggle(g) {
    setSelected((prev) => {
      const next = prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g];
      localStorage.setItem("nh_genres", JSON.stringify(next));
      return next;
    });
  }
  return (
    <PageShell title="Favourite genres">
      <div className="account-section">
        <div className="chip-grid">
          {GENRES.map((g) => (
            <button
              key={g}
              type="button"
              className={`genre-chip ${selected.includes(g) ? "on" : ""}`}
              onClick={() => toggle(g)}
            >
              {g}
            </button>
          ))}
        </div>
      </div>
      <p className="meta">Selected genres help personalize discovery on this device.</p>
    </PageShell>
  );
}

export function AccountWarnings() {
  const [selected, setSelected] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("nh_warn") || "[]");
    } catch {
      return [];
    }
  });
  function toggle(w) {
    setSelected((prev) => {
      const next = prev.includes(w) ? prev.filter((x) => x !== w) : [...prev, w];
      localStorage.setItem("nh_warn", JSON.stringify(next));
      return next;
    });
  }
  return (
    <PageShell title="Content warnings">
      <div className="account-section">
        <div className="chip-grid">
          {WARNINGS.map((w) => (
            <button
              key={w}
              type="button"
              className={`genre-chip ${selected.includes(w) ? "on" : ""}`}
              onClick={() => toggle(w)}
            >
              {w}
            </button>
          ))}
        </div>
      </div>
      <p className="meta">Mark topics you prefer to be careful with while browsing.</p>
    </PageShell>
  );
}

export function AccountLegal({ kind }) {
  const isPrivacy = kind === "privacy";
  const title = isPrivacy ? "Privacy Policy" : kind === "cookies" ? "Cookie preferences" : "Terms of Service";
  const sections = isPrivacy ? PRIVACY : kind === "cookies" ? [
    { t: "Local storage", b: "We store your login token and UI preferences (theme, notification toggles) in local storage only." },
    { t: "No third-party ad cookies", b: "This web client does not load advertising trackers by default." },
  ] : TERMS;

  return (
    <PageShell title={title}>
      {sections.map((s) => (
        <div key={s.t} className="legal-block">
          <h3>{s.t}</h3>
          <p>{s.b}</p>
        </div>
      ))}
    </PageShell>
  );
}

export function AccountLanguage() {
  return (
    <PageShell title="Language">
      <div className="account-section">
        <div className="toggle-row">
          <span>English (default)</span>
          <span className="meta">Active</span>
        </div>
      </div>
      <p className="meta">Additional languages can be added later without changing the Flutter app.</p>
    </PageShell>
  );
}

/** @deprecated name kept for App imports */
export function AccountSimple({ title, body }) {
  return (
    <PageShell title={title}>
      <div className="legal-block">
        <p>{body}</p>
      </div>
    </PageShell>
  );
}

export default function AccountPage({ user, onLogout }) {
  const guest = isGuestUser(user);
  const name = user?.display_name || user?.email || "Guest";

  return (
    <div className="container page account-page">
      <div className="account-hero">
        <div className="profile-avatar-lg" style={{ width: 72, height: 72, fontSize: "1.6rem" }}>
          {String(name).trim().charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 style={{ margin: 0 }}>{guest ? "Account & More" : name}</h1>
          <p className="meta" style={{ margin: "6px 0 0" }}>
            {guest
              ? "Sign in for full profile sync with the mobile app."
              : user?.email || "Signed in"}
          </p>
          <div className="profile-actions-bar">
            {!guest ? <Link className="btn btn-primary" to="/profile">View profile</Link> : null}
            {guest ? <Link className="btn btn-primary" to="/login">Sign in</Link> : null}
          </div>
        </div>
      </div>

      <section className="account-section">
        <h2>Profile</h2>
        <ul className="account-menu">
          <li>
            <Link to="/profile">
              View profile <span className="chev">›</span>
            </Link>
          </li>
          <li>
            <Link to="/library">
              Library <span className="chev">›</span>
            </Link>
          </li>
          <li>
            <Link to="/manage-stories">
              My stories / Write <span className="chev">›</span>
            </Link>
          </li>
          <li>
            <Link to="/account/stats">
              Reading stats <span className="chev">›</span>
            </Link>
          </li>
        </ul>
      </section>

      <section className="account-section">
        <h2>Support</h2>
        <ul className="account-menu">
          <li>
            <Link to="/account/help">
              Help Center <span className="chev">›</span>
            </Link>
          </li>
          <li>
            <Link to="/account/contact">
              Contact us <span className="chev">›</span>
            </Link>
          </li>
        </ul>
      </section>

      <section className="account-section">
        <h2>Settings</h2>
        <ul className="account-menu">
          <li>
            <Link to="/account/notifications">
              Notifications <span className="chev">›</span>
            </Link>
          </li>
          <li>
            <Link to="/account/language">
              Language <span className="chev">›</span>
            </Link>
          </li>
          <li>
            <Link to="/account/genres">
              Favourite genres <span className="chev">›</span>
            </Link>
          </li>
          <li>
            <Link to="/account/warnings">
              Content warnings <span className="chev">›</span>
            </Link>
          </li>
        </ul>
      </section>

      <section className="account-section">
        <h2>Legal</h2>
        <ul className="account-menu">
          <li>
            <Link to="/account/terms">
              Terms of Service <span className="chev">›</span>
            </Link>
          </li>
          <li>
            <Link to="/account/privacy">
              Privacy Policy <span className="chev">›</span>
            </Link>
          </li>
          <li>
            <Link to="/account/cookies">
              Cookie preferences <span className="chev">›</span>
            </Link>
          </li>
        </ul>
      </section>

      {!guest ? (
        <section className="account-section">
          <h2>Change accounts</h2>
          <ul className="account-menu">
            <li>
              <button type="button" className="menu-row danger" onClick={() => onLogout?.()}>
                Sign out <span className="chev">›</span>
              </button>
            </li>
          </ul>
        </section>
      ) : null}
    </div>
  );
}
