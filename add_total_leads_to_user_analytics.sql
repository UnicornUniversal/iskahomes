-- Add total_leads column to user_analytics table
-- This field aggregates ALL leads (both profile and listing) for developers/agents

ALTER TABLE user_analytics
ADD COLUMN IF NOT EXISTS total_leads INTEGER DEFAULT 0;

-- Add comment explaining the field
COMMENT ON COLUMN user_analytics.total_leads IS 'Total leads (profile + listing) for developers/agents. For property_seekers, this should be 0 or NULL.';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_analytics_total_leads ON user_analytics(user_id, user_type, total_leads) WHERE total_leads > 0;

