-- ============================================
-- MIGRATION: Convert Analytics Tables to Hourly Tracking
-- This migration adds 'hour' column and updates constraints
-- Run this BEFORE updating the cron job code
-- ============================================

-- ============================================
-- 1. LISTING_ANALYTICS
-- ============================================
DO $$
BEGIN
    -- Add hour column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'listing_analytics' AND column_name = 'hour'
    ) THEN
        ALTER TABLE listing_analytics 
        ADD COLUMN hour INTEGER NOT NULL DEFAULT 0 
        CHECK (hour >= 0 AND hour <= 23);
        
        RAISE NOTICE 'Added hour column to listing_analytics';
    END IF;
    
    -- Drop old primary key constraint
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'listing_analytics' 
        AND constraint_type = 'PRIMARY KEY'
        AND constraint_name = 'listing_analytics_pkey'
    ) THEN
        ALTER TABLE listing_analytics DROP CONSTRAINT listing_analytics_pkey;
        RAISE NOTICE 'Dropped old primary key from listing_analytics';
    END IF;
    
    -- Add new primary key with hour
    ALTER TABLE listing_analytics 
    ADD PRIMARY KEY (listing_id, date, hour);
    
    RAISE NOTICE 'Added new primary key (listing_id, date, hour) to listing_analytics';
    
    -- Add index for faster queries
    CREATE INDEX IF NOT EXISTS idx_listing_analytics_date_hour 
    ON listing_analytics(date, hour);
    
    RAISE NOTICE 'Added index on (date, hour) for listing_analytics';
END $$;

-- ============================================
-- 2. USER_ANALYTICS
-- ============================================
DO $$
BEGIN
    -- Add hour column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_analytics' AND column_name = 'hour'
    ) THEN
        ALTER TABLE user_analytics 
        ADD COLUMN hour INTEGER NOT NULL DEFAULT 0 
        CHECK (hour >= 0 AND hour <= 23);
        
        RAISE NOTICE 'Added hour column to user_analytics';
    END IF;
    
    -- Drop old primary key constraint
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'user_analytics' 
        AND constraint_type = 'PRIMARY KEY'
        AND constraint_name = 'user_analytics_pkey'
    ) THEN
        ALTER TABLE user_analytics DROP CONSTRAINT user_analytics_pkey;
        RAISE NOTICE 'Dropped old primary key from user_analytics';
    END IF;
    
    -- Add new primary key with hour
    ALTER TABLE user_analytics 
    ADD PRIMARY KEY (user_id, user_type, date, hour);
    
    RAISE NOTICE 'Added new primary key (user_id, user_type, date, hour) to user_analytics';
    
    -- Add index for faster queries
    CREATE INDEX IF NOT EXISTS idx_user_analytics_date_hour 
    ON user_analytics(date, hour);
    
    RAISE NOTICE 'Added index on (date, hour) for user_analytics';
END $$;

-- ============================================
-- 3. DEVELOPMENT_ANALYTICS
-- ============================================
DO $$
BEGIN
    -- Add hour column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'development_analytics' AND column_name = 'hour'
    ) THEN
        ALTER TABLE development_analytics 
        ADD COLUMN hour INTEGER NOT NULL DEFAULT 0 
        CHECK (hour >= 0 AND hour <= 23);
        
        RAISE NOTICE 'Added hour column to development_analytics';
    END IF;
    
    -- Check current primary key structure
    -- Drop old primary key if it exists (might be on different columns)
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'development_analytics' 
        AND constraint_type = 'PRIMARY KEY'
    ) THEN
        -- Get constraint name
        DECLARE
            pk_name TEXT;
        BEGIN
            SELECT constraint_name INTO pk_name
            FROM information_schema.table_constraints
            WHERE table_name = 'development_analytics' 
            AND constraint_type = 'PRIMARY KEY'
            LIMIT 1;
            
            EXECUTE format('ALTER TABLE development_analytics DROP CONSTRAINT %I', pk_name);
            RAISE NOTICE 'Dropped old primary key from development_analytics';
        END;
    END IF;
    
    -- Add new primary key with hour (assuming development_id, date structure)
    -- Adjust columns based on your actual schema
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'development_analytics' AND column_name = 'development_id'
    ) THEN
        ALTER TABLE development_analytics 
        ADD PRIMARY KEY (development_id, date, hour);
        
        RAISE NOTICE 'Added new primary key (development_id, date, hour) to development_analytics';
    END IF;
    
    -- Add index for faster queries
    CREATE INDEX IF NOT EXISTS idx_development_analytics_date_hour 
    ON development_analytics(date, hour);
    
    RAISE NOTICE 'Added index on (date, hour) for development_analytics';
