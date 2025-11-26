-- PostHog HogQL Query: Get exactly 5 sample events for each custom event type
-- Paste this directly into PostHog's SQL/HogQL interface
-- This will help analyze event structure and properties for aggregation

WITH ranked_events AS (
    SELECT 
        event,
        timestamp,
        distinct_id,
        person_id,
        -- Listing-related properties
        properties.listing_id as listing_id,
        properties.listingId as listingId,
        -- Lister/Developer/Agent properties
        properties.lister_id as lister_id,
        properties.listerId as listerId,
        properties.developer_id as developer_id,
        properties.developerId as developerId,
        properties.user_id as user_id,
        properties.userId as userId,
        -- Seeker/User properties
        properties.seeker_id as seeker_id,
        properties.seekerId as seekerId,
        -- View source properties
        properties.viewed_from as viewed_from,
        properties.is_logged_in as is_logged_in,
        -- Lead properties
        properties.lead_type as lead_type,
        properties.action_type as action_type,
        -- Impression properties
        properties.platform as platform,
        properties.source as source,
        -- Development properties
        properties.development_id as development_id,
        properties.developmentId as developmentId,
        -- All properties as JSON for full inspection
        properties as all_properties,
        ROW_NUMBER() OVER (PARTITION BY event ORDER BY timestamp DESC) as row_num
    FROM events
    WHERE 
        -- Filter to only our custom events (exclude auto-capture)
        event NOT LIKE '$%'
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
        -- Optional: Filter by date range (uncomment and adjust as needed)
        -- AND timestamp >= '2025-11-01 00:00:00'
        -- AND timestamp <= '2025-11-21 23:59:59'
        -- Optional: Filter by specific user (uncomment and adjust as needed)
        -- AND (
        --     properties.lister_id = '2110cf0f-11c5-40a9-9a00-97bc581d2cee'
        --     OR properties.developer_id = '2110cf0f-11c5-40a9-9a00-97bc581d2cee'
        --     OR properties.user_id = '2110cf0f-11c5-40a9-9a00-97bc581d2cee'
        --     OR distinct_id = '2110cf0f-11c5-40a9-9a00-97bc581d2cee'
        -- )
)
SELECT 
    event,
    timestamp,
    distinct_id,
    person_id,
    listing_id,
    listingId,
    lister_id,
    listerId,
    developer_id,
    developerId,
    user_id,
    userId,
    seeker_id,
    seekerId,
    viewed_from,
    is_logged_in,
    lead_type,
    action_type,
    platform,
    source,
    development_id,
    developmentId,
    all_properties
FROM ranked_events
WHERE row_num <= 5
ORDER BY 
    event,
    timestamp DESC

-- This query will return exactly 5 samples per event type (max 90 rows if all 18 event types exist)
-- Use this to understand:
-- 1. Which properties are actually present in events
-- 2. How properties are named (camelCase vs snake_case)
-- 3. What values are stored in each property
-- 4. Event structure for aggregation logic
