-- ---------------------------------------------
-- Allow community videos to upload.
--
-- The `moments` bucket was created without a file_size_limit, so it fell back
-- to the project-wide default (50 MB). Phone videos routinely exceed that, so
-- video uploads were rejected by storage (the app showed "Could not upload").
--
-- Raise the bucket limit to 200 MB. NOTE: the project-wide upload limit caps
-- this — also raise it in the Dashboard: Storage → Settings → "Upload file
-- size limit" to at least 200 MB, or this bucket limit can't take effect.
-- ---------------------------------------------
UPDATE storage.buckets
SET file_size_limit = 209715200 -- 200 MB
WHERE id = 'moments';
