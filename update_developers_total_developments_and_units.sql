-- Update Developers: total_developments and total_units from listings table
-- This script updates each developer's total_developments (count of distinct developments from listings)
-- and total_units (count of listings) based on actual data in the listings table
--
-- Note: listings.user_id matches developers.developer_id (auth user id), not developers.id

UPDATE developers d
SET 
    -- Total units: Count of listings for this developer
    -- Counts listings that are either completed or have active/sold/rented status
    total_units = COALESCE(
        (SELECT COUNT(*) 
         FROM listings l 
         WHERE l.user_id = d.developer_id 
           AND l.account_type = 'developer'
           AND (
               -- Check if listing_condition and upload_status columns exist and are completed
               (l.listing_condition = 'completed' AND l.upload_status = 'completed')
               -- OR listing has an active status
               OR l.listing_status IN ('active', 'sold', 'rented')
           )),
        0
    ),
    
    -- Total developments: Count of distinct developments from listings
    -- This counts unique development_id values from listings for this developer
    total_developments = COALESCE(
        (SELECT COUNT(DISTINCT l.development_id)
         FROM listings l 
         WHERE l.user_id = d.developer_id 
           AND l.account_type = 'developer'
           AND l.development_id IS NOT NULL
           AND (
               -- Check if listing_condition and upload_status columns exist and are completed
               (l.listing_condition = 'completed' AND l.upload_status = 'completed')
               -- OR listing has an active status
               OR l.listing_status IN ('active', 'sold', 'rented')
           )),
        0
    ),
    
    -- Update timestamp
    updated_at = NOW();

-- Verification query: Check the results
SELECT 
    d.id,
    d.name,
    d.slug,
    d.total_units,
    d.total_developments,
    (SELECT COUNT(*) 
     FROM listings 
     WHERE user_id = d.developer_id 
       AND account_type = 'developer'
       AND (
           (listing_condition = 'completed' AND upload_status = 'completed')
           OR listing_status IN ('active', 'sold', 'rented')
       )) as actual_listings_count,
    (SELECT COUNT(DISTINCT development_id)
     FROM listings 
     WHERE user_id = d.developer_id 
       AND account_type = 'developer'
       AND development_id IS NOT NULL
       AND (
           (listing_condition = 'completed' AND upload_status = 'completed')
           OR listing_status IN ('active', 'sold', 'rented')
       )) as actual_developments_count
FROM developers d
WHERE d.developer_id IS NOT NULL
ORDER BY d.total_units DESC
LIMIT 20;

