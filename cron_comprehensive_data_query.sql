-- Comprehensive Query for Analytics Cron Job
-- This query fetches ALL necessary data from all tables needed during cron execution
-- Includes proper joins, constraints, and all required fields to prevent errors

-- ============================================================================
-- MAIN DATA QUERY - Gets all active entities and their relationships
-- ============================================================================

WITH active_listings AS (
  -- Get all active listings with their owner information
  SELECT 
    l.id AS listing_id,
    l.user_id AS lister_id,
    l.account_type AS lister_type,
    l.listing_status,
    l.listing_type,
    l.created_at AS listing_created_at,
    l.updated_at AS listing_updated_at
  FROM public.listings l
  WHERE l.listing_status = 'active'
    AND l.user_id IS NOT NULL
    AND l.account_type IS NOT NULL
),

active_developers AS (
  -- Get all developers with their analytics fields
  SELECT 
    d.developer_id AS user_id,
    'developer'::VARCHAR AS user_type,
    d.total_views,
    d.total_listings_views,
    d.total_profile_views,
    d.total_leads,
    d.total_impressions,
    d.conversion_rate,
    d.total_listings,
    d.total_developments,
    d.total_sales,
    d.total_revenue,
    d.account_status,
    d.created_at,
    d.updated_at
  FROM public.developers d
  WHERE d.account_status = 'active'
    AND d.developer_id IS NOT NULL
),

active_agents AS (
  -- Get all agents with their agency relationships
  SELECT 
    a.agent_id AS user_id,
    'agent'::VARCHAR AS user_type,
    a.agency_id,
    a.total_views,
    a.total_listings_views,
    a.total_profile_views,
    a.total_leads,
    a.total_impressions,
    a.conversion_rate,
    a.total_listings,
    a.total_developments,
    a.total_sales,
    a.total_revenue,
    a.account_status,
    a.created_at,
    a.updated_at
  FROM public.agents a
  WHERE a.account_status = 'active'
    AND a.agent_id IS NOT NULL
),

active_developments AS (
  -- Get all active developments with their developer relationships
  SELECT 
    d.id AS development_id,
    d.developer_id,
    d.development_status,
    d.created_at AS development_created_at,
    d.updated_at AS development_updated_at
  FROM public.developments d
  WHERE d.development_status = 'active'
    AND d.developer_id IS NOT NULL
),

-- Get listing analytics for a specific date (aggregated across all hours)
listing_analytics_for_date AS (
  SELECT 
    la.listing_id,
    la.date,
    -- Aggregate across all hours for the date
    SUM(la.total_views) AS total_views,
    SUM(la.unique_views) AS unique_views,
    SUM(la.logged_in_views) AS logged_in_views,
    SUM(la.anonymous_views) AS anonymous_views,
    SUM(la.views_from_home) AS views_from_home,
    SUM(la.views_from_explore) AS views_from_explore,
    SUM(la.views_from_search) AS views_from_search,
    SUM(la.views_from_direct) AS views_from_direct,
    SUM(la.total_impressions) AS total_impressions,
    SUM(la.impression_social_media) AS impression_social_media,
    SUM(la.impression_website_visit) AS impression_website_visit,
    SUM(la.impression_share) AS impression_share,
    SUM(la.impression_saved_listing) AS impression_saved_listing,
    SUM(la.total_leads) AS total_leads,
    SUM(la.phone_leads) AS phone_leads,
    SUM(la.message_leads) AS message_leads,
    SUM(la.email_leads) AS email_leads,
    SUM(la.appointment_leads) AS appointment_leads,
    SUM(la.unique_leads) AS unique_leads,
    AVG(la.conversion_rate) AS conversion_rate,
    MAX(la.share_breakdown) AS share_breakdown,
    MAX(la.leads_breakdown) AS leads_breakdown
  FROM public.listing_analytics la
  WHERE la.date = CURRENT_DATE  -- Replace with target date parameter
  GROUP BY la.listing_id, la.date
),

-- Get previous period listing analytics for change calculations
previous_listing_analytics AS (
  SELECT 
    la.listing_id,
    la.date,
    la.hour,
    la.total_views,
    la.total_impressions,
    la.total_leads,
    la.conversion_rate
  FROM public.listing_analytics la
  WHERE la.date = CURRENT_DATE - INTERVAL '1 day'  -- Previous day (adjust based on hour logic)
    AND la.hour = 23  -- Previous hour (adjust based on current hour)
),

