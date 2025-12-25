-- ============================================================================
-- Add Lead Tracking Fields to Agencies & Agents Tables
-- ============================================================================
-- This script adds all required fields for dual tracking (agency's own vs cumulative from agents)
-- and lead tracking fields to match developers table structure
-- 
-- Note: No backfilling is done here. Backfilling will be handled by cron job later.
-- ============================================================================

-- ============================================================================
-- PART 1: UPDATE AGENCIES TABLE - Add New Fields
-- ============================================================================

-- Add profile-specific lead fields (from earlier analysis)
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS unique_leads integer DEFAULT 0;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS anonymous_leads integer DEFAULT 0;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS total_unique_leads integer DEFAULT 0;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS total_anonymous_leads integer DEFAULT 0;

-- Add agency's own metrics (from agency profile only)
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS agency_profile_leads integer DEFAULT 0;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS agency_appointments integer DEFAULT 0;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS agency_impressions integer DEFAULT 0;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS agency_saved integer DEFAULT 0;

-- Add cumulative metrics from agents (everything agents do)
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS agents_total_leads integer DEFAULT 0;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS agents_total_appointments integer DEFAULT 0;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS agents_total_impressions integer DEFAULT 0;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS agents_total_saved integer DEFAULT 0;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS agents_total_revenue numeric(15, 2) DEFAULT 0;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS agents_total_sales integer DEFAULT 0;

-- Add missing change tracking
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS revenue_change numeric(5, 2) DEFAULT 0;

-- Add impressions breakdown
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS impressions_breakdown jsonb DEFAULT '{}'::jsonb;

-- Add comments for documentation
COMMENT ON COLUMN agencies.unique_leads IS 'Profile-specific unique logged-in individuals (agency profile only)';
COMMENT ON COLUMN agencies.anonymous_leads IS 'Profile-specific unique anonymous individuals (agency profile only)';
COMMENT ON COLUMN agencies.total_unique_leads IS 'Aggregate unique logged-in individuals (agency profile + all agents)';
COMMENT ON COLUMN agencies.total_anonymous_leads IS 'Aggregate unique anonymous individuals (agency profile + all agents)';
COMMENT ON COLUMN agencies.agency_profile_leads IS 'Leads from agency profile only (not cumulative from agents)';
COMMENT ON COLUMN agencies.agency_appointments IS 'Appointments booked directly with agency (not cumulative from agents)';
COMMENT ON COLUMN agencies.agency_impressions IS 'Impressions on agency profile only (not cumulative from agents)';
COMMENT ON COLUMN agencies.agency_saved IS 'Properties saved from agency profile only (not cumulative from agents)';
COMMENT ON COLUMN agencies.agents_total_leads IS 'Cumulative total leads from all agents (agent profiles + agent listings)';
COMMENT ON COLUMN agencies.agents_total_appointments IS 'Cumulative total appointments from all agents';
COMMENT ON COLUMN agencies.agents_total_impressions IS 'Cumulative total impressions from all agents (agent profiles + agent listings)';
COMMENT ON COLUMN agencies.agents_total_saved IS 'Cumulative total saved properties from all agents';
COMMENT ON COLUMN agencies.agents_total_revenue IS 'Cumulative total revenue from all agents (agencies do not have listings, so revenue only comes from agents)';
COMMENT ON COLUMN agencies.agents_total_sales IS 'Cumulative total sales from all agents (agencies do not have listings, so sales only come from agents)';
COMMENT ON COLUMN agencies.total_leads IS 'Combined total: agency_profile_leads + agents_total_leads';
COMMENT ON COLUMN agencies.total_appointments IS 'Combined total: agency_appointments + agents_total_appointments';
COMMENT ON COLUMN agencies.total_impressions IS 'Combined total: agency_impressions + agents_total_impressions';
COMMENT ON COLUMN agencies.total_saved IS 'Combined total: agency_saved + agents_total_saved';
COMMENT ON COLUMN agencies.total_revenue IS 'Cumulative from agents only (equals agents_total_revenue, no agency component)';
COMMENT ON COLUMN agencies.total_sales IS 'Cumulative from agents only (equals agents_total_sales, no agency component)';
COMMENT ON COLUMN agencies.total_listings_views IS 'Cumulative from agents only (agencies do not have listings)';
COMMENT ON COLUMN agencies.revenue_change IS 'Period-over-period change in revenue';
COMMENT ON COLUMN agencies.impressions_breakdown IS 'JSONB breakdown of impressions by source (agency vs agents)';

-- Create indexes for new fields
CREATE INDEX IF NOT EXISTS idx_agencies_agency_profile_leads ON public.agencies USING btree (agency_profile_leads);
CREATE INDEX IF NOT EXISTS idx_agencies_agents_total_leads ON public.agencies USING btree (agents_total_leads);
CREATE INDEX IF NOT EXISTS idx_agencies_unique_leads ON public.agencies USING btree (unique_leads);
CREATE INDEX IF NOT EXISTS idx_agencies_total_unique_leads ON public.agencies USING btree (total_unique_leads);

-- ============================================================================
-- PART 2: UPDATE AGENTS TABLE - Add New Fields and Fix Naming
-- ============================================================================

-- Add profile-specific lead fields
ALTER TABLE agents ADD COLUMN IF NOT EXISTS unique_leads integer DEFAULT 0;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS anonymous_leads integer DEFAULT 0;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS total_unique_leads integer DEFAULT 0;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS total_anonymous_leads integer DEFAULT 0;

-- Fix field naming inconsistency: total_listing_views → total_listings_views
DO $$
BEGIN
    -- Check if old column exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'agents' 
        AND column_name = 'total_listing_views'
    ) THEN
        -- Check if new column doesn't exist
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'agents' 
            AND column_name = 'total_listings_views'
        ) THEN
            -- Rename the column
            ALTER TABLE agents RENAME COLUMN total_listing_views TO total_listings_views;
        ELSE
            -- Both exist, drop old one and keep new one
            ALTER TABLE agents DROP COLUMN IF EXISTS total_listing_views;
        END IF;
    END IF;
    
    -- Ensure new column exists (in case neither existed)
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'agents' 
        AND column_name = 'total_listings_views'
    ) THEN
        ALTER TABLE agents ADD COLUMN total_listings_views integer DEFAULT 0;
    END IF;
