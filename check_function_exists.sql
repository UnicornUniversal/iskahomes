-- =============================================
-- Check if mark_conversation_as_read function exists
-- =============================================
-- This query checks if the function exists in the database

-- Check in public schema specifically
SELECT 
  proname as function_name,
  pg_get_function_arguments(oid) as arguments,
  pronamespace::regnamespace as schema_name,
  prokind as function_type
FROM pg_proc
WHERE proname = 'mark_conversation_as_read'
  AND pronamespace::regnamespace::text = 'public';

-- If the above returns a row, the function EXISTS
-- If it returns nothing, the function DOES NOT EXIST

-- Alternative: Check all schemas (in case it's in a different schema)
SELECT 
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments,
  p.prokind as function_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'mark_conversation_as_read';