-- Get user analytics for a specific date
user_analytics_for_date AS (
  SELECT 
    ua.user_id,
    ua.user_type,
    ua.date,
    -- Aggregate across all hours for the date
    SUM(ua.profile_views) AS profile_views,
    SUM(ua.unique_profile_viewers) AS unique_profile_viewers,
    SUM(ua.profile_views_from_home) AS profile_views_from_home,
    SUM(ua.profile_views_from_listings) AS profile_views_from_listings,
    SUM(ua.profile_views_from_search) AS profile_views_from_search,
    SUM(ua.total_listing_views) AS total_listing_views,
    SUM(ua.total_views) AS total_views,
    SUM(ua.total_listing_leads) AS total_listing_leads,
    SUM(ua.total_leads) AS total_leads,
    SUM(ua.total_impressions_received) AS total_impressions_received,
    SUM(ua.leads_initiated) AS leads_initiated,
    SUM(ua.impression_social_media_received) AS impression_social_media_received,
    SUM(ua.impression_website_visit_received) AS impression_website_visit_received,
    SUM(ua.impression_share_received) AS impression_share_received
  FROM public.user_analytics ua
  WHERE ua.date = CURRENT_DATE  -- Replace with target date parameter
  GROUP BY ua.user_id, ua.user_type, ua.date
),

-- Get leads for a specific date/hour
leads_for_period AS (
  SELECT 
    l.seeker_id,
    l.lister_id,
    l.lister_type,
    l.listing_id,
    l.lead_actions,
    l.date,
    l.hour,
    l.context_type,
    l.created_at,
    l.updated_at
  FROM public.leads l
  WHERE l.date = CURRENT_DATE  -- Replace with target date parameter
    AND l.hour = EXTRACT(HOUR FROM CURRENT_TIMESTAMP)  -- Replace with target hour parameter
),

-- Get last cron status for resume point
last_cron_status AS (
  SELECT 
    acs.run_id,
    acs.run_type,
    acs.status,
    acs.status_message,
    acs.start_time,
    acs.end_time,
    acs.target_date,
    acs.last_processed_event_timestamp,
    acs.last_processed_event_id,
    acs.events_processed,
    acs.events_fetched,
    acs.started_at,
    acs.completed_at,
    acs.duration_seconds,
    acs.error_count,
    acs.last_error,
    acs.error_details
  FROM public.analytics_cron_status acs
  WHERE acs.status IN ('running', 'failed', 'partial')
  ORDER BY acs.started_at DESC
  LIMIT 1
),

-- Get admin analytics for a specific date
admin_analytics_for_date AS (
  SELECT 
    aa.date,
    aa.leads,
    aa.impressions,
    aa.views,
    aa.user_signups,
    aa.created_at,
    aa.updated_at
  FROM public.admin_analytics aa
  WHERE aa.date = CURRENT_DATE  -- Replace with target date parameter
)

