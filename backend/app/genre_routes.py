
"""Genre listing + books-by-genre (real DB data for Discover / hashtag-style hubs)."""
from __future__ import annotations

import logging
from typing import Any, Callable

from fastapi import HTTPException

LOGGER = logging.getLogger("novel_app.genre_routes")


def register_genre_routes(
    app,
    *,
    fetch_all: Callable,
    fetch_one: Callable | None = None,
    serialize_book: Callable | None = None,
    is_public_status: Callable | None = None,
) -> None:
    def _serialize(row):
        if serialize_book is not None:
            return serialize_book(row)
        if isinstance(row, dict):
            return dict(row)
        try:
            return dict(row)
        except Exception:
            return row

    def _public_clause():
        return """
            LOWER(COALESCE(status_text, 'draft')) NOT IN
            ('draft', 'unpublished', 'private', 'unlisted', '')
        """

    @app.get("/api/genres")
    def list_genres():
        """Distinct genres from public books + genres table."""
        names: list[str] = []
        seen = set()
        try:
            rows = fetch_all(
                f"""
                SELECT name FROM genres
                WHERE COALESCE(name, '') <> ''
                ORDER BY name LIMIT 200
                """
            ) or []
            for r in rows:
                n = (r.get("name") if isinstance(r, dict) else r[0]) or ""
                n = str(n).strip()
                if n and n.lower() not in seen:
                    seen.add(n.lower())
                    names.append(n)
        except Exception as exc:
            LOGGER.warning("genres table list: %s", exc)
        try:
            rows = fetch_all(
                f"""
                SELECT g AS name, COUNT(*) AS c FROM (
                  SELECT NULLIF(TRIM(primary_genre), '') AS g FROM books
                  WHERE {_public_clause()}
                  UNION ALL
                  SELECT NULLIF(TRIM(genre), '') FROM books WHERE {_public_clause()}
                  UNION ALL
                  SELECT NULLIF(TRIM(secondary_genre), '') FROM books WHERE {_public_clause()}
                ) x
                WHERE g IS NOT NULL AND g <> ''
                GROUP BY g
                ORDER BY c DESC, g ASC
                LIMIT 100
                """
            ) or []
            for r in rows:
                n = (r.get("name") if isinstance(r, dict) else r[0]) or ""
                n = str(n).strip()
                if n and n.lower() not in seen:
                    seen.add(n.lower())
                    names.append(n)
        except Exception as exc:
            LOGGER.warning("genres from books: %s", exc)
        return {"items": names}

    @app.get("/api/genres/{genre_name:path}/books")
    def list_books_by_genre(genre_name: str, sort: str | None = None):
        from urllib.parse import unquote
        clean = unquote(genre_name or "").strip()
        if not clean:
            raise HTTPException(status_code=400, detail="Genre required")
        like = f"%{clean}%"
        order = "COALESCE(b.rating, 0) DESC, b.id DESC"
        s = (sort or "top").strip().lower()
        if s in ("recent", "new"):
            order = "b.id DESC"
        elif s in ("trending", "views"):
            order = "COALESCE(b.view_count, 0) DESC, b.id DESC"
        try:
            rows = fetch_all(
                f"""
                SELECT b.* FROM books b
                WHERE {_public_clause()}
                  AND (
                    LOWER(COALESCE(b.primary_genre, '')) = LOWER(%s)
                    OR LOWER(COALESCE(b.genre, '')) = LOWER(%s)
                    OR LOWER(COALESCE(b.secondary_genre, '')) = LOWER(%s)
                    OR LOWER(COALESCE(b.primary_genre, '')) LIKE LOWER(%s)
                    OR LOWER(COALESCE(b.genre, '')) LIKE LOWER(%s)
                    OR LOWER(COALESCE(b.secondary_genre, '')) LIKE LOWER(%s)
                  )
                ORDER BY {order}
                LIMIT 100
                """,
                (clean, clean, clean, like, like, like),
            ) or []
        except Exception as exc:
            LOGGER.warning("books by genre: %s", exc)
            rows = []
        return {
            "genre": clean,
            "items": [_serialize(r) for r in rows],
            "count": len(rows),
        }

    LOGGER.info("genre routes registered")
