-- Check all constraints on analytics-related tables
-- This script will show all constraints including check constraints, foreign keys, unique constraints, etc.

-- 1. Check constraints on user_analytics
SELECT 
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'user_analytics'::regclass
ORDER BY contype, conname;

-- 2. Check constraints on listing_analytics
SELECT 
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'listing_analytics'::regclass
ORDER BY contype, conname;

-- 3. Check constraints on leads
SELECT 
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'leads'::regclass
ORDER BY contype, conname;

-- 4. Get detailed info about the user_type check constraint specifically
SELECT 
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition,
    conrelid::regclass AS table_name
FROM pg_constraint
WHERE conrelid = 'user_analytics'::regclass
  AND contype = 'c'  -- 'c' = check constraint
  AND conname LIKE '%user_type%';

-- 5. Show all check constraints across all three tables
SELECT 
    conrelid::regclass AS table_name,
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid::regclass::text IN ('user_analytics', 'listing_analytics', 'leads')
  AND contype = 'c'  -- 'c' = check constraint
ORDER BY conrelid::regclass::text, conname;

