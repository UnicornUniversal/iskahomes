-- Add company_locations field to developers table
-- This field stores an array of company location objects as JSONB

ALTER TABLE developers 
ADD COLUMN IF NOT EXISTS company_locations JSONB DEFAULT '[]'::jsonb;

-- Add GIN index for efficient JSONB queries on company_locations
CREATE INDEX IF NOT EXISTS idx_developers_company_locations_gin 
ON developers USING gin (company_locations);

-- Comment on the column
COMMENT ON COLUMN developers.company_locations IS 'Array of company location objects with place_id, address, coordinates, currency, and primary_location flag';

