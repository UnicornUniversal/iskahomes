-- Remove the user_type check constraint from user_analytics table
-- This constraint is preventing valid user_type values from being inserted

-- Drop the constraint directly
ALTER TABLE user_analytics DROP CONSTRAINT IF EXISTS user_analytics_user_type_check;

-- Verify the constraint is removed
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'user_analytics'::regclass
  AND contype = 'c'  -- 'c' = check constraint
  AND conname LIKE '%user_type%';

-- If the above query returns no rows, the constraint has been successfully removed
