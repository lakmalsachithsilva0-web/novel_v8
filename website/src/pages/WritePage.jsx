import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { createStory, getMyStories, resolveAssetUrl } from "../api";

export default function WritePage({ user, isRealUser, onNeedAuth }) {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await getMyStories();
      setStories(res?.items || (Array.isArray(res) ? res : []));
    } catch {
      setStories([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isRealUser) load();
    else setLoading(false);
  }, [isRealUser]);

  async function onCreate(e) {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    setError("");
    try {
      await createStory({
        title: title.trim(),
        author: user?.display_name || user?.username || "Author",
        genre: "Romance",
      });
      setTitle("");
      await load();
    } catch (err) {
      setError(String(err.message || err));
    } finally {
      setBusy(false);
    }
  }

  if (!isRealUser) {
    return (
      <div className="container page-empty">
        <h3>Write</h3>
        <p>Sign in to create and manage stories — same as the mobile Write tab.</p>
        <button type="button" className="btn btn-primary" style={{ marginTop: 16 }} onClick={onNeedAuth}>
          Sign in to write
        </button>
      </div>
    );
  }

  return (
    <div className="container-wide" style={{ paddingTop: 20, paddingBottom: 40 }}>
      <h1 className="section-title">Write</h1>
      <p style={{ color: "var(--muted)", marginBottom: 20, fontSize: "0.9rem" }}>
        Manage Stories · Drafts · Submitted
      </p>

      <form onSubmit={onCreate} className="panel" style={{ marginBottom: 24, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <input
          style={{
            flex: 1,
            minWidth: 200,
            padding: "12px 14px",
            borderRadius: 12,
            border: "1px solid var(--border)",
            background: "var(--field)",
            color: "var(--text)",
          }}
          placeholder="New story title…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? "Creating…" : "Create story"}
        </button>
      </form>
      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <div className="skeleton" style={{ height: 120 }} />
      ) : stories.length === 0 ? (
        <div className="page-empty">
          <h3>You haven&apos;t submitted any story yet</h3>
          <p>Create your first draft above.</p>
        </div>
      ) : (
        <div className="card-grid">
          {stories.map((s) => (
            <Link key={s.id} to={`/stories/${s.id}`} className="panel">
              <div style={{ display: "flex", gap: 14 }}>
                <div
                  style={{
                    width: 56,
                    height: 80,
                    borderRadius: 8,
                    overflow: "hidden",
                    background: "var(--field)",
                    flexShrink: 0,
                  }}
                >
                  {(s.cover_path || s.cover) && (
                    <img
                      src={resolveAssetUrl(s.cover_path || s.cover)}
                      alt=""
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  )}
                </div>
                <div>
                  <h3>{s.title || "Untitled"}</h3>
                  <p className="meta">
                    {s.status_text || s.status || "Draft"} · {s.genre || ""}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
