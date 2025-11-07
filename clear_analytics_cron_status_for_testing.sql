-- Clear analytics_cron_status table for testing
-- This will allow the cron to start fresh from 1 hour ago

-- Option 1: Delete all records (clean slate)
-- DELETE FROM analytics_cron_status;

-- Option 2: Delete only completed/failed records (keep running ones)
-- DELETE FROM analytics_cron_status WHERE status IN ('completed', 'failed');

-- Option 3: Delete records older than 1 hour (recommended for testing)
DELETE FROM analytics_cron_status 
WHERE started_at < NOW() - INTERVAL '1 hour';

-- Verify the table is cleared
SELECT COUNT(*) as remaining_records FROM analytics_cron_status;

