import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import BookCard from "../components/BookCard";
import {
  getMe,
  getMyActivity,
  getToken,
  getUserProfile,
  getUserStories,
  getUserWall,
  postUserWall,
  resolveAssetUrl,
} from "../api";

const TABS = [
  { id: "about", label: "About" },
  { id: "stories", label: "Stories" },
  { id: "wall", label: "Wall" },
  { id: "activity", label: "Activity" },
];

/**
 * Inkitt-style profile: About | Stories | Wall | Activity
 * /profile — own profile
 * /profile/:userId — public profile
 */
export default function ProfilePage({ user: sessionUser }) {
  const { userId: paramId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [stories, setStories] = useState([]);
  const [wall, setWall] = useState([]);
  const [activity, setActivity] = useState([]);
  const [tab, setTab] = useState("about");
  const [wallText, setWallText] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");

  const targetId = paramId ? Number(paramId) : sessionUser?.id || sessionUser?.user_id;
  const isOwn =
    !paramId ||
    String(paramId) === String(sessionUser?.id || sessionUser?.user_id || "");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!targetId && !getToken()) {
        navigate("/login");
        return;
      }
      setLoading(true);
      setError("");
      try {
        let prof = null;
        if (isOwn && getToken()) {
          prof = await getMe().catch(() => null);
        }
        if (!prof && targetId) {
          prof = await getUserProfile(targetId);
        }
        if (cancelled) return;
        setProfile(prof);

        const uid = prof?.id || prof?.user_id || targetId;
        if (uid) {
          const [st, w] = await Promise.all([
            getUserStories(uid),
            getUserWall(uid).catch(() => ({ items: [] })),
          ]);
          if (cancelled) return;
          const sItems = Array.isArray(st?.items) ? st.items : Array.isArray(st) ? st : [];
          setStories(sItems);
          const wItems = Array.isArray(w?.items) ? w.items : Array.isArray(w) ? w : [];
          setWall(wItems);
        }
        if (isOwn && getToken()) {
          const act = await getMyActivity();
          if (!cancelled) {
            const aItems = Array.isArray(act?.items) ? act.items : [];
            setActivity(aItems);
          }
        }
      } catch (e) {
        if (!cancelled) setError(e?.message || "Failed to load profile");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [paramId, sessionUser, targetId, isOwn, navigate]);

  async function submitWall(e) {
    e.preventDefault();
    const body = wallText.trim();
    if (!body || !targetId) return;
    setPosting(true);
    try {
      await postUserWall(targetId, body);
      setWallText("");
      const w = await getUserWall(targetId);
      setWall(Array.isArray(w?.items) ? w.items : []);
    } catch (err) {
      setError(err?.message || "Could not post");
    } finally {
      setPosting(false);
    }
  }

  const name =
    profile?.display_name || profile?.username || sessionUser?.display_name || "Reader";
  const photo = resolveAssetUrl(
    profile?.photo_url || profile?.avatar_url || sessionUser?.photo_url || ""
  );
  const cover = resolveAssetUrl(profile?.cover_url || "");
  const bio = profile?.bio || "";

  if (loading) {
    return <p className="page-loading">Loading profile…</p>;
  }

  return (
    <div className="profile-page">
      <div
        className="profile-cover"
        style={
          cover
            ? { backgroundImage: `linear-gradient(transparent, rgba(0,0,0,.5)), url(${cover})` }
            : undefined
        }
      />
      <div className="container profile-main">
        <div className="profile-identity">
          <div
            className="profile-avatar"
            style={photo ? { backgroundImage: `url(${photo})` } : undefined}
          >
            {!photo ? String(name).charAt(0).toUpperCase() : null}
          </div>
          <div>
            <h1 className="profile-name">{name}</h1>
            {profile?.username ? (
              <p className="meta">@{profile.username}</p>
            ) : null}
            <div className="profile-stats meta">
              <span>{profile?.followers ?? 0} followers</span>
              <span>·</span>
              <span>{profile?.following ?? 0} following</span>
              <span>·</span>
              <span>{stories.length} stories</span>
            </div>
          </div>
        </div>

        <div className="search-tabs profile-tabs" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              className={`search-tab ${tab === t.id ? "active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {error ? <p className="meta" style={{ color: "var(--danger)" }}>{error}</p> : null}

        {tab === "about" && (
          <section className="profile-panel">
            <h2 className="shelf-title">About</h2>
            <p className="profile-bio">{bio || "No bio yet."}</p>
          </section>
        )}

        {tab === "stories" && (
          <section className="profile-panel">
            <h2 className="shelf-title">Stories</h2>
            {stories.length === 0 ? (
              <p className="meta">No published stories yet.</p>
            ) : (
              <div className="trending-grid">
                {stories.map((b) => (
                  <div key={b.id} className="trending-cell book-card-hover">
                    <BookCard book={b} variant="grid" />
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {tab === "wall" && (
          <section className="profile-panel">
            <h2 className="shelf-title">Wall</h2>
            {isOwn && (
              <form className="wall-compose" onSubmit={submitWall}>
                <textarea
                  value={wallText}
                  onChange={(e) => setWallText(e.target.value)}
                  placeholder="Share an update with your followers…"
                  rows={3}
                />
                <button type="submit" className="btn-primary" disabled={posting || !wallText.trim()}>
                  {posting ? "Posting…" : "Post"}
                </button>
              </form>
            )}
            <ul className="wall-list">
              {wall.length === 0 ? (
                <li className="meta">No wall posts yet.</li>
              ) : (
                wall.map((post) => (
                  <li key={post.id} className="wall-item">
                    <div className="wall-item-head">
                      <strong>{post.actor_name || post.display_name || name}</strong>
                      <span className="meta">{post.created_at || ""}</span>
                    </div>
                    <p className="wall-body">{post.body || post.content || ""}</p>
                  </li>
                ))
              )}
            </ul>
          </section>
        )}

        {tab === "activity" && (
          <section className="profile-panel">
            <h2 className="shelf-title">Activity</h2>
            {!isOwn ? (
              <p className="meta">Activity is only visible on your own profile.</p>
            ) : activity.length === 0 ? (
              <p className="meta">No recent activity.</p>
            ) : (
              <ul className="activity-list">
                {activity.map((item) => (
                  <li key={item.id} className="activity-item">
                    <div className="activity-title">
                      {item.title || item.message || item.type}
                    </div>
                    <div className="meta">{item.created_at || item.tab || ""}</div>
                    {item.book_id ? (
                      <Link className="meta" to={`/stories/${item.book_id}`}>
                        View story
                      </Link>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
