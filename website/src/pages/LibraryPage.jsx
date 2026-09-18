import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getLibrary, getReadingLists, resolveAssetUrl } from "../api";
import BookCard from "../components/BookCard";

export default function LibraryPage({ isRealUser, onNeedAuth }) {
  const [items, setItems] = useState([]);
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isRealUser) {
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      try {
        const [lib, rl] = await Promise.all([getLibrary(), getReadingLists()]);
        const libItems = lib?.items || lib?.entries || (Array.isArray(lib) ? lib : []);
        setItems(libItems);
        setLists(rl?.items || (Array.isArray(rl) ? rl : []));
      } catch {
        setItems([]);
        setLists([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [isRealUser]);

  if (!isRealUser) {
    return (
      <div className="container page-empty">
        <h3>Your Library</h3>
        <p>Sign in to see Current Reads, History, and Reading Lists.</p>
        <button type="button" className="btn btn-primary" style={{ marginTop: 16 }} onClick={onNeedAuth}>
          Sign in
        </button>
        <p style={{ marginTop: 12 }}>
          <Link to="/" className="linkish">
            Continue browsing on Home →
          </Link>
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: 24 }}>
        <div className="skeleton" style={{ height: 40, width: 200, marginBottom: 16 }} />
        <div className="skeleton" style={{ height: 180 }} />
      </div>
    );
  }

  return (
    <div className="container-wide" style={{ paddingTop: 20, paddingBottom: 40 }}>
      <h1 className="section-title" style={{ marginBottom: 8 }}>
        Library
      </h1>
      <p style={{ color: "var(--muted)", marginBottom: 20, fontSize: "0.9rem" }}>
        Your reads and lists — same data as the mobile app.
      </p>

      {lists.length > 0 && (
        <section className="section">
          <h2 className="section-title">Reading lists</h2>
          <div className="card-grid" style={{ marginTop: 12 }}>
            {lists.map((l) => (
              <div key={l.id} className="panel">
                <h3>{l.name || "Reading List"}</h3>
                <p className="meta">{l.story_count ?? l.items?.length ?? 0} stories</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="section">
        <h2 className="section-title">Current & history</h2>
        {items.length === 0 ? (
          <div className="page-empty" style={{ padding: 32 }}>
            <p>No library entries yet. Open a story and add it to a list.</p>
            <Link to="/" className="btn btn-primary" style={{ marginTop: 12, display: "inline-flex" }}>
              Browse Home
            </Link>
          </div>
        ) : (
          <div className="shelf" style={{ marginTop: 12 }}>
            {items.map((it, i) => {
              const book = it.book || it;
              return <BookCard key={book.id || i} book={book} />;
            })}
          </div>
        )}
      </section>
    </div>
  );
}
