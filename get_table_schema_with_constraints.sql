-- ============================================================================
-- COMPREHENSIVE TABLE SCHEMA QUERY WITH ALL CONSTRAINTS
-- Fetches columns, data types, defaults, and ALL constraint information
-- ============================================================================

-- Main query: Get all columns with their properties
SELECT 
  c.table_schema,
  c.table_name,
  c.column_name,
  c.ordinal_position,
  c.data_type,
  c.character_maximum_length,
  c.numeric_precision,
  c.numeric_scale,
  c.is_nullable,
  c.column_default,
  c.udt_name,
  -- Constraint information
  CASE WHEN pk.column_name IS NOT NULL THEN 'PRIMARY KEY' END AS constraint_type,
  pk.constraint_name AS primary_key_constraint,
  fk.constraint_name AS foreign_key_constraint,
  fk.foreign_table_name,
  fk.foreign_column_name,
  uq.constraint_name AS unique_constraint,
  chk.constraint_name AS check_constraint,
  chk.check_clause
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
  ) uq ON c.table_schema = uq.table_schema
    AND c.table_name = uq.table_name
    AND c.column_name = uq.column_name
  -- Check Constraints
  LEFT JOIN (
    SELECT 
      tc.table_schema,
      tc.table_name,
      cc.column_name,
      tc.constraint_name,
      cc.check_clause
    FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage cc
      ON tc.constraint_name = cc.constraint_name
      AND tc.table_schema = cc.table_schema
    WHERE tc.constraint_type = 'CHECK'
  ) chk ON c.table_schema = chk.table_schema
    AND c.table_name = chk.table_name
    AND c.column_name = chk.column_name
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

-- ============================================================================
-- ALTERNATIVE: SEPARATE QUERIES FOR BETTER READABILITY
-- ============================================================================

-- Query 1: Basic column information
SELECT 
  table_name,
  column_name,
  ordinal_position,
  data_type,
  character_maximum_length,
  numeric_precision,
  numeric_scale,
  is_nullable,
  column_default
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

-- Query 2: Primary Key Constraints
SELECT 
  tc.table_name,
  kcu.column_name,
  tc.constraint_name AS primary_key_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
  AND tc.table_name = kcu.table_name
WHERE tc.constraint_type = 'PRIMARY KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name IN (
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
ORDER BY tc.table_name, kcu.ordinal_position;

-- Query 3: Foreign Key Constraints
SELECT 
  tc.table_name AS table_name,
  kcu.column_name AS column_name,
  tc.constraint_name AS foreign_key_name,
  ccu.table_name AS references_table,
  ccu.column_name AS references_column,
  rc.update_rule,
  rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
  AND tc.table_name = kcu.table_name
JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints rc
  ON rc.constraint_name = tc.constraint_name
  AND rc.constraint_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name IN (
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
ORDER BY tc.table_name, kcu.ordinal_position;

-- Query 4: Unique Constraints
SELECT 
  tc.table_name,
  kcu.column_name,
  tc.constraint_name AS unique_constraint_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
  AND tc.table_name = kcu.table_name
WHERE tc.constraint_type = 'UNIQUE'
  AND tc.table_schema = 'public'
  AND tc.table_name IN (
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
ORDER BY tc.table_name, kcu.ordinal_position;

-- Query 5: Check Constraints
SELECT 
  tc.table_name,
  cc.column_name,
  tc.constraint_name AS check_constraint_name,
  cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage cc
  ON tc.constraint_name = cc.constraint_name
  AND tc.table_schema = cc.table_schema
WHERE tc.constraint_type = 'CHECK'
  AND tc.table_schema = 'public'
  AND tc.table_name IN (
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
ORDER BY tc.table_name, tc.constraint_name;

-- Query 6: Not Null Constraints (columns that are NOT NULL)
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND is_nullable = 'NO'
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

-- Query 7: Indexes (for performance optimization)
SELECT 
  t.relname AS table_name,
  i.relname AS index_name,
  a.attname AS column_name,
  idx.indisunique AS is_unique,
  idx.indisprimary AS is_primary,
  pg_get_indexdef(idx.indexrelid) AS index_definition
FROM pg_class t
JOIN pg_index idx ON t.oid = idx.indrelid
JOIN pg_class i ON i.oid = idx.indexrelid
JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(idx.indkey)
WHERE t.relkind = 'r'
  AND t.relname IN (
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
ORDER BY t.relname, i.relname, array_position(idx.indkey, a.attnum);

-- ============================================================================
-- SUMMARY QUERY: All constraints in one view
-- ============================================================================
SELECT 
  'PRIMARY KEY' AS constraint_type,
  tc.table_name,
  STRING_AGG(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) AS columns,
  tc.constraint_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
  AND tc.table_name = kcu.table_name
WHERE tc.constraint_type = 'PRIMARY KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name IN (
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
GROUP BY tc.table_name, tc.constraint_name

UNION ALL

SELECT 
  'FOREIGN KEY' AS constraint_type,
  tc.table_name,
  kcu.column_name || ' -> ' || ccu.table_name || '.' || ccu.column_name AS columns,
  tc.constraint_name
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
  AND tc.table_name IN (
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

UNION ALL

SELECT 
  'UNIQUE' AS constraint_type,
  tc.table_name,
  STRING_AGG(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) AS columns,
  tc.constraint_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
  AND tc.table_name = kcu.table_name
WHERE tc.constraint_type = 'UNIQUE'
  AND tc.table_schema = 'public'
  AND tc.table_name IN (
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
GROUP BY tc.table_name, tc.constraint_name

UNION ALL

SELECT 
  'CHECK' AS constraint_type,
  tc.table_name,
  cc.check_clause AS columns,
  tc.constraint_name
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage cc
  ON tc.constraint_name = cc.constraint_name
  AND tc.table_schema = cc.table_schema
WHERE tc.constraint_type = 'CHECK'
  AND tc.table_schema = 'public'
  AND tc.table_name IN (
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

ORDER BY constraint_type, table_name, constraint_name;

-- ============================================================================
-- NOTES:
-- ============================================================================
-- 1. Fixed the table name list - removed quotes around individual names
-- 2. Added 'agents', 'leads', 'analytics_cron_status', 'property_seekers' to the list
-- 3. All queries filter by table_schema = 'public' for safety
-- 4. The main query shows all constraint types in one result
-- 5. Separate queries are provided for better readability
-- 6. Index query uses pg_catalog for detailed index information
-- 7. Summary query shows all constraints grouped by type
-- ============================================================================

