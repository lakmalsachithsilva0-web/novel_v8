import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getBookChapters } from "../api";

export default function ChapterPage() {
  const { id, chapterId } = useParams();
  const [chapter, setChapter] = useState(null);
  const [siblings, setSiblings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await getBookChapters(id);
        const items = res?.items || res?.chapters || (Array.isArray(res) ? res : []);
        setSiblings(items);
        const found = items.find((c) => String(c.id) === String(chapterId));
        setChapter(found || null);
        if (!found) setError("Chapter not found");
      } catch (e) {
        setError(String(e.message || e));
      } finally {
        setLoading(false);
      }
    })();
  }, [id, chapterId]);

  if (loading) {
    return (
      <div className="reader-page">
        <div className="skeleton" style={{ height: 40, marginBottom: 16 }} />
        <div className="skeleton" style={{ height: 300 }} />
      </div>
    );
  }

  const idx = siblings.findIndex((c) => String(c.id) === String(chapterId));
  const prev = idx > 0 ? siblings[idx - 1] : null;
  const next = idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1] : null;
  const content = chapter?.content || chapter?.body || chapter?.text || "";

  return (
    <div className="reader-page">
      <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <Link to={`/stories/${id}`} className="linkish">
          ← Story
        </Link>
        <div style={{ display: "flex", gap: 12 }}>
          {prev && (
            <Link to={`/stories/${id}/chapters/${prev.id}`} className="btn btn-ghost btn-sm">
              Previous
            </Link>
          )}
          {next && (
            <Link to={`/stories/${id}/chapters/${next.id}`} className="btn btn-primary btn-sm">
              Next
            </Link>
          )}
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <h1
        style={{
          fontFamily: "var(--display)",
          fontSize: "1.5rem",
          fontWeight: 800,
          marginBottom: 24,
        }}
      >
        {chapter?.title || "Chapter"}
      </h1>

      <div className="reader-content">
        {content
          ? content.split(/\n\n+/).map((para, i) => <p key={i}>{para}</p>)
          : "No content for this chapter."}
      </div>

      <div style={{ marginTop: 40, display: "flex", justifyContent: "space-between" }}>
        {prev ? (
          <Link to={`/stories/${id}/chapters/${prev.id}`} className="btn btn-ghost">
            ← Previous
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link to={`/stories/${id}/chapters/${next.id}`} className="btn btn-primary">
            Next →
          </Link>
        ) : (
          <Link to={`/stories/${id}`} className="btn btn-ghost">
            Back to story
          </Link>
        )}
      </div>
    </div>
  );
}
