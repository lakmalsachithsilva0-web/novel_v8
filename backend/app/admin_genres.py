"""Admin genres CRUD with cover images (Inkitt-style genre hubs)."""
from __future__ import annotations

from typing import Any

from fastapi import Depends, HTTPException
from pydantic import BaseModel


class AdminGenreCreate(BaseModel):
    name: str
    slug: str | None = None
    description: str | None = None
    color_hex: str | None = None
    cover_path: str | None = None
    display_order: int | None = 0


class AdminGenreUpdate(BaseModel):
    name: str | None = None
    slug: str | None = None
    description: str | None = None
    color_hex: str | None = None
    cover_path: str | None = None
    display_order: int | None = None


def _slugify(name: str) -> str:
    import re
    s = (name or "").strip().lower()
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s or "genre"


def register_admin_genre_routes(app, *, require_admin, fetch_all, execute_write, LOGGER):
    def _ensure_schema():
        try:
            execute_write(
                """
                CREATE TABLE IF NOT EXISTS genres (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(100) NOT NULL UNIQUE,
                    slug VARCHAR(100) NOT NULL UNIQUE,
                    description TEXT,
                    color_hex VARCHAR(7),
                    cover_path VARCHAR(512) DEFAULT '',
                    display_order INT DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )
                """,
                (),
            )
        except Exception as exc:
            LOGGER.warning("genres ensure table: %s", exc)
        for col, ddl in [
            ("cover_path", "ALTER TABLE genres ADD COLUMN cover_path VARCHAR(512) DEFAULT ''"),
            ("description", "ALTER TABLE genres ADD COLUMN description TEXT"),
            ("color_hex", "ALTER TABLE genres ADD COLUMN color_hex VARCHAR(7)"),
            ("display_order", "ALTER TABLE genres ADD COLUMN display_order INT DEFAULT 0"),
            ("slug", "ALTER TABLE genres ADD COLUMN slug VARCHAR(100)"),
        ]:
            try:
                execute_write(ddl, ())
            except Exception:
                pass

    def _ser(row: dict[str, Any]) -> dict[str, Any]:
        return {
            "id": row.get("id"),
            "name": row.get("name") or "",
            "slug": row.get("slug") or "",
            "description": row.get("description") or "",
            "color_hex": row.get("color_hex") or "",
            "cover_path": row.get("cover_path") or "",
            "display_order": int(row.get("display_order") or 0),
        }

    @app.get("/api/admin/genres")
    def admin_list_genres(_: dict[str, Any] = Depends(require_admin)):
        _ensure_schema()
        rows = fetch_all(
            "SELECT id, name, slug, description, color_hex, cover_path, display_order FROM genres ORDER BY display_order ASC, name ASC"
        )
        return {"items": [_ser(r) for r in rows]}

    @app.post("/api/admin/genres")
    def admin_create_genre(payload: AdminGenreCreate, _: dict[str, Any] = Depends(require_admin)):
        _ensure_schema()
        name = (payload.name or "").strip()
        if not name:
            raise HTTPException(status_code=400, detail="Genre name required")
        slug = (payload.slug or "").strip() or _slugify(name)
        existing = fetch_all("SELECT id FROM genres WHERE LOWER(name)=LOWER(%s) OR LOWER(slug)=LOWER(%s) LIMIT 1", (name, slug))
        if existing:
            raise HTTPException(status_code=400, detail="Genre already exists")
        execute_write(
            """
            INSERT INTO genres (name, slug, description, color_hex, cover_path, display_order)
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (
                name,
                slug,
                (payload.description or "").strip(),
                (payload.color_hex or "").strip() or None,
                (payload.cover_path or "").strip(),
                int(payload.display_order or 0),
            ),
        )
        return {"ok": True}

    @app.put("/api/admin/genres/{genre_id}")
    def admin_update_genre(genre_id: int, payload: AdminGenreUpdate, _: dict[str, Any] = Depends(require_admin)):
        _ensure_schema()
        rows = fetch_all("SELECT id FROM genres WHERE id=%s LIMIT 1", (genre_id,))
        if not rows:
            raise HTTPException(status_code=404, detail="Genre not found")
        fields = []
        vals: list[Any] = []
        if payload.name is not None:
            fields.append("name=%s")
            vals.append(payload.name.strip())
        if payload.slug is not None:
            fields.append("slug=%s")
            vals.append(payload.slug.strip() or _slugify(payload.name or "genre"))
        if payload.description is not None:
            fields.append("description=%s")
            vals.append(payload.description.strip())
        if payload.color_hex is not None:
            fields.append("color_hex=%s")
            vals.append(payload.color_hex.strip())
        if payload.cover_path is not None:
            fields.append("cover_path=%s")
            vals.append(payload.cover_path.strip())
        if payload.display_order is not None:
            fields.append("display_order=%s")
            vals.append(int(payload.display_order))
        if not fields:
            return {"ok": True}
        vals.append(genre_id)
        execute_write(f"UPDATE genres SET {', '.join(fields)} WHERE id=%s", tuple(vals))
        return {"ok": True}

    @app.delete("/api/admin/genres/{genre_id}")
    def admin_delete_genre(genre_id: int, _: dict[str, Any] = Depends(require_admin)):
        _ensure_schema()
        execute_write("DELETE FROM genres WHERE id=%s", (genre_id,))
        return {"ok": True}

    # Public genre meta (cover for Flutter hubs)
    @app.get("/api/genres/{genre_name:path}/meta")
    def genre_meta(genre_name: str):
        _ensure_schema()
        from urllib.parse import unquote
        clean = unquote(genre_name or "").strip()
        rows = fetch_all(
            "SELECT id, name, slug, description, color_hex, cover_path FROM genres WHERE LOWER(name)=LOWER(%s) OR LOWER(slug)=LOWER(%s) LIMIT 1",
            (clean, clean),
        )
        if not rows:
            return {"name": clean, "cover_path": "", "description": ""}
        return _ser(rows[0])

    LOGGER.info("admin genre routes registered")
