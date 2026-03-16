BEGIN;

-- ============================================================
-- BACKFILL distinct lead metrics with stable CTE scope
-- - total_distincts_leads
-- - distinct_lead_breakdown
--
-- RULES:
-- Developers: profile, listings, development
-- Agents:     profile, listings
-- Agencies:   profile, listings, agents
--   - profile  = agency profile leads
--   - listings = leads from agent listings under agency
--   - agents   = leads from agent profiles under agency
--
-- DISTINCT KEY:
-- - profile:     profile + seeker
-- - listing:     listing_id + seeker
-- - development: development_id + seeker
-- - manual leads (seeker_id IS NULL): each lead row is distinct via lead.id
-- ============================================================

-- =========================
-- 1) DEVELOPERS
-- =========================
WITH dev_listing_map AS (
  SELECT id AS listing_id, user_id AS developer_id
  FROM public.listings
  WHERE account_type = 'developer'
),
dev_development_map AS (
  SELECT id::text AS development_id, developer_id
  FROM public.developments
),
dev_raw AS (
  SELECT
    d.developer_id,
    l.context_type,
    CASE
      WHEN l.context_type = 'profile' THEN
        'profile|' || COALESCE(l.seeker_id::text, 'manual:' || l.id::text)
      WHEN l.context_type = 'listing' THEN
        'listing|' || COALESCE(l.listing_id::text, 'unknown') || '|' || COALESCE(l.seeker_id::text, 'manual:' || l.id::text)
      WHEN l.context_type = 'development' THEN
        'development|' || COALESCE(l.development_id::text, 'unknown') || '|' || COALESCE(l.seeker_id::text, 'manual:' || l.id::text)
      ELSE NULL
    END AS distinct_key
  FROM public.developers d
  JOIN public.leads l
    ON (
      (l.context_type = 'profile'
       AND l.lister_type = 'developer'
       AND l.lister_id = d.developer_id)
      OR
      (l.context_type = 'listing'
       AND (
         (l.lister_type = 'developer' AND l.lister_id = d.developer_id)
         OR EXISTS (
           SELECT 1
           FROM dev_listing_map dlm
           WHERE dlm.listing_id = l.listing_id
             AND dlm.developer_id = d.developer_id
         )
       ))
      OR
      (l.context_type = 'development'
       AND (
         (l.lister_type = 'developer' AND l.lister_id = d.developer_id)
         OR EXISTS (
           SELECT 1
           FROM dev_development_map ddm
           WHERE ddm.development_id = l.development_id::text
             AND ddm.developer_id = d.developer_id
         )
       ))
    )
),
dev_distinct AS (
  SELECT developer_id, context_type, distinct_key
  FROM dev_raw
  WHERE distinct_key IS NOT NULL
  GROUP BY developer_id, context_type, distinct_key
),
dev_counts AS (
  SELECT
    developer_id,
    COUNT(*)::int AS total_distincts_leads,
    COUNT(*) FILTER (WHERE context_type = 'profile')::int AS profile_total,
    COUNT(*) FILTER (WHERE context_type = 'listing')::int AS listings_total,
    COUNT(*) FILTER (WHERE context_type = 'development')::int AS development_total
  FROM dev_distinct
  GROUP BY developer_id
)
UPDATE public.developers d
SET
  total_distincts_leads = COALESCE(c.total_distincts_leads, 0),
  distinct_lead_breakdown = jsonb_build_object(
    'profile', jsonb_build_object(
      'total_amount', COALESCE(c.profile_total, 0),
      'percentage',
        CASE WHEN COALESCE(c.total_distincts_leads, 0) = 0 THEN 0
             ELSE ROUND((COALESCE(c.profile_total, 0)::numeric / c.total_distincts_leads::numeric) * 100, 2)
        END
    ),
    'listings', jsonb_build_object(
      'total_amount', COALESCE(c.listings_total, 0),
      'percentage',
        CASE WHEN COALESCE(c.total_distincts_leads, 0) = 0 THEN 0
             ELSE ROUND((COALESCE(c.listings_total, 0)::numeric / c.total_distincts_leads::numeric) * 100, 2)
        END
    ),
    'development', jsonb_build_object(
      'total_amount', COALESCE(c.development_total, 0),
      'percentage',
        CASE WHEN COALESCE(c.total_distincts_leads, 0) = 0 THEN 0
             ELSE ROUND((COALESCE(c.development_total, 0)::numeric / c.total_distincts_leads::numeric) * 100, 2)
        END
    )
  )
