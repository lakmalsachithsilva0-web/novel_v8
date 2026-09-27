import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Shelf from "../components/Shelf";
import TrendingGrid from "../components/TrendingGrid";
import { getBootstrap, getContests, getPublicReadingLists, getReadingListFollow, getTags, getToken, resolveAssetUrl, searchStories, toggleReadingListFollow } from "../api";

const GENRE_PILLS = [
  "Romance",
  "Fantasy",
  "Thriller",
  "Young Adult",
  "Sci-Fi",
  "LGBTQ+",
  "Mystery",
  "Werewolves",
  "Adventure",
  "More",
];

const GENRE_SHELVES = [
  "Contemporary Romance",
  "Dark Romance",
  "Thriller",
  "Sci-Fi",
  "LGBTQ+",
  "Werewolves & Shifters",
  "Fantasy",
  "Horror",
];

function collectBooks(boot) {
  if (!boot) return [];
  const map = new Map();
  const add = (value) => {
    const items = Array.isArray(value) ? value : value && typeof value === "object" ? [value] : [];
    items.forEach((b) => {
      if (b && b.id != null) map.set(String(b.id), b);
    });
  };
  add(boot.books);
  add(boot.trending);
  add(boot.discover_books);
  add(boot.recently_updated);
  add(boot.recently_completed);
  add(boot.featured);
  add(boot.featured_book);
  if (Array.isArray(boot.sections)) {
    boot.sections.forEach((s) => add(s.books || s.items));
  }
  if (boot.categories && typeof boot.categories === "object") {
    Object.values(boot.categories).forEach((v) => {
      if (Array.isArray(v)) add(v);
      else if (v?.books) add(v.books);
    });
  }
  return [...map.values()];
}

function byGenre(books, genre) {
  const g = genre.toLowerCase();
  return books.filter((b) => {
    const fields = [b.genre, b.primary_genre, b.secondary_genre, b.section_name]
      .filter(Boolean)
      .map((x) => String(x).toLowerCase());
    return fields.some((f) => f.includes(g.split(" ")[0]) || g.includes(f) || f.includes(g));
  });
}

