import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  addToReadingList,
  getBook,
  getBookChapters,
  getChapterComments,
  getChapterReactions,
  getToken,
  saveLibraryProgress,
  postChapterComment,
  toggleChapterReaction,
} from "../api";
import {
  GUEST_CHAPTER_LIMIT,
  isChapterAllowedForGuest,
  isGuestUser,
} from "../utils/guest";

const REACTIONS = [
  { label: "Love this", emoji: "❤️" },
  { label: "Funny", emoji: "😂" },
  { label: "Spicy", emoji: "🌶️" },
  { label: "Suspenseful", emoji: "😮" },
  { label: "Emotional", emoji: "📚" },
  { label: "Profound", emoji: "🤯" },
  { label: "Heartwarming", emoji: "🥰" },
  { label: "Shocking", emoji: "😱" },
  { label: "Good Writing", emoji: "✍️" },
  { label: "Compelling Plot", emoji: "🎢" },
  { label: "Great Character", emoji: "😎" },
  { label: "Strong Dialog", emoji: "💬" },
];

export default function ChapterPage({ user }) {
  const { id, chapterId } = useParams();
  const navigate = useNavigate();
  const guest = isGuestUser(user);
  const [book, setBook] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [chapter, setChapter] = useState(null);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [commentMsg, setCommentMsg] = useState("");
  const [comments, setComments] = useState([]);
  const [paraCounts, setParaCounts] = useState({});
  const [activePara, setActivePara] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [reactionCounts, setReactionCounts] = useState({});
  const [mine, setMine] = useState([]);
  const [fontSize, setFontSize] = useState(() => {
    const saved = Number(localStorage.getItem("novelhub_reader_font_size"));
    return saved >= 16 && saved <= 26 ? saved : 19;
  });
  const [warmPage, setWarmPage] = useState(() => localStorage.getItem("novelhub_reader_warm_page") === "true");
  const progressTimer = useRef(null);

  const chapterNumber = useMemo(() => {
    if (!chapter) return 1;
    return Number(chapter.chapter_number) || 1;
  }, [chapter]);

  async function loadComments(num) {
    try {
      const res = await getChapterComments(id, num);
      setComments(res?.items || []);
      setParaCounts(res?.paragraph_counts || {});
      setCommentMsg("");
    } catch (err) {
      setComments([]);
      setParaCounts({});
      setCommentMsg(`Comments could not load: ${err.message || "check your connection and try again."}`);
    }
  }

  async function loadReactions(num) {
    try {
      const res = await getChapterReactions(id, num);
      setReactionCounts(res?.counts || res || {});
      setMine(res?.mine || []);
    } catch {
      setReactionCounts({});
      setMine([]);
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setError("");
      try {
        const [b, chRes] = await Promise.all([getBook(id), getBookChapters(id)]);
        const items = chRes?.items || [];
        if (cancelled) return;
        setBook(b);
        setChapters(items);
        const found = items.find((c) => String(c.id) === String(chapterId));
        setChapter(found || null);
        if (found) {
          const num = Number(found.chapter_number) || 1;
          await loadComments(num);
          await loadReactions(num);
        }
      } catch (e) {
        if (!cancelled) setError(String(e.message || e));
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, chapterId]);

  useEffect(() => {
    if (!chapter || !getToken() || guest) return undefined;
    const total = chapters.length;
    const chapterNum = Number(chapter.chapter_number) || 1;
    saveLibraryProgress({
      book_id: Number(id),
      reading_status: "Reading",
      chapters: total,
      last_chapter_number: chapterNum,
      last_paragraph_index: 0,
      chapters_read: chapterNum,
      primary_genre: book?.primary_genre || book?.genre || "",
    }).catch(() => {});
    return undefined;
  }, [chapter?.id, chapters.length, guest, id, book?.primary_genre, book?.genre]);

  useEffect(() => () => clearTimeout(progressTimer.current), []);

  useEffect(() => {
    if (!chapter || guest || !getToken()) return undefined;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const visible = [...document.querySelectorAll("[data-reader-paragraph]")]
          .filter((node) => node.getBoundingClientRect().top < window.innerHeight * 0.68);
        const current = visible.at(-1);
        if (current) recordProgress(Number(current.dataset.readerParagraph));
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [chapter?.id, guest]);

  const idx = chapters.findIndex((c) => String(c.id) === String(chapterId));
  if (guest && !isChapterAllowedForGuest(idx >= 0 ? idx : 0)) {
    return (
      <div className="container page">
        <div className="guest-lock">
          <h3>Sign in to keep reading</h3>
          <p>
            Guests can read the first {GUEST_CHAPTER_LIMIT} chapters. Sign in for the full story.
          </p>
          <Link className="btn btn-primary" to="/login">
            Sign in
          </Link>
          <div style={{ marginTop: 12 }}>
            <Link to={`/stories/${id}`}>← Back to story</Link>
          </div>
        </div>
      </div>
    );
  }

  if (error) return <div className="container page error-banner">{error}</div>;
  if (!chapter) return <div className="container page">Loading chapter…</div>;
  const isStoryOwner = !guest && Number(book?.user_id || book?.author_user_id) === Number(user?.user_id || user?.id);

  const prev = idx > 0 ? chapters[idx - 1] : null;
  const next = idx >= 0 && idx < chapters.length - 1 ? chapters[idx + 1] : null;
  const nextLocked = guest && next && !isChapterAllowedForGuest(idx + 1);

  const paragraphs = String(chapter.content || "")
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  function recordProgress(i) {
    if (getToken() && !guest) {
      clearTimeout(progressTimer.current);
      progressTimer.current = setTimeout(() => {
        saveLibraryProgress({
          book_id: Number(id),
          reading_status: "Reading",
          chapters: chapters.length,
          last_chapter_number: chapterNumber,
          last_paragraph_index: i,
          chapters_read: chapterNumber,
          primary_genre: book?.primary_genre || book?.genre || "",
        }).catch(() => {});
      }, 700);
    }
  }

  function openPara(i) {
    setActivePara(i);
    setPanelOpen(true);
    recordProgress(i);
  }

  async function submitComment(e) {
    e.preventDefault();
    if (!getToken() || guest) {
      setCommentMsg("Sign in to comment.");
      return;
    }
    if (!draft.trim()) {
      setCommentMsg("Write a comment before posting.");
      return;
    }
    setBusy(true);
    setCommentMsg("");
    try {
      await postChapterComment(id, chapterNumber, {
        body: draft.trim(),
        paragraph_index: activePara ?? -1,
      });
      setDraft("");
      await loadComments(chapterNumber);
      setCommentMsg("Comment posted.");
    } catch (err) {
      setCommentMsg(String(err.message || err));
    } finally {
      setBusy(false);
    }
  }

  async function onReact(label) {
    if (!getToken() || guest) {
      setMsg("Sign in to react");
      return;
    }
    try {
      const res = await toggleChapterReaction(id, chapterNumber, label);
      setReactionCounts((prev) => ({
        ...prev,
        [label]: res?.count ?? (prev[label] || 0),
      }));
      if (res?.selected) {
        setMine((m) => (m.includes(label) ? m : [...m, label]));
      } else {
        setMine((m) => m.filter((x) => x !== label));
      }
      await loadReactions(chapterNumber);
    } catch (err) {
      setMsg(String(err.message || err));
    }
  }

  async function onSaveList() {
    if (!getToken() || guest) {
      setMsg("Sign in to save");
      return;
    }
    try {
      await addToReadingList(Number(id));
      setMsg("Saved to reading list");
    } catch (err) {
      setMsg(String(err.message || err));
    }
  }

  async function finishStory() {
    if (!getToken() || guest) {
      setMsg("Sign in to save your reading progress");
      return;
    }
    try {
      await saveLibraryProgress({
        book_id: Number(id),
        reading_status: "Completed",
        updated_text: "Finished",
        chapters: chapters.length,
        last_chapter_number: chapterNumber,
        last_paragraph_index: Math.max(0, paragraphs.length - 1),
        chapters_read: chapters.length,
        primary_genre: book?.primary_genre || book?.genre || "",
      });
      setMsg("Story marked completed");
      navigate(`/stories/${id}`);
    } catch (err) {
      setMsg(String(err.message || err));
    }
  }

  function adjustFontSize(amount) {
    setFontSize((current) => {
      const next = Math.max(16, Math.min(26, current + amount));
      localStorage.setItem("novelhub_reader_font_size", String(next));
      return next;
    });
  }

  function toggleWarmPage() {
    setWarmPage((current) => {
      localStorage.setItem("novelhub_reader_warm_page", String(!current));
      return !current;
    });
  }

  const panelComments =
    activePara == null
      ? comments
      : comments.filter((c) => Number(c.paragraph_index) === Number(activePara));

  return (
    <div className="inkitt-reader">
      <div className="inkitt-reader-grid">
        <aside className="reader-actions">
          <button type="button" className="story-action-btn" onClick={onSaveList}>
            🔖 Add to Reading List
          </button>
          <Link className="story-action-btn story-action-primary" to={`/stories/${id}`}>
            Write a Review
          </Link>
          {msg ? <p className="meta side-msg">{msg}</p> : null}
          <div className="reader-font-tools">
            <span className="meta">Customize readability</span>
            <div className="font-btns">
              <button type="button" className="story-action-btn" onClick={() => adjustFontSize(-1)} aria-label="Decrease reading text size">A-</button>
              <button type="button" className="story-action-btn" onClick={() => adjustFontSize(1)} aria-label="Increase reading text size">A+</button>
              <button type="button" className={`story-action-btn ${warmPage ? "selected" : ""}`} onClick={toggleWarmPage} aria-pressed={warmPage}>Warm page</button>
            </div>
          </div>
        </aside>

        <article className={`reader-main ${warmPage ? "reader-main--warm" : ""}`}>
          <div className="reader-top-inline">
            <Link to={`/stories/${id}`} className="back-link">
              ← {book?.title || "Story"}
            </Link>
            <h1 className="chapter-heading">{chapter.title || `Chapter ${chapterNumber}`}</h1>
          </div>

          <nav className="reader-chapter-tabs" aria-label="Choose a chapter">
            {chapters.map((item, index) => {
              const locked = guest && !isChapterAllowedForGuest(index);
              const selected = String(item.id) === String(chapterId);
              return locked ? (
                <span className="reader-chapter-tab is-locked" key={item.id} aria-disabled="true">
                  {item.chapter_number ?? index + 1}
                </span>
              ) : (
                <Link
                  className={`reader-chapter-tab${selected ? " is-active" : ""}`}
                  key={item.id}
                  to={`/stories/${id}/chapters/${item.id}`}
                  aria-current={selected ? "page" : undefined}
                  title={item.title || `Chapter ${item.chapter_number ?? index + 1}`}
                >
                  {item.chapter_number ?? index + 1}
                </Link>
              );
            })}
          </nav>

          <div className="reader-paragraphs" style={{ "--reader-font-size": `${fontSize}px` }}>
            {paragraphs.length ? (
              paragraphs.map((p, i) => {
                const count = Number(paraCounts[i] || paraCounts[String(i)] || 0);
                return (
                  <div key={i} className="para-row">
                    <p className="para-text" data-reader-paragraph={i}>{p}</p>
                    <button
                      type="button"
                      className={`para-bubble ${count > 0 ? "has-comments" : ""}`}
                      onClick={() => openPara(i)}
                      title="Comments"
                    >
                      💬 {count > 0 ? count : 0}
                    </button>
                  </div>
                );
              })
            ) : (
              <p className="meta">Empty chapter.</p>
            )}
          </div>

          <div className="chapter-divider">〰</div>

          <section className="reactions-grid-wrap">
            <h3>Reactions</h3>
            <div className="reactions-grid">
              {REACTIONS.map((r) => {
                const count = Number(reactionCounts[r.label] || 0);
                const selected = mine.includes(r.label);
                return (
                  <button
                    key={r.label}
                    type="button"
                    className={`reaction-cell ${selected ? "selected" : ""}`}
                    onClick={() => onReact(r.label)}
                  >
                    <span className="reaction-emoji">{r.emoji}</span>
                    <span className="reaction-count">{count}</span>
                    <span className="reaction-label">{r.label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {nextLocked ? (
            <div className="guest-lock">
              <h3>Unlock the rest of this story</h3>
              <p>Sign in to read the next chapters.</p>
              <Link className="btn btn-primary" to="/login">
                Sign in
              </Link>
            </div>
          ) : null}

          <div className="reader-nav">
            {prev ? (
              <Link className="btn" to={`/stories/${id}/chapters/${prev.id}`}>
                ← Previous
              </Link>
            ) : (
              <span />
            )}
            {next && !nextLocked ? (
              <Link className="btn btn-primary" to={`/stories/${id}/chapters/${next.id}`}>
                Next →
              </Link>
            ) : (
              <button className="btn btn-primary" type="button" onClick={finishStory}>
                Finish story
              </button>
            )}
          </div>
        </article>

        <aside className="reader-chapters-side">
          <details className="chapters-dropdown" open>
            <summary>
              Chapters
              <span className="meta">
                {chapterNumber}. {chapter.title || `Chapter ${chapterNumber}`}
              </span>
            </summary>
            <ul className="chapter-list chapter-list--panel">
              {chapters.map((c, i) => {
                const locked = guest && !isChapterAllowedForGuest(i);
                return (
                  <li key={c.id} className={locked ? "chapter-locked" : String(c.id) === String(chapterId) ? "active-ch" : ""}>
                    {locked ? (
                      <span>
                        {c.chapter_number != null ? `${c.chapter_number}. ` : ""}
                        {c.title}
                      </span>
                    ) : (
                      <Link to={`/stories/${id}/chapters/${c.id}`}>
                        {c.chapter_number != null ? `${c.chapter_number}. ` : ""}
                        {c.title}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </details>
        </aside>
      </div>

      {/* Comments slide-over panel */}
      {panelOpen && (
        <div className="comments-panel" role="dialog">
          <div className="comments-panel-head">
            <h2>Comments</h2>
            <button type="button" className="auth-close" onClick={() => setPanelOpen(false)}>
              ×
            </button>
          </div>
          {activePara != null && paragraphs[activePara] && (
            <blockquote className="comment-context">{paragraphs[activePara]}</blockquote>
          )}
          <ul className="comment-thread">
            {panelComments.map((c) => (
              <li key={c.id}>
                <strong>{c.display_name || "Reader"}</strong>
                <p>{c.body}</p>
                <span className="meta">{c.created_at || ""}</span>
              </li>
            ))}
            {panelComments.length === 0 && <li className="meta">No comments on this paragraph yet.</li>}
          </ul>
          {!isStoryOwner ? <form className="comment-compose" onSubmit={submitComment}>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={guest ? "Sign in to write a comment…" : "Write a comment…"}
              disabled={guest}
            />
            <button type="submit" className="btn btn-primary" disabled={guest || busy}>
              Post
            </button>
          </form> : <p className="comment-form-status meta">You own this story. Reader comments appear here.</p>}
          {commentMsg ? <p className="comment-form-status meta" role="status">{commentMsg}</p> : null}
        </div>
      )}
    </div>
  );
}