FROM (
  SELECT developer_id, total_distincts_leads, profile_total, listings_total, development_total
  FROM dev_counts
) c
WHERE d.developer_id = c.developer_id;

-- Fill developers with no matched leads
UPDATE public.developers d
SET
  total_distincts_leads = 0,
  distinct_lead_breakdown = jsonb_build_object(
    'profile', jsonb_build_object('total_amount', 0, 'percentage', 0),
    'listings', jsonb_build_object('total_amount', 0, 'percentage', 0),
    'development', jsonb_build_object('total_amount', 0, 'percentage', 0)
  )
WHERE d.developer_id NOT IN (
  SELECT developer_id FROM (
    WITH dev_listing_map AS (
      SELECT id AS listing_id, user_id AS developer_id
      FROM public.listings
      WHERE account_type = 'developer'
    ),
    dev_development_map AS (
      SELECT id::text AS development_id, developer_id
      FROM public.developments
    ),
    dev_raw AS (
      SELECT d2.developer_id, l.context_type,
        CASE
          WHEN l.context_type = 'profile' THEN 'profile|' || COALESCE(l.seeker_id::text, 'manual:' || l.id::text)
          WHEN l.context_type = 'listing' THEN 'listing|' || COALESCE(l.listing_id::text, 'unknown') || '|' || COALESCE(l.seeker_id::text, 'manual:' || l.id::text)
          WHEN l.context_type = 'development' THEN 'development|' || COALESCE(l.development_id::text, 'unknown') || '|' || COALESCE(l.seeker_id::text, 'manual:' || l.id::text)
          ELSE NULL
        END AS distinct_key
      FROM public.developers d2
      JOIN public.leads l
        ON (
          (l.context_type = 'profile' AND l.lister_type = 'developer' AND l.lister_id = d2.developer_id)
          OR
          (l.context_type = 'listing' AND (
            (l.lister_type = 'developer' AND l.lister_id = d2.developer_id)
            OR EXISTS (SELECT 1 FROM dev_listing_map dlm WHERE dlm.listing_id = l.listing_id AND dlm.developer_id = d2.developer_id)
          ))
          OR
          (l.context_type = 'development' AND (
            (l.lister_type = 'developer' AND l.lister_id = d2.developer_id)
            OR EXISTS (SELECT 1 FROM dev_development_map ddm WHERE ddm.development_id = l.development_id::text AND ddm.developer_id = d2.developer_id)
          ))
        )
    )
    SELECT DISTINCT developer_id FROM dev_raw WHERE distinct_key IS NOT NULL
  ) x
);

