"""Inkitt-style user block + report, with admin review."""
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
        try:
            execute_write(
                """
                CREATE TABLE IF NOT EXISTS user_blocks (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    blocker_id INT NOT NULL,
                    blocked_id INT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE KEY uq_block (blocker_id, blocked_id),
                    INDEX (blocker_id),
                    INDEX (blocked_id)
                )
                """,
                (),
            )
        except Exception as exc:
            LOGGER.warning("user_blocks ensure: %s", exc)
        try:
            execute_write(
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
                    UNIQUE KEY uq_report (reporter_id, reported_id),
                    INDEX (reported_id),
                    INDEX (status)
                )
                """,
                (),
            )
        except Exception as exc:
            LOGGER.warning("user_reports ensure: %s", exc)

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
                    "INSERT IGNORE INTO user_blocks (blocker_id, blocked_id) VALUES (%s, %s)",
                    (me, user_id),
                )
            except Exception:
                execute_write(
                    "INSERT INTO user_blocks (blocker_id, blocked_id) VALUES (%s, %s)",
                    (me, user_id),
                )
        else:
            execute_write(
                "DELETE FROM user_blocks WHERE blocker_id=%s AND blocked_id=%s",
                (me, user_id),
            )
        return {"ok": True, "blocked": blocked}

    @app.get("/api/users/me/blocked")
    def list_my_blocked(user: dict[str, Any] = Depends(require_user)):
        _ensure()
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
        return {"items": rows}

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
        reason = (payload.reason if payload else None) or ""
        reason = reason.strip()[:500]
        try:
            execute_write(
                """
                INSERT INTO user_reports (reporter_id, reported_id, reason, status)
                VALUES (%s, %s, %s, 'open')
                ON DUPLICATE KEY UPDATE reason=VALUES(reason), status='open'
                """,
                (me, user_id, reason),
            )
        except Exception:
            # sqlite-ish fallback
            existing = fetch_all(
                "SELECT id FROM user_reports WHERE reporter_id=%s AND reported_id=%s LIMIT 1",
                (me, user_id),
            )
            if existing:
                execute_write(
                    "UPDATE user_reports SET reason=%s, status='open' WHERE id=%s",
                    (reason, existing[0]["id"] if isinstance(existing[0], dict) else existing[0][0]),
                )
            else:
                execute_write(
                    "INSERT INTO user_reports (reporter_id, reported_id, reason, status) VALUES (%s,%s,%s,'open')",
                    (me, user_id, reason),
                )
        count_rows = fetch_all(
            "SELECT COUNT(*) AS c FROM user_reports WHERE reported_id=%s AND status='open'",
            (user_id,),
        )
        c = int((count_rows[0].get("c") if count_rows and isinstance(count_rows[0], dict) else (count_rows[0][0] if count_rows else 0)) or 0)
        return {"ok": True, "open_reports": c, "flagged_for_admin": c >= 3}

    @app.get("/api/admin/user-reports")
    def admin_user_reports(_: dict[str, Any] = Depends(require_admin)):
        _ensure()
        rows = fetch_all(
            """
            SELECT ur.id, ur.reporter_id, ur.reported_id, ur.reason, ur.status, ur.created_at,
                   ru.display_name AS reported_name, ru.username AS reported_username,
                   rr.display_name AS reporter_name
            FROM user_reports ur
            LEFT JOIN users ru ON ru.id = ur.reported_id
            LEFT JOIN users rr ON rr.id = ur.reporter_id
            ORDER BY ur.created_at DESC
            LIMIT 200
            """
        )
        return {"items": rows}

    @app.post("/api/admin/user-reports/{report_id}/resolve")
    def admin_resolve_report(report_id: int, _: dict[str, Any] = Depends(require_admin)):
        _ensure()
        execute_write(
            "UPDATE user_reports SET status='resolved', resolved_at=CURRENT_TIMESTAMP WHERE id=%s",
            (report_id,),
        )
        return {"ok": True}

    LOGGER.info("user moderation routes registered")
