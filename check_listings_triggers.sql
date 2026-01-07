-- ============================================
-- CHECK ALL TRIGGERS ON LISTINGS TABLE
-- ============================================

-- Check all triggers on the listings table
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing,
    action_orientation
FROM information_schema.triggers
WHERE event_object_table = 'listings'
ORDER BY trigger_name;

-- If no results, it means NO triggers exist for the listings table

-- ============================================
-- SEE THE ACTUAL TRIGGER FUNCTION CODE
-- ============================================

-- Check for trigger functions related to listings (shows full code)
SELECT 
    p.proname AS function_name,
    pg_get_functiondef(p.oid) AS function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND (
    p.proname LIKE '%listing%' 
    OR p.proname LIKE '%slug%'
  )
ORDER BY p.proname;

-- Alternative: Get trigger function code in a more readable format
SELECT 
    p.proname AS function_name,
    pg_get_functiondef(p.oid) AS full_function_code
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname LIKE '%slug%'
ORDER BY p.proname;

-- ============================================
-- SEE TRIGGER DETAILS WITH FUNCTION CODE
-- ============================================

-- Check if there's a trigger specifically for slug generation on listings
-- This shows both trigger metadata AND the function code
SELECT 
    t.trigger_name,
    t.event_manipulation,
    t.event_object_table,
    t.action_timing,
    t.action_orientation,
    p.proname AS function_name,
    pg_get_functiondef(p.oid) AS function_code
FROM information_schema.triggers t
JOIN pg_trigger pt ON t.trigger_name = pt.tgname
JOIN pg_proc p ON pt.tgfoid = p.oid
WHERE t.event_object_table = 'listings'
  AND (
    t.trigger_name LIKE '%slug%' 
    OR p.proname LIKE '%slug%'
  )
ORDER BY t.trigger_name;

-- If no results above, there's NO slug trigger for listings table

-- ============================================
-- SEE ALL TRIGGERS ON LISTINGS WITH THEIR FUNCTION CODE
-- ============================================

-- Get ALL triggers on listings table with their function code
SELECT 
    t.trigger_name,
    t.event_manipulation AS event_type,
    t.event_object_table AS table_name,
    t.action_timing AS when_triggered,
    t.action_orientation AS for_each,
    p.proname AS function_name,
    pg_get_functiondef(p.oid) AS function_code
FROM information_schema.triggers t
JOIN pg_trigger pt ON t.trigger_name = pt.tgname
JOIN pg_proc p ON pt.tgfoid = p.oid
WHERE t.event_object_table = 'listings'
ORDER BY t.trigger_name;

-- ============================================
-- COMPARISON: See property_seekers slug trigger code (for reference)
-- ============================================

-- This shows the code for the property_seekers slug trigger (which EXISTS)
SELECT 
    t.trigger_name,
    t.event_manipulation,
    t.event_object_table,
    t.action_timing,
    p.proname AS function_name,
    pg_get_functiondef(p.oid) AS function_code
FROM information_schema.triggers t
JOIN pg_trigger pt ON t.trigger_name = pt.tgname
JOIN pg_proc p ON pt.tgfoid = p.oid
WHERE t.event_object_table = 'property_seekers'
  AND t.trigger_name LIKE '%slug%'
ORDER BY t.trigger_name;

-- ============================================
-- CHECK SLUG COLUMN PROPERTIES
-- ============================================

-- Check all columns in listings table to see if slug has any constraints
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_name = 'listings'
  AND column_name = 'slug';

-- Check for unique constraints on slug
SELECT
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'listings'
  AND kcu.column_name = 'slug';

-- ============================================
-- COMPARISON: Check if other tables have slug triggers
-- ============================================

-- Check property_seekers table (which HAS a slug trigger)
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'property_seekers'
  AND trigger_name LIKE '%slug%'
ORDER BY trigger_name;

-- Check developers table for slug triggers
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'developers'
  AND trigger_name LIKE '%slug%'
ORDER BY trigger_name;

-- Check agents table for slug triggers
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'agents'
  AND trigger_name LIKE '%slug%'
ORDER BY trigger_name;

-- ============================================
-- SUMMARY QUERY: Count listings without slugs
-- ============================================

-- Count how many listings are missing slugs
SELECT 
    COUNT(*) as total_listings,
    COUNT(slug) as listings_with_slug,
    COUNT(*) - COUNT(slug) as listings_without_slug,
    ROUND((COUNT(slug)::numeric / COUNT(*)::numeric) * 100, 2) as percentage_with_slug
FROM listings;

-- Breakdown by account_type
SELECT 
    account_type,
    COUNT(*) as total_listings,
    COUNT(slug) as listings_with_slug,
    COUNT(*) - COUNT(slug) as listings_without_slug
FROM listings
GROUP BY account_type;

