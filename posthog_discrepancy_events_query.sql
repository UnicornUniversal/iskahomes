-- PostHog SQL Query to Get Events for Discrepancy Analysis
-- This query fetches all events for the user on dates/hours with discrepancies
-- Replace the user_id and dates as needed

SELECT 
    -- Event identification
    event,
    timestamp,
    DATE(timestamp) as event_date,
    EXTRACT(HOUR FROM timestamp) as event_hour,
    
    -- User identification fields (to check which ones match)
    properties.lister_id as lister_id,
    properties.listerId as listerId,
    properties.developer_id as developer_id,
    properties.developerId as developerId,
    properties.agent_id as agent_id,
    properties.agentId as agentId,
    properties.user_id as user_id,
    properties.userId as userId,
    properties.profile_id as profile_id,
    properties.profileId as profileId,
    distinct_id,
    person_id,
    
    -- Listing identification
    properties.listing_id as listing_id,
    properties.listingId as listingId,
    properties.listing_uuid as listing_uuid,
    properties.property_id as property_id,
    
    -- Event-specific properties
    properties.viewed_from as viewed_from,
    properties.lead_type as lead_type,
    properties.context_type as context_type,
    properties.message_type as message_type,
    
    -- All properties as JSON (for detailed inspection)
    properties as all_properties
    
FROM events
WHERE 
    -- User filter: Replace '2110cf0f-11c5-40a9-9a00-97bc581d2cee' with your user_id
    (
        properties.lister_id = '2110cf0f-11c5-40a9-9a00-97bc581d2cee'
        OR properties.listerId = '2110cf0f-11c5-40a9-9a00-97bc581d2cee'
        OR properties.developer_id = '2110cf0f-11c5-40a9-9a00-97bc581d2cee'
        OR properties.developerId = '2110cf0f-11c5-40a9-9a00-97bc581d2cee'
        OR properties.agent_id = '2110cf0f-11c5-40a9-9a00-97bc581d2cee'
        OR properties.agentId = '2110cf0f-11c5-40a9-9a00-97bc581d2cee'
        OR properties.user_id = '2110cf0f-11c5-40a9-9a00-97bc581d2cee'
        OR properties.userId = '2110cf0f-11c5-40a9-9a00-97bc581d2cee'
        OR properties.profile_id = '2110cf0f-11c5-40a9-9a00-97bc581d2cee'
        OR properties.profileId = '2110cf0f-11c5-40a9-9a00-97bc581d2cee'
        OR distinct_id = '2110cf0f-11c5-40a9-9a00-97bc581d2cee'
    )
    
    -- Date range: Focus on problematic dates
    AND DATE(timestamp) IN ('2025-11-08', '2025-11-09', '2025-11-06', '2025-11-17')
    
    -- Focus on specific event types that are causing discrepancies
    AND event IN (
        'profile_view',
        'property_view',
        'listing_impression',
        'impression_share',
        'impression_saved_listing',
        'lead',
        'lead_phone',
        'lead_message',
        'lead_appointment',
        'impression_social_media',
        'impression_website_visit'
    )
    
    -- Optional: Filter to specific problematic hours
    -- Uncomment and modify as needed:
    -- AND EXTRACT(HOUR FROM timestamp) IN (13, 15, 17, 19, 16)  -- For 2025-11-09 extra hours
    
ORDER BY timestamp ASC

-- Alternative query: Get events grouped by date and hour for easier analysis
-- Uncomment this section and comment out the above SELECT to use:

/*
SELECT 
    DATE(timestamp) as event_date,
    EXTRACT(HOUR FROM timestamp) as event_hour,
    event,
    COUNT(*) as event_count,
    COUNT(DISTINCT distinct_id) as unique_users,
    -- Count by event type
    COUNT(CASE WHEN event = 'profile_view' THEN 1 END) as profile_views,
    COUNT(CASE WHEN event = 'property_view' THEN 1 END) as property_views,
    COUNT(CASE WHEN event = 'listing_impression' THEN 1 END) as listing_impressions,
    COUNT(CASE WHEN event = 'impression_share' THEN 1 END) as share_impressions,
    COUNT(CASE WHEN event = 'impression_saved_listing' THEN 1 END) as saved_impressions,
    COUNT(CASE WHEN event IN ('lead', 'lead_phone', 'lead_message', 'lead_appointment') THEN 1 END) as lead_events
    
FROM events
WHERE 
    (
        properties.lister_id = '2110cf0f-11c5-40a9-9a00-97bc581d2cee'
        OR properties.listerId = '2110cf0f-11c5-40a9-9a00-97bc581d2cee'
        OR properties.developer_id = '2110cf0f-11c5-40a9-9a00-97bc581d2cee'
        OR properties.developerId = '2110cf0f-11c5-40a9-9a00-97bc581d2cee'
        OR properties.agent_id = '2110cf0f-11c5-40a9-9a00-97bc581d2cee'
        OR properties.agentId = '2110cf0f-11c5-40a9-9a00-97bc581d2cee'
        OR properties.user_id = '2110cf0f-11c5-40a9-9a00-97bc581d2cee'
        OR properties.userId = '2110cf0f-11c5-40a9-9a00-97bc581d2cee'
        OR properties.profile_id = '2110cf0f-11c5-40a9-9a00-97bc581d2cee'
        OR properties.profileId = '2110cf0f-11c5-40a9-9a00-97bc581d2cee'
        OR distinct_id = '2110cf0f-11c5-40a9-9a00-97bc581d2cee'
    )
    AND DATE(timestamp) IN ('2025-11-08', '2025-11-09', '2025-11-06', '2025-11-17')
    AND event IN (
        'profile_view',
        'property_view',
        'listing_impression',
        'impression_share',
        'impression_saved_listing',
        'lead',
        'lead_phone',
        'lead_message',
        'lead_appointment',
        'impression_social_media',
        'impression_website_visit'
    )
GROUP BY 
    DATE(timestamp),
    EXTRACT(HOUR FROM timestamp),
    event
ORDER BY 
    event_date ASC,
    event_hour ASC,
    event ASC
*/

