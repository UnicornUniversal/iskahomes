-- Add total_saved and total_appointments fields to listings and developers tables
-- These fields track how many times listings are saved and appointments are booked

-- Add fields to listings table
ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS total_saved INTEGER DEFAULT 0;

ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS total_appointments INTEGER DEFAULT 0;

-- Add fields to developers table (if they don't exist)
ALTER TABLE developers 
ADD COLUMN IF NOT EXISTS total_saved INTEGER DEFAULT 0;

-- Note: total_appointments might already exist in developers table
-- This will only add it if it doesn't exist
ALTER TABLE developers 
ADD COLUMN IF NOT EXISTS total_appointments INTEGER DEFAULT 0;

-- Add comments for documentation
COMMENT ON COLUMN listings.total_saved IS 'Total number of times this listing has been saved by property seekers';
COMMENT ON COLUMN listings.total_appointments IS 'Total number of appointments booked for this listing';
COMMENT ON COLUMN developers.total_saved IS 'Total number of times developer listings have been saved by property seekers';
COMMENT ON COLUMN developers.total_appointments IS 'Total number of appointments booked for developer listings';

