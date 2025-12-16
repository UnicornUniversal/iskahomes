-- Update development_locations array from existing location fields
-- This script populates the development_locations JSONB array with location data
-- from the individual location columns (country, state, city, town, etc.)

UPDATE developments
SET development_locations = (
  SELECT jsonb_build_array(
    jsonb_build_object(
      'id', COALESCE(
        (EXTRACT(EPOCH FROM COALESCE(updated_at, created_at)) * 1000)::bigint::text,
        (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint::text
      ),
      'city', COALESCE(city, ''),
      'town', COALESCE(town, ''),
      'state', COALESCE(state, ''),
      'country', COALESCE(country, ''),
      'isPrimary', true,
      'coordinates', jsonb_build_object(
        'latitude', COALESCE(latitude::text, ''),
        'longitude', COALESCE(longitude::text, '')
      ),
      'countryCode', CASE
        WHEN UPPER(country) = 'GHANA' THEN 'GH'
        WHEN UPPER(country) = 'NIGERIA' THEN 'NG'
        WHEN UPPER(country) = 'KENYA' THEN 'KE'
        WHEN UPPER(country) = 'SOUTH AFRICA' THEN 'ZA'
        WHEN UPPER(country) = 'UNITED STATES' OR UPPER(country) = 'USA' THEN 'US'
        WHEN UPPER(country) = 'UNITED KINGDOM' OR UPPER(country) = 'UK' THEN 'GB'
        WHEN UPPER(country) = 'CANADA' THEN 'CA'
        WHEN UPPER(country) = 'AUSTRALIA' THEN 'AU'
        ELSE NULL
      END,
      'fullAddress', COALESCE(full_address, ''),
      'additionalInformation', COALESCE(additional_information, '')
    )
  )
)
WHERE 
  -- Only update where development_locations is NULL or empty array
  (development_locations IS NULL 
   OR development_locations = '[]'::jsonb
   OR jsonb_array_length(development_locations) = 0)
  -- And where we have at least some location data
  AND (
    country IS NOT NULL 
    OR city IS NOT NULL 
    OR full_address IS NOT NULL
  );

-- Optional: Verify the update
-- SELECT 
--   id,
--   title,
--   country,
--   state,
--   city,
--   town,
--   full_address,
--   latitude,
--   longitude,
--   development_locations
-- FROM developments
-- WHERE development_locations IS NOT NULL
-- ORDER BY updated_at DESC
-- LIMIT 10;

