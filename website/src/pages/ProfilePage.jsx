import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMe, getMyStories, resolveAssetUrl } from "../api";
import { isGuestUser } from "../utils/guest";

export default function ProfilePage({ user, onLogout }) {
  const guest = isGuestUser(user);
  const [me, setMe] = useState(user);
  const [stories, setStories] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

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

  if (guest) {
    return (
      <div className="container page">
        <div className="guest-lock">
          <h1>Profile</h1>
          <p className="meta">Sign in to view your profile, stats, and stories.</p>
          <Link className="btn btn-primary" to="/login">
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  const name = me?.display_name || me?.email || "Reader";
  const photo = resolveAssetUrl(me?.photo_url || me?.photoUrl || "");
  const bio = me?.bio || "";
  const initial = name.trim().charAt(0).toUpperCase();

  return (
    <div className="container page profile-page">
      {error ? <div className="error-banner">{error}</div> : null}
      {loading ? <p className="meta">Loading profile…</p> : null}

      <div className="profile-hero card-panel">
        <div className="profile-avatar-wrap">
          {photo ? (
            <img className="profile-avatar" src={photo} alt="" />
          ) : (
            <div className="profile-avatar profile-avatar--fallback">{initial}</div>
          )}
        </div>
        <div className="profile-hero-copy">
          <h1>{name}</h1>
          {me?.username ? <p className="meta">@{me.username}</p> : null}
          {me?.email ? <p className="meta">{me.email}</p> : null}
          {bio ? <p className="profile-bio">{bio}</p> : <p className="meta">No bio yet.</p>}
          <div className="profile-stats">
            <div>
              <strong>{me?.followers ?? me?.follower_count ?? 0}</strong>
              <span className="meta">Followers</span>
            </div>
            <div>
              <strong>{me?.following ?? me?.following_count ?? 0}</strong>
              <span className="meta">Following</span>
            </div>
            <div>
              <strong>{me?.chapters_read ?? me?.chaptersRead ?? 0}</strong>
              <span className="meta">Chapters read</span>
            </div>
          </div>
          <div className="profile-actions">
            <Link className="btn btn-primary" to="/manage-stories">
              My stories
            </Link>
            <Link className="btn btn-ghost" to="/library">
              Library
            </Link>
            <Link className="btn btn-ghost" to="/account">
              More options
            </Link>
            <button type="button" className="btn btn-ghost" onClick={() => onLogout?.()}>
              Sign out
            </button>
          </div>
        </div>
      </div>

      <section className="profile-stories">
        <h2>Your stories</h2>
        {stories.length === 0 ? (
          <p className="meta">
            No stories yet. <Link to="/write">Start writing</Link>
          </p>
        ) : (
          <ul className="simple-list">
            {stories.map((s) => (
              <li key={s.id}>
                <Link to={`/write/${s.id}`}>{s.title || "Untitled"}</Link>
                <span className="meta"> · {s.status_text || s.status || "Draft"}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
