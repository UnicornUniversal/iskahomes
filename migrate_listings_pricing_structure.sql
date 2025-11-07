-- Migration: Restructure listings pricing fields
-- This migration moves pricing data from flat columns to JSONB structure

-- Step 1: Handle existing estimated_revenue column (if it exists with different type)
-- Drop old estimated_revenue if it exists and is not JSONB
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'listings' 
    AND column_name = 'estimated_revenue' 
    AND data_type != 'jsonb'
  ) THEN
    ALTER TABLE listings DROP COLUMN estimated_revenue;
  END IF;
END $$;

-- Step 2: Add new JSONB columns
ALTER TABLE listings 
  ADD COLUMN IF NOT EXISTS pricing JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS estimated_revenue JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS global_price JSONB DEFAULT '{}'::jsonb;

-- Step 3: Migrate existing data to new structure
-- Migrate pricing data from flat columns to pricing JSONB
-- Handle NULL values properly
UPDATE listings
SET pricing = jsonb_build_object(
  'price', CASE 
    WHEN price IS NOT NULL THEN price::numeric
    ELSE NULL
  END,
  'currency', COALESCE(currency, 'GHS'),
  'duration', COALESCE(duration, 'monthly'),
  'price_type', COALESCE(price_type, 'rent'),
  'security_requirements', COALESCE(security_requirements, '')
)
WHERE (pricing = '{}'::jsonb OR pricing IS NULL)
  AND (price IS NOT NULL OR currency IS NOT NULL OR duration IS NOT NULL OR price_type IS NOT NULL);

-- Step 4: Initialize estimated_revenue and global_price as empty objects
-- These will be populated when currency conversion is implemented
-- Since we just added them with DEFAULT '{}'::jsonb, they should already be initialized
-- But update any that might be NULL just in case
UPDATE listings
SET estimated_revenue = '{}'::jsonb
WHERE estimated_revenue IS NULL;

UPDATE listings
SET global_price = '{}'::jsonb
WHERE global_price IS NULL;

-- Step 5: Create indexes on JSONB columns for efficient querying
CREATE INDEX IF NOT EXISTS idx_listings_pricing_currency ON listings USING GIN((pricing->'currency'));
CREATE INDEX IF NOT EXISTS idx_listings_pricing_price_type ON listings USING GIN((pricing->'price_type'));
CREATE INDEX IF NOT EXISTS idx_listings_estimated_revenue_currency ON listings USING GIN((estimated_revenue->'currency'));
CREATE INDEX IF NOT EXISTS idx_listings_global_price_currency ON listings USING GIN((global_price->'currency'));

-- Step 6: Remove old flat columns (DO THIS AFTER VERIFYING DATA IS MIGRATED CORRECTLY)
-- Uncomment these lines once you've verified the migration worked:
/*
ALTER TABLE listings 
  DROP COLUMN IF EXISTS price,
  DROP COLUMN IF EXISTS currency,
  DROP COLUMN IF EXISTS duration,
  DROP COLUMN IF EXISTS security_requirements;
*/

-- Step 7: Verify migration (run this to check the migrated data)
/*
SELECT 
  id,
  title,
  pricing,
  estimated_revenue,
  global_price,
  cancellation_policy,
  is_negotiable,
  flexible_terms,
  -- Show old columns for comparison (before dropping them)
  price AS old_price,
  currency AS old_currency,
  duration AS old_duration
FROM listings
WHERE pricing != '{}'::jsonb
LIMIT 10;
*/

-- Expected output after migration:
-- pricing: {"price": 2000.00, "currency": "GHS", "duration": "yearly", "price_type": "rent", "security_requirements": "None for now"}
-- estimated_revenue: {} (empty, will be populated by currency conversion logic)
-- global_price: {} (empty, will be populated by currency conversion logic)

-- ============================================================================
-- ROLLBACK SCRIPT (Use this if you need to revert the migration)
-- ============================================================================
/*
-- Step 1: Restore old columns if they were dropped
ALTER TABLE listings 
  ADD COLUMN IF NOT EXISTS price DECIMAL(15, 2),
  ADD COLUMN IF NOT EXISTS currency VARCHAR(3),
  ADD COLUMN IF NOT EXISTS duration VARCHAR(50),
  ADD COLUMN IF NOT EXISTS security_requirements TEXT;

-- Step 2: Migrate data back from JSONB to flat columns
UPDATE listings
SET 
  price = (pricing->>'price')::DECIMAL,
  currency = pricing->>'currency',
  duration = pricing->>'duration',
  security_requirements = pricing->>'security_requirements'
WHERE pricing IS NOT NULL AND pricing != '{}'::jsonb;

-- Step 3: Drop new JSONB columns
ALTER TABLE listings 
  DROP COLUMN IF EXISTS pricing,
  DROP COLUMN IF EXISTS estimated_revenue,
  DROP COLUMN IF EXISTS global_price;

-- Step 4: Drop indexes
DROP INDEX IF EXISTS idx_listings_pricing_currency;
DROP INDEX IF EXISTS idx_listings_pricing_price_type;
DROP INDEX IF EXISTS idx_listings_estimated_revenue_currency;
DROP INDEX IF EXISTS idx_listings_global_price_currency;
*/
