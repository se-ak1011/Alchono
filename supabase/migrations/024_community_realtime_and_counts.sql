-- 024 — Fast, realtime Talk interactions without changing the feed model.

ALTER TABLE community_posts
  ADD COLUMN IF NOT EXISTS comment_count INTEGER NOT NULL DEFAULT 0;

UPDATE community_posts p
SET comment_count = counts.total
FROM (
  SELECT post_id, count(*)::INTEGER AS total
  FROM community_comments
  GROUP BY post_id
) counts
WHERE p.id = counts.post_id;

CREATE OR REPLACE FUNCTION update_community_comment_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  END IF;
  UPDATE community_posts SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$;

CREATE TRIGGER community_comment_count_insert
  AFTER INSERT ON community_comments
  FOR EACH ROW EXECUTE FUNCTION update_community_comment_count();
CREATE TRIGGER community_comment_count_delete
  AFTER DELETE ON community_comments
  FOR EACH ROW EXECUTE FUNCTION update_community_comment_count();

-- Reactions remain the existing JSON counters, but increments are now atomic
-- and do not require broad UPDATE access to somebody else's post.
CREATE OR REPLACE FUNCTION react_to_community_post(p_post_id UUID, p_reaction TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE updated JSONB;
BEGIN
  IF auth.uid() IS NULL OR p_reaction NOT IN ('heart', 'clap', 'handshake') THEN
    RAISE EXCEPTION 'invalid reaction' USING ERRCODE = 'check_violation';
  END IF;
  UPDATE community_posts
  SET reactions = jsonb_set(
    reactions,
    ARRAY[p_reaction],
    to_jsonb(COALESCE((reactions ->> p_reaction)::INTEGER, 0) + 1),
    TRUE
  )
  WHERE id = p_post_id AND removed_at IS NULL AND moderation_status = 'published'
  RETURNING reactions INTO updated;
  IF updated IS NULL THEN RAISE EXCEPTION 'post unavailable' USING ERRCODE = 'no_data_found'; END IF;
  RETURN updated;
END;
$$;
REVOKE ALL ON FUNCTION react_to_community_post(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION react_to_community_post(UUID, TEXT) TO authenticated;

-- Idempotently enable the same Postgres Changes transport already used by DMs.
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE community_posts;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE community_comments;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
