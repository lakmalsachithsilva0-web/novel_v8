-- Auto-run on backend startup (safe, idempotent).
-- Allow custom home slider section names from admin panel.
ALTER TABLE books MODIFY COLUMN section_name VARCHAR(64) NOT NULL DEFAULT 'recently_updated';
