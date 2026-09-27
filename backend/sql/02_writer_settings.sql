-- Persist web writer preferences and schedule data with the story owner.
ALTER TABLE books ADD COLUMN writer_settings LONGTEXT NULL;
