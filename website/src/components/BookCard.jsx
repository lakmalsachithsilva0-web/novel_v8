import { Link } from "react-router-dom";
import { resolveAssetUrl } from "../api";

export default function BookCard({ book, style }) {
  if (!book) return null;
  const id = book.id || book.book_id;
  const title = book.title || "Untitled";
  const author = book.author || book.author_name || "";
  const cover = resolveAssetUrl(book.cover_path || book.cover_url || book.cover || "");
  const rating = book.rating != null ? Number(book.rating).toFixed(1) : null;

  return (
    <Link to={id ? `/stories/${id}` : "#"} className="book-card" style={style}>
      <div className="book-cover">
        {cover ? (
          <img src={cover} alt="" loading="lazy" />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              background: "linear-gradient(145deg,#2A1F3D,#1A1625)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#A78BFA",
              fontSize: "0.75rem",
              padding: 8,
              textAlign: "center",
            }}
          >
            {title.slice(0, 24)}
          </div>
        )}
        {rating != null && rating > 0 && <span className="badge">★ {rating}</span>}
      </div>
      <div className="book-meta">
        <div className="book-title">{title}</div>
        {author && <div className="book-author">{author}</div>}
      </div>
    </Link>
  );
}
