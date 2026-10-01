import { useState } from "react";
import { resolveAssetUrl } from "../api";

export default function WallPostCard({ post, canInteract, busy, onLike, onComment }) {
  const [commenting, setCommenting] = useState(false);
  const [draft, setDraft] = useState("");
  const name = post.display_name || post.sender_name || "Reader";
  const avatar = resolveAssetUrl(post.photo_url || post.sender_photo || "");
  const image = resolveAssetUrl(post.image_path || post.image_url || "");

  async function submitComment(event) {
    event.preventDefault();
    const body = draft.trim();
    if (!body || busy) return;
    if (await onComment?.(post, body)) {
      setDraft("");
      setCommenting(false);
    }
  }

  return (
    <article className="wall-post card-panel">
      <div className="wall-post-head">
        <span className="wall-post-avatar">
          {avatar ? <img src={avatar} alt="" /> : name.slice(0, 1).toUpperCase()}
        </span>
        <div className="wall-post-author">
          <strong>{name}</strong>
          <time>{post.created_at ? new Date(post.created_at).toLocaleString() : "A moment ago"}</time>
        </div>
      </div>
      <p className="wall-post-body">{post.body || post.message || ""}</p>
      {image ? <img className="wall-post-image" src={image} alt="" loading="lazy" /> : null}
      <div className="wall-post-actions">
        {canInteract ? (
          <button type="button" className={post.liked ? "is-active" : ""} aria-pressed={post.liked === true} disabled={busy} onClick={() => onLike?.(post)}>
            {post.liked ? "Liked" : "Like"} <span>{Number(post.likes || 0)}</span>
          </button>
        ) : <span>{Number(post.likes || 0)} likes</span>}
        {canInteract ? <button type="button" disabled={busy} onClick={() => setCommenting((value) => !value)}>{commenting ? "Cancel reply" : "Reply"}</button> : null}
      </div>
      {commenting ? (
        <form className="wall-post-reply" onSubmit={submitComment}>
          <label className="visually-hidden" htmlFor={`wall-reply-${post.id}`}>Write a reply</label>
          <textarea id={`wall-reply-${post.id}`} rows={2} maxLength={500} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Write a reply…" />
          <div><span>{draft.length}/500</span><button type="submit" className="btn btn-primary btn-sm" disabled={busy || !draft.trim()}>{busy ? "Posting…" : "Post reply"}</button></div>
        </form>
      ) : null}
    </article>
  );
}
