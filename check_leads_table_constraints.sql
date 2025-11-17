-- Check all constraints on the leads table
-- This query shows all constraints including primary keys, unique constraints, foreign keys, and check constraints

-- Method 1: Query information_schema for all constraints
SELECT 
    con.conname AS constraint_name,
    con.contype AS constraint_type,
    CASE con.contype
        WHEN 'p' THEN 'PRIMARY KEY'
        WHEN 'u' THEN 'UNIQUE'
        WHEN 'f' THEN 'FOREIGN KEY'
        WHEN 'c' THEN 'CHECK'
        WHEN 'x' THEN 'EXCLUSION'
        ELSE 'OTHER'
    END AS constraint_type_name,
    con.conrelid::regclass AS table_name,
    array_agg(a.attname ORDER BY array_position(con.conkey, a.attnum)) AS column_names,
    pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
LEFT JOIN pg_attribute a ON a.attrelid = con.conrelid AND a.attnum = ANY(con.conkey)
WHERE rel.relname = 'leads'
  AND nsp.nspname = 'public'
GROUP BY con.conname, con.contype, con.conrelid, con.oid
ORDER BY con.contype, con.conname;

-- Method 2: Show indexes (which often enforce unique constraints)
SELECT 
    i.relname AS index_name,
    a.amname AS index_type,
    array_agg(att.attname ORDER BY array_position(ix.indkey, att.attnum)) AS column_names,
    ix.indisunique AS is_unique,
    ix.indisprimary AS is_primary,
    pg_get_indexdef(i.oid) AS index_definition
FROM pg_index ix
JOIN pg_class i ON i.oid = ix.indexrelid
JOIN pg_class t ON t.oid = ix.indrelid
JOIN pg_am a ON a.oid = i.relam
LEFT JOIN pg_attribute att ON att.attrelid = t.oid AND att.attnum = ANY(ix.indkey)
WHERE t.relname = 'leads'
  AND t.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
GROUP BY i.relname, a.amname, ix.indisunique, ix.indisprimary, i.oid
ORDER BY ix.indisprimary DESC, ix.indisunique DESC, i.relname;

-- Method 3: Show the specific unique constraint on (listing_id, seeker_id)
SELECT 
    con.conname AS constraint_name,
    'UNIQUE CONSTRAINT' AS constraint_type,
    array_agg(a.attname ORDER BY array_position(con.conkey, a.attnum)) AS columns,
    pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
LEFT JOIN pg_attribute a ON a.attrelid = con.conrelid AND a.attnum = ANY(con.conkey)
WHERE rel.relname = 'leads'
  AND nsp.nspname = 'public'
  AND con.contype = 'u'
  AND array_length(con.conkey, 1) = 2  -- Two columns
GROUP BY con.conname, con.oid
HAVING array_agg(a.attname ORDER BY array_position(con.conkey, a.attnum))::text[] = ARRAY['listing_id', 'seeker_id']
   OR array_agg(a.attname ORDER BY array_position(con.conkey, a.attnum))::text[] = ARRAY['seeker_id', 'listing_id'];

