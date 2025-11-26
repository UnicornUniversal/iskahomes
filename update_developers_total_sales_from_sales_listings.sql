-- ============================================================================
-- Update Developers: total_sales and total_revenue from sales_listings table
-- This script recalculates and updates each developer's total_sales and total_revenue
-- based on the actual sales records in the sales_listings table
--
-- IMPORTANT: 
-- - sales_listings.user_id stores developers.developer_id (UUID from user profile)
-- - NOT developers.id (primary key)
-- - This is the source of truth for actual sales
-- ============================================================================

-- Step 1: Update total_sales and total_revenue for all developers
UPDATE developers d
SET 
    -- Total sales: Count of sales_listings entries for this developer
    -- Note: sales_listings.user_id = developers.developer_id (not developers.id)
    total_sales = COALESCE(
        (SELECT COUNT(*) 
         FROM sales_listings sl 
         WHERE sl.user_id = d.developer_id),
        0
    )::integer,
    
    -- Total revenue: Sum of sale_price from sales_listings for this developer
    total_revenue = COALESCE(
        (SELECT SUM(sale_price)
         FROM sales_listings sl 
         WHERE sl.user_id = d.developer_id),
        0
    )::numeric,
    
    -- Update timestamp
    updated_at = NOW()
WHERE d.developer_id IS NOT NULL;

-- Step 2: Verification query - Check the results
SELECT 
    d.id,
    d.developer_id,
    d.name,
    d.slug,
    d.total_sales as updated_total_sales,
    d.total_revenue as updated_total_revenue,
    (SELECT COUNT(*) 
     FROM sales_listings sl 
     WHERE sl.user_id = d.developer_id) as actual_sales_count,
    (SELECT COALESCE(SUM(sale_price), 0)
     FROM sales_listings sl 
     WHERE sl.user_id = d.developer_id) as actual_total_revenue,
    CASE 
        WHEN d.total_sales = (SELECT COUNT(*) FROM sales_listings sl WHERE sl.user_id = d.developer_id)
        AND ABS(COALESCE(d.total_revenue, 0) - COALESCE((SELECT SUM(sale_price) FROM sales_listings sl WHERE sl.user_id = d.developer_id), 0)) < 0.01
        THEN '✅ Match'
        ELSE '❌ Mismatch'
    END as status
FROM developers d
WHERE d.developer_id IS NOT NULL
ORDER BY d.total_sales DESC, d.name
LIMIT 50;

-- Step 3: Summary statistics
SELECT 
    COUNT(*) as total_developers,
    SUM(total_sales) as total_sales_sum,
    SUM(total_revenue) as total_revenue_sum,
    AVG(total_sales) as avg_sales_per_developer,
    MAX(total_sales) as max_sales,
    MIN(total_sales) as min_sales,
    (SELECT COUNT(*) FROM sales_listings) as actual_total_sales_count,
    (SELECT COALESCE(SUM(sale_price), 0) FROM sales_listings) as actual_total_revenue_sum
FROM developers
WHERE developer_id IS NOT NULL;

