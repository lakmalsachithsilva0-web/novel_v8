import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import BookCard from "../components/BookCard";
import {
  getPublicReadingLists,
  resolveAssetUrl,
  searchStories,
  searchUsers,
} from "../api";

const TABS = [
  { id: "stories", label: "Stories" },
  { id: "people", label: "People" },
  { id: "lists", label: "Reading Lists" },
];

const PLACEHOLDER =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect fill="#e5e7eb" width="80" height="80"/><text x="40" y="44" text-anchor="middle" fill="#9ca3af" font-size="11" font-family="sans-serif">List</text></svg>`
  );

/**
 * Inkitt-style search: Stories | People | Reading Lists
 * Route: /search?q=...&tab=stories
 */
export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const qParam = params.get("q") || "";
  const tabParam = params.get("tab") || "stories";

  const [q, setQ] = useState(qParam);
  const [tab, setTab] = useState(
    TABS.some((t) => t.id === tabParam) ? tabParam : "stories"
  );
  const [stories, setStories] = useState([]);
  const [people, setPeople] = useState([]);
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setQ(qParam);
  }, [qParam]);

  useEffect(() => {
    let cancelled = false;
    const term = qParam.trim();
    if (!term) {
      setStories([]);
      setPeople([]);
      setLists([]);
      return;
    }
    (async () => {
      setLoading(true);
      setError("");
      try {
        if (tab === "stories") {
          const res = await searchStories(term);
          if (cancelled) return;
          const items = Array.isArray(res?.items)
            ? res.items
            : Array.isArray(res)
              ? res
              : [];
          setStories(items);
        } else if (tab === "people") {
          const res = await searchUsers(term);
          if (cancelled) return;
          const items = Array.isArray(res?.items)
            ? res.items
            : Array.isArray(res)
              ? res
              : [];
          setPeople(items);
        } else {
          const res = await getPublicReadingLists().catch(() => ({ items: [] }));
          if (cancelled) return;
          const all = Array.isArray(res?.items) ? res.items : [];
          const lower = term.toLowerCase();
          setLists(
            all.filter((l) =>
              String(l.name || "")
                .toLowerCase()
                .includes(lower)
            )
          );
        }
      } catch (e) {
        if (!cancelled) setError(e?.message || "Search failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [qParam, tab]);

  function submit(e) {
    e.preventDefault();
    const term = q.trim();
    const next = new URLSearchParams();
    if (term) next.set("q", term);
    next.set("tab", tab);
    setParams(next);
  }

  function switchTab(id) {
    setTab(id);
    const next = new URLSearchParams(params);
    next.set("tab", id);
    setParams(next);
  }

  const emptyHint = useMemo(() => {
    if (!qParam.trim()) return "Type a title, author, or keyword — then search.";
    if (loading) return null;
    if (tab === "stories" && !stories.length) return "No stories found.";
    if (tab === "people" && !people.length) return "No people found.";
    if (tab === "lists" && !lists.length)
      return "No reading lists matched (your lists, when logged in).";
    return null;
  }, [qParam, loading, tab, stories, people, lists]);

  return (
    <div className="search-page container">
      <h1 className="search-page-title">Search</h1>
      <form className="search-page-form" onSubmit={submit}>
        <input
          className="search-page-input"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search stories, people, reading lists…"
          aria-label="Search"
          autoFocus
        />
        <button type="submit" className="btn-primary">
          Search
        </button>
      </form>

      <div className="search-tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={`search-tab ${tab === t.id ? "active" : ""}`}
            onClick={() => switchTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error ? <p className="meta" style={{ color: "var(--danger)" }}>{error}</p> : null}
      {loading ? <p className="meta">Searching…</p> : null}
      {emptyHint ? <p className="meta">{emptyHint}</p> : null}

      {tab === "stories" && !loading && stories.length > 0 && (
        <div className="search-stories-grid trending-grid">
          {stories.map((b) => (
            <div key={b.id} className="trending-cell book-card-hover">
              <BookCard book={b} variant="grid" />
            </div>
          ))}
        </div>
      )}

      {tab === "people" && !loading && people.length > 0 && (
        <ul className="search-people-list">
          {people.map((p) => {
            const id = p.id || p.user_id;
            const name = p.display_name || p.username || "User";
            const photo = resolveAssetUrl(p.photo_url || p.avatar_url || "");
            return (
              <li key={id} className="search-people-item book-card-hover">
                <Link to={`/profile/${id}`} className="search-people-link">
                  <span
                    className="search-people-avatar"
                    style={
                      photo
                        ? { backgroundImage: `url(${photo})` }
                        : undefined
                    }
                  >
                    {!photo ? String(name).charAt(0).toUpperCase() : null}
                  </span>
                  <span className="search-people-meta">
                    <span className="search-people-name">{name}</span>
                    {p.username ? (
                      <span className="meta">@{p.username}</span>
                    ) : null}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {tab === "lists" && !loading && lists.length > 0 && (
        <div className="search-lists-grid">
          {lists.map((l) => (
            <div key={l.id} className="reading-list-card book-card-hover">
              <div
                className="reading-list-cover"
                style={{
                  backgroundImage: `url(${
                    resolveAssetUrl(l.cover_path) || PLACEHOLDER
                  })`,
                }}
              />
              <div className="reading-list-body">
                <div className="reading-list-name">{l.name || "List"}</div>
                <div className="meta">
                  {l.story_count ?? l.book_count ?? 0} stories
                </div>
                <button
                  type="button"
                  className="btn-ghost btn-sm"
                  onClick={() => navigate("/library")}
                >
                  Open library
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
