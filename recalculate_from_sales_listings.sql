-- ============================================================================
-- Recalculate all revenue and sales fields from sales_listings table
-- This script updates developers and developments tables based on actual sales
-- ============================================================================

-- Step 1: Update developers.total_revenue and developers.total_sales
-- Calculate from sales_listings table
UPDATE developers d
SET 
  -- Total revenue: Sum of all sale_price from sales_listings for this developer
  total_revenue = COALESCE(
    (SELECT SUM(sale_price)
     FROM sales_listings sl
     WHERE sl.user_id = d.developer_id),
    0
  )::numeric,
  
  -- Total sales: Count of all sales for this developer
  total_sales = COALESCE(
    (SELECT COUNT(*)
     FROM sales_listings sl
     WHERE sl.user_id = d.developer_id),
    0
  )::integer,
  
  -- Update timestamp
  updated_at = NOW()
WHERE EXISTS (
  SELECT 1 FROM sales_listings sl WHERE sl.user_id = d.developer_id
)
OR d.total_revenue IS NULL
OR d.total_sales IS NULL;

-- Step 2: Update developments.total_revenue and developments.units_sold
-- Calculate from sales_listings via listings table
UPDATE developments dev
SET 
  -- Total revenue: Sum of sale_price from sales_listings for listings in this development
  total_revenue = COALESCE(
    (SELECT SUM(sl.sale_price)
     FROM sales_listings sl
     INNER JOIN listings l ON l.id = sl.listing_id
     WHERE l.development_id = dev.id
       AND l.account_type = 'developer'),
    0
  )::numeric,
  
  -- Units sold: Count of unique listings sold in this development
  units_sold = COALESCE(
    (SELECT COUNT(DISTINCT sl.listing_id)
     FROM sales_listings sl
     INNER JOIN listings l ON l.id = sl.listing_id
     WHERE l.development_id = dev.id
       AND l.account_type = 'developer'),
    0
  )::integer,
  
  -- Update timestamp
  updated_at = NOW()
WHERE EXISTS (
  SELECT 1 
  FROM sales_listings sl
  INNER JOIN listings l ON l.id = sl.listing_id
  WHERE l.development_id = dev.id
    AND l.account_type = 'developer'
)
OR dev.total_revenue IS NULL
OR dev.units_sold IS NULL;

-- Step 3: Verify the updates
-- Show summary of updated records
SELECT 
  'Developers Updated' as table_name,
  COUNT(*) as records_updated,
  SUM(total_revenue) as total_revenue_sum,
  SUM(total_sales) as total_sales_sum
FROM developers
WHERE updated_at >= NOW() - INTERVAL '1 minute'

UNION ALL

SELECT 
  'Developments Updated' as table_name,
  COUNT(*) as records_updated,
  SUM(total_revenue) as total_revenue_sum,
  SUM(units_sold) as units_sold_sum
FROM developments
WHERE updated_at >= NOW() - INTERVAL '1 minute';

-- Step 4: Show detailed breakdown by developer
SELECT 
  d.id,
  d.name,
  d.slug,
  d.total_revenue,
  d.total_sales,
  (SELECT COUNT(*) FROM sales_listings sl WHERE sl.user_id = d.developer_id) as actual_sales_count,
  (SELECT SUM(sale_price) FROM sales_listings sl WHERE sl.user_id = d.developer_id) as actual_revenue_sum,
  CASE 
    WHEN d.total_revenue != COALESCE((SELECT SUM(sale_price) FROM sales_listings sl WHERE sl.user_id = d.developer_id), 0)
      THEN 'MISMATCH'
    ELSE 'OK'
  END as revenue_status,
  CASE 
    WHEN d.total_sales != COALESCE((SELECT COUNT(*) FROM sales_listings sl WHERE sl.user_id = d.developer_id), 0)
      THEN 'MISMATCH'
    ELSE 'OK'
  END as sales_count_status
FROM developers d
WHERE d.account_status = 'active'
ORDER BY d.total_revenue DESC NULLS LAST
LIMIT 20;

-- Step 5: Show detailed breakdown by development
SELECT 
  dev.id,
  dev.title,
  dev.slug,
  dev.total_revenue,
  dev.units_sold,
  dev.total_units,
  (SELECT COUNT(DISTINCT sl.listing_id) 
   FROM sales_listings sl
   INNER JOIN listings l ON l.id = sl.listing_id
   WHERE l.development_id = dev.id AND l.account_type = 'developer') as actual_units_sold,
  (SELECT SUM(sl.sale_price) 
   FROM sales_listings sl
   INNER JOIN listings l ON l.id = sl.listing_id
   WHERE l.development_id = dev.id AND l.account_type = 'developer') as actual_revenue_sum,
  CASE 
    WHEN dev.total_revenue != COALESCE((
      SELECT SUM(sl.sale_price) 
      FROM sales_listings sl
      INNER JOIN listings l ON l.id = sl.listing_id
      WHERE l.development_id = dev.id AND l.account_type = 'developer'
    ), 0)
      THEN 'MISMATCH'
    ELSE 'OK'
  END as revenue_status,
  CASE 
    WHEN dev.units_sold != COALESCE((
      SELECT COUNT(DISTINCT sl.listing_id) 
      FROM sales_listings sl
      INNER JOIN listings l ON l.id = sl.listing_id
      WHERE l.development_id = dev.id AND l.account_type = 'developer'
    ), 0)
      THEN 'MISMATCH'
    ELSE 'OK'
  END as units_sold_status
FROM developments dev
WHERE dev.development_status = 'active'
ORDER BY dev.total_revenue DESC NULLS LAST
LIMIT 20;

-- ============================================================================
-- OPTIONAL: Reset all to 0 first (use with caution!)
-- ============================================================================
-- Uncomment the following if you want to reset all values to 0 first:
/*
UPDATE developers 
SET total_revenue = 0, total_sales = 0
WHERE account_status = 'active';

UPDATE developments 
SET total_revenue = 0, units_sold = 0
WHERE development_status = 'active';
*/

-- ============================================================================
-- OPTIONAL: Show sales_listings summary for verification
-- ============================================================================
SELECT 
  'Sales Listings Summary' as summary_type,
  COUNT(*) as total_sales,
  COUNT(DISTINCT user_id) as unique_developers,
  COUNT(DISTINCT listing_id) as unique_listings,
  SUM(sale_price) as total_revenue,
  AVG(sale_price) as avg_sale_price,
  MIN(sale_date) as earliest_sale,
  MAX(sale_date) as latest_sale
FROM sales_listings;

-- Show sales by developer
SELECT 
  d.name as developer_name,
  d.slug,
  COUNT(sl.id) as sales_count,
  SUM(sl.sale_price) as total_revenue,
  AVG(sl.sale_price) as avg_sale_price,
  MIN(sl.sale_date) as first_sale,
  MAX(sl.sale_date) as last_sale
FROM sales_listings sl
INNER JOIN developers d ON d.developer_id = sl.user_id
GROUP BY d.id, d.name, d.slug
ORDER BY total_revenue DESC;

-- Show sales by development
SELECT 
  dev.title as development_name,
  dev.slug,
  COUNT(DISTINCT sl.listing_id) as units_sold,
  SUM(sl.sale_price) as total_revenue,
  AVG(sl.sale_price) as avg_sale_price
FROM sales_listings sl
INNER JOIN listings l ON l.id = sl.listing_id
INNER JOIN developments dev ON dev.id = l.development_id
WHERE l.account_type = 'developer'
GROUP BY dev.id, dev.title, dev.slug
ORDER BY total_revenue DESC;

