import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { listGenres, searchStories } from "../api";
import BookCard from "../components/BookCard";

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get("q") || "");
  const [results, setResults] = useState([]);
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    listGenres().then((g) => {
      const items = g?.items || g?.genres || (Array.isArray(g) ? g : []);
      setGenres(items);
    });
  }, []);

  useEffect(() => {
    const query = params.get("q") || "";
    setQ(query);
    if (!query.trim()) {
      setResults([]);
      return;
    }
    (async () => {
      setLoading(true);
      try {
        const res = await searchStories(query.trim());
        setResults(res?.items || res?.books || (Array.isArray(res) ? res : []));
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [params]);

  function onSubmit(e) {
    e.preventDefault();
    setParams(q.trim() ? { q: q.trim() } : {});
  }

  return (
    <div className="container-wide" style={{ paddingTop: 20, paddingBottom: 40 }}>
      <h1 className="section-title" style={{ marginBottom: 16 }}>
        Search
      </h1>
      <form onSubmit={onSubmit} style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Titles, authors, keywords…"
          style={{
            flex: 1,
            padding: "12px 16px",
            borderRadius: 999,
            border: "1px solid var(--border)",
            background: "var(--field)",
            color: "var(--text)",
          }}
        />
        <button type="submit" className="btn btn-primary">
          Search
        </button>
      </form>

      {genres.length > 0 && (
        <div className="chips" style={{ marginBottom: 24 }}>
          {genres.slice(0, 20).map((g, i) => {
            const name = typeof g === "string" ? g : g.name || g.title;
            if (!name) return null;
            return (
              <button
                key={i}
                type="button"
                className="chip"
                onClick={() => {
                  setQ(name);
                  setParams({ q: name });
                }}
              >
                {name}
              </button>
            );
          })}
        </div>
      )}

      {loading ? (
        <div className="skeleton" style={{ height: 160 }} />
      ) : results.length > 0 ? (
        <div className="shelf" style={{ flexWrap: "wrap" }}>
          {results.map((b, i) => (
            <BookCard key={b.id || i} book={b} />
          ))}
        </div>
      ) : params.get("q") ? (
        <div className="page-empty">
          <p>No results for “{params.get("q")}”.</p>
        </div>
      ) : (
        <p style={{ color: "var(--muted)" }}>Try a genre chip or type a search.</p>
      )}
    </div>
  );
}
