-- 028 — The nearby feed must not return future-dated posts.
--
-- Official starter posts are drip-scheduled into the future. community_feed_nearby
-- ordered by created_at DESC with no upper bound, so the first page came back
-- full of future posts. The client hides future-dated rows, leaving the page
-- visibly empty, which made the app fall back to the non-interactive local seed
-- — so reactions and comments were greyed out even though real, interactive
-- posts existed. Excluding future posts server-side means the first page is the
-- newest posts that are actually live now.

CREATE OR REPLACE FUNCTION community_feed_nearby(p_limit INT, p_offset INT)
RETURNS SETOF community_posts
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH me AS (
    SELECT location_lat AS lat, location_lng AS lng FROM profiles WHERE id = auth.uid()
  )
  SELECT p.* FROM community_posts p
  LEFT JOIN profiles pr ON pr.id = p.user_id
  CROSS JOIN me
  WHERE auth.uid() IS NOT NULL
    AND p.removed_at IS NULL AND p.moderation_status = 'published'
    AND p.created_at <= now()
  ORDER BY
    CASE WHEN me.lat IS NOT NULL AND pr.location_lat IS NOT NULL
      AND ((pr.location_lat - me.lat)^2 + (pr.location_lng - me.lng)^2) < 0.25
      THEN 0 ELSE 1 END,
    p.created_at DESC
  LIMIT p_limit OFFSET p_offset;
$$;
