import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  addToReadingList,
  getBook,
  getBookChapters,
  getBookLike,
  getBookReviews,
  likeBook,
  resolveAssetUrl,
  unlikeBook,
} from "../api";

export default function StoryPage({ isRealUser, onNeedAuth }) {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [liked, setLiked] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const [b, ch, lk, rv] = await Promise.all([
          getBook(id),
          getBookChapters(id).catch(() => ({ items: [] })),
          getBookLike(id).catch(() => ({ liked: false })),
          getBookReviews(id).catch(() => ({ items: [] })),
        ]);
        setBook(b);
        setChapters(ch?.items || ch?.chapters || (Array.isArray(ch) ? ch : []));
        setLiked(!!lk?.liked);
        setReviews(rv?.items || []);
      } catch (e) {
        setError(String(e.message || e));
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  async function toggleLike() {
    if (!isRealUser) return onNeedAuth?.();
    try {
      if (liked) {
        await unlikeBook(id);
        setLiked(false);
      } else {
        await likeBook(id);
        setLiked(true);
      }
    } catch (e) {
      setError(String(e.message || e));
    }
  }

  async function addList() {
    if (!isRealUser) return onNeedAuth?.();
    try {
      await addToReadingList(id);
      setError("");
      alert("Added to reading list");
    } catch (e) {
      setError(String(e.message || e));
    }
  }

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: 24 }}>
        <div className="skeleton" style={{ height: 280 }} />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="container page-empty">
        <h3>Story not found</h3>
        {error && <p>{error}</p>}
        <Link to="/" className="btn btn-primary" style={{ marginTop: 12, display: "inline-flex" }}>
          Back to Home
        </Link>
      </div>
    );
  }

  const cover = resolveAssetUrl(book.cover_path || book.cover_url || book.cover || "");
  const firstCh = chapters[0];

  return (
    <div className="container" style={{ paddingTop: 16, paddingBottom: 48, maxWidth: 960 }}>
      <div className="story-hero">
        <div className="story-cover-lg">
          {cover ? (
            <img src={cover} alt="" />
          ) : (
            <div style={{ width: "100%", height: "100%", background: "var(--purple-dim)" }} />
          )}
        </div>
        <div>
          <h1 style={{ fontFamily: "var(--display)", fontSize: "1.75rem", fontWeight: 800, marginBottom: 8 }}>
            {book.title}
          </h1>
          <p style={{ color: "var(--muted)", marginBottom: 8 }}>{book.author || book.author_name}</p>
          {book.genre && (
            <span className="chip" style={{ marginBottom: 12, display: "inline-block" }}>
              {book.genre}
            </span>
          )}
          <p style={{ color: "var(--muted)", margin: "12px 0 20px", lineHeight: 1.6 }}>
            {book.description || ""}
          </p>
          <div className="hero-actions">
            {firstCh && (
              <Link
                to={`/stories/${id}/chapters/${firstCh.id}`}
                className="btn btn-primary"
              >
                Start reading
              </Link>
            )}
            <button type="button" className="btn btn-ghost" onClick={toggleLike}>
              {liked ? "♥ Liked" : "♡ Like"}
            </button>
            <button type="button" className="btn btn-ghost" onClick={addList}>
              + Reading list
            </button>
          </div>
          {error && <div className="error-banner">{error}</div>}
        </div>
      </div>

      <section className="section">
        <h2 className="section-title">Chapters</h2>
        <div className="chapter-list" style={{ marginTop: 12 }}>
          {chapters.length === 0 ? (
            <p style={{ color: "var(--muted)" }}>No chapters published yet.</p>
          ) : (
            chapters.map((c, i) => (
              <Link
                key={c.id}
                to={`/stories/${id}/chapters/${c.id}`}
                className="chapter-row"
              >
                <span className="chapter-num">{c.chapter_number ?? i + 1}</span>
                <span style={{ fontWeight: 600 }}>{c.title || `Chapter ${i + 1}`}</span>
              </Link>
            ))
          )}
        </div>
      </section>

      {reviews.length > 0 && (
        <section className="section">
          <h2 className="section-title">Reviews</h2>
          {reviews.map((r, i) => (
            <div key={i} className="notif-item">
              <h4>
                ★ {r.rating ?? "—"} · {r.display_name || r.username || "Reader"}
              </h4>
              <p>{r.comment || r.body || ""}</p>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
