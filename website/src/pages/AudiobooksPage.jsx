import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAudiobooks, resolveAssetUrl } from "../api";

export default function AudiobooksPage() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getAudiobooks().then((response) => {
      if (!cancelled) setStories(response?.items || []);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  return (
    <main className="audio-page page-shell">
      <section className="audio-hero">
        <div className="audio-hero-glow" />
        <div className="audio-hero-copy"><span className="eyebrow">A NEW WAY TO FALL INTO A STORY</span><h1>Let the story find its voice.</h1><p>NovelHub audio is on the way. Until then, meet a few reader-loved stories we think deserve a place in your headphones.</p><div className="audio-hero-actions"><Link className="btn btn-primary" to="/">Explore written stories <span aria-hidden="true">→</span></Link><span className="audio-coming-badge"><i /> Audio editions in the works</span></div></div>
        <div className="audio-visual" aria-hidden="true"><div className="audio-record"><span>NH</span></div><div className="audio-wave">{Array.from({ length: 23 }, (_, index) => <i key={index} style={{ "--wave-index": index, "--wave-height": `${12 + (index % 5) * 10}px` }} />)}</div><span className="audio-visual-note">stories, in a new light</span></div>
      </section>
      <section className="audio-curation"><div className="audio-section-head"><div><span className="eyebrow">THE FIRST LISTENING LIST</span><h2>Stories worth hearing</h2><p className="meta">A growing selection from the NovelHub story catalog.</p></div><span className="audio-total">{loading ? "…" : `${stories.length} stories`}</span></div>
        {loading ? <p className="meta">Curating the shelf…</p> : null}
        {!loading && stories.length ? <div className="audio-story-grid">{stories.slice(0, 8).map((story, index) => {
          const cover = resolveAssetUrl(story.cover_path || "");
          return <Link to={`/stories/${story.id}`} className="audio-story-card" key={story.id}><div className="audio-story-cover">{cover ? <img src={cover} alt="" loading="lazy" /> : <span>{(story.title || "N").slice(0, 1)}</span>}<i className="audio-story-number">{String(index + 1).padStart(2, "0")}</i><span className="audio-story-label">A story to discover</span></div><div className="audio-story-info"><h3>{story.title}</h3><p>{story.author || "NovelHub author"}</p>{story.genre ? <span>{story.genre}</span> : null}</div></Link>;
        })}</div> : null}
        {!loading && !stories.length ? <div className="audio-empty card-panel"><h3>Your next great read is already here.</h3><p className="meta">The audio shelf is still being prepared. Browse the full story catalog while we get it ready.</p><Link className="btn btn-primary" to="/">Explore stories</Link></div> : null}
      </section>
      <section className="audio-note"><span className="audio-note-icon">♫</span><p>Audio stories are not playable yet. We’ll share the next chapter of this feature here.</p></section>
    </main>
  );
}
