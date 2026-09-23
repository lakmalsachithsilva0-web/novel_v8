import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getMe, getMyStories, resolveAssetUrl } from "../api";
import { isGuestUser } from "../utils/guest";

const TABS = ["About", "Stories"];

export default function ProfilePage({ user, onLogout }) {
  const guest = isGuestUser(user);
  const [me, setMe] = useState(user);
  const [stories, setStories] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("About");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (guest) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const [profile, mine] = await Promise.all([
          getMe().catch(() => user),
          getMyStories().catch(() => ({ items: [] })),
        ]);
        if (!cancelled) {
          setMe(profile || user);
          setStories(mine?.items || mine || []);
        }
      } catch (e) {
        if (!cancelled) setError(String(e.message || e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [guest, user]);

  const name = me?.display_name || me?.email || "Reader";
  const photo = resolveAssetUrl(me?.photo_url || me?.photoUrl || "");
  const cover = resolveAssetUrl(me?.cover_url || me?.coverUrl || "");
  const bio = me?.bio || "";
  const initial = name.trim().charAt(0).toUpperCase();
  const username = me?.username || (me?.email ? me.email.split("@")[0] : "");

  const stats = useMemo(
    () => [
      {
        label: "Followers",
        value: me?.followers ?? me?.follower_count ?? 0,
      },
      {
        label: "Following",
        value: me?.following ?? me?.following_count ?? 0,
      },
      {
        label: "Chapters read",
        value: me?.chapters_read ?? me?.chaptersRead ?? 0,
      },
    ],
    [me]
  );

  if (guest) {
    return (
      <div className="container page">
        <div className="guest-lock card-panel">
          <h1>Your profile</h1>
          <p className="meta">Sign in to see your Galatea-style profile, stats, and stories.</p>
          <Link className="btn btn-primary" to="/login">
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div
        className="profile-banner"
        style={
          cover
            ? { backgroundImage: `url(${cover})`, backgroundSize: "cover", backgroundPosition: "center" }
            : undefined
        }
      />

      <div className="container profile-layout">
        {error ? <div className="error-banner">{error}</div> : null}

        <div className="profile-identity">
          {photo ? (
            <img className="profile-avatar-lg" src={photo} alt="" />
          ) : (
            <div className="profile-avatar-lg">{initial}</div>
          )}
          <div className="profile-name-block">
            <h1>{name}</h1>
            {username ? <div className="handle">@{username}</div> : null}
            {me?.email ? <div className="meta">{me.email}</div> : null}
            <div className="profile-actions-bar">
              <Link className="btn btn-primary" to="/manage-stories">
                My stories
              </Link>
              <Link className="btn btn-ghost" to="/library">
                Library
              </Link>
              <Link className="btn btn-ghost" to="/account">
                More
              </Link>
              <button type="button" className="btn btn-ghost" onClick={() => onLogout?.()}>
                Sign out
              </button>
            </div>
          </div>
        </div>

        <div className="profile-stat-row">
          {stats.map((s) => (
            <div key={s.label} className="profile-stat-card">
              <strong>{loading ? "…" : s.value}</strong>
              <span>{s.label}</span>
            </div>
          ))}
        </div>

        <div className="profile-tabs" role="tablist">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              className={`profile-tab ${tab === t ? "active" : ""}`}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "About" ? (
          <section className="card-panel">
            <h2>About</h2>
            <p className="profile-bio-text">
              {bio.trim() || "No bio yet. Update your profile from the mobile app or keep reading and writing on NovelHub."}
            </p>
            <div className="profile-stat-row" style={{ marginTop: 20 }}>
              <div className="profile-stat-card">
                <strong>{me?.social_karma ?? me?.socialKarma ?? "—"}</strong>
                <span>Social karma</span>
              </div>
              <div className="profile-stat-card">
                <strong>{me?.day_streak ?? me?.dayStreak ?? "—"}</strong>
                <span>Day streak</span>
              </div>
              <div className="profile-stat-card">
                <strong>{stories.length}</strong>
                <span>Stories</span>
              </div>
            </div>
          </section>
        ) : (
          <section>
            <h2 style={{ marginBottom: 14 }}>Stories</h2>
            {stories.length === 0 ? (
              <div className="card-panel">
                <p className="meta">
                  No stories yet. <Link to="/write">Start writing</Link>
                </p>
              </div>
            ) : (
              <div className="profile-story-grid">
                {stories.map((s) => {
                  const coverPath = resolveAssetUrl(s.cover_path || s.coverPath || "");
                  return (
                    <Link key={s.id} to={`/write/${s.id}`} className="profile-story-card">
                      {coverPath ? (
                        <img src={coverPath} alt="" />
                      ) : (
                        <div
                          style={{
                            aspectRatio: "2/3",
                            background: "linear-gradient(160deg,#4C1D95,#1A1625)",
                            display: "grid",
                            placeItems: "center",
                            fontSize: "2rem",
                            fontWeight: 800,
                          }}
                        >
                          {(s.title || "?")[0]}
                        </div>
                      )}
                      <div className="psc-body">
                        <div className="psc-title">{s.title || "Untitled"}</div>
                        <div className="meta">{s.status_text || s.status || "Draft"}</div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
