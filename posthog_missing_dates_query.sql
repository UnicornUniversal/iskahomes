-- PostHog SQL Query: Missing Dates Analysis
-- Copy this query into PostHog SQL interface
-- Export results as CSV for analysis

SELECT 
    -- Event identification
    event,
    timestamp,
    distinct_id,
    person_id,
    
    -- Date and time breakdown
    toDate(timestamp) as date,
    toHour(timestamp) as hour,
    toMinute(timestamp) as minute,
    
    -- User identification properties (check all variations)
    JSONExtractString(properties, 'lister_id') as lister_id,
    JSONExtractString(properties, 'listerId') as listerId,
    JSONExtractString(properties, 'developer_id') as developer_id,
    JSONExtractString(properties, 'developerId') as developerId,
    JSONExtractString(properties, 'agent_id') as agent_id,
    JSONExtractString(properties, 'agentId') as agentId,
    JSONExtractString(properties, 'user_id') as user_id,
    JSONExtractString(properties, 'userId') as userId,
    JSONExtractString(properties, 'lister_type') as lister_type,
    JSONExtractString(properties, 'listerType') as listerType,
    
    -- Listing identification properties
    JSONExtractString(properties, 'listing_id') as listing_id,
    JSONExtractString(properties, 'listingId') as listingId,
    JSONExtractString(properties, 'listing_uuid') as listing_uuid,
    JSONExtractString(properties, 'property_id') as property_id,
    
    -- Profile/context properties
    JSONExtractString(properties, 'profile_id') as profile_id,
    JSONExtractString(properties, 'profileId') as profileId,
    JSONExtractString(properties, 'context_type') as context_type,
    JSONExtractString(properties, 'contextType') as contextType,
    JSONExtractString(properties, 'viewed_from') as viewed_from,
    JSONExtractString(properties, 'viewedFrom') as viewedFrom,
    
    -- Lead properties
    JSONExtractString(properties, 'lead_type') as lead_type,
    JSONExtractString(properties, 'leadType') as leadType,
    JSONExtractString(properties, 'message_type') as message_type,
    JSONExtractString(properties, 'messageType') as messageType,
    
    -- Seeker identification
    JSONExtractString(properties, 'seeker_id') as seeker_id,
    JSONExtractString(properties, 'seekerId') as seekerId,
    
    -- Development properties
    JSONExtractString(properties, 'development_id') as development_id,
    JSONExtractString(properties, 'developmentId') as developmentId,
    
    -- Full properties JSON (for detailed analysis)
    properties as properties_json

FROM events

WHERE 
    -- Date range: Missing dates
    toDate(timestamp) IN ('2025-11-06', '2025-11-11', '2025-11-12', '2025-11-14', '2025-11-18', '2025-11-19', '2025-11-20')
    
    -- Custom events only (exclude auto-capture events)
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
    
    -- Filter for specific user (check all possible user ID fields)
    AND (
        -- Check if any property matches the user ID
        JSONExtractString(properties, 'lister_id') = '2110cf0f-11c5-40a9-9a00-97bc581d2cee'
        OR JSONExtractString(properties, 'listerId') = '2110cf0f-11c5-40a9-9a00-97bc581d2cee'
        OR JSONExtractString(properties, 'developer_id') = '2110cf0f-11c5-40a9-9a00-97bc581d2cee'
        OR JSONExtractString(properties, 'developerId') = '2110cf0f-11c5-40a9-9a00-97bc581d2cee'
        OR JSONExtractString(properties, 'user_id') = '2110cf0f-11c5-40a9-9a00-97bc581d2cee'
        OR JSONExtractString(properties, 'userId') = '2110cf0f-11c5-40a9-9a00-97bc581d2cee'
        OR distinct_id = '2110cf0f-11c5-40a9-9a00-97bc581d2cee'
        OR person_id = '2110cf0f-11c5-40a9-9a00-97bc581d2cee'
    )

ORDER BY 
    timestamp ASC,
    event ASC

LIMIT 10000

