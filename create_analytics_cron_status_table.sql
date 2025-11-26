-- Create analytics_cron_status table to track cron job runs
-- This table enables fail-safe mechanisms, resume points, error tracking, and monitoring

CREATE TABLE IF NOT EXISTS analytics_cron_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Run Identification
  run_id UUID NOT NULL UNIQUE,              -- Unique identifier for each cron run
  run_type VARCHAR(20) DEFAULT 'scheduled',  -- 'scheduled', 'manual', 'recovery', 'retry'
  
  -- Status Tracking
  status VARCHAR(20) NOT NULL,               -- 'running', 'completed', 'failed', 'partial', 'cancelled'
  status_message TEXT,                      -- Human-readable status message
  
  -- Time Range Being Processed
  start_time TIMESTAMP NOT NULL,            -- Start of time range to fetch from PostHog
  end_time TIMESTAMP NOT NULL,              -- End of time range to fetch from PostHog
  target_date DATE NOT NULL,                -- Target date for aggregation (YYYY-MM-DD)
  
  -- Progress Tracking
  last_processed_event_timestamp TIMESTAMP, -- Last event timestamp processed (for resume)
  last_processed_event_id VARCHAR(255),     -- Last PostHog event ID processed (for cursor)
  events_processed INTEGER DEFAULT 0,       -- Count of events processed so far
  events_fetched INTEGER DEFAULT 0,         -- Total events fetched from PostHog
  
  -- Processing Stats
  listings_processed INTEGER DEFAULT 0,
  users_processed INTEGER DEFAULT 0,
  developments_processed INTEGER DEFAULT 0,
  leads_processed INTEGER DEFAULT 0,
  
  -- Database Write Stats
  listings_inserted INTEGER DEFAULT 0,
  users_inserted INTEGER DEFAULT 0,
  developments_inserted INTEGER DEFAULT 0,
  leads_inserted INTEGER DEFAULT 0,
  
  -- Error Tracking
  error_count INTEGER DEFAULT 0,
  last_error TEXT,                          -- Last error message
  error_details JSONB,                      -- Detailed error information
  
  -- Timing
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP,
  duration_seconds INTEGER,                 -- Calculated: completed_at - started_at
  
  -- PostHog API Stats
  posthog_api_calls INTEGER DEFAULT 0,      -- Number of API calls made
  posthog_api_errors INTEGER DEFAULT 0,     -- API errors encountered
  posthog_rate_limit_hit BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',              -- Additional run metadata
  
  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('running', 'completed', 'failed', 'partial', 'cancelled')),
  CONSTRAINT valid_run_type CHECK (run_type IN ('scheduled', 'manual', 'recovery', 'retry', 'test_time_series'))
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_cron_status_status ON analytics_cron_status(status);
CREATE INDEX IF NOT EXISTS idx_cron_status_target_date ON analytics_cron_status(target_date);
CREATE INDEX IF NOT EXISTS idx_cron_status_started_at ON analytics_cron_status(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_cron_status_run_type ON analytics_cron_status(run_type);
CREATE INDEX IF NOT EXISTS idx_cron_status_completed_at ON analytics_cron_status(completed_at DESC);

-- Composite index for finding incomplete runs (most important for recovery)
CREATE INDEX IF NOT EXISTS idx_cron_status_incomplete 
ON analytics_cron_status(status, started_at DESC) 
WHERE status IN ('running', 'failed', 'partial');

-- Composite index for finding last successful run
CREATE INDEX IF NOT EXISTS idx_cron_status_last_successful 
ON analytics_cron_status(status, completed_at DESC) 
WHERE status = 'completed';

-- Add comment to table
COMMENT ON TABLE analytics_cron_status IS 'Tracks analytics cron job runs for fail-safe mechanisms, resume points, error tracking, and monitoring';

-- Add comments to key columns
COMMENT ON COLUMN analytics_cron_status.run_id IS 'Unique identifier for each cron run';
COMMENT ON COLUMN analytics_cron_status.status IS 'Run status: running, completed, failed, partial, cancelled';
COMMENT ON COLUMN analytics_cron_status.start_time IS 'Start timestamp of events to fetch from PostHog';
COMMENT ON COLUMN analytics_cron_status.end_time IS 'End timestamp of events to fetch from PostHog';
COMMENT ON COLUMN analytics_cron_status.target_date IS 'Target date for aggregation (YYYY-MM-DD)';
COMMENT ON COLUMN analytics_cron_status.last_processed_event_timestamp IS 'Last event timestamp processed (for resume after crash)';
COMMENT ON COLUMN analytics_cron_status.last_processed_event_id IS 'Last PostHog event ID processed (for cursor-based pagination)';