-- =========================
-- 2) AGENTS
-- =========================
WITH agent_listing_map AS (
  SELECT id AS listing_id, user_id AS agent_id
  FROM public.listings
  WHERE account_type = 'agent'
),
agent_raw AS (
  SELECT
    a.agent_id,
    l.context_type,
    CASE
      WHEN l.context_type = 'profile' THEN
        'profile|' || COALESCE(l.seeker_id::text, 'manual:' || l.id::text)
      WHEN l.context_type = 'listing' THEN
        'listing|' || COALESCE(l.listing_id::text, 'unknown') || '|' || COALESCE(l.seeker_id::text, 'manual:' || l.id::text)
      ELSE NULL
    END AS distinct_key
  FROM public.agents a
  JOIN public.leads l
    ON (
      (l.context_type = 'profile'
       AND l.lister_type = 'agent'
       AND l.lister_id = a.agent_id)
      OR
      (l.context_type = 'listing'
       AND (
         (l.lister_type = 'agent' AND l.lister_id = a.agent_id)
         OR EXISTS (
           SELECT 1
           FROM agent_listing_map alm
           WHERE alm.listing_id = l.listing_id
             AND alm.agent_id = a.agent_id
         )
       ))
    )
),
agent_distinct AS (
  SELECT agent_id, context_type, distinct_key
  FROM agent_raw
  WHERE distinct_key IS NOT NULL
  GROUP BY agent_id, context_type, distinct_key
),
agent_counts AS (
  SELECT
    agent_id,
    COUNT(*)::int AS total_distincts_leads,
    COUNT(*) FILTER (WHERE context_type = 'profile')::int AS profile_total,
    COUNT(*) FILTER (WHERE context_type = 'listing')::int AS listings_total
  FROM agent_distinct
  GROUP BY agent_id
)
UPDATE public.agents a
SET
  total_distincts_leads = COALESCE(c.total_distincts_leads, 0),
  distinct_lead_breakdown = jsonb_build_object(
    'profile', jsonb_build_object(
      'total_amount', COALESCE(c.profile_total, 0),
      'percentage',
        CASE WHEN COALESCE(c.total_distincts_leads, 0) = 0 THEN 0
             ELSE ROUND((COALESCE(c.profile_total, 0)::numeric / c.total_distincts_leads::numeric) * 100, 2)
        END
    ),
    'listings', jsonb_build_object(
      'total_amount', COALESCE(c.listings_total, 0),
      'percentage',
        CASE WHEN COALESCE(c.total_distincts_leads, 0) = 0 THEN 0
             ELSE ROUND((COALESCE(c.listings_total, 0)::numeric / c.total_distincts_leads::numeric) * 100, 2)
        END
    )
  )
FROM (
  SELECT agent_id, total_distincts_leads, profile_total, listings_total
  FROM agent_counts
) c
WHERE a.agent_id = c.agent_id;

-- Fill agents with no matched leads
UPDATE public.agents a
SET
  total_distincts_leads = 0,
  distinct_lead_breakdown = jsonb_build_object(
    'profile', jsonb_build_object('total_amount', 0, 'percentage', 0),
    'listings', jsonb_build_object('total_amount', 0, 'percentage', 0)
  )
WHERE a.agent_id NOT IN (
  SELECT agent_id FROM (
    WITH agent_listing_map AS (
      SELECT id AS listing_id, user_id AS agent_id
      FROM public.listings
      WHERE account_type = 'agent'
    ),
    agent_raw AS (
      SELECT a2.agent_id,
        CASE
          WHEN l.context_type = 'profile' THEN 'profile|' || COALESCE(l.seeker_id::text, 'manual:' || l.id::text)
          WHEN l.context_type = 'listing' THEN 'listing|' || COALESCE(l.listing_id::text, 'unknown') || '|' || COALESCE(l.seeker_id::text, 'manual:' || l.id::text)
          ELSE NULL
        END AS distinct_key
      FROM public.agents a2
      JOIN public.leads l
        ON (
          (l.context_type = 'profile' AND l.lister_type = 'agent' AND l.lister_id = a2.agent_id)
          OR
          (l.context_type = 'listing' AND (
            (l.lister_type = 'agent' AND l.lister_id = a2.agent_id)
            OR EXISTS (SELECT 1 FROM agent_listing_map alm WHERE alm.listing_id = l.listing_id AND alm.agent_id = a2.agent_id)
          ))
        )
    )
    SELECT DISTINCT agent_id FROM agent_raw WHERE distinct_key IS NOT NULL
  ) y
);

