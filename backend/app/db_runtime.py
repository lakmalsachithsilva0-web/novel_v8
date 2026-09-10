"""Runtime database readiness checks for the MySQL-only backend."""
from __future__ import annotations

import os
from typing import Any


def apply_mysql_fallback_if_needed(db_mod: Any) -> dict[str, Any]:
    """Verify that the configured MySQL server is reachable."""
    info: dict[str, Any] = {
        "db_mode": "mysql",
    }

    mysql_connector = getattr(db_mod, "mysql_connector", None)
    if mysql_connector is None:
        try:
            import mysql.connector as mysql_connector  # type: ignore
        except ModuleNotFoundError:
            mysql_connector = None

    if mysql_connector is None:
        raise RuntimeError("mysql-connector-python is required; SQLite fallback is disabled")

    ssl_disabled = os.getenv("MYSQL_SSL_DISABLED", "false").lower() == "true"
    try:
        conn = mysql_connector.connect(
            host=os.getenv("MYSQL_HOST", "127.0.0.1"),
            port=int(os.getenv("MYSQL_PORT", "3306")),
            user=os.getenv("MYSQL_USER", "root"),
            password=os.getenv("MYSQL_PASSWORD", ""),
            ssl_disabled=ssl_disabled,
            use_pure=True,
            connection_timeout=3,
        )
        conn.close()
        info["db_mode"] = "mysql"
        return info
    except Exception as exc:
        raise RuntimeError(
            "MySQL is unreachable. Start XAMPP MySQL and verify MYSQL_HOST, MYSQL_PORT, "
            "MYSQL_USER, MYSQL_PASSWORD, and MYSQL_DATABASE."
        ) from exc
