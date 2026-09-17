"""Inkitt-style user block + report, with admin review. SQLite + MySQL safe."""
from __future__ import annotations

from typing import Any

from fastapi import Depends, HTTPException
from pydantic import BaseModel


class ReportUserRequest(BaseModel):
    reason: str | None = None


class BlockUserRequest(BaseModel):
    blocked: bool = True


def register_user_moderation_routes(
    app,
    *,
    require_user,
    require_admin,
    fetch_all,
    execute_write,
    LOGGER,
):
    def _ensure():
        # MySQL-style first, then SQLite-friendly fallbacks
        stmts = [
            """
            CREATE TABLE IF NOT EXISTS user_blocks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                blocker_id INTEGER NOT NULL,
                blocked_id INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE (blocker_id, blocked_id)
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS user_reports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                reporter_id INTEGER NOT NULL,
                reported_id INTEGER NOT NULL,
                reason VARCHAR(500) DEFAULT '',
                status VARCHAR(32) DEFAULT 'open',
                admin_note TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                resolved_at TIMESTAMP NULL,
                UNIQUE (reporter_id, reported_id)
            )
            """,
        ]
        for sql in stmts:
            try:
                execute_write(sql, ())
            except Exception as exc:
                LOGGER.warning("user_moderation ensure: %s", exc)
        # MySQL alternate if SQLite-style failed on MySQL
        mysql_stmts = [
            """
            CREATE TABLE IF NOT EXISTS user_blocks (
                id INT AUTO_INCREMENT PRIMARY KEY,
                blocker_id INT NOT NULL,
                blocked_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY uq_block (blocker_id, blocked_id)
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS user_reports (
                id INT AUTO_INCREMENT PRIMARY KEY,
                reporter_id INT NOT NULL,
                reported_id INT NOT NULL,
                reason VARCHAR(500) DEFAULT '',
                status VARCHAR(32) DEFAULT 'open',
                admin_note TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                resolved_at TIMESTAMP NULL,
                UNIQUE KEY uq_report (reporter_id, reported_id)
            )
            """,
        ]
        for sql in mysql_stmts:
            try:
                execute_write(sql, ())
            except Exception:
                pass

    @app.post("/api/users/{user_id}/block")
    def block_user(
        user_id: int,
        payload: BlockUserRequest | None = None,
        user: dict[str, Any] = Depends(require_user),
    ):
        _ensure()
        me = int(user["user_id"])
        if me == user_id:
            raise HTTPException(status_code=400, detail="Cannot block yourself")
        blocked = True if payload is None else bool(payload.blocked)
        if blocked:
            try:
                execute_write(
                    "INSERT OR IGNORE INTO user_blocks (blocker_id, blocked_id) VALUES (%s, %s)",
                    (me, user_id),
                )
            except Exception:
                try:
                    execute_write(
                        "INSERT IGNORE INTO user_blocks (blocker_id, blocked_id) VALUES (%s, %s)",
                        (me, user_id),
                    )
                except Exception:
                    try:
                        execute_write(
                            "INSERT INTO user_blocks (blocker_id, blocked_id) VALUES (%s, %s)",
                            (me, user_id),
                        )
                    except Exception as exc:
                        LOGGER.warning("block insert: %s", exc)
        else:
            execute_write(
                "DELETE FROM user_blocks WHERE blocker_id=%s AND blocked_id=%s",
                (me, user_id),
            )
        return {"ok": True, "blocked": blocked}

    @app.get("/api/users/me/blocked")
    def list_my_blocked(user: dict[str, Any] = Depends(require_user)):
        _ensure()
        try:
            rows = fetch_all(
                """
                SELECT ub.blocked_id AS id, u.display_name, u.username, u.photo_url
                FROM user_blocks ub
                LEFT JOIN users u ON u.id = ub.blocked_id
                WHERE ub.blocker_id=%s
                ORDER BY ub.created_at DESC
                """,
                (user["user_id"],),
            )
            return {"items": rows or []}
        except Exception:
            try:
                rows = fetch_all(
                    """
                    SELECT ub.blocked_id AS id, u.display_name, u.username, u.photo_url
                    FROM user_blocks ub
                    LEFT JOIN app_users u ON u.id = ub.blocked_id
                    WHERE ub.blocker_id=%s
                    ORDER BY ub.created_at DESC
                    """,
                    (user["user_id"],),
                )
                return {"items": rows or []}
            except Exception as exc:
                LOGGER.warning("list blocked: %s", exc)
                return {"items": []}

    @app.post("/api/users/{user_id}/report")
    def report_user(
        user_id: int,
        payload: ReportUserRequest | None = None,
        user: dict[str, Any] = Depends(require_user),
    ):
        _ensure()
        me = int(user["user_id"])
        if me == user_id:
            raise HTTPException(status_code=400, detail="Cannot report yourself")
        reason = ((payload.reason if payload else None) or "").strip()[:500]
        try:
            execute_write(
                """
                INSERT INTO user_reports (reporter_id, reported_id, reason, status)
                VALUES (%s, %s, %s, 'open')
                """,
                (me, user_id, reason),
            )
        except Exception:
            try:
                existing = fetch_all(
                    "SELECT id FROM user_reports WHERE reporter_id=%s AND reported_id=%s LIMIT 1",
                    (me, user_id),
                )
                if existing:
                    rid = existing[0]["id"] if isinstance(existing[0], dict) else existing[0][0]
                    execute_write(
                        "UPDATE user_reports SET reason=%s, status='open' WHERE id=%s",
                        (reason, rid),
                    )
                else:
                    execute_write(
                        "INSERT INTO user_reports (reporter_id, reported_id, reason, status) VALUES (%s,%s,%s,'open')",
                        (me, user_id, reason),
                    )
            except Exception as exc:
                LOGGER.warning("report_user: %s", exc)
        c = 0
        try:
            count_rows = fetch_all(
                "SELECT COUNT(*) AS c FROM user_reports WHERE reported_id=%s AND status='open'",
                (user_id,),
            )
            if count_rows:
                row = count_rows[0]
                c = int(row.get("c") if isinstance(row, dict) else row[0] or 0)
        except Exception:
            c = 0
        return {"ok": True, "open_reports": c, "flagged_for_admin": c >= 3}

    @app.get("/api/admin/user-reports")
    def admin_user_reports(_: dict[str, Any] = Depends(require_admin)):
        """Never 500 — empty list on schema/query issues (fixes admin CORS-on-error)."""
        try:
            _ensure()
        except Exception as exc:
            LOGGER.warning("user-reports ensure: %s", exc)
            return {"items": []}
        try:
            rows = fetch_all(
                """
                SELECT ur.id, ur.reporter_id, ur.reported_id, ur.reason, ur.status, ur.created_at,
                       COALESCE(ru.display_name, '') AS reported_name,
                       COALESCE(ru.username, '') AS reported_username,
                       COALESCE(rr.display_name, '') AS reporter_name
                FROM user_reports ur
                LEFT JOIN app_users ru ON ru.id = ur.reported_id
                LEFT JOIN app_users rr ON rr.id = ur.reporter_id
                ORDER BY ur.created_at DESC
                LIMIT 200
                """
            )
            return {"items": rows or []}
        except Exception as exc:
            LOGGER.warning("admin user-reports query: %s", exc)
            try:
                rows = fetch_all(
                    "SELECT id, reporter_id, reported_id, reason, status, created_at FROM user_reports ORDER BY id DESC LIMIT 200"
                )
                return {"items": rows or []}
            except Exception as exc2:
                LOGGER.warning("admin user-reports fallback: %s", exc2)
                return {"items": []}

    @app.post("/api/admin/user-reports/{report_id}/resolve")
    def admin_resolve_report(report_id: int, _: dict[str, Any] = Depends(require_admin)):
        _ensure()
        try:
            execute_write(
                "UPDATE user_reports SET status='resolved', resolved_at=CURRENT_TIMESTAMP WHERE id=%s",
                (report_id,),
            )
        except Exception:
            execute_write(
                "UPDATE user_reports SET status='resolved' WHERE id=%s",
                (report_id,),
            )
        return {"ok": True}

    LOGGER.info("user moderation routes registered")