-- =========================
-- 3) AGENCIES
-- =========================
WITH agency_agents AS (
  SELECT agency_id, agent_id
  FROM public.agents
  WHERE agency_id IS NOT NULL
),
agency_agent_listings AS (
  SELECT aa.agency_id, l.id AS listing_id, l.user_id AS agent_id
  FROM agency_agents aa
  JOIN public.listings l
    ON l.user_id = aa.agent_id
   AND l.account_type = 'agent'
),
agency_raw AS (
  SELECT
    ag.agency_id,
    CASE
      WHEN l.context_type = 'profile'
       AND l.lister_type = 'agency'
       AND l.lister_id = ag.agency_id
      THEN 'profile'

      WHEN l.context_type = 'profile'
       AND l.lister_type = 'agent'
       AND EXISTS (
         SELECT 1
         FROM agency_agents aa
         WHERE aa.agency_id = ag.agency_id
           AND aa.agent_id = l.lister_id
       )
      THEN 'agents'

      WHEN l.context_type = 'listing'
       AND (
         EXISTS (
           SELECT 1
           FROM agency_agent_listings aal
           WHERE aal.agency_id = ag.agency_id
             AND aal.listing_id = l.listing_id
         )
         OR (
           l.lister_type = 'agent'
           AND EXISTS (
             SELECT 1
             FROM agency_agents aa
             WHERE aa.agency_id = ag.agency_id
               AND aa.agent_id = l.lister_id
           )
           AND l.listing_id IS NULL
         )
       )
      THEN 'listings'

      ELSE NULL
    END AS bucket,
    CASE
      WHEN l.context_type = 'profile'
       AND l.lister_type = 'agency'
       AND l.lister_id = ag.agency_id
      THEN 'agency_profile|' || COALESCE(l.seeker_id::text, 'manual:' || l.id::text)

      WHEN l.context_type = 'profile'
       AND l.lister_type = 'agent'
       AND EXISTS (
         SELECT 1
         FROM agency_agents aa
         WHERE aa.agency_id = ag.agency_id
           AND aa.agent_id = l.lister_id
       )
      THEN 'agent_profile|' || l.lister_id::text || '|' || COALESCE(l.seeker_id::text, 'manual:' || l.id::text)

      WHEN l.context_type = 'listing'
       AND (
         EXISTS (
           SELECT 1
           FROM agency_agent_listings aal
           WHERE aal.agency_id = ag.agency_id
             AND aal.listing_id = l.listing_id
         )
         OR (
           l.lister_type = 'agent'
           AND EXISTS (
             SELECT 1
             FROM agency_agents aa
             WHERE aa.agency_id = ag.agency_id
               AND aa.agent_id = l.lister_id
           )
           AND l.listing_id IS NULL
         )
       )
      THEN 'agent_listing|' || COALESCE(l.listing_id::text, 'unknown_agent:' || l.lister_id::text) || '|' || COALESCE(l.seeker_id::text, 'manual:' || l.id::text)

      ELSE NULL
    END AS distinct_key
  FROM public.agencies ag
  JOIN public.leads l ON TRUE
),
agency_distinct AS (
  SELECT agency_id, bucket, distinct_key
  FROM agency_raw
  WHERE bucket IS NOT NULL
    AND distinct_key IS NOT NULL
  GROUP BY agency_id, bucket, distinct_key
),
agency_counts AS (
  SELECT
    agency_id,
    COUNT(*)::int AS total_distincts_leads,
    COUNT(*) FILTER (WHERE bucket = 'profile')::int AS profile_total,
    COUNT(*) FILTER (WHERE bucket = 'listings')::int AS listings_total,
    COUNT(*) FILTER (WHERE bucket = 'agents')::int AS agents_total
  FROM agency_distinct
  GROUP BY agency_id
)
UPDATE public.agencies ag
SET
  total_distincts_leads = COALESCE(c.total_distincts_leads, 0),
  distinct_lead_breakdown = jsonb_build_object(
    'profile', jsonb_build_object(
      'total_amount', COALESCE(c.profile_total, 0),
      'percentage',
        CASE WHEN COALESCE(c.total_distincts_leads, 0) = 0 THEN 0
             ELSE ROUND((COALESCE(c.profile_total, 0)::numeric / c.total_distincts_leads::numeric) * 100, 2)
        END
    ),
    'listings', jsonb_build_object(
      'total_amount', COALESCE(c.listings_total, 0),
      'percentage',
        CASE WHEN COALESCE(c.total_distincts_leads, 0) = 0 THEN 0
             ELSE ROUND((COALESCE(c.listings_total, 0)::numeric / c.total_distincts_leads::numeric) * 100, 2)
        END
    ),
    'agents', jsonb_build_object(
      'total_amount', COALESCE(c.agents_total, 0),
      'percentage',
        CASE WHEN COALESCE(c.total_distincts_leads, 0) = 0 THEN 0
             ELSE ROUND((COALESCE(c.agents_total, 0)::numeric / c.total_distincts_leads::numeric) * 100, 2)
        END
    )
  )
