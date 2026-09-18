import BookCard from "./BookCard";

export default function Shelf({ title, books, linkTo }) {
  const list = Array.isArray(books) ? books.filter(Boolean) : [];
  if (!list.length) return null;

  return (
    <section className="section">
      <div className="section-header">
        <h2 className="section-title">{title}</h2>
        {linkTo && (
          <a className="section-link" href={linkTo}>
            View all →
          </a>
        )}
      </div>
      <div className="shelf stagger">
        {list.map((b, i) => (
          <BookCard key={b.id || b.book_id || i} book={b} style={{ animationDelay: `${i * 0.04}s` }} />
        ))}
      </div>
    </section>
  );
}
