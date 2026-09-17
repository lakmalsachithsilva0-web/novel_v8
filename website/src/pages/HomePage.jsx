import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import BookCard from "../components/BookCard";
import PhoneMockup from "../components/PhoneMockup";
import Shelf from "../components/Shelf";
import {
  getBootstrap,
  getPublicReadingLists,
  getToken,
  resolveAssetUrl,
  toggleReadingListFollow,
} from "../api";

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

/** Placeholder cover when book has no image */
const PLACEHOLDER_COVER =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="240" viewBox="0 0 160 240">
      <rect fill="#1f2937" width="160" height="240"/>
      <rect fill="#374151" x="20" y="40" width="120" height="160" rx="4"/>
      <text x="80" y="130" text-anchor="middle" fill="#9ca3af" font-family="sans-serif" font-size="12">Cover</text>
    </svg>`
  );

function collectBooks(boot) {
  if (!boot) return [];
  const map = new Map();
  const add = (arr) => {
    (arr || []).forEach((b) => {
      if (b && b.id != null) map.set(String(b.id), b);
    });
  };
  add(boot.books);
  add(boot.discover_books);
  add(boot.trending);
  add(boot.recently_updated);
  add(boot.recently_completed);
  add(boot.featured);
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
    return fields.some(
      (f) => f.includes(g.split(" ")[0]) || g.includes(f) || f.includes(g)
    );
  });
}

function withCover(book) {
  const path = book.cover_path || book.coverPath || "";
  if (!path) return { ...book, cover_path: PLACEHOLDER_COVER };
  return book;
}

/**
 * Inkitt-style home:
 * - Guest / logged-out: marketing hero + shelves
 * - Logged-in reader: feed-first (Continue · For You · Trending · Genre shelves · Reading lists)
 */
export default function HomePage({ user }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [readingLists, setReadingLists] = useState([]);
  const [followMsg, setFollowMsg] = useState("");
  const navigate = useNavigate();

  const isGuest =
    !user ||
    String(user.email || "").includes("guest") ||
    String(user.provider || "") === "guest";
  const isLoggedIn = Boolean(user && !isGuest);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [boot, lists] = await Promise.all([
          getBootstrap(),
          getPublicReadingLists().catch(() => ({ items: [] })),
        ]);
        if (!cancelled) {
          setData(boot);
          setReadingLists(lists?.items || []);
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

  const allBooks = useMemo(() => collectBooks(data).map(withCover), [data]);
  const trending = useMemo(() => {
    const t = (data?.trending || data?.discover_books || []).map(withCover);
    return t.length ? t : allBooks.slice(0, 12);
  }, [data, allBooks]);
  const recentlyUpdated = useMemo(() => {
    const t = (data?.recently_updated || []).map(withCover);
    return t.length ? t : allBooks.slice(0, 12);
  }, [data, allBooks]);
  const recentlyCompleted = useMemo(() => {
    const t = (data?.recently_completed || []).map(withCover);
    return t.length ? t : allBooks.filter((b) => b.is_completed).slice(0, 12);
  }, [data, allBooks]);
  const library = useMemo(() => {
    const t = (data?.library || []).map((le) =>
      withCover({
        id: le.book_id || le.id,
        title: le.title,
        author: le.author,
        cover_path: le.cover_path,
        rating: le.rating,
      })
    );
    return t;
  }, [data]);

  async function onFollowList(listId) {
    if (!getToken()) {
      navigate("/login");
      return;
    }
    try {
      await toggleReadingListFollow(listId);
      setFollowMsg("Updated follow");
      setTimeout(() => setFollowMsg(""), 2000);
    } catch (e) {
      setFollowMsg(String(e.message || e));
    }
  }

  return (
    <div className={`home-page ${isLoggedIn ? "home-page--feed" : "home-page--marketing"}`}>
      {/* —— Logged-in: Inkitt feed (no big marketing hero) —— */}
      {isLoggedIn && (
        <section className="inkitt-feed">
          <div className="container-wide inkitt-feed-head">
            <h1 className="inkitt-greeting">
              Welcome back{user?.display_name ? `, ${user.display_name.split(" ")[0]}` : ""}
            </h1>
            <p className="meta">Stories from the same library as the NovelHub app</p>
          </div>

          {library.length > 0 && (
            <Shelf title="Continue reading" books={library} seeAllTo="/library" />
          )}
          <Shelf title="For you" books={trending} seeAllTo="/discover" />
          <Shelf title="Recently updated" books={recentlyUpdated} seeAllTo="/discover" />
          <Shelf title="Recently completed" books={recentlyCompleted} seeAllTo="/discover" />

          {GENRE_SHELVES.map((g) => {
            const books = byGenre(allBooks, g).slice(0, 12);
            if (!books.length) return null;
            return (
              <Shelf
                key={g}
                title={g}
                books={books}
                seeAllTo={`/genres/${encodeURIComponent(g.split(" ")[0])}`}
              />
            );
          })}

          {readingLists.length > 0 && (
            <section className="shelf-section">
              <div className="container-wide shelf-head">
                <h2 className="shelf-title">Reading lists</h2>
                <Link to="/discover" className="shelf-see-all">
                  See all
                </Link>
              </div>
              <div className="container-wide reading-lists-row">
                {readingLists.slice(0, 8).map((rl) => (
                  <div key={rl.id || rl.name} className="reading-list-card">
                    <div
                      className="reading-list-cover"
                      style={{
                        backgroundImage: `url(${resolveAssetUrl(rl.cover_path) || PLACEHOLDER_COVER})`,
                      }}
                    />
                    <div className="reading-list-body">
                      <div className="reading-list-name">{rl.name || "List"}</div>
                      <div className="meta">{rl.story_count ?? rl.book_count ?? 0} stories</div>
                      <button
                        type="button"
                        className="btn-ghost btn-sm"
                        onClick={() => onFollowList(rl.id)}
                      >
                        Follow
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {followMsg ? <p className="meta container-wide">{followMsg}</p> : null}
            </section>
          )}
        </section>
      )}

      {/* —— Guest / marketing (Inkitt landing style) —— */}
      {!isLoggedIn && (
        <>
          <section className="hero hero--inkitt">
            <div className="container hero-grid">
              <div className="hero-copy">
                <p className="eyebrow">Our readers are trendsetters.</p>
                <p className="lead">
                  Every day, readers discover the next bestseller on NovelHub — same stories as
                  the mobile app.
                </p>
                <p className="hero-stat">
                  <strong>1 in 2 novels</strong> discovered here become community favorites.
                </p>
                <p className="hero-explore">Explore stories in your favorite genre:</p>
                <div className="genre-pills">
                  {GENRE_PILLS.map((g) => (
                    <button
                      key={g}
                      type="button"
                      className="genre-pill"
                      onClick={() =>
                        navigate(
                          g === "More" ? "/discover" : `/genres/${encodeURIComponent(g)}`
                        )
                      }
                    >
                      {g}
                    </button>
                  ))}
                </div>
                <div className="hero-cta-row">
                  <Link to="/login" className="btn-primary">
                    Log in
                  </Link>
                  <Link to="/discover" className="btn-ghost">
                    Browse free stories
                  </Link>
                </div>
              </div>
              <PhoneMockup />
            </div>
          </section>

          <Shelf title="Trending stories" books={trending} seeAllTo="/discover" />
          <Shelf title="Recently updated" books={recentlyUpdated} seeAllTo="/discover" />
        </>
      )}

      {loading && <p className="page-loading">Loading stories…</p>}
      {error && <p className="meta container" style={{ color: "var(--danger)" }}>{error}</p>}

      {/* Shared genre shelves for guests */}
      {!isLoggedIn &&
        GENRE_SHELVES.map((g) => {
          const books = byGenre(allBooks, g).slice(0, 12);
          if (!books.length) return null;
          return (
            <Shelf
              key={g}
              title={g}
              books={books}
              seeAllTo={`/genres/${encodeURIComponent(g.split(" ")[0])}`}
            />
          );
        })}
    </div>
  );
}
