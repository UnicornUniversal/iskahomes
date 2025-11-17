-- Corrected query to check all analytics tables
SELECT 
  table_name,
  column_name, 
  data_type, 
  column_default
FROM information_schema.columns
WHERE table_name IN ('listing_analytics', 'user_analytics', 'admin_analytics', 'development_analytics')
ORDER BY table_name, ordinal_position;

