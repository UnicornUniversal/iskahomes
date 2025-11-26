-- Alternative PostHog SQL Query (if JSONExtractString doesn't work)
-- Use this version if the first query gives errors
-- PostHog might use different JSON extraction functions

SELECT 
    -- Event identification
    event,
    timestamp,
    distinct_id,
    person_id,
    
    -- Date and time breakdown
    toDate(timestamp) as date,
    toHour(timestamp) as hour,
    
    -- User identification (try different JSON extraction methods)
    properties.lister_id as lister_id,
    properties.listerId as listerId,
    properties.developer_id as developer_id,
    properties.developerId as developerId,
    properties.agent_id as agent_id,
    properties.agentId as agentId,
    properties.user_id as user_id,
    properties.userId as userId,
    properties.lister_type as lister_type,
    
    -- Listing identification
    properties.listing_id as listing_id,
    properties.listingId as listingId,
    properties.listing_uuid as listing_uuid,
    properties.property_id as property_id,
    
    -- Profile/context properties
    properties.profile_id as profile_id,
    properties.context_type as context_type,
    properties.viewed_from as viewed_from,
    
    -- Lead properties
    properties.lead_type as lead_type,
    properties.message_type as message_type,
    
    -- Seeker identification
    properties.seeker_id as seeker_id,
    
    -- Development properties
    properties.development_id as development_id,
    
    -- Full properties (as string for manual parsing if needed)
    toString(properties) as properties_string

FROM events

WHERE 
    -- Date range: Missing dates
    toDate(timestamp) IN ('2025-11-06', '2025-11-11', '2025-11-12', '2025-11-14', '2025-11-18', '2025-11-19', '2025-11-20')
    
    -- Custom events only
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
    
    -- Filter for specific user
    AND (
        properties.lister_id = '2110cf0f-11c5-40a9-9a00-97bc581d2cee'
        OR properties.listerId = '2110cf0f-11c5-40a9-9a00-97bc581d2cee'
        OR properties.developer_id = '2110cf0f-11c5-40a9-9a00-97bc581d2cee'
        OR properties.developerId = '2110cf0f-11c5-40a9-9a00-97bc581d2cee'
        OR properties.user_id = '2110cf0f-11c5-40a9-9a00-97bc581d2cee'
        OR distinct_id = '2110cf0f-11c5-40a9-9a00-97bc581d2cee'
        OR person_id = '2110cf0f-11c5-40a9-9a00-97bc581d2cee'
    )

ORDER BY timestamp ASC

LIMIT 10000

