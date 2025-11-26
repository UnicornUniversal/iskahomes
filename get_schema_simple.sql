-- ============================================================================
-- SIMPLE SCHEMA QUERY WITH CONSTRAINTS (Fixed version of your query)
-- ============================================================================

-- Fixed your original query (removed extra quotes in table list)
SELECT 
  table_name,
  column_name, 
  data_type, 
  column_default,
  is_nullable,
  character_maximum_length,
  numeric_precision,
  numeric_scale
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
    'listing_analytics', 
    'user_analytics', 
    'admin_analytics',
    'developers_analytics',
    'developers',
    'listings',
    'developments',
    'agents',
    'leads',
    'analytics_cron_status',
    'property_seekers'
  )
ORDER BY table_name, ordinal_position;

-- ============================================================================
-- ENHANCED VERSION: Add constraint information
-- ============================================================================

SELECT 
  c.table_name,
  c.column_name, 
  c.data_type, 
  c.column_default,
  c.is_nullable,
  -- Constraint flags
  CASE WHEN pk.column_name IS NOT NULL THEN 'YES' ELSE 'NO' END AS is_primary_key,
  CASE WHEN fk.column_name IS NOT NULL THEN 'YES' ELSE 'NO' END AS is_foreign_key,
  CASE WHEN uq.column_name IS NOT NULL THEN 'YES' ELSE 'NO' END AS is_unique,
  -- Foreign key details
  fk.foreign_table_name,
  fk.foreign_column_name,
  -- Constraint names
  pk.constraint_name AS primary_key_name,
  fk.constraint_name AS foreign_key_name,
  uq.constraint_name AS unique_constraint_name
FROM information_schema.columns c
  -- Primary Keys
  LEFT JOIN (
    SELECT 
      kcu.table_schema,
      kcu.table_name,
      kcu.column_name,
      kcu.constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
      AND tc.table_name = kcu.table_name
    WHERE tc.constraint_type = 'PRIMARY KEY'
      AND tc.table_schema = 'public'
  ) pk ON c.table_schema = pk.table_schema
    AND c.table_name = pk.table_name
    AND c.column_name = pk.column_name
  -- Foreign Keys
  LEFT JOIN (
    SELECT 
      kcu.table_schema,
      kcu.table_name,
      kcu.column_name,
      kcu.constraint_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
      AND tc.table_name = kcu.table_name
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
  ) fk ON c.table_schema = fk.table_schema
    AND c.table_name = fk.table_name
    AND c.column_name = fk.column_name
  -- Unique Constraints
  LEFT JOIN (
    SELECT 
      kcu.table_schema,
      kcu.table_name,
      kcu.column_name,
      kcu.constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
      AND tc.table_name = kcu.table_name
    WHERE tc.constraint_type = 'UNIQUE'
      AND tc.table_schema = 'public'
  ) uq ON c.table_schema = uq.table_schema
    AND c.table_name = uq.table_name
    AND c.column_name = uq.column_name
WHERE c.table_schema = 'public'
  AND c.table_name IN (
    'listing_analytics', 
    'user_analytics', 
    'admin_analytics',
    'developers_analytics',
    'developers',
    'listings',
    'developments',
    'agents',
    'leads',
    'analytics_cron_status',
    'property_seekers'
  )
ORDER BY c.table_name, c.ordinal_position;

