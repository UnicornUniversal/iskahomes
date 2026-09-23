-- =============================================================================
-- Lead source: website → iskahomes, free-form partner sources (crm, api, …)
-- Use lead_source only going forward. lead_origin is left in place but unused.
--
-- Run this in the Supabase SQL editor, then tell the app to switch copy/code.
-- =============================================================================

-- 1) lead_source is just text — no CHECK constraint. Keep VARCHAR, allow crm / api / etc.
ALTER TABLE public.leads
  ALTER COLUMN lead_source TYPE character varying(64);

COMMENT ON COLUMN public.leads.lead_source IS
  'Channel the lead came through: iskahomes, whatsapp, facebook, crm, api, referral, walk_in, etc. Free token, lowercase.';

COMMENT ON COLUMN public.leads.lead_origin IS
  'Deprecated. Use lead_source only. Kept for old rows.';

COMMENT ON COLUMN public.leads.lead_source_context IS
  'When lead_source is iskahomes: in-app surface (home, explore, search, profile, etc.). NULL otherwise.';


-- 2) Existing Iska website leads → iskahomes
UPDATE public.leads
SET lead_source = 'iskahomes'
WHERE lower(trim(coalesce(lead_source, ''))) = 'website';

-- Rows that never had a source: copy origin, mapping platform → iskahomes
UPDATE public.leads
SET lead_source = CASE
  WHEN lower(trim(lead_origin)) = 'platform' THEN 'iskahomes'
  WHEN lower(trim(lead_origin)) = 'their_website' THEN 'api'
  ELSE left(regexp_replace(lower(trim(lead_origin)), '[^a-z0-9_-]', '_', 'g'), 64)
END
WHERE (lead_source IS NULL OR trim(lead_source) = '')
  AND lead_origin IS NOT NULL
  AND trim(lead_origin) <> '';


-- 3) JSON helpers: rename key "website" → "iskahomes" (merge amounts if both exist)
CREATE OR REPLACE FUNCTION public.rename_lead_source_json_key(p JSONB)
RETURNS JSONB
LANGUAGE plpgsql
IMMUTABLE
AS $fn$
DECLARE
  src JSONB := coalesce(p, '{}'::jsonb);
  old JSONB;
  neu JSONB;
  merged JSONB;
  old_amt NUMERIC;
  new_amt NUMERIC;
  total NUMERIC;
  k TEXT;
  e JSONB;
BEGIN
  IF src = '{}'::jsonb OR NOT src ? 'website' THEN
    RETURN src;
  END IF;

  old := src -> 'website';
  src := src - 'website';

  IF src ? 'iskahomes' THEN
    neu := src -> 'iskahomes';
    old_amt := coalesce((old ->> 'amount')::NUMERIC, 0);
    new_amt := coalesce((neu ->> 'amount')::NUMERIC, 0);
    merged := jsonb_build_object(
      'amount', old_amt + new_amt,
      'percentage', coalesce((neu ->> 'percentage')::NUMERIC, 0)
    );
    IF (old ? 'context_breakdown') OR (neu ? 'context_breakdown') THEN
      merged := merged || jsonb_build_object(
        'context_breakdown',
        coalesce(neu -> 'context_breakdown', '{}'::jsonb)
          || coalesce(old -> 'context_breakdown', '{}'::jsonb)
      );
    END IF;
    src := src || jsonb_build_object('iskahomes', merged);
  ELSE
    src := src || jsonb_build_object('iskahomes', old);
  END IF;

  total := 0;
  FOR k, e IN SELECT * FROM jsonb_each(src)
  LOOP
    total := total + coalesce((e ->> 'amount')::NUMERIC, 0);
  END LOOP;

  IF total > 0 THEN
    FOR k, e IN SELECT * FROM jsonb_each(src)
    LOOP
      src := src || jsonb_build_object(
        k,
        e || jsonb_build_object(
          'percentage',
          round((coalesce((e ->> 'amount')::NUMERIC, 0) / total * 100)::NUMERIC, 2)
        )
      );
    END LOOP;
  END IF;

  RETURN src;
END;
$fn$;


UPDATE public.listings
SET listing_lead_source_breakdown = public.rename_lead_source_json_key(listing_lead_source_breakdown)
WHERE listing_lead_source_breakdown ? 'website';

UPDATE public.developers
SET lead_source_breakdown = public.rename_lead_source_json_key(lead_source_breakdown)
WHERE lead_source_breakdown ? 'website';

UPDATE public.agents
SET lead_source_breakdown = public.rename_lead_source_json_key(lead_source_breakdown)
WHERE lead_source_breakdown ? 'website';

UPDATE public.agencies
SET lead_source_breakdown = public.rename_lead_source_json_key(lead_source_breakdown)
WHERE lead_source_breakdown ? 'website';

UPDATE public.listing_analytics
SET lead_source_breakdown = public.rename_lead_source_json_key(lead_source_breakdown)
WHERE lead_source_breakdown ? 'website';

UPDATE public.user_analytics
SET lead_source_breakdown = public.rename_lead_source_json_key(lead_source_breakdown)
WHERE lead_source_breakdown ? 'website';


-- 4) Rebuild functions: default + context nest under iskahomes (not website)
CREATE OR REPLACE FUNCTION public.normalize_lead_source_key(p TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $f$
  SELECT CASE
    WHEN coalesce(
      nullif(
        left(
          regexp_replace(lower(trim(coalesce(p, 'iskahomes'))), '[^a-z0-9_-]', '_', 'g'),
          64
        ),
        ''
      ),
      ''
    ) = '' THEN 'iskahomes'
    WHEN left(
      regexp_replace(lower(trim(coalesce(p, 'iskahomes'))), '[^a-z0-9_-]', '_', 'g'),
      64
    ) = 'website' THEN 'iskahomes'
    ELSE left(
      regexp_replace(lower(trim(coalesce(p, 'iskahomes'))), '[^a-z0-9_-]', '_', 'g'),
      64
    )
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

    IF r.sk = 'iskahomes' THEN
      ctx_obj := '{}'::jsonb;
      FOR ctx_rec IN
        SELECT ck AS ctx_key, COUNT(*)::INT AS ca
        FROM (
          SELECT public.normalize_lead_source_context_key(lead_source_context) AS ck
          FROM public.leads
          WHERE context_type = 'listing'
            AND listing_id = p_listing_id
            AND public.normalize_lead_source_key(lead_source) = 'iskahomes'
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

    IF r.sk = 'iskahomes' THEN
      ctx_obj := '{}'::jsonb;
      FOR ctx_rec IN
        SELECT ck AS ctx_key, COUNT(*)::INT AS ca
        FROM (
          SELECT public.normalize_lead_source_context_key(lead_source_context) AS ck
          FROM public.leads
          WHERE lister_id = p_lister_id
            AND lower(trim(lister_type)) = lt
            AND public.normalize_lead_source_key(lead_source) = 'iskahomes'
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


-- Optional check
-- SELECT lead_source, count(*) FROM public.leads GROUP BY 1 ORDER BY 2 DESC;
-- SELECT count(*) FROM public.leads WHERE lower(trim(coalesce(lead_source,''))) = 'website';
