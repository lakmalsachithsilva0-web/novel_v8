import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { getMe, getMyReviews, getMyStories, getUserActivity, getUserWall, postUserWall, resolveAssetUrl, updateMe, uploadProfileImage } from "../api";
import { isGuestUser } from "../utils/guest";

const TABS = ["About", "Stories", "Wall", "Reviews"];

function normalizeItems(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.items)) return value.items;
  return [];
}

export default function ProfilePage({ user, onLogout }) {
  const guest = isGuestUser(user);
  const [me, setMe] = useState(user);
  const [stories, setStories] = useState([]);
  const [wall, setWall] = useState([]);
  const [activity, setActivity] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [feedLoading, setFeedLoading] = useState(false);
  const [feedError, setFeedError] = useState("");
  const [wallDraft, setWallDraft] = useState("");
  const [wallSaving, setWallSaving] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("About");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imageBusy, setImageBusy] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const avatarInput = useRef(null);
  const coverInput = useRef(null);

  useEffect(() => {
    let cancelled = false;
    if (guest) {
      setMe(user);
      setStories([]);
      setLoading(false);
      return () => { cancelled = true; };
    }

    setLoading(true);
    setError("");
    Promise.allSettled([getMe(), getMyStories()])
      .then(([profileResult, storiesResult]) => {
        if (cancelled) return;
        if (profileResult.status === "fulfilled") setMe(profileResult.value || user);
        else setError(`Profile details could not load: ${profileResult.reason?.message || "Please try again."}`);
        if (storiesResult.status === "fulfilled") setStories(normalizeItems(storiesResult.value));
        else setError((current) => [current, `Your stories could not load: ${storiesResult.reason?.message || "Please try again."}`].filter(Boolean).join(" "));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [guest, user]);

  const name = me?.display_name || me?.email || "Reader";
  const initial = name.trim().charAt(0).toUpperCase() || "R";
  const photo = resolveAssetUrl(me?.photo_url || me?.photoUrl || "");
  const cover = resolveAssetUrl(me?.cover_url || me?.coverUrl || "");
  const username = (me?.username || (me?.email ? me.email.split("@")[0] : "")).replace(/^@+/, "");
  const profileId = me?.id || me?.user_id || user?.id || user?.user_id;
  async function saveProfile(e) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setSaving(true); setSaveMessage("");
    try {
      await updateMe({
        display_name: String(form.get("display_name") || "").trim(),
        username: String(form.get("username") || "").trim(),
        bio: String(form.get("bio") || "").trim(),
        gender: String(form.get("gender") || "").trim(),
        birth_date: String(form.get("birth_date") || "").trim(),
        country: String(form.get("country") || "").trim(),
        facebook_url: String(form.get("facebook_url") || "").trim(),
      });
      setMe(await getMe()); setEditing(false); setSaveMessage("Profile saved to your account.");
    } catch (err) { setSaveMessage(err.message || "Could not save profile."); }
    finally { setSaving(false); }
  }
  async function saveProfileImage(field, file) {
    if (!file) return;
    setImageBusy(field);
    setSaveMessage("");
    try {
      const uploaded = await uploadProfileImage(file);
      await updateMe({ [field]: uploaded?.path || uploaded?.url || "" });
      setMe(await getMe());
      setSaveMessage(field === "photo_url" ? "Profile photo updated." : "Profile cover updated.");
    } catch (err) {
      setSaveMessage(err.message || "Could not upload this image.");
    } finally {
      setImageBusy("");
      if (field === "photo_url" && avatarInput.current) avatarInput.current.value = "";
      if (field === "cover_url" && coverInput.current) coverInput.current.value = "";
    }
  }
  useEffect(() => {
    if (guest || !profileId || (tab !== "Wall" && tab !== "Activity" && tab !== "Reviews")) return undefined;
    let cancelled = false;
    setFeedLoading(true);
    setFeedError("");
    const loadFeed = tab === "Wall" ? getUserWall(profileId) : tab === "Reviews" ? getMyReviews() : getUserActivity(profileId);
    loadFeed.then((response) => {
      if (cancelled) return;
      const items = normalizeItems(response);
      if (tab === "Wall") setWall(items);
      else if (tab === "Reviews") setReviews(items);
      else setActivity(items);
    }).catch((err) => {
      if (!cancelled) setFeedError(err.message || `Could not load your ${tab.toLowerCase()}.`);
    }).finally(() => { if (!cancelled) setFeedLoading(false); });
    return () => { cancelled = true; };
  }, [guest, profileId, tab]);

  async function postToWall(event) {
    event.preventDefault();
    const body = wallDraft.trim();
    if (!body || !profileId || wallSaving) return;
    setWallSaving(true);
    setFeedError("");
    try {
      await postUserWall(profileId, body);
      setWallDraft("");
      const response = await getUserWall(profileId);
      setWall(normalizeItems(response));
    } catch (err) {
      setFeedError(err.message || "Could not post to your wall.");
    } finally {
      setWallSaving(false);
    }
  }
  const stats = useMemo(() => [
    { label: "Followers", value: me?.followers ?? me?.follower_count ?? 0 },
    { label: "Following", value: me?.following ?? me?.following_count ?? 0 },
    { label: "Chapters read", value: me?.chapters_read ?? me?.chaptersRead ?? 0 },
    { label: "Your stories", value: me?.story_count ?? stories.length },
  ], [me, stories.length]);

  if (guest) {
    return (
      <div className="container page profile-guest-page">
        <section className="guest-lock card-panel">
          <span className="eyebrow">YOUR READING SPACE</span>
          <h1>Your profile starts here</h1>
          <p className="meta">Sign in to see your reading activity, saved stories, and writing in one place.</p>
          <div className="profile-guest-actions">
            <Link className="btn btn-primary" to="/login">Sign in</Link>
            <Link className="btn btn-ghost" to="/">Explore stories</Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div
        className={`profile-cover ${cover ? "has-image" : ""}`}
        style={cover ? { backgroundImage: `linear-gradient(90deg, rgba(15, 11, 24, .45), rgba(15, 11, 24, .1)), url("${cover}")` } : undefined}
      >
        <div className="profile-cover-glow" />
        {editing ? <>
          <input ref={coverInput} className="visually-hidden" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => saveProfileImage("cover_url", event.target.files?.[0])} />
          <button type="button" className="profile-image-edit profile-cover-edit" onClick={() => coverInput.current?.click()} disabled={imageBusy === "cover_url"}>{imageBusy === "cover_url" ? "Uploading…" : "Change cover"}</button>
        </> : null}
      </div>

      <div className="container profile-layout">
        {error ? <div className="error-banner" role="alert">{error}</div> : null}

        <section className="profile-heading card-panel">
          <div className="profile-avatar-frame">
            {photo ? <img className="profile-avatar-lg" src={photo} alt={`${name}'s profile`} /> : (
              <div className="profile-avatar-lg profile-avatar-fallback" aria-hidden="true">{initial}</div>
            )}
            {editing ? <>
              <input ref={avatarInput} className="visually-hidden" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => saveProfileImage("photo_url", event.target.files?.[0])} />
              <button type="button" className="profile-image-edit profile-avatar-edit" onClick={() => avatarInput.current?.click()} disabled={imageBusy === "photo_url"}>{imageBusy === "photo_url" ? "…" : "Change photo"}</button>
            </> : null}
          </div>
          <div className="profile-heading-copy">
            <span className="eyebrow">YOUR NOVELHUB PROFILE</span>
            <h1>{name}</h1>
            {username ? <p className="profile-handle">@{username}</p> : null}
            {me?.email ? <p className="profile-email">{me.email}</p> : null}
            <p className="profile-bio-text">{me?.bio?.trim() || "Your story is still being written. Add a little about yourself in the NovelHub app."}</p>
            <div className="profile-actions-bar">
              <button type="button" className="btn btn-ghost" onClick={() => { setEditing((value) => !value); setSaveMessage(""); }}>{editing ? "Cancel edit" : "Edit profile"}</button>
              <Link className="btn btn-primary" to="/manage-stories">Manage stories</Link>
              <Link className="btn btn-ghost" to="/library">Open library</Link>
              <Link className="btn btn-ghost" to="/account">More</Link>
              <button type="button" className="btn btn-ghost" onClick={() => onLogout?.()}>Sign out</button>
            </div>
            {saveMessage ? <p className="meta" role="status">{saveMessage}</p> : null}
            {editing ? <form className="profile-edit-form" onSubmit={saveProfile}>
              <label>Display name<input name="display_name" defaultValue={me?.display_name || ""} maxLength={80} required /></label>
              <label>Username<input name="username" defaultValue={username} maxLength={40} pattern="[A-Za-z0-9_.]+" required /></label>
              <label>About you<textarea name="bio" defaultValue={me?.bio || ""} rows={3} maxLength={500} /></label>
              <label>Gender<input name="gender" defaultValue={me?.gender || ""} maxLength={40} /></label>
              <label>Birthday<input name="birth_date" type="date" defaultValue={me?.birth_date || ""} /></label>
              <label>Country<input name="country" defaultValue={me?.country || ""} maxLength={64} autoComplete="country-name" /></label>
              <label>Facebook profile<input name="facebook_url" type="url" defaultValue={me?.facebook_url || ""} maxLength={255} placeholder="https://facebook.com/…" /></label>
              <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? "Saving…" : "Save profile"}</button>
            </form> : null}
          </div>
        </section>

        <section className="profile-stats-grid" aria-label="Reading and writing stats">
          {stats.map((stat) => (
            <article className="profile-stat-card" key={stat.label}>
              <strong>{loading ? "—" : Number(stat.value || 0).toLocaleString()}</strong>
              <span>{stat.label}</span>
            </article>
          ))}
        </section>

        <div className="profile-tabs" role="tablist" aria-label="Profile sections">
          {TABS.map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={tab === item}
              className={`profile-tab ${tab === item ? "active" : ""}`}
              onClick={() => setTab(item)}
            >
              {item}{item === "Stories" ? ` (${stories.length})` : ""}
            </button>
          ))}
        </div>

        {tab === "About" ? (
          <section className="profile-about card-panel">
            <span className="eyebrow">A LITTLE INTRODUCTION</span>
            <h2>About {name.split(" ")[0]}</h2>
            <p>{me?.bio?.trim() || "No bio yet. When you add one in the NovelHub app, it will appear here."}</p>
            <div className="profile-about-details">
              <div><span>Saved stories</span><strong>{me?.library_count ?? 0}</strong></div>
              <div><span>Reading lists</span><strong>{me?.reading_list_count ?? 0}</strong></div>
              <div><span>Stories written</span><strong>{me?.story_count ?? stories.length}</strong></div>
            </div>
          </section>
        ) : tab === "Stories" ? (
          <section className="profile-stories-section">
            <div className="profile-section-heading">
              <div><span className="eyebrow">FROM YOUR DESK</span><h2>Your stories</h2></div>
              <Link className="btn btn-primary" to="/write">Create a story</Link>
            </div>
            {loading ? <p className="meta">Loading your stories…</p> : null}
            {!loading && stories.length === 0 ? (
              <div className="profile-empty card-panel">
                <div className="profile-empty-mark" aria-hidden="true">✦</div>
                <h3>A blank page can become anything.</h3>
                <p className="meta">Start a story and keep every chapter together in your writing space.</p>
                <Link className="btn btn-primary" to="/write">Start writing</Link>
              </div>
            ) : null}
            <div className="profile-story-grid">
              {stories.map((story) => {
                const image = resolveAssetUrl(story.cover_path || story.coverPath || "");
                return (
                  <Link key={story.id} to={`/write/${story.id}`} className="profile-story-card">
                    {image ? <img src={image} alt={`${story.title || "Story"} cover`} /> : (
                      <div className="profile-story-cover-fallback" aria-hidden="true">{(story.title || "N").charAt(0)}</div>
                    )}
                    <div className="psc-body">
                      <div className="psc-title">{story.title || "Untitled story"}</div>
                      <div className="meta">{story.status_text || story.status || "Draft"}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        ) : tab === "Wall" ? (
          <section className="profile-feed-section">
            <header className="profile-section-heading"><div><span className="eyebrow">YOUR COMMUNITY</span><h2>Profile wall</h2></div></header>
            <form className="profile-wall-compose card-panel" onSubmit={postToWall}>
              <label className="visually-hidden" htmlFor="profile-wall-message">Write a wall post</label>
              <textarea id="profile-wall-message" value={wallDraft} onChange={(event) => setWallDraft(event.target.value)} maxLength={1000} rows={3} placeholder="Share a note with your readers…" />
              <div><span className="meta">{wallDraft.length}/1000</span><button className="btn btn-primary btn-sm" type="submit" disabled={wallSaving || !wallDraft.trim()}>{wallSaving ? "Posting…" : "Post to wall"}</button></div>
            </form>
            {feedError ? <div className="error-banner" role="alert">{feedError}</div> : null}
            {feedLoading ? <p className="meta">Loading your wall…</p> : null}
            {!feedLoading && !wall.length ? <div className="profile-empty card-panel"><h3>Your wall is ready</h3><p className="meta">Notes from you and your readers will appear here.</p></div> : null}
            <div className="profile-feed-list">{wall.map((item) => <article className="profile-feed-card card-panel" key={item.id}><div className="profile-feed-avatar">{item.photo_url ? <img src={resolveAssetUrl(item.photo_url)} alt="" /> : (item.sender_name || "R").slice(0,1).toUpperCase()}</div><div><strong>{item.sender_name || item.display_name || "Reader"}</strong><time>{item.created_at ? new Date(item.created_at).toLocaleString() : ""}</time><p>{item.body || item.message}</p></div></article>)}</div>
          </section>
        ) : tab === "Reviews" ? (
          <section className="profile-reviews-section">
            <header className="profile-section-heading"><div><span className="eyebrow">YOUR READER VOICE</span><h2>Reviews you wrote</h2></div></header>
            {feedError ? <div className="error-banner" role="alert">{feedError}</div> : null}
            {feedLoading ? <p className="meta">Loading your reviews…</p> : null}
            {!feedLoading && !reviews.length ? <div className="profile-empty card-panel"><h3>No reviews yet</h3><p className="meta">Open a story and leave a review to help other readers choose their next read.</p><Link className="btn btn-primary" to="/">Explore stories</Link></div> : null}
            <div className="profile-review-list">
              {reviews.map((review) => {
                const book = review.book || {};
                const bookId = review.book_id || book.id;
                const image = resolveAssetUrl(review.cover_path || book.cover_path || "");
                return <article className="profile-review-card card-panel" key={review.id}>
                  {bookId ? <Link to={`/stories/${bookId}`} className="profile-review-cover">{image ? <img src={image} alt="" /> : <span>{(review.book_title || book.title || "N").slice(0,1)}</span>}</Link> : null}
                  <div className="profile-review-copy"><Link to={bookId ? `/stories/${bookId}` : "/"} className="profile-review-title">{review.book_title || book.title || "Story review"}</Link><span className="profile-review-rating" aria-label={`${review.rating || 0} out of 5 stars`}>★ {Number(review.rating || 0)}/5</span><p>{review.comment || review.body || "No written review."}</p><time>{review.created_at ? new Date(review.created_at).toLocaleDateString() : ""}</time></div>
                </article>;
              })}
            </div>
          </section>
        ) : (
          <section className="profile-feed-section">
            <header className="profile-section-heading"><div><span className="eyebrow">YOUR READING JOURNEY</span><h2>Recent activity</h2></div></header>
            {feedError ? <div className="error-banner" role="alert">{feedError}</div> : null}
            {feedLoading ? <p className="meta">Loading your activity…</p> : null}
            {!feedLoading && !activity.length ? <div className="profile-empty card-panel"><h3>Your story journey starts here</h3><p className="meta">Reading, likes, and community activity will show here.</p></div> : null}
            <div className="profile-feed-list">{activity.map((item) => <Link className="profile-feed-card card-panel" key={item.id} to={item.book_id ? `/stories/${item.book_id}` : "/profile"}><div className="profile-feed-avatar">{item.cover_path ? <img src={resolveAssetUrl(item.cover_path)} alt="" /> : (item.type || "N").slice(0,1).toUpperCase()}</div><div><strong>{item.title || "NovelHub activity"}</strong><time>{item.created_at ? new Date(item.created_at).toLocaleString() : ""}</time>{item.message ? <p>{item.message}</p> : null}</div></Link>)}</div>
          </section>
        )}
      </div>
    </div>
  );
}
