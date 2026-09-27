import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getBootstrap, resolveAssetUrl } from "../api";

function recommendationsFrom(data, excludeId) {
  const asList = (value) => Array.isArray(value) ? value : value && typeof value === "object" ? [value] : [];
  const source = [
    ...asList(data?.recommended),
    ...asList(data?.trending),
    ...asList(data?.recently_updated || data?.recentlyUpdated),
    ...asList(data?.recently_completed),
    ...asList(data?.discover_books),
    ...asList(data?.featured),
    ...asList(data?.featured_book),
    ...asList(data?.books),
  ];
  const seen = new Set([String(excludeId || "")]);
  return source.filter((book) => {
    const id = book?.id;
    if (!id || seen.has(String(id))) return false;
    seen.add(String(id));
    return true;
  }).slice(0, 6);
}

export default function YouMayAlsoLike({ excludeId, title = "You may also like" }) {
  const [books, setBooks] = useState([]);

  useEffect(() => {
    let cancelled = false;
    getBootstrap().then((data) => {
      if (!cancelled) setBooks(recommendationsFrom(data, excludeId));
    }).catch(() => {
      if (!cancelled) setBooks([]);
    });
    return () => { cancelled = true; };
  }, [excludeId]);

  if (!books.length) return null;
  return (
    <section className="you-may-also-like" aria-labelledby="recommendations-title">
      <header className="recommendations-heading">
        <div><span className="eyebrow">KEEP READING</span><h2 id="recommendations-title">{title}</h2></div>
        <Link to="/" className="recommendations-browse">Browse stories <span aria-hidden="true">→</span></Link>
      </header>
      <div className="recommendations-grid">
        {books.map((book) => {
          const cover = resolveAssetUrl(book.cover_path || book.coverPath || "");
          return (
            <Link to={`/stories/${book.id}`} className="recommendation-card" key={book.id}>
              <div className="recommendation-cover">
                {cover ? <img src={cover} alt="" loading="lazy" /> : <span>{(book.title || "N").slice(0, 1)}</span>}
              </div>
              <div className="recommendation-copy"><strong>{book.title || "Untitled story"}</strong><span>{book.author || "NovelHub author"}</span><small>{book.primary_genre || book.genre || "A story for you"}</small></div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
