"""
Idempotent catalog health on every backend start:
- Min 3 chapters per public book (chapters.story_id only)
- Ensure tag rows exist for book genres
- Link book_tags so hashtag pages show real stories
- Ensure genres table has names used by books
"""
from __future__ import annotations

import logging
from typing import Any

LOGGER = logging.getLogger("novel_app.seed_catalog_links")


def _db():
    from .main import fetch_all, execute_write
    return fetch_all, execute_write


def ensure_min_chapters(min_chapters: int = 3, limit_books: int = 300) -> dict[str, Any]:
    from .content_enrichment_seed import seed_chapters_for_empty_books
    return seed_chapters_for_empty_books(
        limit_books=limit_books,
        chapters_per_book=min_chapters,
        paragraphs_per_chapter=12,
    )


def ensure_genres_and_tag_links(limit_books: int = 500) -> dict[str, Any]:
    """Create missing tags/genres from book fields and fill book_tags."""
    report: dict[str, Any] = {
        "tags_created": 0,
        "genres_created": 0,
        "links": 0,
        "errors": 0,
    }
    try:
        fetch_all, execute_write = _db()
    except Exception as exc:
        report["error"] = str(exc)
        return report

    # Collect public books
    try:
        books = fetch_all(
            """
            SELECT id, genre, primary_genre, secondary_genre
            FROM books
            WHERE LOWER(COALESCE(status_text, 'draft'))
                  NOT IN ('draft', 'unpublished', 'private', 'unlisted', '')
            LIMIT %s
            """,
            (limit_books,),
        ) or []
    except Exception as exc:
        report["error"] = f"books query: {exc}"
        return report

    def _names_for(row) -> list[str]:
        if isinstance(row, dict):
            vals = [row.get("genre"), row.get("primary_genre"), row.get("secondary_genre")]
        else:
            vals = list(row[1:4]) if len(row) >= 4 else []
        out = []
        for v in vals:
            s = str(v or "").strip()
            if not s:
                continue
            out.append(s)
            for part in s.replace("/", ",").split(","):
                p = part.strip()
                if p:
                    out.append(p)
        # unique preserve order
        seen = set()
        uniq = []
        for n in out:
            k = n.lower()
            if k not in seen:
                seen.add(k)
                uniq.append(n)
        return uniq

    # Load existing tags
    tag_by_lower: dict[str, int] = {}
    try:
        tags = fetch_all("SELECT id, name FROM tags") or []
        for t in tags:
            if isinstance(t, dict):
                tid, nm = int(t.get("id") or 0), str(t.get("name") or "").strip()
            else:
                tid, nm = int(t[0] or 0), str(t[1] or "").strip()
            if tid and nm:
                tag_by_lower[nm.lower()] = tid
    except Exception as exc:
        report["tags_load_error"] = str(exc)

    for b in books:
        bid = int((b.get("id") if isinstance(b, dict) else b[0]) or 0)
        if not bid:
            continue
        for name in _names_for(b):
            key = name.lower()
            # genres table (best-effort)
            try:
                execute_write(
                    "INSERT IGNORE INTO genres (name) VALUES (%s)",
                    (name,),
                )
                report["genres_created"] += 1
            except Exception:
                try:
                    execute_write(
                        "INSERT OR IGNORE INTO genres (name) VALUES (%s)",
                        (name,),
                    )
                    report["genres_created"] += 1
                except Exception:
                    pass

            tid = tag_by_lower.get(key)
            if not tid:
                try:
                    execute_write(
                        "INSERT IGNORE INTO tags (name) VALUES (%s)",
                        (name,),
                    )
                except Exception:
                    try:
                        execute_write(
                            "INSERT OR IGNORE INTO tags (name) VALUES (%s)",
                            (name,),
                        )
                    except Exception as te:
                        report["errors"] += 1
                        LOGGER.debug("tag insert %s: %s", name, te)
                        continue
                try:
                    rows = fetch_all(
                        "SELECT id FROM tags WHERE LOWER(name)=LOWER(%s) LIMIT 1",
                        (name,),
                    ) or []
                    if rows:
                        r0 = rows[0]
                        tid = int((r0.get("id") if isinstance(r0, dict) else r0[0]) or 0)
                        if tid:
                            tag_by_lower[key] = tid
                            report["tags_created"] += 1
                except Exception:
                    continue
            if not tid:
                continue
            # book_tags link
            try:
                execute_write(
                    "INSERT IGNORE INTO book_tags (book_id, tag_id) VALUES (%s, %s)",
                    (bid, tid),
                )
                report["links"] += 1
            except Exception:
                try:
                    execute_write(
                        "INSERT OR IGNORE INTO book_tags (book_id, tag_id) VALUES (%s, %s)",
                        (bid, tid),
                    )
                    report["links"] += 1
                except Exception as le:
                    report["errors"] += 1
                    LOGGER.debug("book_tags %s->%s: %s", bid, tid, le)

    LOGGER.info("ensure_genres_and_tag_links: %s", report)
    return report


def run_catalog_health() -> dict[str, Any]:
    """Call on every local/backend start after schema is ready."""
    out: dict[str, Any] = {}
    try:
        out["chapters"] = ensure_min_chapters(min_chapters=3, limit_books=300)
    except Exception as exc:
        LOGGER.warning("ensure_min_chapters: %s", exc)
        out["chapters_error"] = str(exc)
    try:
        out["genre_tag_links"] = ensure_genres_and_tag_links(limit_books=500)
    except Exception as exc:
        LOGGER.warning("ensure_genres_and_tag_links: %s", exc)
        out["genre_tag_links_error"] = str(exc)
    # Prefer main helper too (covers DEFAULT_TAGS matching)
    try:
        from .main import _ensure_tags_schema, _seed_book_tag_links
        _ensure_tags_schema()
        out["seed_book_tag_links"] = _seed_book_tag_links(limit=500)
    except Exception as exc:
        LOGGER.warning("_seed_book_tag_links: %s", exc)
        out["seed_book_tag_links_error"] = str(exc)
    return out
