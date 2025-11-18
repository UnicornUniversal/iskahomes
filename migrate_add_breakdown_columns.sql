-- ============================================
-- MIGRATION: Add Share and Leads Breakdown Columns
-- This migration adds breakdown tracking for shares and leads
-- ============================================

-- ============================================
-- 1. LISTING_ANALYTICS: Add share_breakdown column
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'listing_analytics' AND column_name = 'share_breakdown'
    ) THEN
        ALTER TABLE listing_analytics 
        ADD COLUMN share_breakdown JSONB DEFAULT '{}'::jsonb;
        
        RAISE NOTICE 'Added share_breakdown column to listing_analytics';
    END IF;
END $$;

-- ============================================
-- 2. LISTING_ANALYTICS: Add leads_breakdown column
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'listing_analytics' AND column_name = 'leads_breakdown'
    ) THEN
        ALTER TABLE listing_analytics 
        ADD COLUMN leads_breakdown JSONB DEFAULT '{}'::jsonb;
        
        RAISE NOTICE 'Added leads_breakdown column to listing_analytics';
    END IF;
END $$;

-- ============================================
-- 3. LISTINGS: Add listing_share_breakdown column
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'listings' AND column_name = 'listing_share_breakdown'
    ) THEN
        ALTER TABLE listings 
        ADD COLUMN listing_share_breakdown JSONB DEFAULT '{}'::jsonb;
        
        RAISE NOTICE 'Added listing_share_breakdown column to listings';
    END IF;
END $$;

-- ============================================
-- 4. LISTINGS: Add listing_leads_breakdown column
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'listings' AND column_name = 'listing_leads_breakdown'
    ) THEN
        ALTER TABLE listings 
        ADD COLUMN listing_leads_breakdown JSONB DEFAULT '{}'::jsonb;
        
        RAISE NOTICE 'Added listing_leads_breakdown column to listings';
    END IF;
END $$;

-- ============================================
-- 5. Add GIN indexes for JSONB columns (for faster queries)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_listing_analytics_share_breakdown 
ON listing_analytics USING GIN(share_breakdown);

CREATE INDEX IF NOT EXISTS idx_listing_analytics_leads_breakdown 
ON listing_analytics USING GIN(leads_breakdown);

CREATE INDEX IF NOT EXISTS idx_listings_share_breakdown 
ON listings USING GIN(listing_share_breakdown);

CREATE INDEX IF NOT EXISTS idx_listings_leads_breakdown 
ON listings USING GIN(listing_leads_breakdown);

-- ============================================
-- 6. Add comments for documentation
-- ============================================
COMMENT ON COLUMN listing_analytics.share_breakdown IS 'Hourly share breakdown by platform: {"facebook": {"total": 3, "percentage": 30.0}, ...}';
COMMENT ON COLUMN listing_analytics.leads_breakdown IS 'Hourly leads breakdown by type: {"phone": {"total": 5, "percentage": 25.0}, ...}';
COMMENT ON COLUMN listings.listing_share_breakdown IS 'Aggregated all-time share breakdown by platform';
COMMENT ON COLUMN listings.listing_leads_breakdown IS 'Aggregated all-time leads breakdown by type';

-- Migration completed: Added breakdown columns for shares and leads