export default function HomePage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [readingLists, setReadingLists] = useState([]);
  const [tags, setTags] = useState([]);
  const [contests, setContests] = useState([]);
  const [followMsg, setFollowMsg] = useState("");
  const [followedListIds, setFollowedListIds] = useState(() => new Set());
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = (searchParams.get("q") || "").trim();
  const genreFilter = (searchParams.get("genre") || "").trim();
  const statusFilter = (searchParams.get("status") || "all").toLowerCase();
  const sortFilter = (searchParams.get("sort") || "popular").toLowerCase();
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    if (!query) {
      setSearchResults(null);
      setSearchLoading(false);
      return undefined;
    }
    let active = true;
    setSearchLoading(true);
    searchStories(query, genreFilter).then((response) => {
      const items = response?.items || response?.books || response || [];
      if (active) setSearchResults(Array.isArray(items) ? items : []);
    }).catch(() => {
      if (active) setSearchResults(null);
    }).finally(() => {
      if (active) setSearchLoading(false);
    });
    return () => { active = false; };
  }, [query, genreFilter]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [boot, lists, tagRes, contestRes] = await Promise.all([
          getBootstrap(),
          getPublicReadingLists().catch(() => ({ items: [] })),
          getTags().catch(() => ({ items: [] })),
          getContests().catch(() => ({ items: [] })),
        ]);
        if (!cancelled) {
          setData(boot);
          setReadingLists(lists?.items || []);
          setContests(contestRes?.items || []);
          const raw = tagRes?.items || tagRes || [];
          const names = (Array.isArray(raw) ? raw : [])
            .map((x) => (typeof x === "string" ? x : x?.name))
            .filter(Boolean);
          setTags([...new Set(names)].slice(0, 20));
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
  }, []);

  const allBooks = useMemo(() => collectBooks(data), [data]);
  const qParam = query.toLowerCase();
  const isFiltered = Boolean(qParam || genreFilter || statusFilter !== "all" || sortFilter !== "popular");
  const filteredBooks = useMemo(() => {
    const source = qParam && Array.isArray(searchResults) ? searchResults : allBooks;
    const filtered = source.filter((book) => {
      const status = String(book.status_text || book.status || "").toLowerCase();
      const completed = book.is_completed === true || Number(book.is_completed) === 1 || /complete|finished/.test(status);
      if (statusFilter === "complete" && !completed) return false;
      if (statusFilter === "ongoing" && completed) return false;
      const genre = `${book.genre || ""} ${book.primary_genre || ""} ${book.secondary_genre || ""}`.toLowerCase();
      if (genreFilter && genre && !genre.includes(genreFilter.toLowerCase())) return false;
      if (qParam && !Array.isArray(searchResults)) {
        const blob = `${book.title || ""} ${book.author || ""} ${genre} ${book.description || ""}`.toLowerCase();
        if (!blob.includes(qParam)) return false;
      }
      return true;
    });
    return filtered.sort((a, b) => {
      if (sortFilter === "newest") return String(b.updated_at || b.created_at || "").localeCompare(String(a.updated_at || a.created_at || ""));
      if (sortFilter === "rating") return Number(b.rating || 0) - Number(a.rating || 0);
      return Number(b.view_count || b.read_count || 0) - Number(a.view_count || a.read_count || 0);
    });
  }, [allBooks, searchResults, qParam, genreFilter, statusFilter, sortFilter]);


  const uniqueLists = useMemo(() => {
    const map = new Map();
    for (const rl of readingLists || []) {
      if (!rl) continue;
      const key = String(rl.name || "").trim().toLocaleLowerCase().replace(/\s+/g, " ");
      if (key && !map.has(key)) map.set(key, rl);
    }
    return [...map.values()];
  }, [readingLists]);

  useEffect(() => {
    if (!getToken() || !uniqueLists.length) return;
    let active = true;
    Promise.all(uniqueLists.filter((item) => item?.id).map(async (item) => {
      try { const state = await getReadingListFollow(item.id); return state?.following ? String(item.id) : null; }
      catch { return null; }
    })).then((ids) => { if (active) setFollowedListIds(new Set(ids.filter(Boolean))); });
    return () => { active = false; };
  }, [uniqueLists]);

  const trending = useMemo(() => {
    const apiTrending = !isFiltered && Array.isArray(data?.trending) ? data.trending : [];
    const ranked = apiTrending.length
      ? apiTrending
      : [...filteredBooks].sort((a, b) =>
          Number(b.view_count || 0) - Number(a.view_count || 0) || Number(b.rating || 0) - Number(a.rating || 0)
        );
    return ranked.slice(0, 16);
  }, [allBooks, data, filteredBooks, isFiltered]);

  function setHomeFilter(key, value) {
    const next = new URLSearchParams(searchParams);
    if (!value || value === "all") next.delete(key);
    else next.set(key, value);
    setSearchParams(next);
  }

  if (loading) return <main className="home-loading page-shell" aria-live="polite"><span className="eyebrow">OPENING THE STORY SHELVES</span><div className="home-loading-line" /><div className="home-loading-grid">{Array.from({ length: 5 }, (_, index) => <div className="home-loading-cover" key={index} />)}</div></main>;
  if (error) return <main className="container page home-error"><span className="eyebrow">NOVELHUB</span><h1>Your next story is just around the page.</h1><p className="meta">We couldn’t load the shelves right now. Check your connection and try again.</p><button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>Try again</button></main>;

  return (
    <main className="home-wattpad home-page">
      <section className="hero inkitt-hero home-hero home-feed-hero">
        <div className="hero-inner">
          <div className="hero-copy">
            <span className="hero-eyebrow">NOVELHUB <span aria-hidden="true">✦</span> STORIES BY THE COMMUNITY</span>
            <h1>What will you read today?</h1>
            <p className="hero-tagline">Discover your next favorite story.</p>
            <p className="lead">
              Explore new voices, follow stories as they grow, and find a community that loves the same worlds you do.
            </p>
            <div className="hero-actions">
              <a className="btn btn-primary" href="#story-feed">Explore stories</a>
              <Link className="btn btn-ghost" to="/write">Share your story</Link>
            </div>
            <p className="hero-stat"><strong>{allBooks.length.toLocaleString()}</strong> stories to explore</p>
            <p className="hero-explore">Browse by genre</p>
            <div className="genre-pills">
              {(tags.length ? [...tags.slice(0, 7), "More"] : GENRE_PILLS).map((g) => (
                <button
                  key={g}
                  type="button"
                  className="genre-pill"
                  onClick={() =>
                    g === "More"
                      ? navigate("/genres/Stories")
                      : setHomeFilter("genre", g)
                  }
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
          <div className="hero-story-mosaic" aria-label="Stories readers are discovering">
            {trending.slice(0, 3).map((book, index) => {
              const cover = resolveAssetUrl(book.cover_path || book.coverPath || "");
              return (
                <Link
                  key={book.id}
                  to={`/stories/${book.id}`}
                  className={`hero-story-cover hero-story-cover--${index + 1}`}
                  aria-label={`Read ${book.title || "story"} by ${book.author || "NovelHub author"}`}
                >
                  {cover ? <img src={cover} alt="" loading="lazy" /> : <span>{(book.title || "N").slice(0, 1)}</span>}
                  <span className="hero-story-caption">
                    <strong>{book.title || "Untitled story"}</strong>
                    <small>{book.author || "NovelHub author"}</small>
                  </span>
                </Link>
              );
            })}
            {!trending.length ? <div className="hero-mosaic-empty">Discover a story to begin</div> : null}
            <span className="hero-mosaic-label">Stories readers love</span>
          </div>
        </div>
      </section>
      <div className="home-hero-foot" aria-label="NovelHub reading community"><span><i>✦</i> Reader-powered discovery</span><span><i>✧</i> New voices every day</span><span><i>♡</i> Stories worth staying for</span></div>

      <nav className="home-feed-tabs" aria-label="Story feed filters">
        {[["popular", "Popular"], ["newest", "Recently updated"], ["complete", "Completed"]].map(([value, label]) => {
          const active = value === "complete" ? statusFilter === "complete" : statusFilter !== "complete" && sortFilter === value;
          return <button key={label} type="button" className={active ? "active" : ""} onClick={() => {
            const next = new URLSearchParams(searchParams);
            if (value === "complete") { next.set("status", "complete"); next.delete("sort"); }
            else { next.delete("status"); if (value === "popular") next.delete("sort"); else next.set("sort", value); }
            setSearchParams(next);
          }}>{label}</button>;
        })}
      </nav>

      {qParam ? (
        <div className="container search-results-heading">
          <p className="meta">{searchLoading ? "Searching stories…" : `${trending.length} ${trending.length === 1 ? "story" : "stories"} found`}</p>
          <Link className="btn btn-ghost btn-sm" to="/">Clear search</Link>
        </div>
      ) : null}
      <div id="story-feed" className="home-story-feed">
      <TrendingGrid title={qParam ? `Results for “${searchParams.get("q") || ""}”` : genreFilter ? `${genreFilter} stories` : statusFilter === "complete" ? "Completed stories" : sortFilter === "newest" ? "Recently updated stories" : "Stories readers love"} books={trending} seeAllTo={null} />
      </div>
      {qParam && !searchLoading && trending.length === 0 ? (
        <div className="container card-panel search-empty">
          <h2>No stories found</h2>
          <p className="meta">Try another title, author, or genre.</p>
        </div>
      ) : null}

      {!isFiltered && Array.isArray(data?.recently_updated) && data.recently_updated.length > 0 ? (
        <Shelf title="Recently updated" books={data.recently_updated} seeAllTo="/?sort=newest" />
      ) : null}
      {!isFiltered && Array.isArray(data?.recently_completed) && data.recently_completed.length > 0 ? (
        <Shelf title="Completed stories" books={data.recently_completed} seeAllTo="/?status=complete" />
      ) : null}
      {!isFiltered && contests.length > 0 ? (
        <section className="contest-neon home-contest">
          <div className="contest-neon-inner">
            <h2 className="neon-title">{contests[0].title}</h2>
            <div className="neon-copy">
              <p className="neon-kicker">COMMUNITY WRITING CONTEST</p>
              <p>{contests[0].theme || 'A new prompt from the NovelHub community.'}</p>
              <p className="meta">{contests[0].deadline ? `Deadline: ${contests[0].deadline}` : ''}</p>
              <Link className="btn btn-neon" to="/contests">Explore contest</Link>
            </div>
          </div>
        </section>
      ) : null}
      {!isFiltered && tags.length > 0 ? (
        <section className="hashtag-section container">
          <div className="shelf-header">
            <h2>Popular tags</h2>
          </div>
          <div className="hashtag-strip">
            {tags.map((name) => (
              <Link
                key={name}
                className="hashtag-chip"
                to={`/genres/${encodeURIComponent(name)}`}
              >
                #{name}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* Reading Lists */}
      {!isFiltered ? <section className="shelf shelf--inkitt">
        <div className="shelf-inner">
          <div className="shelf-header">
            <h2>Reading Lists</h2>
            {followMsg ? <span className="meta">{followMsg}</span> : null}
          </div>
          <div className="shelf-track-wrap">
            <div className="shelf-track reading-list-track">
              {uniqueLists.map((rl, i) => (
                <div key={rl.id || rl.name} className="reading-list-card">
                  <div className="rl-covers-grid">
                    {Array.from({ length: 4 }, (_, j) => {
                        const cp = Array.isArray(rl.covers) ? rl.covers[j] : null;
                        const path = typeof cp === "string" ? cp : cp?.cover_path || cp?.coverPath || "";
                        const src = path ? resolveAssetUrl(path) : "";
                        return (
                          <div key={j} className="rl-thumb">
                            {src ? (
                              <img src={src} alt="" className="book-cover" loading="lazy" />
                            ) : (
                              <div className="rl-thumb-fallback" style={{ background: `linear-gradient(145deg, ${rl.accent_hex || "#39284F"}, #17131F)` }}>{(rl.name || "R").slice(0, 1).toUpperCase()}</div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                  <h3>{rl.name}</h3>
                  <p className="meta">
                    {Number(rl.story_count || 0)} {Number(rl.story_count) === 1 ? "story" : "stories"} · {rl.owner_name || "Community"}
                  </p>
                  <button
                    type="button"
                    className={`btn-follow-outline ${followedListIds.has(String(rl.id)) ? "is-following" : ""}`}
                    aria-pressed={followedListIds.has(String(rl.id))}
                    onClick={async () => {
                      if (!rl.id) {
                        setFollowMsg("This reading list is not available right now.");
                        return;
                      }
                      if (!getToken()) {
                        setFollowMsg("Sign in to follow lists");
                        return;
                      }
                      try {
                        const res = await toggleReadingListFollow(rl.id);
                        setFollowedListIds((current) => {
                          const next = new Set(current);
                          if (res?.following) next.add(String(rl.id));
                          else next.delete(String(rl.id));
                          return next;
                        });
                        setFollowMsg(res?.following ? `Following ${rl.name}` : `Unfollowed ${rl.name}`);
                      } catch (e) {
                        setFollowMsg(String(e.message || e));
                      }
                    }}
                  >
                    {followedListIds.has(String(rl.id)) ? "Following" : "Follow list"}
                  </button>
                </div>
              ))}
              {!uniqueLists.length ? (
                <div className="reading-list-empty card-panel">
                  <h3>Make a list your own</h3>
                  <p className="meta">Save stories into themed collections and pick up your next read anytime.</p>
                  <Link className="btn btn-primary" to="/library">Open your library</Link>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section> : null}

      {!isFiltered ? GENRE_SHELVES.map((genre) => {
        // Only real genre matches — do NOT pad with trending (causes repeated books)
        const books = byGenre(allBooks, genre);
        if (books.length < 3) return null;
        return (
          <Shelf
            key={genre}
            title={genre}
            books={books.slice(0, 14)}
            seeAllTo={`/genres/${encodeURIComponent(genre.split(" ")[0])}`}
          />
        );
      }) : null}


    </main>
  );
}
