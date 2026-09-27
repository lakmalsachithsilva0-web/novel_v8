import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import BookCard from "../components/BookCard";
import {
  createReadingList,
  deleteLibraryEntry,
  deleteReadingList,
  getBookChapters,
  getLibrary,
  getReadingListDetail,
  getReadingLists,
  removeReadingListItem,
  resolveAssetUrl,
  updateLibraryEntry,
} from "../api";
import { isGuestUser } from "../utils/guest";

function itemsFrom(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.items)) return response.items;
  if (Array.isArray(response?.books)) return response.books;
  return [];
}

function isCompleted(entry) {
  const status = String(entry.reading_status || "").toLowerCase().trim();
  return /complete|finished|^done$|^history$/.test(status);
}

function progressOf(entry) {
  const total = Number(entry.chapters || 0);
  if (!total) return entry.reading_status ? 8 : 0;
  const lastChapter = Number(entry.last_chapter_number || 1);
  const paragraph = Number(entry.last_paragraph_index || 0);
  const position = Math.max(0, lastChapter - 1);
  const partial = paragraph > 0 ? Math.min(paragraph, 20) / 20 : .05;
  return Math.max(0, Math.min(100, Math.round(((position + partial) / total) * 100)));
}

export default function LibraryPage({ user }) {
  const guest = isGuestUser(user);
  const navigate = useNavigate();
  const [tab, setTab] = useState("ongoing");
  const [entries, setEntries] = useState([]);
  const [readingLists, setReadingLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [busyEntry, setBusyEntry] = useState(null);
  const [activeList, setActiveList] = useState(null);
  const [activeListItems, setActiveListItems] = useState([]);
  const [listBusy, setListBusy] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const loadId = useRef(0);

  useEffect(() => {
    const currentLoad = ++loadId.current;
    if (guest) {
      setEntries([]);
      setReadingLists([]);
      setLoading(false);
      return () => { loadId.current += 1; };
    }
    setLoading(true);
    setError("");
    Promise.allSettled([getLibrary(), getReadingLists()]).then(([libraryResult, listsResult]) => {
      if (currentLoad !== loadId.current) return;
      const errors = [];
      if (libraryResult.status === "fulfilled") setEntries(itemsFrom(libraryResult.value));
      else errors.push(`Reading progress could not load: ${libraryResult.reason?.message || "Please try again."}`);
      if (listsResult.status === "fulfilled") setReadingLists(itemsFrom(listsResult.value));
      else errors.push(`Reading lists could not load: ${listsResult.reason?.message || "Please try again."}`);
      setError(errors.join(" "));
      setLoading(false);
    });
    return () => { loadId.current += 1; };
  }, [guest, user?.user_id, user?.id, reloadKey]);

  const ongoing = useMemo(() => entries.filter((entry) => !isCompleted(entry)), [entries]);
  const completed = useMemo(() => entries.filter(isCompleted), [entries]);

  async function onCreateList(event) {
    event.preventDefault();
    const name = newName.trim();
    if (!name || creating) return;
    setCreating(true);
    setNotice("");
    try {
      await createReadingList({ name, sort_order: readingLists.length + 1 });
      const response = await getReadingLists();
      setReadingLists(itemsFrom(response));
      setNewName("");
      setNotice(`Created “${name}”`);
    } catch (err) {
      setNotice(err.message || "Your list could not be created. Please try again.");
    } finally {
      setCreating(false);
    }
  }

  async function resumeEntry(entry) {
    const story = entry.book || entry;
    try {
      const response = await getBookChapters(story.id);
      const chapters = response?.items || [];
      const wanted = Number(entry.last_chapter_number || 1);
      const chapter = chapters.find((item) => Number(item.chapter_number) === wanted) || chapters[0];
      if (chapter?.id) {
        navigate(`/stories/${story.id}/chapters/${chapter.id}`);
        return;
      }
    } catch {
      // Fall back to the story page if a chapter cannot be resumed directly.
    }
    navigate(`/stories/${story.id}`);
  }

  async function setEntryStatus(entry, nextStatus) {
    setBusyEntry(entry.id);
    setNotice("");
    try {
      await updateLibraryEntry(entry.id, { reading_status: nextStatus });
      setEntries((current) => current.map((item) => item.id === entry.id ? { ...item, reading_status: nextStatus } : item));
      setNotice(nextStatus === "Completed" ? "Moved to Completed." : "Moved back to Ongoing.");
    } catch (err) {
      setNotice(err.message || "Could not update this story. Please try again.");
    } finally {
      setBusyEntry(null);
    }
  }

  async function onRemoveEntry(entry) {
    const story = entry.book || entry;
    if (!window.confirm(`Remove “${story.title || "this story"}” from your library?`)) return;
    setBusyEntry(entry.id);
    try {
      await deleteLibraryEntry(entry.id);
      setEntries((current) => current.filter((item) => item.id !== entry.id));
      setNotice("Story removed from your library.");
    } catch (err) {
      setNotice(err.message || "Could not remove this story.");
    } finally {
      setBusyEntry(null);
    }
  }

  async function openList(list) {
    setListBusy(true);
    setActiveList(list);
    setActiveListItems([]);
    try {
      const detail = await getReadingListDetail(list.id);
      setActiveList(detail);
      setActiveListItems(detail?.items || []);
    } catch (err) {
      setNotice(err.message || "This reading list could not be opened.");
    } finally {
      setListBusy(false);
    }
  }

  async function removeListItem(item) {
    try {
      await removeReadingListItem(activeList.id, item.id);
      setActiveListItems((current) => current.filter((currentItem) => currentItem.id !== item.id));
      setReadingLists((current) => current.map((list) => list.id === activeList.id ? { ...list, story_count: Math.max(0, Number(list.story_count || 0) - 1) } : list));
    } catch (err) {
      setNotice(err.message || "Could not remove this story from the list.");
    }
  }

  async function removeList(list) {
    if (!window.confirm(`Delete the reading list “${list.name}”?`)) return;
    try {
      await deleteReadingList(list.id);
      setReadingLists((current) => current.filter((item) => item.id !== list.id));
      setNotice("Reading list deleted.");
      setActiveList(null);
    } catch (err) {
      setNotice(err.message || "Could not delete this reading list.");
    }
  }

  if (guest) {
    return (
      <div className="container page library-page library-guest-page">
        <section className="guest-lock card-panel">
          <span className="eyebrow">YOUR PERSONAL BOOKSHELF</span>
          <h1>Keep your stories close</h1>
          <p className="meta">Sign in to save stories, track your reading, and build collections that sync with the NovelHub app.</p>
          <div className="library-guest-actions">
            <Link className="btn btn-primary" to="/login">Sign in</Link>
            <Link className="btn btn-ghost" to="/">Browse stories</Link>
          </div>
        </section>
      </div>
    );
  }

  const selectedEntries = tab === "completed" ? completed : ongoing;

  return (
    <div className="container page library-page library-page--full">
      <div className="library-hero-glow" aria-hidden="true" />
      <header className="library-heading">
        <div>
          <span className="eyebrow">YOUR READING SPACE</span>
          <h1>My library</h1>
          <p className="meta">Continue a story, revisit a favorite, or shape your next reading list.</p>
        </div>
        <div className="library-heading-actions"><span className="library-heading-note"><i>✧</i><span>Every shelf holds a new beginning.</span></span><Link className="btn btn-primary" to="/">Find a story <span aria-hidden="true">→</span></Link></div>
      </header>

      <section className="library-overview" aria-label="Library totals">
        <div><span className="library-overview-icon" aria-hidden="true">↗</span><strong>{loading ? "—" : ongoing.length}</strong><span>Ongoing reads</span></div>
        <div><span className="library-overview-icon" aria-hidden="true">▤</span><strong>{loading ? "—" : readingLists.length}</strong><span>Reading lists</span></div>
        <div><span className="library-overview-icon" aria-hidden="true">✦</span><strong>{loading ? "—" : completed.length}</strong><span>Completed reads</span></div>
      </section>

      <div className="profile-tabs library-tabs" role="tablist" aria-label="Library sections">
        <button type="button" role="tab" aria-selected={tab === "ongoing"} className={`profile-tab ${tab === "ongoing" ? "active" : ""}`} onClick={() => setTab("ongoing")}>
          Ongoing <span className="tab-count">{ongoing.length}</span>
        </button>
        <button type="button" role="tab" aria-selected={tab === "lists"} className={`profile-tab ${tab === "lists" ? "active" : ""}`} onClick={() => setTab("lists")}>
          Reading lists <span className="tab-count">{readingLists.length}</span>
        </button>
        <button type="button" role="tab" aria-selected={tab === "completed"} className={`profile-tab ${tab === "completed" ? "active" : ""}`} onClick={() => setTab("completed")}>
          Completed <span className="tab-count">{completed.length}</span>
        </button>
      </div>

      {error ? <div className="error-banner" role="alert">{error} <button type="button" className="btn btn-ghost btn-sm" onClick={() => setReloadKey((key) => key + 1)}>Retry</button></div> : null}
      {notice ? <p className="library-notice" role="status">{notice}</p> : null}
      {loading ? <div className="library-loading" aria-live="polite"><span className="library-loading-orbit" />Opening your shelves…</div> : null}

      {tab !== "lists" ? (
        <section aria-label={tab === "completed" ? "Completed stories" : "Ongoing stories"}>
          {!loading && selectedEntries.length > 0 ? <div className="library-shelf-heading"><div><span className="eyebrow">{tab === "completed" ? "THE STORIES YOU FINISHED" : "PICK UP THE THREAD"}</span><h2>{tab === "completed" ? "Your completed stories" : "Continue reading"}</h2></div><span>{selectedEntries.length} {selectedEntries.length === 1 ? "story" : "stories"}</span></div> : null}
          {!loading && selectedEntries.length > 0 ? (
            <div className="library-story-grid">
              {selectedEntries.map((entry) => {
                const story = entry.book || entry;
                const progress = progressOf(entry);
                const completedEntry = isCompleted(entry);
                return (
                  <article className={`library-story-card card-panel ${completedEntry ? "is-completed" : ""}`} key={entry.id || story.id}>
                    <BookCard book={story} variant="grid" />
                    {!completedEntry ? (
                      <div className="library-progress" aria-label={`${progress}% read`}>
                        <div><span>Reading progress</span><strong>{progress}%</strong></div>
                        <div className="library-progress-track"><span style={{ width: `${progress}%` }} /></div>
                      </div>
                    ) : null}
                    <div className="library-story-actions">
                      {!completedEntry ? (
                        <button type="button" className="btn btn-primary btn-sm" onClick={() => resumeEntry(entry)}>Continue reading</button>
                      ) : (
                        <Link className="btn btn-primary btn-sm" to={`/stories/${story.id}`}>Read again</Link>
                      )}
                      <button type="button" className="btn btn-ghost btn-sm" disabled={busyEntry === entry.id} onClick={() => setEntryStatus(entry, completedEntry ? "Reading" : "Completed")}>
                        {busyEntry === entry.id ? "Saving…" : completedEntry ? "Move to ongoing" : "Mark completed"}
                      </button>
                      <button type="button" className="library-remove" disabled={busyEntry === entry.id} onClick={() => onRemoveEntry(entry)}>Remove</button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : null}
          {!loading && !error && selectedEntries.length === 0 ? (
            <div className="library-empty card-panel">
              <span className="library-empty-mark">{tab === "completed" ? "FINISHED" : "YOUR NEXT CHAPTER"}</span>
              <h2>{tab === "completed" ? "Your finished stories will live here." : "Every great read starts somewhere."}</h2>
              <p className="meta">{tab === "completed" ? "Finish a story or mark it completed to add it to this shelf." : "Open a story and start reading. Your progress will appear here."}</p>
              <Link className="btn btn-primary" to="/">Browse stories</Link>
            </div>
          ) : null}
        </section>
      ) : (
        <section className="lists-panel" aria-label="Reading lists">
          <form className="create-list-form card-panel" onSubmit={onCreateList}>
            <div className="create-list-intro">
              <span className="eyebrow">CURATE YOUR NEXT READ</span>
              <h2>Create a reading list</h2>
              <p className="meta">Group stories by mood, genre, or the ones you want to read next.</p>
            </div>
            <div className="create-list-row">
              <label className="visually-hidden" htmlFor="new-reading-list-name">Reading list name</label>
              <input id="new-reading-list-name" value={newName} onChange={(event) => setNewName(event.target.value)} placeholder="For example, Cozy weekend reads" maxLength={80} required />
              <button type="submit" className="btn btn-primary" disabled={creating || !newName.trim()}>{creating ? "Creating…" : "Create list"}</button>
            </div>
          </form>
          {!loading && readingLists.length > 0 ? (
            <div className="rl-grid">
              {readingLists.map((list) => {
                const cover = resolveAssetUrl(list.cover_path || list.covers?.[0] || "");
                return (
                  <article key={list.id} className="rl-user-card card-panel">
                    <button type="button" className="rl-open-button" onClick={() => openList(list)} aria-label={`Open ${list.name}`}>
                      <div className="rl-user-cover">{cover ? <img src={cover} alt="" loading="lazy" /> : <div className="rl-user-cover-fallback">LIST</div>}</div>
                      <div className="rl-user-card-copy"><h3>{list.name}</h3><p className="meta">{list.story_count ?? 0} stories</p></div>
                    </button>
                    <button type="button" className="library-remove" onClick={() => removeList(list)}>Delete list</button>
                  </article>
                );
              })}
            </div>
          ) : null}
          {!loading && !error && readingLists.length === 0 ? <p className="library-list-empty meta">Your first list is one good idea away. Create one above.</p> : null}
        </section>
      )}

      {activeList ? (
        <div className="library-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setActiveList(null); }}>
          <section className="library-list-modal card-panel" role="dialog" aria-modal="true" aria-labelledby="active-list-title">
            <button className="library-modal-close" type="button" onClick={() => setActiveList(null)} aria-label="Close list">×</button>
            <span className="eyebrow">READING LIST</span>
            <h2 id="active-list-title">{activeList.name}</h2>
            <p className="meta">{activeListItems.length} stories</p>
            {listBusy ? <p className="meta">Loading stories…</p> : null}
            {!listBusy && activeListItems.length ? (
              <div className="library-list-items">
                {activeListItems.map((item) => (
                  <div className="library-list-item" key={item.id}>
                    <BookCard book={{ ...item, id: item.book_id }} variant="mini" />
                    <Link to={`/stories/${item.book_id}`} onClick={() => setActiveList(null)}>{item.title}</Link>
                    <button type="button" className="library-remove" onClick={() => removeListItem(item)}>Remove</button>
                  </div>
                ))}
              </div>
            ) : null}
            {!listBusy && activeListItems.length === 0 ? <p className="meta">This list is empty. Add a story from its story page.</p> : null}
          </section>
        </div>
      ) : null}

    </div>
  );
}
