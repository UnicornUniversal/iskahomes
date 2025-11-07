-- Add updated_at column to analytics_cron_status table
-- This column tracks when the run record was last updated (useful for progress tracking)

ALTER TABLE analytics_cron_status
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create index for efficient querying by update time
CREATE INDEX IF NOT EXISTS idx_cron_status_updated_at ON analytics_cron_status(updated_at DESC);

-- Add comment
COMMENT ON COLUMN analytics_cron_status.updated_at IS 'Timestamp when the run record was last updated (for progress tracking)';

-- Create trigger function to automatically update updated_at on row updates
CREATE OR REPLACE FUNCTION update_analytics_cron_status_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Safely create trigger (only if it doesn't already exist)
-- This avoids any "destructive operation" warnings
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'trigger_update_analytics_cron_status_updated_at'
        AND tgrelid = 'analytics_cron_status'::regclass
    ) THEN
        CREATE TRIGGER trigger_update_analytics_cron_status_updated_at
            BEFORE UPDATE ON analytics_cron_status
            FOR EACH ROW
            EXECUTE FUNCTION update_analytics_cron_status_updated_at();
    END IF;
END $$;
