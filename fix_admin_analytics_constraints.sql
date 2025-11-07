-- Fix Admin Analytics Constraints
-- This script will add any missing constraints needed for upsert to work
-- Run this AFTER checking with quick_check_admin_analytics.sql

-- ============================================
-- STEP 1: Ensure id column exists and is primary key
-- ============================================
DO $$
BEGIN
    -- Check if id column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'admin_analytics' AND column_name = 'id'
    ) THEN
        -- Add id column if it doesn't exist
        ALTER TABLE admin_analytics 
        ADD COLUMN id UUID DEFAULT gen_random_uuid() NOT NULL;
        
        RAISE NOTICE 'Added id column';
    END IF;
    
    -- Check if id is primary key
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'admin_analytics'
            AND kcu.column_name = 'id'
            AND tc.constraint_type = 'PRIMARY KEY'
    ) THEN
        -- Drop existing primary key if it's on date
        IF EXISTS (
            SELECT 1 
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
                ON tc.constraint_name = kcu.constraint_name
            WHERE tc.table_name = 'admin_analytics'
                AND kcu.column_name = 'date'
                AND tc.constraint_type = 'PRIMARY KEY'
        ) THEN
            ALTER TABLE admin_analytics DROP CONSTRAINT admin_analytics_pkey;
            RAISE NOTICE 'Dropped primary key from date column';
        END IF;
        
        -- Set id as primary key
        ALTER TABLE admin_analytics ADD PRIMARY KEY (id);
        RAISE NOTICE 'Set id as primary key';
    END IF;
END $$;

-- ============================================
-- STEP 2: Ensure date has unique constraint (CRITICAL!)
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'admin_analytics'
            AND kcu.column_name = 'date'
            AND tc.constraint_type = 'UNIQUE'
    ) THEN
        -- Check for duplicate dates first
        IF EXISTS (
            SELECT date, COUNT(*) 
            FROM admin_analytics 
            GROUP BY date 
            HAVING COUNT(*) > 1
        ) THEN
            RAISE EXCEPTION 'Cannot add unique constraint: duplicate dates exist in table. Please fix duplicates first.';
        END IF;
        
        -- Add unique constraint
        ALTER TABLE admin_analytics 
        ADD CONSTRAINT admin_analytics_date_unique UNIQUE (date);
        
        RAISE NOTICE 'Added UNIQUE constraint on date column - upsert will now work!';
    ELSE
        RAISE NOTICE 'UNIQUE constraint on date already exists';
    END IF;
END $$;

-- ============================================
-- STEP 3: Ensure date index exists (for performance)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_admin_analytics_date 
ON admin_analytics(date);

-- ============================================
-- STEP 4: Verify all critical JSONB columns exist
-- ============================================
DO $$
DECLARE
    required_columns TEXT[] := ARRAY[
        'country', 'state', 'city', 'town',
        'listings_by_property_purpose', 'listings_by_property_type',
        'listings_by_sub_type', 'listings_by_category',
        'developers_metrics', 'agents_metrics', 'agencies_metrics',
        'property_seekers_metrics', 'platform_engagement',
        'platform_impressions', 'phone_leads', 'message_leads',
        'email_leads', 'appointment_leads', 'website_leads',
        'sales_metrics', 'conversion_rates'
    ];
    missing_cols TEXT[];
    col TEXT;
BEGIN
    missing_cols := ARRAY[]::TEXT[];
    
    FOREACH col IN ARRAY required_columns
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'admin_analytics' AND column_name = col
        ) THEN
            missing_cols := array_append(missing_cols, col);
        END IF;
    END LOOP;
    
    IF array_length(missing_cols, 1) > 0 THEN
        RAISE NOTICE 'Missing columns: %', array_to_string(missing_cols, ', ');
        RAISE NOTICE 'These columns may need to be added manually';
    ELSE
        RAISE NOTICE 'All required JSONB columns exist';
    END IF;
END $$;

-- ============================================
-- STEP 5: Final verification
-- ============================================
SELECT 
    '✅ VERIFICATION COMPLETE' as status,
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
                ON tc.constraint_name = kcu.constraint_name
            WHERE tc.table_name = 'admin_analytics'
                AND kcu.column_name = 'id'
                AND tc.constraint_type = 'PRIMARY KEY'
        ) AND EXISTS (
            SELECT 1 
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
                ON tc.constraint_name = kcu.constraint_name
            WHERE tc.table_name = 'admin_analytics'
                AND kcu.column_name = 'date'
                AND tc.constraint_type = 'UNIQUE'
        ) THEN '✅ All constraints are correct - upsert will work!'
        ELSE '❌ Some constraints are missing - check errors above'
    END as result;

