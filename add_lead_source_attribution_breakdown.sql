-- =============================================================================
-- Lead attribution: per-lead context + aggregated source breakdown (JSONB)
--
-- Raw facts: leads.lead_source_context (nullable; set when lead_source = website)
-- Time series: listing_analytics, user_analytics — lead_source_breakdown per bucket
-- Rollups: listings + developers/agents/agencies — cumulative distinct-lead breakdown
--
-- Expected JSON shape for lead_source_breakdown (example):
-- {
--   "website": {
--     "amount": 10,
--     "percentage": 25.0,
--     "context_breakdown": {
--       "home": { "amount": 4, "percentage": 40.0 },
--       "profile": { "amount": 2, "percentage": 20.0 }
--     }
--   },
--   "facebook": { "amount": 30, "percentage": 75.0 }
-- }
-- Inner context_breakdown percentages: typically % of website-sourced distinct leads.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. leads — per-row attribution (not the aggregate JSON)
-- -----------------------------------------------------------------------------
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS lead_source_context VARCHAR(64) NULL;

COMMENT ON COLUMN leads.lead_source_context IS
  'When lead_source is website: in-app surface (home, explore, search, profile, etc.). NULL when lead_source is not website or unknown.';

CREATE INDEX IF NOT EXISTS idx_leads_lead_source_context
ON leads (lead_source_context)
WHERE lead_source_context IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_leads_lead_source_and_context
ON leads (lead_source, lead_source_context);


-- -----------------------------------------------------------------------------
-- 2. listing_analytics — hourly (listing_id, date, hour) distinct-lead breakdown
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'listing_analytics' AND column_name = 'lead_source_breakdown'
  ) THEN
    ALTER TABLE listing_analytics
    ADD COLUMN lead_source_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb;
    RAISE NOTICE 'Added lead_source_breakdown to listing_analytics';
  END IF;
END $$;

COMMENT ON COLUMN listing_analytics.lead_source_breakdown IS
  'Distinct leads in this listing + date + hour bucket, by lead_source; website entry may include context_breakdown.';

CREATE INDEX IF NOT EXISTS idx_listing_analytics_lead_source_breakdown
ON listing_analytics USING GIN (lead_source_breakdown);


-- -----------------------------------------------------------------------------
-- 3. user_analytics — hourly (user_id, user_type, date, hour) breakdown
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_analytics' AND column_name = 'lead_source_breakdown'
  ) THEN
    ALTER TABLE user_analytics
    ADD COLUMN lead_source_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb;
    RAISE NOTICE 'Added lead_source_breakdown to user_analytics';
  END IF;
END $$;

COMMENT ON COLUMN user_analytics.lead_source_breakdown IS
  'Distinct leads for this user account in this date+hour, by lead_source; website may include nested context_breakdown.';

CREATE INDEX IF NOT EXISTS idx_user_analytics_lead_source_breakdown
ON user_analytics USING GIN (lead_source_breakdown);


-- -----------------------------------------------------------------------------
-- 4. listings — cumulative aggregate for the listing (matches listing_* pattern)
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'listings' AND column_name = 'listing_lead_source_breakdown'
  ) THEN
    ALTER TABLE listings
    ADD COLUMN listing_lead_source_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb;
    RAISE NOTICE 'Added listing_lead_source_breakdown to listings';
  END IF;
END $$;

COMMENT ON COLUMN listings.listing_lead_source_breakdown IS
  'All-time (or job-defined window) distinct-lead lead_source breakdown for this listing; website may include context_breakdown.';

CREATE INDEX IF NOT EXISTS idx_listings_listing_lead_source_breakdown
ON listings USING GIN (listing_lead_source_breakdown);


-- -----------------------------------------------------------------------------
-- 5. developers — account-level cumulative aggregate
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'developers'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'developers' AND column_name = 'lead_source_breakdown'
  ) THEN
    ALTER TABLE developers
    ADD COLUMN lead_source_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb;
    RAISE NOTICE 'Added lead_source_breakdown to developers';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'developers' AND column_name = 'lead_source_breakdown'
  ) THEN
    EXECUTE 'COMMENT ON COLUMN developers.lead_source_breakdown IS ' ||
      quote_literal('Cumulative distinct-lead breakdown by lead_source for this developer account.');
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'developers') THEN
    CREATE INDEX IF NOT EXISTS idx_developers_lead_source_breakdown
    ON developers USING GIN (lead_source_breakdown);
  END IF;
END $$;


-- -----------------------------------------------------------------------------
-- 6. agents — account-level cumulative aggregate
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'agents'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'agents' AND column_name = 'lead_source_breakdown'
  ) THEN
    ALTER TABLE agents
    ADD COLUMN lead_source_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb;
    RAISE NOTICE 'Added lead_source_breakdown to agents';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'agents' AND column_name = 'lead_source_breakdown'
  ) THEN
    EXECUTE 'COMMENT ON COLUMN agents.lead_source_breakdown IS ' ||
      quote_literal('Cumulative distinct-lead breakdown by lead_source for this agent account.');
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agents') THEN
    CREATE INDEX IF NOT EXISTS idx_agents_lead_source_breakdown
    ON agents USING GIN (lead_source_breakdown);
  END IF;
END $$;


-- -----------------------------------------------------------------------------
-- 7. agencies — account-level cumulative aggregate
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'agencies'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'agencies' AND column_name = 'lead_source_breakdown'
  ) THEN
    ALTER TABLE agencies
    ADD COLUMN lead_source_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb;
    RAISE NOTICE 'Added lead_source_breakdown to agencies';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'agencies' AND column_name = 'lead_source_breakdown'
  ) THEN
    EXECUTE 'COMMENT ON COLUMN agencies.lead_source_breakdown IS ' ||
      quote_literal('Cumulative distinct-lead breakdown by lead_source for this agency account.');
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agencies') THEN
    CREATE INDEX IF NOT EXISTS idx_agencies_lead_source_breakdown
    ON agencies USING GIN (lead_source_breakdown);
  END IF;
END $$;
