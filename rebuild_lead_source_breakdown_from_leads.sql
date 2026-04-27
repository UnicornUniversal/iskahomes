-- =============================================================================
-- Rebuild lead-source JSON aggregates from the `leads` table
--
-- Updates:
--   - listings.listing_lead_source_breakdown  (from leads where context_type = 'listing')
--   - developers.lead_source_breakdown        (from leads where lister_id + lister_type match)
--   - agents.lead_source_breakdown
--   - agencies.lead_source_breakdown
--
-- Shape matches app logic (see src/lib/leadSourceBreakdownAggregation.js):
--   - Top-level keys = normalized lead_source
--   - website entry includes context_breakdown (possibly '{}') with allowed contexts only
--   - Percentages: outer = % of all leads in scope; inner = % of website leads per context
--
-- Prerequisites: add_lead_source_attribution_breakdown.sql (columns exist)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.normalize_lead_source_key(p TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $f$
  SELECT CASE
    WHEN coalesce(
      nullif(
        left(
          regexp_replace(lower(trim(coalesce(p, 'website'))), '[^a-z0-9_-]', '_', 'g'),
          64
        ),
        ''
      ),
      ''
    ) = '' THEN 'website'
    ELSE left(
      regexp_replace(lower(trim(coalesce(p, 'website'))), '[^a-z0-9_-]', '_', 'g'),
      64
    )
  END;
$f$;

CREATE OR REPLACE FUNCTION public.is_allowed_lead_source_context(p TEXT)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
AS $f$
  SELECT lower(trim(coalesce(p, ''))) IN (
    'home', 'explore', 'search', 'profile', 'directory',
    'featured', 'recommendations', 'development'
  );
$f$;

CREATE OR REPLACE FUNCTION public.normalize_lead_source_context_key(p TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $f$
  SELECT CASE
    WHEN public.is_allowed_lead_source_context(p) THEN
      left(regexp_replace(lower(trim(p)), '[^a-z0-9_-]', '_', 'g'), 64)
    ELSE NULL
  END;
$f$;


CREATE OR REPLACE FUNCTION public.rebuild_listing_lead_source_breakdown_json(p_listing_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $fn$
DECLARE
  result JSONB := '{}'::jsonb;
  r RECORD;
  total_n NUMERIC;
  ctx_obj JSONB;
  pct NUMERIC;
  inner_pct NUMERIC;
  ctx_rec RECORD;
BEGIN
  SELECT COUNT(*)::NUMERIC INTO total_n
  FROM public.leads
  WHERE context_type = 'listing'
    AND listing_id = p_listing_id;

  IF total_n IS NULL OR total_n = 0 THEN
    RETURN '{}'::jsonb;
  END IF;

  FOR r IN
    SELECT sk, COUNT(*)::INT AS amt
    FROM (
      SELECT public.normalize_lead_source_key(lead_source) AS sk
      FROM public.leads
      WHERE context_type = 'listing'
        AND listing_id = p_listing_id
    ) s
    GROUP BY sk
    ORDER BY sk
  LOOP
    pct := ROUND((r.amt / total_n * 100)::NUMERIC, 2);

    IF r.sk = 'website' THEN
      ctx_obj := '{}'::jsonb;
      FOR ctx_rec IN
        SELECT ck AS ctx_key, COUNT(*)::INT AS ca
        FROM (
          SELECT public.normalize_lead_source_context_key(lead_source_context) AS ck
          FROM public.leads
          WHERE context_type = 'listing'
            AND listing_id = p_listing_id
            AND public.normalize_lead_source_key(lead_source) = 'website'
        ) c
        WHERE ck IS NOT NULL
        GROUP BY ck
      LOOP
        inner_pct := ROUND((ctx_rec.ca::NUMERIC / NULLIF(r.amt, 0) * 100)::NUMERIC, 2);
        ctx_obj := ctx_obj || jsonb_build_object(
          ctx_rec.ctx_key,
          jsonb_build_object('amount', ctx_rec.ca, 'percentage', inner_pct)
        );
      END LOOP;

      result := result || jsonb_build_object(
        r.sk,
        jsonb_build_object(
          'amount', r.amt,
          'percentage', pct,
          'context_breakdown', COALESCE(ctx_obj, '{}'::jsonb)
        )
      );
    ELSE
      result := result || jsonb_build_object(
        r.sk,
        jsonb_build_object('amount', r.amt, 'percentage', pct)
      );
    END IF;
  END LOOP;

  RETURN result;
END;
$fn$;


CREATE OR REPLACE FUNCTION public.rebuild_account_lead_source_breakdown_json(
  p_lister_id UUID,
  p_lister_type TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $fn$
DECLARE
  result JSONB := '{}'::jsonb;
  r RECORD;
  total_n NUMERIC;
  ctx_obj JSONB;
  pct NUMERIC;
  inner_pct NUMERIC;
  ctx_rec RECORD;
  lt TEXT := lower(trim(coalesce(p_lister_type, '')));
BEGIN
  IF lt NOT IN ('developer', 'agent', 'agency') THEN
    RETURN '{}'::jsonb;
  END IF;

  SELECT COUNT(*)::NUMERIC INTO total_n
  FROM public.leads
  WHERE lister_id = p_lister_id
    AND lower(trim(lister_type)) = lt;

  IF total_n IS NULL OR total_n = 0 THEN
    RETURN '{}'::jsonb;
  END IF;

  FOR r IN
    SELECT sk, COUNT(*)::INT AS amt
    FROM (
      SELECT public.normalize_lead_source_key(lead_source) AS sk
      FROM public.leads
      WHERE lister_id = p_lister_id
        AND lower(trim(lister_type)) = lt
    ) s
    GROUP BY sk
    ORDER BY sk
  LOOP
    pct := ROUND((r.amt / total_n * 100)::NUMERIC, 2);

    IF r.sk = 'website' THEN
      ctx_obj := '{}'::jsonb;
      FOR ctx_rec IN
        SELECT ck AS ctx_key, COUNT(*)::INT AS ca
        FROM (
          SELECT public.normalize_lead_source_context_key(lead_source_context) AS ck
          FROM public.leads
          WHERE lister_id = p_lister_id
            AND lower(trim(lister_type)) = lt
            AND public.normalize_lead_source_key(lead_source) = 'website'
        ) c
        WHERE ck IS NOT NULL
        GROUP BY ck
      LOOP
        inner_pct := ROUND((ctx_rec.ca::NUMERIC / NULLIF(r.amt, 0) * 100)::NUMERIC, 2);
        ctx_obj := ctx_obj || jsonb_build_object(
          ctx_rec.ctx_key,
          jsonb_build_object('amount', ctx_rec.ca, 'percentage', inner_pct)
        );
      END LOOP;

      result := result || jsonb_build_object(
        r.sk,
        jsonb_build_object(
          'amount', r.amt,
          'percentage', pct,
          'context_breakdown', COALESCE(ctx_obj, '{}'::jsonb)
        )
      );
    ELSE
      result := result || jsonb_build_object(
        r.sk,
        jsonb_build_object('amount', r.amt, 'percentage', pct)
      );
    END IF;
  END LOOP;

  RETURN result;
END;
$fn$;


-- -----------------------------------------------------------------------------
-- Apply: listings (only rows that have at least one listing-context lead)
-- -----------------------------------------------------------------------------
UPDATE public.listings AS l
SET listing_lead_source_breakdown = public.rebuild_listing_lead_source_breakdown_json(l.id)
WHERE EXISTS (
  SELECT 1
  FROM public.leads z
  WHERE z.context_type = 'listing'
    AND z.listing_id = l.id
);


-- -----------------------------------------------------------------------------
-- Apply: lister accounts
-- -----------------------------------------------------------------------------
UPDATE public.developers AS d
SET lead_source_breakdown = public.rebuild_account_lead_source_breakdown_json(d.developer_id, 'developer')
WHERE EXISTS (
  SELECT 1
  FROM public.leads z
  WHERE z.lister_id = d.developer_id
    AND lower(trim(z.lister_type)) = 'developer'
);

UPDATE public.agents AS a
SET lead_source_breakdown = public.rebuild_account_lead_source_breakdown_json(a.agent_id, 'agent')
WHERE EXISTS (
  SELECT 1
  FROM public.leads z
  WHERE z.lister_id = a.agent_id
    AND lower(trim(z.lister_type)) = 'agent'
);

UPDATE public.agencies AS g
SET lead_source_breakdown = public.rebuild_account_lead_source_breakdown_json(g.agency_id, 'agency')
WHERE EXISTS (
  SELECT 1
  FROM public.leads z
  WHERE z.lister_id = g.agency_id
    AND lower(trim(z.lister_type)) = 'agency'
);


-- -----------------------------------------------------------------------------
-- Optional: zero out listings that have no listing-context leads (uncomment)
-- -----------------------------------------------------------------------------
-- UPDATE public.listings
-- SET listing_lead_source_breakdown = '{}'::jsonb
-- WHERE id NOT IN (
--   SELECT DISTINCT listing_id FROM public.leads
--   WHERE context_type = 'listing' AND listing_id IS NOT NULL
-- );


-- -----------------------------------------------------------------------------
-- Optional: drop helpers after run (uncomment if you do not want DB functions)
-- -----------------------------------------------------------------------------
-- DROP FUNCTION IF EXISTS public.rebuild_listing_lead_source_breakdown_json(uuid);
-- DROP FUNCTION IF EXISTS public.rebuild_account_lead_source_breakdown_json(uuid, text);
-- DROP FUNCTION IF EXISTS public.normalize_lead_source_context_key(text);
-- DROP FUNCTION IF EXISTS public.is_allowed_lead_source_context(text);
-- DROP FUNCTION IF EXISTS public.normalize_lead_source_key(text);
