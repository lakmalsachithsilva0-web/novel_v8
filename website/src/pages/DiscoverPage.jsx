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
    <div className="container-wide" style={{ paddingBottom: 48 }}>
      <div className="web-hero">
        <div className="web-hero-copy">
          <h1>
            Discover stories
            <br />
            worth finishing
          </h1>
          <p className="lead">
            Browse the same catalog as the NovelHub app — trending shelves, genres, and new chapters,
            in a full desktop experience.
          </p>
          <div className="web-hero-actions">
            <Link to="/search" className="btn btn-primary">
              Explore catalog
            </Link>
            <Link to="/write" className="btn btn-ghost">
              Start writing
            </Link>
          </div>
        </div>

        {featured && (featured.title || featured.id) ? (
          <div className="web-hero-card">
            <div className="cover">
              {featuredCover ? (
                <img src={featuredCover} alt="" />
              ) : (
                <div style={{ width: "100%", height: "100%", background: "var(--purple-dim)" }} />
              )}
            </div>
            <div>
              <p style={{ color: "var(--purple-bright)", fontWeight: 600, fontSize: "0.8rem", marginBottom: 4 }}>
                Featured
              </p>
              <h2>{featured.title || "Featured story"}</h2>
              <p>{featured.description || featured.author || "Start reading now."}</p>
              {featured.id && (
                <Link to={`/stories/${featured.id}`} className="btn btn-primary btn-sm">
                  {featured.cta || "Read now"}
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="web-hero-card" style={{ minHeight: 180 }}>
            <div className="cover" style={{ background: "var(--purple-dim)" }} />
            <div>
              <h2>Your next read</h2>
              <p>Stories load from the same database as the mobile app once the backend is running.</p>
            </div>
          </div>
        )}
      </div>

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

      {topics.length > 0 && (
        <section className="section" style={{ marginTop: 8 }}>
          <div className="section-header">
            <h2 className="section-title">Browse by topic</h2>
          </div>
          <div className="chips">
            {topics.slice(0, 18).map((t, i) => {
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

      <Shelf title="Trending now" books={books} />
      <Shelf title="Recently updated" books={updated} />
      <Shelf title="Recently completed" books={completed} />

      {!books.length && !updated.length && !completed.length && (
        <div className="page-empty">
          <h3>No stories loaded yet</h3>
          <p>Start the backend so /api/bootstrap can fill these shelves from your database.</p>
        </div>
      )}
    </div>
  );
}
