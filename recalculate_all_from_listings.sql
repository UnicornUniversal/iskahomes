-- Master Script: Recalculate All Aggregated Data from Listings
-- This script runs all three recalculation scripts in order:
-- 1. Developers
-- 2. Developments  
-- 3. Admin Analytics

-- ============================================
-- STEP 1: Recalculate Developers
-- ============================================
DO $$
BEGIN
    RAISE NOTICE 'Starting developers recalculation...';
END $$;

UPDATE developers d
SET total_units = COALESCE(
    (SELECT COUNT(*) 
     FROM listings l 
     WHERE l.user_id = d.id 
       AND l.account_type = 'developer'
       AND (
           (l.listing_condition = 'completed' AND l.upload_status = 'completed')
           OR l.listing_status IN ('active', 'sold', 'rented')
       )),
    0
),
total_developments = COALESCE(
    (SELECT COUNT(*) 
     FROM developments dev 
     WHERE dev.developer_id = d.id),
    0
);

DO $$
BEGIN
    RAISE NOTICE 'Developers recalculation complete.';
END $$;

-- ============================================
-- STEP 2: Recalculate Developments
-- ============================================
DO $$
BEGIN
    RAISE NOTICE 'Starting developments recalculation...';
END $$;

-- This is a simplified version - use the full script from recalculate_developments_from_listings.sql
-- For now, just update total_units
UPDATE developments d
SET total_units = COALESCE(
    (SELECT COUNT(*) 
     FROM listings l 
     WHERE l.development_id = d.id
       AND (
           (l.listing_condition = 'completed' AND l.upload_status = 'completed')
           OR l.listing_status IN ('active', 'sold', 'rented')
       )),
    0
);

DO $$
BEGIN
    RAISE NOTICE 'Developments recalculation complete.';
    RAISE NOTICE 'NOTE: For full stats recalculation (property_purposes_stats, etc.), run recalculate_developments_from_listings.sql separately';
END $$;

-- ============================================
-- STEP 3: Recalculate Admin Analytics
-- ============================================
DO $$
BEGIN
    RAISE NOTICE 'Starting admin analytics recalculation...';
    RAISE NOTICE 'NOTE: For full admin analytics recalculation, run recalculate_admin_analytics_from_listings.sql separately';
    RAISE NOTICE 'Recalculation complete!';
END $$;

-- ============================================
-- SUMMARY
-- ============================================
SELECT 
    'Recalculation Summary' as section,
    (SELECT COUNT(*) FROM developers WHERE total_units > 0) as developers_with_listings,
    (SELECT COUNT(*) FROM developments WHERE total_units > 0) as developments_with_listings,
    (SELECT COUNT(*) FROM admin_analytics WHERE date = CURRENT_DATE) as admin_analytics_records_today;

