-- Migration: Add ideal_duration and user_type fields to subscriptions_package table

-- Step 1: Add ideal_duration field
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'subscriptions_package' 
        AND column_name = 'ideal_duration'
    ) THEN
        ALTER TABLE subscriptions_package 
        ADD COLUMN ideal_duration INTEGER;
        
        COMMENT ON COLUMN subscriptions_package.ideal_duration IS 'Minimum subscription duration in months (e.g., 3 for 3 months minimum, 12 for 1 year minimum)';
        
        RAISE NOTICE 'Added ideal_duration column';
    ELSE
        RAISE NOTICE 'ideal_duration column already exists';
    END IF;
END $$;

-- Step 2: Add user_type field
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'subscriptions_package' 
        AND column_name = 'user_type'
    ) THEN
        ALTER TABLE subscriptions_package 
        ADD COLUMN user_type VARCHAR(20) CHECK (user_type IN ('developers', 'agents', 'agencies'));
        
        COMMENT ON COLUMN subscriptions_package.user_type IS 'Type of user this package is intended for: developers, agents, or agencies (stored in lowercase)';
        
        -- Add index for better query performance
        CREATE INDEX IF NOT EXISTS idx_subscriptions_package_user_type ON subscriptions_package(user_type);
        
        RAISE NOTICE 'Added user_type column';
    ELSE
        RAISE NOTICE 'user_type column already exists';
    END IF;
END $$;

-- Step 3: Add constraint for ideal_duration if needed
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'check_positive_ideal_duration' 
        AND conrelid = 'subscriptions_package'::regclass
    ) THEN
        RAISE NOTICE 'check_positive_ideal_duration constraint already exists';
    ELSE
        ALTER TABLE subscriptions_package 
        ADD CONSTRAINT check_positive_ideal_duration CHECK (
            ideal_duration IS NULL OR ideal_duration > 0
        );
        RAISE NOTICE 'Added check_positive_ideal_duration constraint';
    END IF;
END $$;

