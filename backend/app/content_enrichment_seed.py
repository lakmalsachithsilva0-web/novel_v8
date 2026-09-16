"""
Content enrichment on startup:
- Ensure every published book has at least N chapters (default 5, min recommended 3)
- Sample wall posts + book reviews
Uses main.fetch_all / execute_write (not db_runtime).
"""
from __future__ import annotations

import logging
from typing import Any, Callable

LOGGER = logging.getLogger("novel_app.content_seed")

_ENRICHMENT_DONE = False

SAMPLE_PARAGRAPHS = [
    "The morning light slipped through the curtains as {hero} woke to a world that no longer felt familiar.",
    "Every choice from the night before echoed in the quiet of the room, and the path ahead was anything but clear.",
    "Footsteps in the hallway made {hero} freeze. Someone was awake who should not have been.",
    "A half-written letter lay on the desk, ink still wet, secrets unfinished.",
    "Outside, the city moved on as if nothing had changed — but everything had.",
    "By noon, secrets had already begun to surface between friends and rivals alike.",
    "A message left unread, a door left open, and a promise that could not be kept.",
    "{hero} knew there would be no turning back once the truth came out.",
    "Rain traced patterns on the window while the conversation turned sharp.",
    "In the mirror, a stranger looked back with the same eyes and a different resolve.",
    "The archive smelled of dust and old paper; answers waited in the margins.",
    "A name whispered twice was enough to reopen a closed chapter of the past.",
    "Trust was a fragile currency, spent too quickly and earned too slowly.",
    "Night fell harder than expected, swallowing the last of the golden hour.",
    "In the space between fear and hope, {hero} made a decision that would reshape everything.",
    "Allies argued in low voices; enemies listened from the other side of the wall.",
    "The map was incomplete, but the road still demanded to be walked.",
    "Music from a distant radio filled the silence neither of them could break.",
    "One photograph changed the story — or at least the way it would be told.",
    "Coffee went cold while the plan took shape on a napkin stained with ink.",
    "The clock on the wall seemed slower when every second carried a cost.",
    "A locked drawer finally gave way, revealing more questions than answers.",
    "They agreed to meet at dusk, where the river met the old bridge.",
    "No one admitted fear, yet every glance checked the exits.",
    "History repeated itself with new faces and the same old wounds.",
    "A single word of kindness cut deeper than any accusation.",
    "The storm arrived early, driving everyone under the same thin roof.",
    "When the lights returned, nothing was exactly where it had been left.",
    "Tomorrow would demand courage; tonight only required honesty.",
    "And so the chapter closed not with an ending, but with a door left ajar.",
]



def _db() -> tuple[Callable, Callable]:
    """Resolve fetch_all / execute_write from main (circular-import safe)."""
    try:
        from . import main as main_mod
    except Exception:
        import app.main as main_mod  # type: ignore
    return main_mod.fetch_all, main_mod.execute_write


def _chapter_body(hero: str, chapter_num: int, paragraphs: int = 30) -> str:
    lines = []
    for i in range(paragraphs):
        tmpl = SAMPLE_PARAGRAPHS[i % len(SAMPLE_PARAGRAPHS)]
        lines.append(tmpl.format(hero=hero or "the protagonist"))
    header = f"[Chapter {chapter_num}]\n\n"
    return header + "\n\n".join(lines)