-- ============================================================================
-- FINAL COMPREHENSIVE RESULT SET
-- ============================================================================
SELECT 
  -- Listing Information
  al.listing_id,
  al.lister_id,
  al.lister_type,
  al.listing_status,
  al.listing_type,
  
  -- Developer Information (if lister is developer)
  dev.user_id AS developer_user_id,
  dev.user_type AS developer_user_type,
  dev.total_views AS developer_total_views,
  dev.total_listings_views AS developer_total_listings_views,
  dev.total_profile_views AS developer_total_profile_views,
  dev.total_leads AS developer_total_leads,
  dev.total_impressions AS developer_total_impressions,
  dev.conversion_rate AS developer_conversion_rate,
  dev.total_listings AS developer_total_listings,
  dev.total_developments AS developer_total_developments,
  
  -- Agent Information (if lister is agent)
  agent.user_id AS agent_user_id,
  agent.user_type AS agent_user_type,
  agent.agency_id,
  agent.total_views AS agent_total_views,
  agent.total_listings_views AS agent_total_listings_views,
  agent.total_profile_views AS agent_total_profile_views,
  agent.total_leads AS agent_total_leads,
  agent.total_impressions AS agent_total_impressions,
  agent.conversion_rate AS agent_conversion_rate,
  agent.total_listings AS agent_total_listings,
  
  -- Development Information
  ad.development_id,
  ad.developer_id AS development_developer_id,
  
  -- Listing Analytics (current date)
  la.total_views AS listing_total_views,
  la.unique_views AS listing_unique_views,
  la.logged_in_views AS listing_logged_in_views,
  la.anonymous_views AS listing_anonymous_views,
  la.views_from_home AS listing_views_from_home,
  la.views_from_explore AS listing_views_from_explore,
  la.views_from_search AS listing_views_from_search,
  la.views_from_direct AS listing_views_from_direct,
  la.total_impressions AS listing_total_impressions,
  la.impression_social_media AS listing_impression_social_media,
  la.impression_website_visit AS listing_impression_website_visit,
  la.impression_share AS listing_impression_share,
  la.impression_saved_listing AS listing_impression_saved_listing,
  la.total_leads AS listing_total_leads,
  la.phone_leads AS listing_phone_leads,
  la.message_leads AS listing_message_leads,
  la.email_leads AS listing_email_leads,
  la.appointment_leads AS listing_appointment_leads,
  la.unique_leads AS listing_unique_leads,
  la.conversion_rate AS listing_conversion_rate,
  la.share_breakdown AS listing_share_breakdown,
  la.leads_breakdown AS listing_leads_breakdown,
  
  -- Previous Period Listing Analytics (for change calculations)
  pla.total_views AS previous_listing_total_views,
  pla.total_impressions AS previous_listing_total_impressions,
  pla.total_leads AS previous_listing_total_leads,
  pla.conversion_rate AS previous_listing_conversion_rate,
  
  -- User Analytics (current date)
  ua.profile_views AS user_profile_views,
  ua.unique_profile_viewers AS user_unique_profile_viewers,
  ua.profile_views_from_home AS user_profile_views_from_home,
  ua.profile_views_from_listings AS user_profile_views_from_listings,
  ua.profile_views_from_search AS user_profile_views_from_search,
  ua.total_listing_views AS user_total_listing_views,
  ua.total_views AS user_total_views,
  ua.total_listing_leads AS user_total_listing_leads,
  ua.total_leads AS user_total_leads,
  ua.total_impressions_received AS user_total_impressions_received,
  ua.leads_initiated AS user_leads_initiated,
  ua.impression_social_media_received AS user_impression_social_media_received,
  ua.impression_website_visit_received AS user_impression_website_visit_received,
  ua.impression_share_received AS user_impression_share_received,
  
  -- Leads Information
  lf.seeker_id,
  lf.lister_id AS lead_lister_id,
  lf.lister_type AS lead_lister_type,
  lf.listing_id AS lead_listing_id,
  lf.lead_actions AS lead_actions,
  lf.context_type AS lead_context_type,
  
  -- Cron Status
  lcs.run_id AS last_run_id,
  lcs.status AS last_run_status,
  lcs.last_processed_event_timestamp,
  lcs.last_processed_event_id,
  lcs.events_processed,
  lcs.error_count AS last_error_count,
  lcs.last_error,
  
  -- Admin Analytics
  aa.leads AS admin_total_leads,
  aa.impressions AS admin_total_impressions,
  aa.views AS admin_total_views,
  aa.user_signups AS admin_user_signups

FROM active_listings al
  -- Left joins to handle cases where relationships might not exist
  LEFT JOIN active_developers dev 
    ON al.lister_id = dev.user_id 
    AND al.lister_type = 'developer'
  LEFT JOIN active_agents agent 
    ON al.lister_id = agent.user_id 
    AND al.lister_type = 'agent'
  LEFT JOIN active_developments ad 
    ON dev.user_id = ad.developer_id
  LEFT JOIN listing_analytics_for_date la 
    ON al.listing_id = la.listing_id
  LEFT JOIN previous_listing_analytics pla 
    ON al.listing_id = pla.listing_id
  LEFT JOIN user_analytics_for_date ua 
    ON (dev.user_id = ua.user_id OR agent.user_id = ua.user_id)
    AND ua.user_type = COALESCE(dev.user_type, agent.user_type)
  LEFT JOIN leads_for_period lf 
    ON al.listing_id = lf.listing_id
  CROSS JOIN last_cron_status lcs  -- Single row, safe to cross join
  CROSS JOIN admin_analytics_for_date aa  -- Single row, safe to cross join

ORDER BY al.listing_id, al.lister_id;

-- ============================================================================
-- ALTERNATIVE: SEPARATE QUERIES FOR BETTER PERFORMANCE
-- Use these individual queries if the comprehensive query is too slow
-- ============================================================================

