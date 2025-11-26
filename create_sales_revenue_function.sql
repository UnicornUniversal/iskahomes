-- Create PostgreSQL function to get sales revenue summary using SQL SUM
CREATE OR REPLACE FUNCTION get_sales_revenue_summary(p_user_id UUID)
RETURNS TABLE (
  total_revenue NUMERIC,
  total_sales INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(sale_price), 0)::NUMERIC as total_revenue,
    COUNT(*)::INTEGER as total_sales
  FROM sales_listings
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

