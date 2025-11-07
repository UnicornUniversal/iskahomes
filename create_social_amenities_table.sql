-- Create social_amenities table to store nearby social facilities for each listing
-- This table uses JSONB columns to store arrays of amenity data for efficient querying

CREATE TABLE IF NOT EXISTS social_amenities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    
    -- Schools nearby (array of school objects)
    schools JSONB DEFAULT '[]'::jsonb,
    
    -- Hospitals nearby (array of hospital objects)
    hospitals JSONB DEFAULT '[]'::jsonb,
    
    -- Airports nearby (array of airport objects)
    airports JSONB DEFAULT '[]'::jsonb,
    
    -- Parks nearby (array of park objects)
    parks JSONB DEFAULT '[]'::jsonb,
    
    -- Shops and markets nearby (array of shop objects)
    shops JSONB DEFAULT '[]'::jsonb,
    
    -- Police stations nearby (array of police station objects)
    police JSONB DEFAULT '[]'::jsonb,
    
    -- Metadata
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one record per listing
    CONSTRAINT unique_listing_amenities UNIQUE (listing_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_social_amenities_listing_id ON social_amenities(listing_id);
CREATE INDEX IF NOT EXISTS idx_social_amenities_last_updated ON social_amenities(last_updated);

-- Create GIN indexes on JSONB columns for efficient JSON queries
CREATE INDEX IF NOT EXISTS idx_social_amenities_schools ON social_amenities USING GIN (schools);
CREATE INDEX IF NOT EXISTS idx_social_amenities_hospitals ON social_amenities USING GIN (hospitals);
CREATE INDEX IF NOT EXISTS idx_social_amenities_airports ON social_amenities USING GIN (airports);
CREATE INDEX IF NOT EXISTS idx_social_amenities_parks ON social_amenities USING GIN (parks);
CREATE INDEX IF NOT EXISTS idx_social_amenities_shops ON social_amenities USING GIN (shops);
CREATE INDEX IF NOT EXISTS idx_social_amenities_police ON social_amenities USING GIN (police);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_social_amenities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_social_amenities_updated_at
    BEFORE UPDATE ON social_amenities
    FOR EACH ROW
    EXECUTE FUNCTION update_social_amenities_updated_at();

-- Add comments for documentation
COMMENT ON TABLE social_amenities IS 'Stores nearby social amenities data for each property listing';
COMMENT ON COLUMN social_amenities.listing_id IS 'Reference to the property listing';
COMMENT ON COLUMN social_amenities.schools IS 'Array of nearby schools with details (name, address, distance, rating, etc.)';
COMMENT ON COLUMN social_amenities.hospitals IS 'Array of nearby hospitals with details';
COMMENT ON COLUMN social_amenities.airports IS 'Array of nearby airports with details';
COMMENT ON COLUMN social_amenities.parks IS 'Array of nearby parks with details';
COMMENT ON COLUMN social_amenities.shops IS 'Array of nearby shops and markets with details';
COMMENT ON COLUMN social_amenities.police IS 'Array of nearby police stations with details';
COMMENT ON COLUMN social_amenities.last_updated IS 'Timestamp when amenities data was last fetched from Google Places';

-- Example of the JSON structure for each amenity:
-- {
--   "id": "ChIJDae3soSQ3w8RfsOpnxExsv0",
--   "name": "Top Kid Activity Centre",
--   "address": "MR6V+6VF, Fourth Street, Madina",
--   "rating": 4.8,
--   "distance": 2.9,
--   "location": {
--     "lat": 5.6605557,
--     "lng": -0.1553334
--   },
--   "types": ["school", "point_of_interest", "establishment"],
--   "priceLevel": 2,
--   "openNow": false,
--   "photoUrl": "https://maps.googleapis.com/maps/api/place/photo?..."
-- }

-- Example queries:

-- Insert or update social amenities for a listing
-- INSERT INTO social_amenities (listing_id, schools, hospitals, parks, shops, airports, police)
-- VALUES (
--     'your-listing-uuid',
--     '[{"id":"place1","name":"School 1","distance":2.5}]'::jsonb,
--     '[{"id":"place2","name":"Hospital 1","distance":1.2}]'::jsonb,
--     '[{"id":"place3","name":"Park 1","distance":0.8}]'::jsonb,
--     '[{"id":"place4","name":"Shop 1","distance":0.5}]'::jsonb,
--     '[{"id":"place5","name":"Airport 1","distance":15.0}]'::jsonb,
--     '[{"id":"place6","name":"Police 1","distance":1.0}]'::jsonb
-- )
-- ON CONFLICT (listing_id) 
-- DO UPDATE SET
--     schools = EXCLUDED.schools,
--     hospitals = EXCLUDED.hospitals,
--     parks = EXCLUDED.parks,
--     shops = EXCLUDED.shops,
--     airports = EXCLUDED.airports,
--     police = EXCLUDED.police,
--     last_updated = NOW();

-- Query to get all amenities for a listing
-- SELECT * FROM social_amenities WHERE listing_id = 'your-listing-uuid';

-- Query to find listings with schools within 2km
-- SELECT listing_id 
-- FROM social_amenities, 
--      jsonb_array_elements(schools) AS school
-- WHERE (school->>'distance')::float < 2.0;

-- Query to count total amenities for a listing
-- SELECT 
--     listing_id,
--     jsonb_array_length(schools) as school_count,
--     jsonb_array_length(hospitals) as hospital_count,
--     jsonb_array_length(parks) as park_count,
--     jsonb_array_length(shops) as shop_count,
--     jsonb_array_length(airports) as airport_count,
--     jsonb_array_length(police) as police_count
-- FROM social_amenities 
-- WHERE listing_id = 'your-listing-uuid';

-- Query to find schools with rating > 4.5
-- SELECT 
--     listing_id,
--     school->>'name' as school_name,
--     school->>'rating' as rating,
--     school->>'distance' as distance
-- FROM social_amenities,
--      jsonb_array_elements(schools) AS school
-- WHERE (school->>'rating')::float > 4.5;

