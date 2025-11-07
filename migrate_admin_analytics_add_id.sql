-- Migration: Add unique constraint on date column
-- This allows upsert to work properly with onConflict: 'date'
-- Note: id column already exists and is already the primary key

-- Check if unique constraint already exists, if not add it
DO $$
BEGIN
    -- Check if unique constraint on date already exists
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'admin_analytics_date_unique' 
        AND conrelid = 'admin_analytics'::regclass
    ) THEN
        -- Add unique constraint on date
        ALTER TABLE admin_analytics 
        ADD CONSTRAINT admin_analytics_date_unique UNIQUE (date);
        
        RAISE NOTICE 'Unique constraint added on date column';
    ELSE
        RAISE NOTICE 'Unique constraint on date already exists';
    END IF;
END $$;

-- Add index on date for faster lookups (if it doesn't exist)
CREATE INDEX IF NOT EXISTS idx_admin_analytics_date ON admin_analytics(date);