def _insert_chapter(execute_write, book_id: int, num: int, title: str, body: str) -> None:
    """Insert one chapter using story_id (this schema has no chapters.book_id)."""
    attempts = [
        (
            """
            INSERT INTO chapters
              (story_id, chapter_number, title, content, sort_order, submission_status)
            VALUES (%s, %s, %s, %s, %s, 'published')
            """,
            (book_id, num, title, body, num),
        ),
        (
            """
            INSERT INTO chapters (story_id, chapter_number, title, content, sort_order)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (book_id, num, title, body, num),
        ),
    ]
    last_exc = None
    for sql, params in attempts:
        try:
            execute_write(sql, params)
            return
        except Exception as exc:
            last_exc = exc
            continue
    if last_exc:
        raise last_exc


def seed_chapters_for_empty_books(
    limit_books: int = 120,
    chapters_per_book: int = 5,
    paragraphs_per_chapter: int = 30,
) -> dict[str, Any]:
    """Ensure published books have at least N chapters with multi-paragraph content."""
    report: dict[str, Any] = {"books_touched": 0, "chapters_added": 0, "errors": 0}
    try:
        fetch_all, execute_write = _db()
        books = fetch_all(
            """
            SELECT b.id, b.title, b.author,
                   (SELECT COUNT(*) FROM chapters c
                    WHERE c.story_id = b.id) AS ch_count
            FROM books b
            WHERE LOWER(COALESCE(b.status_text, 'draft'))
                  NOT IN ('draft', 'unpublished', 'private', '')
            LIMIT %s
            """,
            (limit_books,),
        ) or []
    except Exception as exc:
        LOGGER.warning("seed chapters query failed: %s", exc)
        report["error"] = str(exc)
        return report

    for b in books:
        try:
            if isinstance(b, dict):
                bid = int(b.get("id") or 0)
                title = str(b.get("title") or "Untitled")
                author = str(b.get("author") or "Hero")
                ch_count = int(b.get("ch_count") or 0)
            else:
                bid = int(b[0] or 0)
                title = str(b[1] or "Untitled")
                author = str(b[2] or "Hero")
                ch_count = int(b[3] or 0)
            if not bid or ch_count >= chapters_per_book:
                continue
            hero = (author.split() or ["Hero"])[0]
            for n in range(ch_count + 1, chapters_per_book + 1):
                body = _chapter_body(hero, n, paragraphs_per_chapter)
                ch_title = f"Chapter {n}"
                if n == 1:
                    ch_title = "Chapter 1 — Beginning"
                _insert_chapter(execute_write, bid, n, ch_title, body)
                report["chapters_added"] += 1
            report["books_touched"] += 1
        except Exception as exc:
            report["errors"] += 1
            LOGGER.warning("seed chapters for book failed: %s", exc)
    LOGGER.info("seed_chapters: %s", report)
    return report


def _ensure_seed_users() -> list[int]:
    ids: list[int] = []
    try:
        fetch_all, execute_write = _db()
        rows = fetch_all("SELECT id FROM app_users ORDER BY id ASC LIMIT 12")
        for r in rows or []:
            ids.append(int(r["id"] if isinstance(r, dict) else r[0]))
    except Exception as exc:
        LOGGER.warning("list users for seed: %s", exc)

    if len(ids) >= 2:
        return ids

    seed_people = [
        ("reader_one@seed.local", "Reader One"),
        ("reader_two@seed.local", "Reader Two"),
        ("fan_three@seed.local", "Story Fan"),
        ("bookworm@seed.local", "Book Worm"),
    ]
    try:
        fetch_all, execute_write = _db()
    except Exception:
        return ids

    for email, name in seed_people:
        try:
            uid, _ = execute_write(
                """
                INSERT INTO app_users (email, display_name, auth_provider)
                VALUES (%s, %s, 'seed')
                """,
                (email, name),
            )
            if uid:
                ids.append(int(uid))
            else:
                rows = fetch_all("SELECT id FROM app_users WHERE email=%s LIMIT 1", (email,))
                if rows:
                    ids.append(int(rows[0]["id"] if isinstance(rows[0], dict) else rows[0][0]))
        except Exception:
            try:
                rows = fetch_all("SELECT id FROM app_users WHERE email=%s LIMIT 1", (email,))
                if rows:
                    ids.append(int(rows[0]["id"] if isinstance(rows[0], dict) else rows[0][0]))
            except Exception:
                pass
    return ids


def seed_wall_posts(limit_authors: int = 20) -> dict[str, Any]:
    report: dict[str, Any] = {"posts_added": 0, "errors": 0}
    try:
        fetch_all, execute_write = _db()
        try:
            execute_write(
                """
                CREATE TABLE IF NOT EXISTS wall_posts (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT NOT NULL,
                    target_user_id INT NOT NULL,
                    body TEXT NOT NULL,
                    image_path VARCHAR(512) DEFAULT '',
                    likes_count INT NOT NULL DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
                """,
                (),
            )
        except Exception:
            pass

        authors = fetch_all(
            """
            SELECT DISTINCT user_id AS id FROM books
            WHERE user_id IS NOT NULL AND user_id > 0
            ORDER BY user_id DESC
            LIMIT %s
            """,
            (limit_authors,),
        )
        # Fallback: any app_users if books have no user_id
        if not authors:
            authors = fetch_all(
                "SELECT id FROM app_users ORDER BY id DESC LIMIT %s",
                (limit_authors,),
            )
    except Exception as exc:
        report["error"] = str(exc)
        return report

    samples = [
        "New chapter is live — thank you for reading along!",
        "Working on the next twist. Any guesses?",
        "Happy weekend, readers. Drop a comment if you are caught up!",
        "Cover refresh coming soon. Stay tuned.",
    ]
    report["authors_found"] = len(authors or [])
    for a in authors or []:
        uid = int(a["id"] if isinstance(a, dict) else a[0])
        try:
            existing = fetch_all(
                "SELECT COUNT(*) AS c FROM wall_posts WHERE target_user_id=%s",
                (uid,),
            )
            count = 0
            if existing:
                row0 = existing[0]
                count = int(row0["c"] if isinstance(row0, dict) else row0[0])
            if count >= 2:
                continue
            for body in samples[:2]:
                execute_write(
                    """
                    INSERT INTO wall_posts (user_id, target_user_id, body, image_path, likes_count)
                    VALUES (%s, %s, %s, '', 0)
                    """,
                    (uid, uid, body),
                )
                report["posts_added"] += 1
        except Exception as exc:
            report["errors"] += 1
            LOGGER.warning("wall seed for user %s: %s", uid, exc)
    return report


def seed_sample_reviews(limit_books: int = 40) -> dict[str, Any]:
    report: dict[str, Any] = {"reviews_added": 0, "errors": 0}
    user_ids = _ensure_seed_users()
    if not user_ids:
        report["error"] = "no users for reviews"
        return report
    try:
        fetch_all, execute_write = _db()
        books = fetch_all(
            """
            SELECT id FROM books
            WHERE LOWER(COALESCE(status_text, 'published')) NOT IN ('draft', 'unpublished', 'private')
            ORDER BY id DESC
            LIMIT %s
            """,
            (limit_books,),
        )
    except Exception as exc:
        report["error"] = str(exc)
        return report

    comments = [
        "Could not put this down. Great pacing!",
        "Loved the characters and the emotional arc.",
        "Solid plot with a few surprises. Recommend.",
        "Beautifully written. Waiting for the next chapter.",
    ]
    report["books_found"] = len(books or [])
    report["users_found"] = len(user_ids)
    for i, book in enumerate(books or []):
        bid = int(book["id"] if isinstance(book, dict) else book[0])
        # Try up to 2 different users per book
        for j in range(min(2, len(user_ids))):
            uid = user_ids[(i + j) % len(user_ids)]
            try:
                existing = fetch_all(
                    "SELECT id FROM book_reviews WHERE book_id=%s AND user_id=%s LIMIT 1",
                    (bid, uid),
                )
                if existing:
                    continue
                rating = 4 + ((i + j) % 2)
                comment = comments[(i + j) % len(comments)]
                execute_write(
                    """
                    INSERT INTO book_reviews (book_id, user_id, rating, comment)
                    VALUES (%s, %s, %s, %s)
                    """,
                    (bid, uid, rating, comment),
                )
                report["reviews_added"] += 1
            except Exception as exc:
                report["errors"] += 1
                LOGGER.warning("review seed book %s user %s: %s", bid, uid, exc)
    return report


def run_content_enrichment(force: bool = False) -> dict[str, Any]:
    """
    Always fill books that still have zero chapters (up to limit_books).
    Wall + reviews run until they have sample data.
    Skips fully if this process already finished enrichment (warm instance).
    """
    global _ENRICHMENT_DONE
    result: dict[str, Any] = {"ran": False}

    if _ENRICHMENT_DONE and not force:
        result["skipped"] = True
        result["reason"] = "already_done_this_instance"
        return result

    # Always try empty books first — do NOT skip based on total chapter count
    result["chapters"] = seed_chapters_for_empty_books(limit_books=120, chapters_per_book=5, paragraphs_per_chapter=30)

    try:
        result["wall"] = seed_wall_posts(limit_authors=20)
    except Exception as exc:
        result["wall"] = {"error": str(exc)}

    try:
        result["reviews"] = seed_sample_reviews(limit_books=40)
    except Exception as exc:
        result["reviews"] = {"error": str(exc)}

    result["ran"] = True
    _ENRICHMENT_DONE = True
    LOGGER.info("content enrichment: %s", result)
    return result