END $$;

-- Add impressions breakdown
ALTER TABLE agents ADD COLUMN IF NOT EXISTS impressions_breakdown jsonb DEFAULT '{}'::jsonb;

-- Add comments for documentation
COMMENT ON COLUMN agents.unique_leads IS 'Profile-specific unique logged-in individuals (agent profile only)';
COMMENT ON COLUMN agents.anonymous_leads IS 'Profile-specific unique anonymous individuals (agent profile only)';
COMMENT ON COLUMN agents.total_unique_leads IS 'Aggregate unique logged-in individuals (agent profile + agent listings)';
COMMENT ON COLUMN agents.total_anonymous_leads IS 'Aggregate unique anonymous individuals (agent profile + agent listings)';
COMMENT ON COLUMN agents.total_leads IS 'Total unique leads for this agent (should equal total_unique_leads + total_anonymous_leads)';
COMMENT ON COLUMN agents.total_listings_views IS 'Views on this agent listings (matches developers/agencies naming convention)';
COMMENT ON COLUMN agents.impressions_breakdown IS 'JSONB breakdown of impressions by source';

-- Create indexes for new fields
CREATE INDEX IF NOT EXISTS idx_agents_unique_leads ON public.agents USING btree (unique_leads);
CREATE INDEX IF NOT EXISTS idx_agents_total_unique_leads ON public.agents USING btree (total_unique_leads);
CREATE INDEX IF NOT EXISTS idx_agents_total_listings_views ON public.agents USING btree (total_listings_views);

-- Update existing index if it exists with old name
DO $$
BEGIN
    -- Drop old index if it exists
    IF EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'agents' 
        AND indexname = 'idx_agents_total_listing_views'
    ) THEN
        DROP INDEX IF EXISTS idx_agents_total_listing_views;
    END IF;
END $$;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- All fields have been added to both tables
-- Backfilling will be handled by cron job later
-- ============================================================================