FROM (
  SELECT agency_id, total_distincts_leads, profile_total, listings_total, agents_total
  FROM agency_counts
) c
WHERE ag.agency_id = c.agency_id;

-- Fill agencies with no matched leads
UPDATE public.agencies ag
SET
  total_distincts_leads = 0,
  distinct_lead_breakdown = jsonb_build_object(
    'profile', jsonb_build_object('total_amount', 0, 'percentage', 0),
    'listings', jsonb_build_object('total_amount', 0, 'percentage', 0),
    'agents', jsonb_build_object('total_amount', 0, 'percentage', 0)
  )
WHERE ag.agency_id NOT IN (
  SELECT agency_id FROM (
    WITH agency_agents AS (
      SELECT agency_id, agent_id
      FROM public.agents
      WHERE agency_id IS NOT NULL
    ),
    agency_agent_listings AS (
      SELECT aa.agency_id, l.id AS listing_id, l.user_id AS agent_id
      FROM agency_agents aa
      JOIN public.listings l
        ON l.user_id = aa.agent_id
       AND l.account_type = 'agent'
    ),
    agency_raw AS (
      SELECT
        ag2.agency_id,
        CASE
          WHEN l.context_type = 'profile' AND l.lister_type = 'agency' AND l.lister_id = ag2.agency_id
            THEN 'agency_profile|' || COALESCE(l.seeker_id::text, 'manual:' || l.id::text)
          WHEN l.context_type = 'profile' AND l.lister_type = 'agent'
            AND EXISTS (SELECT 1 FROM agency_agents aa WHERE aa.agency_id = ag2.agency_id AND aa.agent_id = l.lister_id)
            THEN 'agent_profile|' || l.lister_id::text || '|' || COALESCE(l.seeker_id::text, 'manual:' || l.id::text)
          WHEN l.context_type = 'listing'
            AND (
              EXISTS (SELECT 1 FROM agency_agent_listings aal WHERE aal.agency_id = ag2.agency_id AND aal.listing_id = l.listing_id)
              OR (
                l.lister_type = 'agent'
                AND EXISTS (SELECT 1 FROM agency_agents aa WHERE aa.agency_id = ag2.agency_id AND aa.agent_id = l.lister_id)
                AND l.listing_id IS NULL
              )
            )
            THEN 'agent_listing|' || COALESCE(l.listing_id::text, 'unknown_agent:' || l.lister_id::text) || '|' || COALESCE(l.seeker_id::text, 'manual:' || l.id::text)
          ELSE NULL
        END AS distinct_key
      FROM public.agencies ag2
      JOIN public.leads l ON TRUE
    )
    SELECT DISTINCT agency_id FROM agency_raw WHERE distinct_key IS NOT NULL
  ) z
);

COMMIT;

