-- Migration: Update subscriptions_package table schema
-- This script updates the table to match the new requirements:
-- 1. Remove package_type column
-- 2. Change duration_days to duration and add span
-- 3. Add display_text column

-- Step 1: Remove package_type column if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'subscriptions_package' 
        AND column_name = 'package_type'
    ) THEN
        ALTER TABLE subscriptions_package DROP COLUMN package_type;
        RAISE NOTICE 'Removed package_type column';
    ELSE
        RAISE NOTICE 'package_type column does not exist, skipping';
    END IF;
END $$;

-- Step 2: Rename duration_days to duration if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'subscriptions_package' 
        AND column_name = 'duration_days'
    ) THEN
        ALTER TABLE subscriptions_package RENAME COLUMN duration_days TO duration;
        RAISE NOTICE 'Renamed duration_days to duration';
    ELSE
        RAISE NOTICE 'duration_days column does not exist, skipping rename';
    END IF;
END $$;

-- Step 3: Add span column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'subscriptions_package' 
        AND column_name = 'span'
    ) THEN
        ALTER TABLE subscriptions_package 
        ADD COLUMN span VARCHAR(20) CHECK (span IN ('month', 'months', 'year', 'years'));
        
        -- Add index for span
        CREATE INDEX IF NOT EXISTS idx_subscriptions_package_span ON subscriptions_package(span);
        
        RAISE NOTICE 'Added span column';
    ELSE
        RAISE NOTICE 'span column already exists';
    END IF;
END $$;

-- Step 4: Add display_text column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'subscriptions_package' 
        AND column_name = 'display_text'
    ) THEN
        ALTER TABLE subscriptions_package 
        ADD COLUMN display_text TEXT;
        
        RAISE NOTICE 'Added display_text column';
    ELSE
        RAISE NOTICE 'display_text column already exists';
    END IF;
END $$;

-- Step 5: Update duration constraint if needed
DO $$
BEGIN
    -- Check if constraint exists
    IF EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'check_positive_duration' 
        AND conrelid = 'subscriptions_package'::regclass
    ) THEN
        RAISE NOTICE 'check_positive_duration constraint already exists';
    ELSE
        -- Add constraint
        ALTER TABLE subscriptions_package 
        ADD CONSTRAINT check_positive_duration CHECK (
            duration IS NULL OR duration > 0
        );
        RAISE NOTICE 'Added check_positive_duration constraint';
    END IF;
END $$;

-- Step 6: Remove old package_type index if it exists
DROP INDEX IF EXISTS idx_subscriptions_package_type;

-- Step 7: Update comments
COMMENT ON COLUMN subscriptions_package.duration IS 'Duration number (e.g., 1, 3, 12)';
COMMENT ON COLUMN subscriptions_package.span IS 'Duration span: month/months or year/years';
COMMENT ON COLUMN subscriptions_package.display_text IS 'Display text showing price and duration (e.g., "GHS 100 / month" or "USD 50 / year")';

