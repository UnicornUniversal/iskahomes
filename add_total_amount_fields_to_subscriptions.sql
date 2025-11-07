-- =============================================
-- ADD TOTAL AMOUNT FIELDS TO SUBSCRIPTIONS
-- =============================================
-- Adds total_amount_usd and total_amount_ghs fields to subscriptions table
-- These store the total amount paid for the subscription
-- =============================================

-- Add total_amount_usd column
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS total_amount_usd DECIMAL(15, 2);

-- Add total_amount_ghs column
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS total_amount_ghs DECIMAL(15, 2);

-- Update existing subscriptions with calculated values based on currency
-- If currency is USD, set total_amount_usd = amount, total_amount_ghs = null (or calculate if needed)
-- If currency is GHS, set total_amount_ghs = amount, total_amount_usd = null (or calculate if needed)
UPDATE subscriptions
SET 
  total_amount_usd = CASE 
    WHEN currency = 'USD' THEN amount
    ELSE NULL
  END,
  total_amount_ghs = CASE 
    WHEN currency = 'GHS' THEN amount
    ELSE NULL
  END
WHERE total_amount_usd IS NULL AND total_amount_ghs IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN subscriptions.total_amount_usd IS 'Total subscription amount in USD (if paid in USD)';
COMMENT ON COLUMN subscriptions.total_amount_ghs IS 'Total subscription amount in GHS (if paid in GHS)';

