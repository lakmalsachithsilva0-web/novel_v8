import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import BookCard from "../components/BookCard";
import {
  followAuthor,
  getAuthorBooks,
  getAuthorFollow,
  getUserProfile,
  resolveAssetUrl,
  unfollowAuthor,
} from "../api";
import { isGuestUser } from "../utils/guest";

const itemsFrom = (value) => Array.isArray(value) ? value : Array.isArray(value?.items) ? value.items : Array.isArray(value?.books) ? value.books : [];

export default function AuthorPage({ user }) {
  const { authorId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("stories");
  const [following, setFollowing] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);
  const guest = isGuestUser(user);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    Promise.allSettled([getUserProfile(authorId), getAuthorBooks(authorId)])
      .then(([profileResult, booksResult]) => {
        if (cancelled) return;
        if (profileResult.status === "fulfilled" && profileResult.value) {
          setProfile(profileResult.value);
        } else {
          setError("This author profile could not be found.");
        }
        if (booksResult.status === "fulfilled") setBooks(itemsFrom(booksResult.value));
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [authorId]);

  useEffect(() => {
    let cancelled = false;
    if (guest || !profile?.id || String(profile.id) === String(user?.id || user?.user_id)) {
      setFollowing(false);
      return () => { cancelled = true; };
    }
    getAuthorFollow(profile.id)
      .then((result) => { if (!cancelled) setFollowing(Boolean(result?.following)); })
      .catch(() => { if (!cancelled) setFollowing(false); });
    return () => { cancelled = true; };
  }, [guest, profile?.id, user?.id, user?.user_id]);

  const name = profile?.display_name || profile?.username || `Author ${authorId}`;
  const username = String(profile?.username || "").replace(/^@+/, "");
  const photo = resolveAssetUrl(profile?.photo_url || profile?.avatar_url || "");
  const cover = resolveAssetUrl(profile?.cover_url || profile?.cover_path || "");
  const stats = useMemo(() => [
    { value: Number(profile?.followers || 0), label: "Followers" },
    { value: Number(profile?.following || 0), label: "Following" },
    { value: books.length, label: "Stories" },
  ], [profile, books.length]);
  const isOwnProfile = Boolean(profile?.id && String(profile.id) === String(user?.id || user?.user_id));

  async function toggleFollow() {
    if (guest) { navigate("/login"); return; }
    if (!profile?.id || followBusy) return;
    setFollowBusy(true);
    try {
      if (following) await unfollowAuthor(profile.id);
      else await followAuthor(profile.id);
      setFollowing((value) => !value);
      setProfile((current) => current ? {
        ...current,
        followers: Math.max(0, Number(current.followers || 0) + (following ? -1 : 1)),
      } : current);
    } catch (err) {
      setError(err.message || "Could not update your follow.");
    } finally {
      setFollowBusy(false);
    }
  }

  return (
    <main className="author-public-page">
      <div
        className={`author-public-cover ${cover ? "has-image" : ""}`}
        style={cover ? { backgroundImage: `linear-gradient(180deg,rgba(11,10,18,.1),rgba(11,10,18,.92)),url("${cover}")` } : undefined}
        aria-hidden="true"
      />
      <div className="author-public-content">
        {error ? <div className="error-banner" role="alert">{error}</div> : null}
        <section className="author-public-heading card-panel">
          <div className="author-public-avatar">
            {photo ? <img src={photo} alt={`${name}'s profile`} /> : <span>{name.slice(0, 1).toUpperCase()}</span>}
          </div>
          <div className="author-public-copy">
            <span className="eyebrow">NOVELHUB AUTHOR</span>
            <h1>{name}</h1>
            {username ? <p className="author-public-handle">@{username}</p> : null}
            <p className="author-public-bio">{profile?.bio || "This author is just getting started. Explore their stories below."}</p>
          </div>
          <div className="author-public-actions">
            {!isOwnProfile ? <button type="button" className={`btn ${following ? "btn-ghost" : "btn-primary"}`} onClick={toggleFollow} disabled={followBusy}>{followBusy ? "Saving…" : following ? "Following" : "Follow author"}</button> : null}
            {isOwnProfile ? <Link className="btn btn-primary" to="/profile">Your profile</Link> : null}
          </div>
        </section>

        <section className="author-public-stats" aria-label="Author statistics">
          {stats.map((stat) => <article className="author-public-stat" key={stat.label}><strong>{loading ? "—" : stat.value.toLocaleString()}</strong><span>{stat.label}</span></article>)}
        </section>

        <div className="author-public-tabs" role="tablist" aria-label="Author profile sections">
          {[["stories", "Stories"], ["about", "About"]].map(([key, label]) => (
            <button key={key} type="button" role="tab" aria-selected={tab === key} className={tab === key ? "active" : ""} onClick={() => setTab(key)}>{label}{key === "stories" ? ` (${books.length})` : ""}</button>
          ))}
        </div>

        {tab === "about" ? (
          <section className="author-public-about card-panel"><span className="eyebrow">ABOUT THE AUTHOR</span><h2>A little about {name}</h2><p>{profile?.bio || "This author has not added a bio yet."}</p>{profile?.country ? <div><span>Based in</span><strong>{profile.country}</strong></div> : null}</section>
        ) : (
          <section className="author-public-stories">
            <header className="author-public-section-heading"><div><span className="eyebrow">THE STORY SHELF</span><h2>Stories by {name}</h2></div><span>{books.length} {books.length === 1 ? "story" : "stories"}</span></header>
            {loading ? <div className="author-public-loading" aria-live="polite">Finding the stories…</div> : null}
            {!loading && books.length ? <div className="trending-grid">{books.map((book) => <div className="trending-cell" key={book.id}><BookCard book={book} variant="grid" /></div>)}</div> : null}
            {!loading && !books.length && !error ? <div className="author-public-empty card-panel"><span className="eyebrow">A NEW CHAPTER</span><h3>No public stories yet</h3><p className="meta">Check back soon to see what {name} shares next.</p><Link className="btn btn-ghost" to="/">Discover stories</Link></div> : null}
          </section>
        )}
      </div>
    </main>
  );
}
