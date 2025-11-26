-- Remove conflicting unique constraints that prevent hourly tracking
-- These constraints conflict with the primary key which includes hour

-- Remove unique constraint on listing_analytics (listing_id, date)
-- This conflicts with hourly tracking - we need multiple rows per day (one per hour)
DROP INDEX IF EXISTS listing_analytics_unique_day;

-- Remove unique constraint on user_analytics (user_id, user_type, date)
-- This conflicts with hourly tracking - we need multiple rows per day (one per hour)
DROP INDEX IF EXISTS user_analytics_unique_day;

-- Verify the constraints are removed
SELECT 
    schemaname,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN ('listing_analytics', 'user_analytics')
    AND indexname IN ('listing_analytics_unique_day', 'user_analytics_unique_day');

