-- SIMPLEST PostHog SQL Query (if other versions don't work)
-- This is the most basic version - adjust based on PostHog's SQL syntax

SELECT 
    event,
    timestamp,
    distinct_id,
    toDate(timestamp) as date,
    toHour(timestamp) as hour,
    properties
FROM events
WHERE 
    toDate(timestamp) IN ('2025-11-06', '2025-11-11', '2025-11-12', '2025-11-14', '2025-11-18', '2025-11-19', '2025-11-20')
    AND event IN (
        'property_view',
        'listing_impression',
        'lead',
        'lead_phone',
        'lead_message',
        'lead_appointment',
        'impression_social_media',
        'impression_website_visit',
        'impression_share',
        'impression_saved_listing',
        'profile_view',
        'property_search',
        'development_view',
        'development_share',
        'development_saved',
        'development_social_click',
        'development_interaction',
        'development_lead'
    )
ORDER BY timestamp ASC
LIMIT 10000

