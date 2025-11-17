-- =============================================
-- Test if mark_conversation_as_read function exists
-- =============================================
-- Run this first to check if the function exists

-- Check if function exists in public schema
SELECT 
  proname as function_name,
  pg_get_function_arguments(oid) as arguments,
  pronamespace::regnamespace as schema_name
FROM pg_proc
WHERE proname = 'mark_conversation_as_read';

-- If the above returns nothing, the function doesn't exist
-- If it returns a row, check if schema_name is 'public'

-- Also check all schemas
SELECT 
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'mark_conversation_as_read';

