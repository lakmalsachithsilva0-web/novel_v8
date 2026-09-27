import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import BookCard from "../components/BookCard";
import {
  addToReadingList,
  followAuthor,
  getAuthorFollow,
  getBook,
  getBookComments,
  getBookChapters,
  getBookLike,
  getBookReviews,
  getBootstrap,
  getChapterComments,
  getChapterReactions,
  getToken,
  postChapterComment,
  postBookComment,
  reportBook,
  resolveAssetUrl,
  toggleBookLike,
  toggleChapterReaction,
  unfollowAuthor,
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

export default function StoryPage({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const guest = isGuestUser(user);

  const [book, setBook] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [bookComments, setBookComments] = useState([]);
  const [recs, setRecs] = useState([]);
  const [liked, setLiked] = useState(false);
  const [following, setFollowing] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [listOpen, setListOpen] = useState(false);
  const [chOpen, setChOpen] = useState(true);
  const [authorOpen, setAuthorOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("Spam or misleading content");
  const [reportBusy, setReportBusy] = useState(false);
  const [fontSize, setFontSize] = useState(() => {
    const saved = Number(localStorage.getItem("novelhub_reader_font_size"));
    return saved >= 16 && saved <= 26 ? saved : 19;
  });
  const [warmPage, setWarmPage] = useState(() => localStorage.getItem("novelhub_reader_warm_page") === "true");

  // Paragraph comments on first readable chapter (Inkitt story page layout)
  const [comments, setComments] = useState([]);
  const [paraCounts, setParaCounts] = useState({});
  const [activePara, setActivePara] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [reactionCounts, setReactionCounts] = useState({});
  const [mine, setMine] = useState([]);
  const [busy, setBusy] = useState(false);
  const [bookCommentDraft, setBookCommentDraft] = useState("");
  const [bookCommentBusy, setBookCommentBusy] = useState(false);
  const [chapterCommentMsg, setChapterCommentMsg] = useState("");
  const [bookCommentMsg, setBookCommentMsg] = useState("");

  const firstChapter = chapters[0] || null;
  const chapterNumber = Number(firstChapter?.chapter_number) || 1;

  const paragraphs = useMemo(() => {
    const content = firstChapter?.content || "";
    return String(content)
      .split(/\n\n+/)
      .map((p) => p.trim())
      .filter(Boolean);
  }, [firstChapter]);

  async function loadComments(num) {
    try {
      const res = await getChapterComments(id, num);
      setComments(res?.items || []);
      setParaCounts(res?.paragraph_counts || {});
      setChapterCommentMsg("");
    } catch (err) {
      setComments([]);
      setParaCounts({});
      setChapterCommentMsg(`Chapter comments could not load: ${err.message || "check your connection and try again."}`);
    }
  }

  async function loadReactions(num) {
    try {
      const res = await getChapterReactions(id, num);
      setReactionCounts(res?.counts || {});
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
        const [b, ch, rev, boot, bookDiscussion] = await Promise.all([
          getBook(id),
          getBookChapters(id),
          getBookReviews(id).then((r) => r?.items || r || []).catch(() => []),
          getBootstrap().catch(() => null),
          getBookComments(id).then((r) => r?.items || []).catch(() => []),
        ]);
        if (cancelled) return;
        setBook(b);
        const items = ch?.items || [];
        setChapters(items);
        setReviews(Array.isArray(rev) ? rev : []);
        setBookComments(Array.isArray(bookDiscussion) ? bookDiscussion : []);

        // recommendations: other books excluding current
        const pool = [];
        const add = (arr) => (arr || []).forEach((x) => x?.id && pool.push(x));
        if (boot) {
          add(boot.trending);
          add(boot.featured ? [boot.featured] : []);
          add(boot.featured_book ? [boot.featured_book] : []);
          add(boot.discover_books);
          add(boot.recently_completed);
          add(boot.recently_updated);
        }
        const seen = new Set([String(id)]);
        const unique = [];
        for (const x of pool) {
          if (seen.has(String(x.id))) continue;
          seen.add(String(x.id));
          unique.push(x);
          if (unique.length >= 9) break;
        }
        setRecs(unique);

        if (items[0]) {
          const num = Number(items[0].chapter_number) || 1;
          await loadComments(num);
          await loadReactions(num);
        }

        if (getToken() && !isGuestUser(user)) {
          try {
            const like = await getBookLike(id);
            if (!cancelled) setLiked(!!like?.liked || !!like?.is_liked);
          } catch {
            /* optional */
          }
          const authorId = b?.author_id || b?.user_id;
          if (authorId) {
            try {
              const f = await getAuthorFollow(authorId);
              if (!cancelled) setFollowing(!!f?.following);
            } catch {
              /* optional */
            }
          }
        }
      } catch (e) {
        if (!cancelled) setError(String(e.message || e));
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user]);

  async function onLike() {
    if (!getToken() || guest) {
      setMsg("Sign in to like");
      return;
    }
    try {
      const res = await toggleBookLike(id, liked);
      const nowLiked =
        res?.liked === true || res?.is_liked === true || (res?.liked !== false && !liked);
      setLiked(nowLiked);
      setMsg(nowLiked ? "Liked" : "Unliked");
    } catch (e) {
      setMsg(String(e.message || e));
    }
  }

  async function onFollow() {
    if (!getToken() || guest) {
      setMsg("Sign in to follow");
      return;
    }
    const authorId = book?.author_id || book?.user_id;
    if (!authorId) {
      setMsg("Author profile not linked");
      return;
    }
    try {
      if (following) {
        await unfollowAuthor(authorId);
        setFollowing(false);
      } else {
        await followAuthor(authorId);
        setFollowing(true);
      }
    } catch (e) {
      setMsg(String(e.message || e));
    }
  }

  async function onAddList() {
    if (!getToken() || guest) {
      setMsg("Sign in to save");
      return;
    }
    try {
      await addToReadingList(Number(id));
      setMsg("Saved to your reading list.");
      setListOpen(false);
    } catch (e) {
      setMsg(String(e.message || e));
    }
  }

  async function submitReport(event) {
    event.preventDefault();
    if (!getToken() || guest) {
      setMsg("Sign in to report a story.");
      setReportOpen(false);
      return;
    }
    setReportBusy(true);
    try {
      const result = await reportBook(id, reportReason);
      setMsg(result?.self ? "You cannot report your own story." : result?.already_reported ? "You have already reported this story." : "Report sent to the moderation team.");
      setReportOpen(false);
    } catch (e) {
      setMsg(String(e.message || e));
    } finally {
      setReportBusy(false);
    }
  }

  async function copyStoryLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setMsg("Story link copied.");
    } catch {
      setMsg("Your browser could not copy the link. Copy it from the address bar.");
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

  function openPara(i) {
    setActivePara(i);
    setPanelOpen(true);
  }

  async function submitComment(e) {
    e.preventDefault();
    if (!getToken() || guest) {
      setChapterCommentMsg("Sign in to comment.");
      return;
    }
    if (!draft.trim()) {
      setChapterCommentMsg("Write a comment before posting.");
      return;
    }
    setBusy(true);
    setChapterCommentMsg("");
    try {
      await postChapterComment(id, chapterNumber, {
        body: draft.trim(),
        paragraph_index: activePara ?? -1,
      });
      setDraft("");
      await loadComments(chapterNumber);
      setChapterCommentMsg("Chapter comment posted.");
    } catch (err) {
      setChapterCommentMsg(String(err.message || err));
    } finally {
      setBusy(false);
    }
  }

  async function submitBookComment(e) {
    e.preventDefault();
    const body = bookCommentDraft.trim();
    if (!getToken() || guest) {
      setBookCommentMsg("Sign in to join the story discussion.");
      return;
    }
    if (!body) {
      setBookCommentMsg("Write a comment before posting.");
      return;
    }
    if (bookCommentBusy) return;
    setBookCommentBusy(true);
    setBookCommentMsg("");
    try {
      await postBookComment(id, body);
      const response = await getBookComments(id);
      setBookComments(response?.items || []);
      setBookCommentDraft("");
      setBookCommentMsg("Story comment posted.");
    } catch (err) {
      setBookCommentMsg(String(err.message || err));
    } finally {
      setBookCommentBusy(false);
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
      if (res?.selected) setMine((m) => (m.includes(label) ? m : [...m, label]));
      else setMine((m) => m.filter((x) => x !== label));
      await loadReactions(chapterNumber);
    } catch (err) {
      setMsg(String(err.message || err));
    }
  }

  if (error) return <div className="container page error-banner">{error}</div>;
  if (!book) return <div className="container page">Loading…</div>;

  const isStoryOwner = !guest && Number(book.user_id || book.author_user_id) === Number(user?.user_id || user?.id);
  const cover = resolveAssetUrl(book.cover_path || book.coverPath || "");
  const tags = [book.genre, book.primary_genre, book.secondary_genre, book.section_name]
    .filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i);
  const rating = book.rating != null ? Number(book.rating).toFixed(1) : "—";
  const nextChapter = chapters[1];
  const panelComments =
    activePara == null
      ? comments
      : comments.filter((c) => Number(c.paragraph_index) === Number(activePara));

  return (
    <div className="story-inkitt">
      {/* Hero */}
      <div
        className="story-hero"
        style={{
          backgroundImage: cover
            ? `linear-gradient(180deg, rgba(11,10,18,0.25), rgba(11,10,18,0.96) 76%), url(${cover})`
            : undefined,
        }}
      >
        <div className="story-hero-inner">
          {cover ? (
            <img className="story-hero-cover" src={cover} alt="" />
          ) : (
            <div
              className="story-hero-cover story-hero-cover--ph"
              style={{ background: book.accent_hex || "#1f2937" }}
            >
              {(book.title || "?")[0]}
            </div>
          )}
        </div>
      </div>

      <div className="story-inkitt-body">
        {/* Left rail */}
        <aside className="story-left-rail">
          <button type="button" className={`story-action-btn ${liked ? "liked" : ""}`} onClick={onLike}>
            {liked ? "♥ Liked" : "♡ Like"}
          </button>

          <div className="list-dropdown-wrap">
            <button type="button" className="story-action-btn" onClick={() => setListOpen((v) => !v)}>
              🔖 Add to Reading List
            </button>
            {listOpen && (
              <div className="list-dropdown">
                <div className="list-dropdown-title">Save this story</div>
                <button type="button" onClick={onAddList}>Save to reading list</button>
                <Link className="list-create" to="/library" onClick={() => setListOpen(false)}>Manage reading lists</Link>
              </div>
            )}
          </div>

          <Link className="story-action-btn story-action-primary" to={`/stories/${id}/review`}>
            Write a Review
          </Link>

          {msg ? <p className="meta side-msg">{msg}</p> : null}

          <div className="share-block">
            <span className="meta">Share with your friends</span>
            <div className="share-row">
              <button type="button" className="share-ico" title="Facebook" onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, "_blank", "noopener,noreferrer")}>
                f
              </button>
              <button type="button" className="share-ico" title="Share on X" onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(book.title || "A story on NovelHub")}`, "_blank", "noopener,noreferrer")}>
                𝕏
              </button>
              <button type="button" className="share-ico" title="Copy link" onClick={copyStoryLink}>
                🔗
              </button>
            </div>
          </div>

          <button type="button" className="story-action-btn muted" onClick={() => guest ? navigate("/login") : setReportOpen(true)}>
            Report
          </button>

          <div className="readability-block">
            <span className="meta">Customize readability</span>
            <div className="readability-row">
  <button type="button" className="story-action-btn compact" onClick={() => adjustFontSize(-1)} aria-label="Decrease reading text size">A-</button>
  <button type="button" className="story-action-btn compact" onClick={() => adjustFontSize(1)} aria-label="Increase reading text size">A+</button>
  <button type="button" className={`story-action-btn compact ${warmPage ? "selected" : ""}`} onClick={toggleWarmPage} aria-pressed={warmPage}>Warm</button>
</div>
          </div>
        </aside>

        {/* Center */}
        <main className="story-center">
          <h1 className="story-title">{book.title}</h1>

          <div className="story-author-row">
            <button type="button" className="author-avatar" onClick={() => setAuthorOpen(true)}>
              {(book.author || "A")[0]}
            </button>
            <div>
              <div className="author-name-line">
                <button type="button" className="author-name-btn" onClick={() => setAuthorOpen(true)}>
                  {book.author || "Unknown"}
                </button>
                <button type="button" className="btn-follow-sm" onClick={onFollow}>
                  {following ? "Following" : "Follow +"}
                </button>
              </div>
              <p className="meta">Author</p>
            </div>
          </div>

          <div className="tag-row">
            {tags.map((t) => (
              <Link key={t} className="tag-chip" to={`/genres/${encodeURIComponent(t)}`}>
                {t}
              </Link>
            ))}
            {tags.length > 5 && <span className="tag-chip">+ More</span>}
          </div>
          <p className="meta rights-line">All Rights Reserved ©</p>

          <h2 className="section-title summary-heading">Summary</h2>
          <p className="summary-text">{book.description || "No summary yet."}</p>

          <div className="story-meta-grid">
            <div>
              <span className="meta-label">Genre</span>
              <strong className="meta-teal">{book.genre || book.primary_genre || "—"}</strong>
            </div>
            <div>
              <span className="meta-label">Status</span>
              <strong>{book.status_text || (book.is_completed ? "Complete" : "Ongoing")}</strong>
            </div>
            <div>
              <span className="meta-label">Rating</span>
              <strong className="meta-teal">
                ★ {rating}
                {reviews.length ? ` ${reviews.length} reviews` : ""}
              </strong>
            </div>
            <div>
              <span className="meta-label">Author</span>
              <strong className="meta-teal">{book.author || "—"}</strong>
            </div>
            <div>
              <span className="meta-label">Chapters</span>
              <strong>{chapters.length}</strong>
            </div>
            <div>
              <span className="meta-label">Age Rating</span>
              <strong>{book.audience || "All Ages"}</strong>
            </div>
          </div>

          {/* Chapter 1 body with paragraph bubbles */}
          {firstChapter && (
            <section className={`story-chapter-inline ${warmPage ? "story-chapter-inline--warm" : ""}`} style={{ "--reader-font-size": `${fontSize}px` }}>
              <h2 className="chapter-inline-title">
                {firstChapter.title || `Chapter ${chapterNumber}`}
              </h2>
              {paragraphs.length ? (
                paragraphs.map((p, i) => {
                  const count = Number(paraCounts[i] || paraCounts[String(i)] || 0);
                  return (
                    <div key={i} className="para-row">
                      <p className="para-text">{p}</p>
                      <button
                        type="button"
                        className={`para-bubble ${count > 0 ? "has-comments" : ""}`}
                        onClick={() => openPara(i)}
                        title="Comments"
                      >
                        💬 {count}
                      </button>
                    </div>
                  );
                })
              ) : (
                <p className="meta">
                  No chapter text yet.{" "}
                  {firstChapter.id && (
                    <Link to={`/stories/${id}/chapters/${firstChapter.id}`}>Open chapter page</Link>
                  )}
                </p>
              )}

              {nextChapter && (
                <div className="next-chapter-wrap">
                  {guest && !isChapterAllowedForGuest(1) ? (
                    <Link className="btn btn-primary next-chapter-btn" to="/login">
                      Sign in for next chapter
                    </Link>
                  ) : (
                    <Link
                      className="btn btn-primary next-chapter-btn"
                      to={`/stories/${id}/chapters/${nextChapter.id}`}
                    >
                      Next Chapter
                    </Link>
                  )}
                </div>
              )}

              <section className="reactions-grid-wrap">
                <h3>Let {book.author || "the author"} know what you thought about this chapter!</h3>
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

              <section className="chapter-comments-inline">
                <h3 className="meta">Chapter discussion</h3>
                <ul className="comment-thread">
                  {comments
                    .filter((c) => Number(c.paragraph_index) < 0 || c.paragraph_index == null)
                    .slice(0, 10)
                    .map((c) => (
                      <li key={c.id}>
                        <div className="comment-avatar">{(c.display_name || "R")[0]}</div>
                        <div>
                          <strong>{c.display_name || "Reader"}</strong>
                          <p>{c.body}</p>
                          <span className="meta">{c.created_at || ""}</span>
                        </div>
                      </li>
                    ))}
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
                </form> : <p className="comment-form-status meta">You own this story. Reader chapter comments appear here.</p>}
                {chapterCommentMsg ? <p className="comment-form-status meta" role="status">{chapterCommentMsg}</p> : null}
              </section>
            </section>
          )}

          <section className="book-comments-section" aria-labelledby="book-comments-title">
            <div className="book-comments-heading">
              <div><span className="eyebrow">THE WHOLE STORY</span><h2 id="book-comments-title">Story discussion <span>({bookComments.length})</span></h2></div>
            </div>
            <ul className="comment-thread book-comment-thread">
              {bookComments.map((comment) => (
                <li key={comment.id}>
                  <div className="comment-avatar">{(comment.display_name || "R").slice(0, 1).toUpperCase()}</div>
                  <div><strong>{comment.display_name || "Reader"}</strong><p>{comment.body}</p><span className="meta">{comment.created_at || ""}</span></div>
                </li>
              ))}
              {!bookComments.length ? <li className="meta">Start a conversation about this story.</li> : null}
            </ul>
            {!isStoryOwner ? <form className="comment-compose book-comment-compose" onSubmit={submitBookComment}>
              <input value={bookCommentDraft} onChange={(event) => setBookCommentDraft(event.target.value)} maxLength={4000} placeholder={guest ? "Sign in to join the story discussion…" : "Share a thought about this story…"} disabled={guest || bookCommentBusy} />
              <button type="submit" className="btn btn-primary" disabled={guest || bookCommentBusy || !bookCommentDraft.trim()}>{bookCommentBusy ? "Posting…" : "Post comment"}</button>
            </form> : <p className="comment-form-status meta">You own this story. Reader story comments appear here.</p>}
            {bookCommentMsg ? <p className="comment-form-status meta" role="status">{bookCommentMsg}</p> : null}
          </section>

          <section className="reviews-block">
            <h2 className="section-title">Reviews ({reviews.length})</h2>
            <ul className="review-list">
              {reviews.slice(0, 6).map((r) => (
                <li key={r.id || r.created_at}>
                  <strong>
                    ★ {r.rating} · {r.display_name || r.username || "Reader"}
                  </strong>
                  <p>{r.comment || r.body || r.title || ""}</p>
                </li>
              ))}
              {!reviews.length && <li className="meta">No reviews yet.</li>}
            </ul>
          </section>

          {/* Further recommendations */}
          {recs.length > 0 && (
            <section className="further-recs">
              <h2 className="section-title">Further recommendations</h2>
              <div className="recs-grid">
                {recs.slice(0, 6).map((b) => (
                  <div key={b.id} className="rec-card">
                    <BookCard book={b} variant="shelf" />
                    <Link className="read-now" to={`/stories/${b.id}`}>
                      Read Now
                    </Link>
                  </div>
                ))}
              </div>
              <div className="more-recs-wrap">
                <Link className="btn more-recs-btn" to="/">
                  More Recommendations
                </Link>
              </div>
            </section>
          )}
        </main>

        {/* Right chapters */}
        <aside className="story-right-rail">
          <div className="chapters-panel">
            <button type="button" className="chapters-panel-head" onClick={() => setChOpen((v) => !v)}>
              <span>Chapters</span>
              <span className="meta">
                {firstChapter
                  ? `${chapterNumber} ${firstChapter.title || "Chapter 1"}`
                  : "—"}{" "}
                ▾
              </span>
            </button>
            {chOpen && (
              <ul className="chapter-list chapter-list--panel">
                {chapters.map((c, i) => {
                  const locked = guest && !isChapterAllowedForGuest(i);
                  return (
                    <li key={c.id} className={locked ? "chapter-locked" : i === 0 ? "active-ch" : ""}>
                      {locked ? (
                        <span>
                          {c.chapter_number != null ? `${c.chapter_number} ` : ""}
                          {c.title} 🔒
                        </span>
                      ) : (
                        <Link to={`/stories/${id}/chapters/${c.id}`}>
                          {c.chapter_number != null ? `${c.chapter_number} ` : ""}
                          {c.title}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>
      </div>

      {/* Footer collections strip */}
      <footer className="story-footer-strip">
        <div className="story-footer-inner">
          <div>
            <h4>GALATEA STORIES</h4>
            <Link to="/galatea">Explore Galatea</Link>
          </div>
          <div>
            <h4>NEWEST COLLECTIONS</h4>
            <Link to="/genres/Romance">Romance</Link>
            <Link to="/genres/Fantasy">Fantasy</Link>
            <Link to="/genres/Thriller">Thriller</Link>
          </div>
          <div>
            <h4>POPULAR COLLECTIONS</h4>
            <Link to="/genres/Love">Love</Link>
            <Link to="/genres/Dark">Dark</Link>
            <Link to="/">More</Link>
          </div>
          <div>
            <h4>FOR AUTHORS</h4>
            <Link to="/write">Submit Your Story</Link>
            <Link to="/contests">Writing Contests</Link>
          </div>
        </div>
      </footer>

      {/* Comments slide-over */}
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
          <div className="reactions-grid reactions-grid--panel">
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
          <ul className="comment-thread">
            {panelComments.map((c) => (
              <li key={c.id}>
                <strong>{c.display_name || "Reader"}</strong>
                <p>{c.body}</p>
                <span className="meta">{c.created_at || ""}</span>
              </li>
            ))}
            {panelComments.length === 0 && (
              <li className="meta">No comments on this paragraph yet.</li>
            )}
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
          </form> : <p className="comment-form-status meta">You own this story. Reader paragraph comments appear here.</p>}
        </div>
      )}

      {/* About author modal */}
      {authorOpen && (
        <div className="author-modal-backdrop" onClick={() => setAuthorOpen(false)}>
          <div className="author-modal" onClick={(e) => e.stopPropagation()}>
            <div className="comments-panel-head">
              <h2>About the Author</h2>
              <button type="button" className="auth-close" onClick={() => setAuthorOpen(false)}>
                ×
              </button>
            </div>
            <p className="meta">Get new release updates, news and more!</p>
            <div className="author-modal-row">
              <div className="author-avatar lg">{(book.author || "A")[0]}</div>
              <div>
                <strong>{book.author}</strong>
              </div>
              <button type="button" className="btn btn-primary" onClick={onFollow}>
                {following ? "Following" : "Follow +"}
              </button>
            </div>
            {(book.author_id || book.user_id) && (
              <Link className="meta" to={`/authors/${book.author_id || book.user_id}`} onClick={() => setAuthorOpen(false)}>
                View profile →
              </Link>
            )}
          </div>
        </div>
      )}

      {reportOpen && (
        <div className="modal-backdrop" role="presentation" onClick={() => setReportOpen(false)}>
          <section className="modal-card story-report-dialog" role="dialog" aria-modal="true" aria-labelledby="story-report-title" onClick={(event) => event.stopPropagation()}>
            <div className="modal-head">
              <h2 id="story-report-title">Report this story</h2>
              <button type="button" className="auth-close" onClick={() => setReportOpen(false)} aria-label="Close report dialog">X</button>
            </div>
            <p className="meta">Tell the moderation team what concerns you. Reports are reviewed and may affect story availability.</p>
            <form onSubmit={submitReport}>
              <label className="story-report-label" htmlFor="story-report-reason">Reason</label>
              <select id="story-report-reason" value={reportReason} onChange={(event) => setReportReason(event.target.value)}>
                <option>Spam or misleading content</option>
                <option>Harassment or hateful content</option>
                <option>Copyright concern</option>
                <option>Unsafe or inappropriate content</option>
                <option>Other</option>
              </select>
              {msg ? <p className="meta" role="status">{msg}</p> : null}
              <div className="modal-actions">
                <button type="button" className="btn" onClick={() => setReportOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={reportBusy}>{reportBusy ? "Sending..." : "Send report"}</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
