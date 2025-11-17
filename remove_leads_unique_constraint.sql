-- Remove unique constraint from leads table
-- This allows multiple lead records for the same (listing_id, seeker_id) combination
-- This enables time series tracking and allows users to see multiple interactions

-- Drop the unique index that enforces the constraint
DROP INDEX IF EXISTS public.idx_leads_unique_seeker_listing;

-- Verify the constraint has been removed
-- Run this query to confirm the unique index is gone:
-- SELECT indexname, indexdef 
-- FROM pg_indexes 
-- WHERE tablename = 'leads' AND indexname = 'idx_leads_unique_seeker_listing';
-- (Should return 0 rows)

-- Note: After removing this constraint, the cron job will be able to insert
-- multiple lead records for the same seeker+listing combination, enabling:
-- 1. Time series tracking of lead interactions
-- 2. Multiple lead records showing different interaction times
-- 3. Better analytics on lead frequency and engagement patterns

