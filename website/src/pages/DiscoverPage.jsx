import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import Shelf from "../components/Shelf";
import { resolveAssetUrl } from "../api";

export default function DiscoverPage({ bootstrap }) {
  const data = bootstrap || {};
  const tabs = useMemo(() => {
    const t = data.discover_tabs || data.discoverTabs || ["For You", "Popular", "New"];
    return Array.isArray(t) && t.length ? t.map(String) : ["For You", "Popular", "New"];
  }, [data]);

  const [tab, setTab] = useState(tabs[0] || "For You");

  const books = data.discover_books || data.discoverBooks || [];
  const updated = data.recently_updated || data.recentlyUpdated || [];
  const completed = data.recently_completed || data.recentlyCompleted || [];
  const topics = data.explore_topics || data.exploreTopics || [];
  const featured = data.featured_book || data.featuredBook || null;

  const featuredCover = resolveAssetUrl(
    featured?.cover_path || featured?.cover_url || featured?.cover || ""
  );

  return (
    <div className="container-wide" style={{ paddingTop: 16, paddingBottom: 32 }}>
      <div className="tabs">
        {tabs.map((t) => (
          <button
            key={t}
            type="button"
            className={`tab${tab === t ? " active" : ""}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {featured && (featured.title || featured.id) && (
        <div className="hero-featured">
          <div className="cover">
            {featuredCover ? (
              <img src={featuredCover} alt="" />
            ) : (
              <div style={{ width: "100%", height: "100%", background: "var(--purple-dim)" }} />
            )}
          </div>
          <div>
            <p style={{ color: "var(--purple-bright)", fontWeight: 600, fontSize: "0.85rem", marginBottom: 6 }}>
              Featured
            </p>
            <h1>{featured.title || "Featured story"}</h1>
            <p>{featured.description || featured.author || "Start reading now."}</p>
            <div className="hero-actions">
              {featured.id ? (
                <Link to={`/stories/${featured.id}`} className="btn btn-primary">
                  {featured.cta || "Read now"}
                </Link>
              ) : null}
              <Link to="/search" className="btn btn-ghost">
                Explore genres
              </Link>
            </div>
          </div>
        </div>
      )}

      {topics.length > 0 && (
        <section className="section">
          <div className="section-header">
            <h2 className="section-title">Explore</h2>
          </div>
          <div className="chips">
            {topics.slice(0, 16).map((t, i) => {
              const name = typeof t === "string" ? t : t.name || t.title || t.topic || "Topic";
              return (
                <Link key={i} className="chip" to={`/search?q=${encodeURIComponent(name)}`}>
                  {name}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <Shelf title="Trending on Home" books={books} />
      <Shelf title="Recently updated" books={updated} />
      <Shelf title="Recently completed" books={completed} />

      {!books.length && !updated.length && !completed.length && (
        <div className="page-empty">
          <h3>No stories yet</h3>
          <p>Start the backend so /api/bootstrap can load shelves from your database.</p>
        </div>
      )}
    </div>
  );
}
