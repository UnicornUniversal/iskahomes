-- Comprehensive Schema Check for admin_analytics Table
-- This query shows all constraints, indexes, and table structure

-- ============================================
-- 1. TABLE STRUCTURE (Columns, Types, Defaults)
-- ============================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_name = 'admin_analytics'
ORDER BY ordinal_position;

-- ============================================
-- 2. PRIMARY KEY CONSTRAINT
-- ============================================
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    tc.table_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'admin_analytics'
    AND tc.constraint_type = 'PRIMARY KEY';

-- ============================================
-- 3. UNIQUE CONSTRAINTS (Critical for upsert!)
-- ============================================
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    tc.table_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'admin_analytics'
    AND tc.constraint_type = 'UNIQUE';

-- ============================================
-- 4. ALL CONSTRAINTS (PRIMARY KEY, UNIQUE, FOREIGN KEY, CHECK)
-- ============================================
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    tc.table_name,
    CASE 
        WHEN tc.constraint_type = 'FOREIGN KEY' THEN
            (SELECT 
                ccu.table_name || '.' || ccu.column_name
             FROM information_schema.constraint_column_usage AS ccu
             WHERE ccu.constraint_name = tc.constraint_name)
        ELSE NULL
    END AS references
FROM information_schema.table_constraints AS tc
LEFT JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'admin_analytics'
ORDER BY tc.constraint_type, tc.constraint_name;

-- ============================================
-- 5. ALL INDEXES (Regular and GIN indexes for JSONB)
-- ============================================
SELECT 
    i.relname AS index_name,
    a.attname AS column_name,
    am.amname AS index_type,
    CASE 
        WHEN i.relname LIKE 'idx_%' THEN 'Manual Index'
        WHEN i.relname LIKE '%_pkey' THEN 'Primary Key Index'
        WHEN i.relname LIKE '%_key' THEN 'Unique Constraint Index'
        ELSE 'Other Index'
    END AS index_category,
    idx.indisunique AS is_unique,
    idx.indisprimary AS is_primary
FROM pg_class t
JOIN pg_index idx ON t.oid = idx.indrelid
JOIN pg_class i ON i.oid = idx.indexrelid
JOIN pg_am am ON i.relam = am.oid
LEFT JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(idx.indkey)
WHERE t.relname = 'admin_analytics'
    AND t.relkind = 'r'
ORDER BY 
    CASE 
        WHEN idx.indisprimary THEN 1
        WHEN idx.indisunique THEN 2
        ELSE 3
    END,
    i.relname;

-- ============================================
-- 6. SPECIFIC CHECK: Is date column unique?
-- ============================================
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
        ) THEN '✅ YES - date has UNIQUE constraint'
        ELSE '❌ NO - date does NOT have UNIQUE constraint (NEEDS FIXING!)'
    END AS date_unique_check;

-- ============================================
-- 7. SPECIFIC CHECK: Is id the primary key?
-- ============================================
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
        ) THEN '✅ YES - id is PRIMARY KEY'
        ELSE '❌ NO - id is NOT the PRIMARY KEY'
    END AS id_primary_key_check;

-- ============================================
-- 8. TABLE STATISTICS (Row count, table size)
-- ============================================
SELECT 
    COUNT(*) as total_records,
    MIN(date) as earliest_date,
    MAX(date) as latest_date,
    COUNT(DISTINCT date) as unique_dates,
    pg_size_pretty(pg_total_relation_size('admin_analytics')) as total_table_size
FROM admin_analytics;

-- ============================================
-- 9. SAMPLE DATA STRUCTURE (First record)
-- ============================================
SELECT 
    id,
    date,
    week,
    month,
    quarter,
    year,
    jsonb_typeof(country) as country_type,
    jsonb_typeof(developers_metrics) as developers_metrics_type,
    jsonb_typeof(listings_by_property_purpose) as listings_by_purpose_type,
    created_at,
    updated_at
FROM admin_analytics
ORDER BY date DESC
LIMIT 1;

-- ============================================
-- 10. COMPLETE SCHEMA SUMMARY (All in one)
-- ============================================
SELECT 
    'TABLE STRUCTURE' as section,
    string_agg(
        column_name || ' (' || data_type || 
        CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
        CASE WHEN column_default IS NOT NULL THEN ' DEFAULT ' || column_default ELSE '' END ||
        ')',
        ', ' ORDER BY ordinal_position
    ) as details
FROM information_schema.columns
WHERE table_name = 'admin_analytics'

UNION ALL

SELECT 
    'PRIMARY KEY' as section,
    string_agg(column_name, ', ') as details
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'admin_analytics'
    AND tc.constraint_type = 'PRIMARY KEY'

UNION ALL

SELECT 
    'UNIQUE CONSTRAINTS' as section,
    COALESCE(string_agg(DISTINCT column_name, ', '), 'NONE') as details
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'admin_analytics'
    AND tc.constraint_type = 'UNIQUE'

UNION ALL

SELECT 
    'INDEXES COUNT' as section,
    COUNT(*)::text || ' indexes (including PK, unique, and GIN indexes)' as details
FROM pg_indexes
WHERE tablename = 'admin_analytics';

