-- Quick Validation Check for admin_analytics Table
-- Run this to verify everything is set up correctly for upsert to work

-- ============================================
-- CRITICAL CHECKS (What you need for upsert)
-- ============================================

-- 1. Check if id exists and is primary key
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
                ON tc.constraint_name = kcu.constraint_name
            WHERE tc.table_name = 'admin_analytics'
                AND kcu.column_name = 'id'
                AND tc.constraint_type = 'PRIMARY KEY'
        ) THEN '✅ PASS: id is PRIMARY KEY'
        ELSE '❌ FAIL: id is NOT the PRIMARY KEY'
    END AS id_primary_key_check;

-- 2. Check if date has unique constraint (CRITICAL for upsert!)
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
                ON tc.constraint_name = kcu.constraint_name
            WHERE tc.table_name = 'admin_analytics'
                AND kcu.column_name = 'date'
                AND tc.constraint_type = 'UNIQUE'
        ) THEN '✅ PASS: date has UNIQUE constraint (upsert will work!)'
        ELSE '❌ FAIL: date does NOT have UNIQUE constraint (upsert will fail! Run migration!)'
    END AS date_unique_check;

-- 3. Check if date column exists
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM information_schema.columns
            WHERE table_name = 'admin_analytics'
                AND column_name = 'date'
        ) THEN '✅ PASS: date column exists'
        ELSE '❌ FAIL: date column does NOT exist'
    END AS date_column_check;

-- 4. Check if id column exists
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM information_schema.columns
            WHERE table_name = 'admin_analytics'
                AND column_name = 'id'
        ) THEN '✅ PASS: id column exists'
        ELSE '❌ FAIL: id column does NOT exist'
    END AS id_column_check;

-- ============================================
-- SUMMARY TABLE
-- ============================================
SELECT 
    'id column exists' as check_item,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'admin_analytics' AND column_name = 'id'
    ) THEN '✅ YES' ELSE '❌ NO' END as status

UNION ALL

SELECT 
    'id is PRIMARY KEY' as check_item,
    CASE WHEN EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'admin_analytics'
            AND kcu.column_name = 'id'
            AND tc.constraint_type = 'PRIMARY KEY'
    ) THEN '✅ YES' ELSE '❌ NO' END as status

UNION ALL

SELECT 
    'date column exists' as check_item,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'admin_analytics' AND column_name = 'date'
    ) THEN '✅ YES' ELSE '❌ NO' END as status

UNION ALL

SELECT 
    'date has UNIQUE constraint' as check_item,
    CASE WHEN EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'admin_analytics'
            AND kcu.column_name = 'date'
            AND tc.constraint_type = 'UNIQUE'
    ) THEN '✅ YES (upsert ready!)' ELSE '❌ NO (run migration!)' END as status

UNION ALL

SELECT 
    'date index exists' as check_item,
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE tablename = 'admin_analytics' 
            AND indexname LIKE '%date%'
    ) THEN '✅ YES' ELSE '⚠️ NO (optional but recommended)' END as status;

