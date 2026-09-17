import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import BookCard from "../components/BookCard";
import { getGenreBooks, getGenreMeta, resolveAssetUrl } from "../api";

/**
 * Genre hub — same backend as Flutter:
 * GET /api/genres/{name}/meta  (cover, description)
 * GET /api/genres/{name}/books
 */
export default function GenrePage() {
  const { genre } = useParams();
  const label = decodeURIComponent(genre || "Stories");
  const [books, setBooks] = useState([]);
  const [meta, setMeta] = useState({
    name: label,
    cover_path: "",
    description: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const [metaRes, booksRes] = await Promise.all([
          getGenreMeta(label).catch(() => ({
            name: label,
            cover_path: "",
            description: "",
          })),
          getGenreBooks(label).catch(() => ({ items: [] })),
        ]);
        if (cancelled) return;
        setMeta({
          name: metaRes?.name || label,
          cover_path: metaRes?.cover_path || metaRes?.cover_url || "",
          description: metaRes?.description || "",
        });
        const items = Array.isArray(booksRes?.items)
          ? booksRes.items
          : Array.isArray(booksRes)
            ? booksRes
            : [];
        setBooks(items);
      } catch (e) {
        if (!cancelled) setError(e?.message || "Failed to load genre");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [label]);

  // Relative paths like /api/media/12 need the API host
  const coverUrl = resolveAssetUrl(meta.cover_path || "");

  return (
    <div className="full-bleed">
      <div className="full-bleed-inner">
        {coverUrl ? (
          <div
            className="genre-cover"
            style={{
              height: 180,
              borderRadius: 16,
              marginBottom: 20,
              backgroundImage: `linear-gradient(to bottom, transparent, rgba(0,0,0,.55)), url(${JSON.stringify(coverUrl).slice(1, -1)})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              display: "flex",
              alignItems: "flex-end",
              padding: 20,
            }}
          >
            <div>
              <p className="meta" style={{ color: "rgba(255,255,255,.85)", marginBottom: 4 }}>
                <Link to="/" style={{ color: "inherit" }}>
                  Home
                </Link>{" "}
                · Genre
              </p>
              <h1 style={{ color: "#fff", margin: 0 }}>{meta.name || label}</h1>
            </div>
          </div>
        ) : (
          <div className="genre-page-header">
            <p className="meta">
              <Link to="/">Home</Link> · {label}
            </p>
            <h1>{meta.name || label} Stories</h1>
          </div>
        )}
        {meta.description ? <p className="meta">{meta.description}</p> : null}
        <p className="meta">
          {loading ? "…" : books.length} stories · same database as the app
        </p>
        {error ? <p className="meta" style={{ color: "#f87171" }}>{error}</p> : null}
        {loading ? <p className="meta">Loading…</p> : null}
        <div className="trending-grid" style={{ marginBottom: 48 }}>
          {books.map((b) => (
            <div key={b.id} className="trending-cell">
              <BookCard book={b} variant="grid" />
            </div>
          ))}
        </div>
        {!loading && books.length === 0 && !error ? (
          <p className="meta">No stories in this genre yet.</p>
        ) : null}
      </div>
    </div>
  );
}
