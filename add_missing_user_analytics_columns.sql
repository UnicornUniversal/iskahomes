-- Add missing columns to user_analytics table
-- This migration adds:
-- 1. total_views: Total views (listing views + profile views) for developers/agents
-- 2. views_change: JSONB object tracking views change from previous period

-- Add total_views column (BIGINT, default 0)
-- This stores the total views for developers/agents (listing views + profile views)
ALTER TABLE user_analytics 
ADD COLUMN IF NOT EXISTS total_views BIGINT DEFAULT 0;

-- Add views_change column (JSONB)
-- This stores change tracking data: { previous, current, change, change_percentage }
ALTER TABLE user_analytics 
ADD COLUMN IF NOT EXISTS views_change JSONB DEFAULT NULL;

-- Create index on total_views for faster queries when updating developers table
CREATE INDEX IF NOT EXISTS idx_user_analytics_total_views 
ON user_analytics(total_views) 
WHERE total_views > 0;

-- Create index on views_change for faster queries
CREATE INDEX IF NOT EXISTS idx_user_analytics_views_change 
ON user_analytics USING GIN (views_change) 
WHERE views_change IS NOT NULL;

-- Add comment to columns
COMMENT ON COLUMN user_analytics.total_views IS 'Total views for developers/agents (listing views + profile views). For property_seekers, this is 0.';
COMMENT ON COLUMN user_analytics.views_change IS 'JSONB object tracking views change: { previous, current, change, change_percentage }';

