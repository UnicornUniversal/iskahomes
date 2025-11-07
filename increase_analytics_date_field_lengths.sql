-- Migration to increase week, month, and quarter field lengths in analytics tables
-- This allows the proper ISO format: week (YYYY-W##), month (YYYY-MM), quarter (YYYY-Q#)

-- Update listing_analytics table
ALTER TABLE listing_analytics 
  ALTER COLUMN week TYPE VARCHAR(10),
  ALTER COLUMN month TYPE VARCHAR(7),
  ALTER COLUMN quarter TYPE VARCHAR(7);

-- Update user_analytics table
ALTER TABLE user_analytics 
  ALTER COLUMN week TYPE VARCHAR(10),
  ALTER COLUMN month TYPE VARCHAR(7),
  ALTER COLUMN quarter TYPE VARCHAR(7);

-- Update development_analytics table
ALTER TABLE development_analytics 
  ALTER COLUMN week TYPE VARCHAR(10),
  ALTER COLUMN month TYPE VARCHAR(7),
  ALTER COLUMN quarter TYPE VARCHAR(7);

-- Add comments for documentation
COMMENT ON COLUMN listing_analytics.week IS 'ISO week format: YYYY-W## (e.g., 2025-W45)';
COMMENT ON COLUMN listing_analytics.month IS 'Month format: YYYY-MM (e.g., 2025-11)';
COMMENT ON COLUMN listing_analytics.quarter IS 'Quarter format: YYYY-Q# (e.g., 2025-Q4)';

COMMENT ON COLUMN user_analytics.week IS 'ISO week format: YYYY-W## (e.g., 2025-W45)';
COMMENT ON COLUMN user_analytics.month IS 'Month format: YYYY-MM (e.g., 2025-11)';
COMMENT ON COLUMN user_analytics.quarter IS 'Quarter format: YYYY-Q# (e.g., 2025-Q4)';

COMMENT ON COLUMN development_analytics.week IS 'ISO week format: YYYY-W## (e.g., 2025-W45)';
COMMENT ON COLUMN development_analytics.month IS 'Month format: YYYY-MM (e.g., 2025-11)';
COMMENT ON COLUMN development_analytics.quarter IS 'Quarter format: YYYY-Q# (e.g., 2025-Q4)';