END $$;

-- ============================================
-- 4. ADMIN_ANALYTICS
-- ============================================
DO $$
BEGIN
    -- Add hour column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'admin_analytics' AND column_name = 'hour'
    ) THEN
        ALTER TABLE admin_analytics 
        ADD COLUMN hour INTEGER NOT NULL DEFAULT 0 
        CHECK (hour >= 0 AND hour <= 23);
        
        RAISE NOTICE 'Added hour column to admin_analytics';
    END IF;
    
    -- Drop old unique constraint on date if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'admin_analytics' 
        AND constraint_type = 'UNIQUE'
        AND constraint_name = 'admin_analytics_date_unique'
    ) THEN
        ALTER TABLE admin_analytics DROP CONSTRAINT admin_analytics_date_unique;
        RAISE NOTICE 'Dropped old unique constraint on date from admin_analytics';
    END IF;
    
    -- Add new unique constraint on (date, hour)
    ALTER TABLE admin_analytics 
    ADD CONSTRAINT admin_analytics_date_hour_unique UNIQUE (date, hour);
    
    RAISE NOTICE 'Added new unique constraint (date, hour) to admin_analytics';
    
    -- Add index for faster queries
    CREATE INDEX IF NOT EXISTS idx_admin_analytics_date_hour 
    ON admin_analytics(date, hour);
    
    RAISE NOTICE 'Added index on (date, hour) for admin_analytics';
END $$;

-- ============================================
-- 5. LEADS (Optional - for consistency)
-- ============================================
-- Note: Leads table doesn't need constraint changes (it's time series)
-- But we can add hour and date columns for easier querying
DO $$
BEGIN
    -- Add date column if it doesn't exist (extract from created_at)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'leads' AND column_name = 'date'
    ) THEN
        ALTER TABLE leads 
        ADD COLUMN date DATE;
        
        -- Update existing records to extract date from created_at
        UPDATE leads 
        SET date = DATE(created_at)
        WHERE date IS NULL;
        
        RAISE NOTICE 'Added date column to leads and populated from created_at';
    END IF;
    
    -- Add hour column if it doesn't exist (for easier hourly queries)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'leads' AND column_name = 'hour'
    ) THEN
        ALTER TABLE leads 
        ADD COLUMN hour INTEGER 
        CHECK (hour IS NULL OR (hour >= 0 AND hour <= 23));
        
        -- Update existing records to extract hour from created_at
        UPDATE leads 
        SET hour = EXTRACT(HOUR FROM created_at)
        WHERE hour IS NULL;
        
        RAISE NOTICE 'Added hour column to leads and populated from created_at';
    END IF;
    
    -- Add index for faster hourly queries (only if date column exists)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'leads' AND column_name = 'date'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_leads_date_hour 
        ON leads(date, hour) WHERE date IS NOT NULL;
        
        RAISE NOTICE 'Added index on (date, hour) for leads';
    END IF;
END $$;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these to verify the migration was successful:

-- Check listing_analytics constraints
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) as columns
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'listing_analytics'
    AND tc.constraint_type IN ('PRIMARY KEY', 'UNIQUE')
GROUP BY tc.constraint_name, tc.constraint_type;

-- Check user_analytics constraints
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) as columns
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'user_analytics'
    AND tc.constraint_type IN ('PRIMARY KEY', 'UNIQUE')
GROUP BY tc.constraint_name, tc.constraint_type;

-- Check admin_analytics constraints
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) as columns
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'admin_analytics'
    AND tc.constraint_type IN ('PRIMARY KEY', 'UNIQUE')
GROUP BY tc.constraint_name, tc.constraint_type;

-- Check all hour columns exist
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name IN ('listing_analytics', 'user_analytics', 'development_analytics', 'admin_analytics', 'leads')
    AND column_name = 'hour'
ORDER BY table_name;

