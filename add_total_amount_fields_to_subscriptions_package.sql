-- =============================================
-- ADD TOTAL AMOUNT FIELDS TO SUBSCRIPTIONS_PACKAGE
-- =============================================
-- Adds total_amount_usd and total_amount_ghs fields
-- These are calculated as: ideal_duration * monthly_price
-- This avoids recalculating on the frontend every time
-- =============================================

-- Add total_amount_usd column
ALTER TABLE subscriptions_package 
ADD COLUMN IF NOT EXISTS total_amount_usd DECIMAL(15, 2);

-- Add total_amount_ghs column
ALTER TABLE subscriptions_package 
ADD COLUMN IF NOT EXISTS total_amount_ghs DECIMAL(15, 2);

-- Update existing records with calculated values
-- total_amount_usd = ideal_duration * international_currency_price
-- total_amount_ghs = ideal_duration * local_currency_price
UPDATE subscriptions_package
SET 
  total_amount_usd = CASE 
    WHEN ideal_duration IS NOT NULL AND ideal_duration > 0 
    THEN ideal_duration * COALESCE(international_currency_price, 0)
    ELSE COALESCE(international_currency_price, 0)
  END,
  total_amount_ghs = CASE 
    WHEN ideal_duration IS NOT NULL AND ideal_duration > 0 
    THEN ideal_duration * COALESCE(local_currency_price, 0)
    ELSE COALESCE(local_currency_price, 0)
  END
WHERE total_amount_usd IS NULL OR total_amount_ghs IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN subscriptions_package.total_amount_usd IS 'Total amount in USD (ideal_duration * international_currency_price). This is the minimum payment amount for this package.';
COMMENT ON COLUMN subscriptions_package.total_amount_ghs IS 'Total amount in GHS (ideal_duration * local_currency_price). This is the minimum payment amount for this package.';