-- Query 1: Get all active listings with lister info
/*
SELECT 
  l.id AS listing_id,
  l.user_id AS lister_id,
  l.account_type AS lister_type,
  l.listing_status,
  l.listing_type
FROM public.listings l
WHERE l.listing_status = 'active'
  AND l.user_id IS NOT NULL
  AND l.account_type IS NOT NULL;
*/

-- Query 2: Get all developers with current stats
/*
SELECT 
  d.developer_id AS user_id,
  'developer'::VARCHAR AS user_type,
  d.total_views,
  d.total_listings_views,
  d.total_profile_views,
  d.total_leads,
  d.total_impressions,
  d.conversion_rate,
  d.total_listings,
  d.total_developments
FROM public.developers d
WHERE d.account_status = 'active'
  AND d.developer_id IS NOT NULL;
*/

-- Query 3: Get all agents with agency relationships
/*
SELECT 
  a.agent_id AS user_id,
  'agent'::VARCHAR AS user_type,
  a.agency_id,
  a.total_views,
  a.total_listings_views,
  a.total_profile_views,
  a.total_leads,
  a.total_impressions,
  a.conversion_rate,
  a.total_listings
FROM public.agents a
WHERE a.account_status = 'active'
  AND a.agent_id IS NOT NULL;
*/

-- Query 4: Get listing analytics for date (aggregated)
/*
SELECT 
  listing_id,
  date,
  SUM(total_views) AS total_views,
  SUM(total_leads) AS total_leads,
  SUM(total_impressions) AS total_impressions,
  SUM(impression_social_media) AS impression_social_media,
  SUM(impression_website_visit) AS impression_website_visit,
  SUM(impression_share) AS impression_share,
  SUM(impression_saved_listing) AS impression_saved_listing,
  AVG(conversion_rate) AS conversion_rate
FROM public.listing_analytics
WHERE date = :target_date  -- Replace with parameter
GROUP BY listing_id, date;
*/

-- Query 5: Get user analytics for date (aggregated)
/*
SELECT 
  user_id,
  user_type,
  date,
  SUM(profile_views) AS profile_views,
  SUM(total_listing_views) AS total_listing_views,
  SUM(total_views) AS total_views,
  SUM(total_listing_leads) AS total_listing_leads,
  SUM(total_leads) AS total_leads,
  SUM(total_impressions_received) AS total_impressions_received
FROM public.user_analytics
WHERE date = :target_date  -- Replace with parameter
GROUP BY user_id, user_type, date;
*/

-- Query 6: Get leads for date/hour
/*
SELECT 
  seeker_id,
  lister_id,
  lister_type,
  listing_id,
  lead_actions,
  date,
  hour,
  context_type
FROM public.leads
WHERE date = :target_date  -- Replace with parameter
  AND hour = :target_hour;  -- Replace with parameter
*/

-- Query 7: Get last incomplete cron status
/*
SELECT 
  run_id,
  status,
  start_time,
  end_time,
  target_date,
  last_processed_event_timestamp,
  last_processed_event_id,
  events_processed,
  error_count,
  last_error
FROM public.analytics_cron_status
WHERE status IN ('running', 'failed', 'partial')
ORDER BY started_at DESC
LIMIT 1;
*/

-- Query 8: Get admin analytics for date
/*
SELECT 
  date,
  leads,
  impressions,
  views,
  user_signups
FROM public.admin_analytics
WHERE date = :target_date;  -- Replace with parameter
*/

-- ============================================================================
-- NOTES:
-- ============================================================================
-- 1. Replace CURRENT_DATE with your target date parameter
-- 2. Replace CURRENT_TIMESTAMP hour extraction with your target hour parameter
-- 3. All LEFT JOINs ensure we get listings even if related data doesn't exist
-- 4. Aggregations (SUM, AVG) handle multiple hours per day
-- 5. Constraints ensure data integrity:
--    - listing_status = 'active' for listings
--    - account_status = 'active' for developers/agents
--    - development_status = 'active' for developments
--    - NOT NULL checks on critical foreign keys
-- 6. Use the separate queries if the comprehensive query is too slow
-- 7. Indexes should exist on:
--    - listings(user_id, listing_status)
--    - listing_analytics(listing_id, date, hour)
--    - user_analytics(user_id, user_type, date, hour)
--    - leads(lister_id, listing_id, date, hour)
--    - analytics_cron_status(status, started_at)
-- ============================================================================

