-- ============================================
-- MIGRATION: Add Impressions Breakdown Columns
-- This migration adds impressions breakdown tracking for listings, developers, and developments
-- ============================================

-- ============================================
-- 1. LISTINGS: Add listing_impressions_breakdown column
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'listings' AND column_name = 'listing_impressions_breakdown'
    ) THEN
        ALTER TABLE listings 
        ADD COLUMN listing_impressions_breakdown JSONB DEFAULT '{}'::jsonb;
        
        RAISE NOTICE 'Added listing_impressions_breakdown column to listings';
    END IF;
END $$;

-- ============================================
-- 2. DEVELOPERS: Add impressions_breakdown column
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'developers' AND column_name = 'impressions_breakdown'
    ) THEN
        ALTER TABLE developers 
        ADD COLUMN impressions_breakdown JSONB DEFAULT '{}'::jsonb;
        
        RAISE NOTICE 'Added impressions_breakdown column to developers';
    END IF;
END $$;

-- ============================================
-- 3. DEVELOPMENTS: Add impressions_breakdown and total_impressions columns
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'developments' AND column_name = 'impressions_breakdown'
    ) THEN
        ALTER TABLE developments 
        ADD COLUMN impressions_breakdown JSONB DEFAULT '{}'::jsonb;
        
        RAISE NOTICE 'Added impressions_breakdown column to developments';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'developments' AND column_name = 'total_impressions'
    ) THEN
        ALTER TABLE developments 
        ADD COLUMN total_impressions INTEGER DEFAULT 0;
        
        RAISE NOTICE 'Added total_impressions column to developments';
    END IF;
END $$;

-- ============================================
-- 4. DEVELOPMENT_ANALYTICS: Add total_impressions column
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'development_analytics' AND column_name = 'total_impressions'
    ) THEN
        ALTER TABLE development_analytics 
        ADD COLUMN total_impressions INTEGER DEFAULT 0;
        
        RAISE NOTICE 'Added total_impressions column to development_analytics';
    END IF;
END $$;

-- ============================================
-- 5. Add GIN indexes for JSONB columns (for faster queries)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_listings_impressions_breakdown 
ON listings USING GIN(listing_impressions_breakdown);

CREATE INDEX IF NOT EXISTS idx_developers_impressions_breakdown 
ON developers USING GIN(impressions_breakdown);

CREATE INDEX IF NOT EXISTS idx_developments_impressions_breakdown 
ON developments USING GIN(impressions_breakdown);

-- ============================================
-- 6. Add comments for documentation
-- ============================================
COMMENT ON COLUMN listings.listing_impressions_breakdown IS 'Aggregated all-time impressions breakdown by type: {"social_media": {"total": 10, "percentage": 40.0}, "website_visit": {"total": 5, "percentage": 20.0}, "share": {"total": 7, "percentage": 28.0}, "saved_listing": {"total": 3, "percentage": 12.0}}';

COMMENT ON COLUMN developers.impressions_breakdown IS 'Aggregated all-time impressions breakdown by type: {"social_media": {"total": 10, "percentage": 40.0}, "website_visit": {"total": 5, "percentage": 20.0}, "share": {"total": 7, "percentage": 28.0}, "saved_listing": {"total": 3, "percentage": 12.0}}';

COMMENT ON COLUMN developments.impressions_breakdown IS 'Aggregated all-time impressions breakdown by type: {"social_media": {"total": 10, "percentage": 40.0}, "website_visit": {"total": 0, "percentage": 0}, "share": {"total": 7, "percentage": 28.0}, "saved": {"total": 3, "percentage": 12.0}}';

COMMENT ON COLUMN developments.total_impressions IS 'Total number of impressions (engagement/interactions) received for this development';

COMMENT ON COLUMN development_analytics.total_impressions IS 'Total impressions (engagement/interactions) for this development in this time period';

-- Migration completed: Added impressions breakdown columns for listings, developers, and developments
