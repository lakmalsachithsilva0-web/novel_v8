import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getMyStories, resolveAssetUrl } from "../api";
import { isGuestUser } from "../utils/guest";

export default function WritePage({ user }) {
  const guest = isGuestUser(user);
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(!guest);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    if (guest) {
      setLoading(false);
      setStories([]);
      return () => { cancelled = true; };
    }
    setLoading(true);
    setError("");
    getMyStories().then((response) => {
      const items = Array.isArray(response) ? response : Array.isArray(response?.items) ? response.items : [];
      if (!cancelled) setStories(items);
    }).catch((err) => {
      if (!cancelled) setError(err.message || "Your stories could not be loaded.");
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [guest, user?.id, user?.user_id, reloadKey]);

  const drafts = useMemo(() => stories.filter((story) => /draft/i.test(story.status_text || story.status || "")), [stories]);
  const recent = [...stories].sort((a, b) => String(b.last_updated_at || "").localeCompare(String(a.last_updated_at || "")) || Number(b.id || 0) - Number(a.id || 0)).slice(0, 3);

  if (guest) {
    return (
      <main className="writer-home writer-home--guest">
        <section className="writer-hero writer-hero--guest">
          <div className="writer-orbit writer-orbit--one" /><div className="writer-orbit writer-orbit--two" />
          <div className="writer-hero-copy">
            <span className="eyebrow">THE NOVELHUB WRITER'S ROOM</span>
            <h1>Somewhere, a story is waiting for you to begin.</h1>
            <p>Build a world chapter by chapter, save your drafts, and share your voice with readers who are looking for their next favorite.</p>
            <div className="writer-hero-actions"><Link className="btn btn-primary" to="/login">Sign in to start writing</Link><Link className="btn btn-ghost" to="/">Explore stories</Link></div>
          </div>
          <div className="writer-hero-art" aria-hidden="true"><span className="writer-art-star">✦</span><span className="writer-art-page">N</span><span className="writer-art-spark">✧</span></div>
        </section>
        <section className="writer-process"><article><span>01</span><h2>Start with a spark</h2><p>Give your story a title, a voice, and a world of its own.</p></article><article><span>02</span><h2>Write at your pace</h2><p>Keep your work in progress together in one writing space.</p></article><article><span>03</span><h2>Meet your readers</h2><p>Publish when you are ready and grow a community around your work.</p></article></section>
      </main>
    );
  }

  return (
    <main className="writer-home">
      <section className="writer-hero">
        <div className="writer-orbit writer-orbit--one" /><div className="writer-orbit writer-orbit--two" />
        <div className="writer-hero-copy">
          <span className="eyebrow">YOUR CREATIVE SPACE</span>
          <h1>Make room for the story only you can tell.</h1>
          <p>Draft in your own rhythm, keep every chapter in reach, and bring your next idea to the NovelHub community.</p>
          <div className="writer-hero-actions"><Link className="btn btn-primary" to="/write/new">Start a new story <span aria-hidden="true">→</span></Link><Link className="btn btn-ghost" to="/manage-stories">Manage stories</Link></div>
        </div>
        <div className="writer-hero-art" aria-hidden="true"><span className="writer-art-star">✦</span><span className="writer-art-page">N</span><span className="writer-art-spark">✧</span></div>
      </section>

      <section className="writer-stats" aria-label="Writing overview">
        <div><strong>{loading ? "—" : stories.length}</strong><span>Stories in your desk</span></div><div><strong>{loading ? "—" : drafts.length}</strong><span>Drafts in progress</span></div><Link to="/manage-stories">View all stories <span aria-hidden="true">→</span></Link>
      </section>

      <section className="writer-recent-section">
        <div className="writer-section-head"><div><span className="eyebrow">PICK UP WHERE YOU LEFT OFF</span><h2>Your writing desk</h2></div><Link to="/manage-stories">All stories <span aria-hidden="true">→</span></Link></div>
        {error ? <div className="error-banner" role="alert">{error} <button type="button" className="btn btn-ghost btn-sm" onClick={() => setReloadKey((key) => key + 1)}>Retry</button></div> : null}
        {loading ? <p className="meta">Gathering your stories…</p> : null}
        {!loading && recent.length ? <div className="writer-story-grid">{recent.map((story) => {
          const cover = resolveAssetUrl(story.cover_path || story.coverPath || "");
          return <Link className="writer-story-card" to={`/write/${story.id}`} key={story.id}>
            <div className="writer-story-cover">{cover ? <img src={cover} alt="" loading="lazy" /> : <span>{(story.title || "N").slice(0, 1)}</span>}<i>{story.status_text || story.status || "Draft"}</i></div>
            <div><h3>{story.title || "Untitled story"}</h3><p>{story.genre || story.primary_genre || "A story in progress"}</p></div>
          </Link>;
        })}</div> : null}
        {!loading && !error && !recent.length ? <div className="writer-first-story"><span aria-hidden="true">✧</span><div><h3>A blank page has so much potential.</h3><p className="meta">Create a story in your writing desk and your drafts will appear here.</p></div><Link className="btn btn-primary" to="/write/new">Create your first story</Link></div> : null}
      </section>
      <section className="writer-process"><article><span>01</span><h2>Build the world</h2><p>Shape your premise, characters, and story details.</p></article><article><span>02</span><h2>Find your rhythm</h2><p>Keep chapters organized as your story grows.</p></article><article><span>03</span><h2>Share the feeling</h2><p>Publish your work for readers to discover and follow.</p></article></section>
    </main>
  );
}
