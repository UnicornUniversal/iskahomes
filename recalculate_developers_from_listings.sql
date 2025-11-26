-- Recalculate Developers Table from Actual Listings Data
-- This script updates developers.total_units, total_developments, total_revenue, and estimated_revenue based on actual data
-- 
-- Note: total_revenue and estimated_revenue are stored as INTEGER (not JSONB objects)
-- Currency is retrieved from developer's primary_location (company_locations) or default_currency when displaying

-- Step 1: Update total_units, total_developments, total_revenue, and estimated_revenue for each developer
UPDATE developers d
SET 
    -- Total units (count of completed listings)
    -- Note: listings.user_id matches developers.developer_id (auth user id), not developers.id
    total_units = COALESCE(
        (SELECT COUNT(*) 
         FROM listings l 
         WHERE l.user_id = d.developer_id 
           AND l.account_type = 'developer'
           AND (
               (l.listing_condition = 'completed' AND l.upload_status = 'completed')
               OR l.listing_status IN ('active', 'sold', 'rented')
           )),
        0
    ),
    
    -- Total developments (count of developments)
    -- Note: developments.developer_id stores developers.developer_id (not developers.id)
    total_developments = COALESCE(
        (SELECT COUNT(*) 
         FROM developments dev 
         WHERE dev.developer_id = d.developer_id),
        0
    ),
    
    -- Total revenue (sum of estimated_revenue from sold/rented listings)
    -- Stored as INTEGER - currency comes from primary_location/default_currency
    total_revenue = COALESCE(
        (SELECT COALESCE(SUM(
            CASE 
                WHEN l.estimated_revenue IS NOT NULL 
                    AND jsonb_typeof(l.estimated_revenue) = 'object'
                THEN COALESCE(
                    (l.estimated_revenue->>'estimated_revenue')::numeric,
                    (l.estimated_revenue->>'price')::numeric,
                    0
                )::integer
                ELSE 0
            END
        ), 0)
        FROM listings l
        WHERE l.user_id = d.developer_id
          AND l.account_type = 'developer'
          AND l.listing_status IN ('sold', 'rented')
          AND (
              (l.listing_condition = 'completed' AND l.upload_status = 'completed')
              OR l.listing_status IN ('sold', 'rented')
          )),
        0
    )::integer,
    
    -- Estimated revenue (sum of estimated_revenue from all completed listings)
    -- Stored as INTEGER - currency comes from primary_location/default_currency
    estimated_revenue = COALESCE(
        (SELECT COALESCE(SUM(
            CASE 
                WHEN l.estimated_revenue IS NOT NULL 
                    AND jsonb_typeof(l.estimated_revenue) = 'object'
                THEN COALESCE(
                    (l.estimated_revenue->>'estimated_revenue')::numeric,
                    (l.estimated_revenue->>'price')::numeric,
                    0
                )::integer
                ELSE 0
            END
        ), 0)
        FROM listings l
        WHERE l.user_id = d.developer_id
          AND l.account_type = 'developer'
          AND (
              (l.listing_condition = 'completed' AND l.upload_status = 'completed')
              OR l.listing_status IN ('active', 'sold', 'rented')
          )),
        0
    )::integer;

-- Step 2: Verify the updates
SELECT 
    d.id,
    d.name,
    d.slug,
    d.total_units as calculated_total_units,
    d.total_developments as calculated_total_developments,
    d.total_revenue,
    d.estimated_revenue,
    (SELECT COUNT(*) FROM listings WHERE user_id = d.developer_id AND account_type = 'developer' 
     AND (
         (listing_condition = 'completed' AND upload_status = 'completed')
         OR listing_status IN ('active', 'sold', 'rented')
     )) as actual_listings_count,
    (SELECT COUNT(*) FROM developments WHERE developer_id = d.id) as actual_developments_count,
    (SELECT COALESCE(SUM(
        CASE 
            WHEN estimated_revenue IS NOT NULL AND jsonb_typeof(estimated_revenue) = 'object'
            THEN COALESCE(
                (estimated_revenue->>'estimated_revenue')::numeric,
                (estimated_revenue->>'price')::numeric,
                0
            )::integer
            ELSE 0
        END
    ), 0)
    FROM listings 
    WHERE user_id = d.developer_id 
      AND account_type = 'developer'
      AND listing_status IN ('sold', 'rented')) as actual_total_revenue,
    (SELECT COALESCE(SUM(
        CASE 
            WHEN estimated_revenue IS NOT NULL AND jsonb_typeof(estimated_revenue) = 'object'
            THEN COALESCE(
                (estimated_revenue->>'estimated_revenue')::numeric,
                (estimated_revenue->>'price')::numeric,
                0
            )::integer
            ELSE 0
        END
    ), 0)
    FROM listings 
    WHERE user_id = d.developer_id 
      AND account_type = 'developer'
      AND (
          (listing_condition = 'completed' AND upload_status = 'completed')
          OR listing_status IN ('active', 'sold', 'rented')
      )) as actual_estimated_revenue
FROM developers d
ORDER BY d.total_units DESC
LIMIT 20;

