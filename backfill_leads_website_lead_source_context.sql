-- =============================================================================
-- Backfill: random lead_source_context for historical website leads
--
-- Scope: rows where lead_source is website (case-insensitive) and
--        lead_source_context IS NULL or empty.
-- Each row gets an independent random pick from the same allowlist as the app
-- (home, explore, search, profile, directory, featured, recommendations, development).
--
-- Does NOT recompute listing_analytics / user_analytics / rollups — only `leads`.
-- Run add_lead_source_attribution_breakdown.sql first if leads.lead_source_context
-- does not exist yet.
-- =============================================================================

-- Preview (optional — uncomment to run)
-- SELECT id, lead_source, lead_source_context
-- FROM leads
-- WHERE lower(trim(coalesce(lead_source, ''))) = 'website'
--   AND (lead_source_context IS NULL OR trim(lead_source_context) = '')
-- LIMIT 50;

UPDATE leads AS l
SET lead_source_context = ctx.pool[(floor(random() * array_length(ctx.pool, 1)) + 1)::int]
FROM (
  SELECT ARRAY[
    'home',
    'explore',
    'search',
    'profile',
    'directory',
    'featured',
    'recommendations',
    'development'
  ]::varchar(64)[] AS pool
) AS ctx
WHERE lower(trim(coalesce(l.lead_source, ''))) = 'website'
  AND (l.lead_source_context IS NULL OR trim(l.lead_source_context) = '');

-- Verify
-- SELECT lead_source_context, count(*) FROM leads WHERE lower(trim(coalesce(lead_source,''))) = 'website' GROUP BY 1 ORDER BY 2 DESC;
