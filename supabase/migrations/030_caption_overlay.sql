-- 030 — Optional "caption on the video" overlay for moments.
--
-- caption_position is NULL/'below' for the existing behaviour (caption shown
-- under the media). 'top' | 'center' | 'bottom' means the caption is drawn OVER
-- the media at that position, in-app (no re-encoding — it's a display overlay).

ALTER TABLE moments ADD COLUMN IF NOT EXISTS caption_position TEXT;
