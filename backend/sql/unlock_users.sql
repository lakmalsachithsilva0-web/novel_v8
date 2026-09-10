-- -- Run in phpMyAdmin on database: novel_app_db_v2
-- -- This unlocks ALL users for login (clears ban / suspend / soft-delete).

-- USE novel_app_db_v2;

-- -- 1) Ensure moderation columns exist
-- ALTER TABLE app_users ADD COLUMN IF NOT EXISTS is_banned INT NOT NULL DEFAULT 0;
-- ALTER TABLE app_users ADD COLUMN IF NOT EXISTS is_suspended INT NOT NULL DEFAULT 0;
-- ALTER TABLE app_users ADD COLUMN IF NOT EXISTS is_deleted INT NOT NULL DEFAULT 0;
-- ALTER TABLE app_users ADD COLUMN IF NOT EXISTS suspended_until VARCHAR(64) NULL;
-- ALTER TABLE app_users ADD COLUMN IF NOT EXISTS is_author_active INT NOT NULL DEFAULT 1;
-- ALTER TABLE app_users ADD COLUMN IF NOT EXISTS token_version INT NOT NULL DEFAULT 0;
-- ALTER TABLE app_users ADD COLUMN IF NOT EXISTS device_id VARCHAR(128) NULL;
-- ALTER TABLE app_users ADD COLUMN IF NOT EXISTS password_hash TEXT NULL;

-- -- MySQL versions without IF NOT EXISTS on columns: ignore errors if column already exists.

-- -- 2) Unlock EVERY account (safe for local dev)
-- UPDATE app_users
-- SET
--   is_banned = 0,
--   is_suspended = 0,
--   is_deleted = 0,
--   suspended_until = NULL,
--   is_author_active = 1;

-- -- 3) Explicitly unlock the three accounts visible in your admin panel
-- UPDATE app_users
-- SET is_banned = 0, is_suspended = 0, is_deleted = 0, suspended_until = NULL
-- WHERE LOWER(email) IN (
--   'hellohiro797@gmail.com',
--   'fernandoanushka84@gmail.com',
--   'malindasilva047@gmail.com'
-- );

-- -- 4) Verify
-- SELECT id, email, display_name, is_banned, is_suspended, is_deleted, provider
-- FROM app_users
-- ORDER BY id DESC
-- LIMIT 50;
