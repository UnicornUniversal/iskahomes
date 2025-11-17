-- Update leads table to support profile-based leads (listing_id can be null)
-- This allows leads from developer/agent profiles (not tied to a specific listing)

-- 1. Make listing_id nullable (to support profile-based leads)
ALTER TABLE leads
ALTER COLUMN listing_id DROP NOT NULL;

-- 2. Add context_type column to distinguish between listing and profile leads
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS context_type VARCHAR(20) DEFAULT 'listing';

-- Add check constraint to ensure context_type is valid
ALTER TABLE leads
ADD CONSTRAINT leads_context_type_check CHECK (context_type IN ('listing', 'profile', 'customer_care'));

-- 3. Update existing records: set context_type based on listing_id
-- If listing_id is null, set context_type to 'profile' (though existing records should all have listing_id)
UPDATE leads
SET context_type = CASE 
  WHEN listing_id IS NULL THEN 'profile'
  ELSE 'listing'
END
WHERE context_type = 'listing' OR context_type IS NULL;

-- 4. Create index on context_type for fast filtering
CREATE INDEX IF NOT EXISTS idx_leads_context_type ON leads(context_type);

-- 5. Create composite index for querying profile leads by lister
CREATE INDEX IF NOT EXISTS idx_leads_lister_context 
ON leads(lister_id, context_type) 
WHERE listing_id IS NULL;

-- 6. Create composite index for querying listing leads
CREATE INDEX IF NOT EXISTS idx_leads_listing_context 
ON leads(listing_id, context_type) 
WHERE listing_id IS NOT NULL;

-- 7. Add comment explaining the change
COMMENT ON COLUMN leads.listing_id IS 'Listing ID (nullable). NULL for profile-based leads, UUID for listing-based leads.';
COMMENT ON COLUMN leads.context_type IS 'Context where lead originated: listing, profile, or customer_care';

-- Note about unique constraint:
-- The existing unique index on (listing_id, seeker_id) will still work:
-- - For listing-based leads (listing_id IS NOT NULL): Enforces uniqueness per (listing_id, seeker_id)
-- - For profile-based leads (listing_id IS NULL): PostgreSQL allows multiple NULLs, so multiple profile leads
--   per (lister_id, seeker_id) are allowed for time series tracking
-- This is the desired behavior: listing leads are unique per listing+seeker, profile leads can repeat

