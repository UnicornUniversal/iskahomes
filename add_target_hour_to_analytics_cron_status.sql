-- Add target_hour column to analytics_cron_status table for hourly tracking
-- This matches the granularity of the analytics tables (listing_analytics, user_analytics, etc.)

-- Add target_hour column (INTEGER, 0-23)
ALTER TABLE analytics_cron_status
ADD COLUMN IF NOT EXISTS target_hour INTEGER;

-- Add check constraint to ensure hour is between 0 and 23
ALTER TABLE analytics_cron_status
ADD CONSTRAINT target_hour_check CHECK (target_hour IS NULL OR (target_hour >= 0 AND target_hour <= 23));

-- Create index for efficient querying by date and hour
CREATE INDEX IF NOT EXISTS idx_cron_status_target_date_hour 
ON analytics_cron_status(target_date, target_hour);

-- Create composite index for finding runs by date and hour
CREATE INDEX IF NOT EXISTS idx_cron_status_date_hour_status
ON analytics_cron_status(target_date, target_hour, status)
WHERE status IN ('completed', 'failed');

-- Add comment
COMMENT ON COLUMN analytics_cron_status.target_hour IS 'Target hour for aggregation (0-23). Represents the hour being written to in analytics tables.';

-- Update existing records: extract hour from end_time
-- This is a best-effort update for historical data
UPDATE analytics_cron_status
SET target_hour = EXTRACT(HOUR FROM end_time AT TIME ZONE 'UTC')
WHERE target_hour IS NULL AND end_time IS NOT NULL;

