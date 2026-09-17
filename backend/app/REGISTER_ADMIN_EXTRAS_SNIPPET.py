# === Paste near the end of main.py (after admin_tags / story_reports registration) ===
try:
    from .admin_genres import register_admin_genre_routes
    register_admin_genre_routes(
        app,
        require_admin=require_admin,
        fetch_all=fetch_all,
        execute_write=execute_write,
        LOGGER=LOGGER,
    )
except Exception as _admin_genres_exc:
    LOGGER.warning("admin_genres routes not registered: %s", _admin_genres_exc)

try:
    from .user_moderation_routes import register_user_moderation_routes
    register_user_moderation_routes(
        app,
        require_user=require_user,
        require_admin=require_admin,
        fetch_all=fetch_all,
        execute_write=execute_write,
        LOGGER=LOGGER,
    )
except Exception as _user_mod_exc:
    LOGGER.warning("user_moderation routes not registered: %s", _user_mod_exc)
