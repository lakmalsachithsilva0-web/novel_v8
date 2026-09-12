-- Auto-run on backend startup. Adds notify column for hashtag follow notifications.
-- Safe to re-run: MySQL will error if column exists (ignored by runner); use IF NOT EXISTS pattern via app ensure.
ALTER TABLE tag_follows ADD COLUMN notify TINYINT NOT NULL DEFAULT 0;
