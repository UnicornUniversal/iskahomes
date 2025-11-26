-- ============================================================================
-- READY-TO-USE QUERIES FOR ANALYTICS CRON JOB
-- These queries are optimized and ready to use in your cron code
-- Replace :target_date and :target_hour with actual values
-- ============================================================================

-- ============================================================================
-- QUERY 1: Get all active listings with lister information
-- Used for: Pre-fetching lister_id when missing from events
-- ============================================================================
SELECT 
  l.id AS listing_id,
  l.user_id AS lister_id,
  l.account_type AS lister_type,
  l.listing_status,
  l.listing_type,
  l.created_at,
  l.updated_at
FROM public.listings l
WHERE l.listing_status = 'active'
  AND l.user_id IS NOT NULL
  AND l.account_type IS NOT NULL
ORDER BY l.id;

-- ============================================================================
-- QUERY 2: Get listings by user IDs (for user analytics calculation)
-- Used for: Getting all listings owned by specific users
-- Parameters: :user_ids (array of UUIDs)
-- ============================================================================
SELECT 
  l.id AS listing_id,
  l.user_id AS lister_id,
  l.listing_status,
  l.listing_type
FROM public.listings l
WHERE l.user_id = ANY(:user_ids::uuid[])
  AND l.listing_status = 'active'
ORDER BY l.user_id, l.id;

-- ============================================================================
-- QUERY 3: Get all active developers with current statistics
-- Used for: Updating developer totals, getting developer user IDs
-- ============================================================================
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
ORDER BY d.developer_id;

-- ============================================================================
-- QUERY 4: Get all active agents with agency relationships
-- Used for: Updating agent totals, getting agent user IDs and agency info
-- ============================================================================
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
ORDER BY a.agent_id;

-- ============================================================================
-- QUERY 5: Get listing analytics for a specific date (aggregated across hours)
-- Used for: Calculating user analytics from listing analytics
-- Parameters: :target_date (DATE), :listing_ids (array of UUIDs)
-- ============================================================================
SELECT 
  la.listing_id,
  la.date,
  -- Aggregate metrics across all hours for the date
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
  -- JSONB fields - take the most recent one (or aggregate if needed)
  MAX(la.share_breakdown) AS share_breakdown,
  MAX(la.leads_breakdown) AS leads_breakdown
FROM public.listing_analytics la
WHERE la.date = :target_date
  AND la.listing_id = ANY(:listing_ids::uuid[])
GROUP BY la.listing_id, la.date
ORDER BY la.listing_id;

-- ============================================================================
-- QUERY 6: Get previous period listing analytics (for change calculations)
-- Used for: Calculating views_change, impressions_change, leads_change
-- Parameters: :target_date (DATE), :target_hour (INTEGER), :listing_ids (array)
-- ============================================================================
SELECT 
  la.listing_id,
  la.date,
  la.hour,
  la.total_views,
  la.total_impressions,
  la.total_leads,
  la.conversion_rate
FROM public.listing_analytics la
WHERE la.listing_id = ANY(:listing_ids::uuid[])
  AND (
    -- Previous hour on same day
    (la.date = :target_date AND la.hour = :target_hour - 1)
    OR
    -- Last hour of previous day (if current hour is 0)
    (la.date = :target_date - INTERVAL '1 day' AND la.hour = 23 AND :target_hour = 0)
  )
ORDER BY la.listing_id;

-- ============================================================================
-- QUERY 7: Get user analytics for a specific date (aggregated across hours)
-- Used for: Getting previous user analytics for comparison/updates
-- Parameters: :target_date (DATE), :user_ids (array of UUIDs)
-- ============================================================================
SELECT 
  ua.user_id,
  ua.user_type,
  ua.date,
  -- Aggregate metrics across all hours for the date
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
WHERE ua.date = :target_date
  AND ua.user_id = ANY(:user_ids::uuid[])
GROUP BY ua.user_id, ua.user_type, ua.date
ORDER BY ua.user_id;

-- ============================================================================
-- QUERY 8: Get leads for a specific date and hour
-- Used for: Lead aggregation, lead breakdown calculations
-- Parameters: :target_date (DATE), :target_hour (INTEGER)
-- ============================================================================
SELECT 
  l.id AS lead_id,
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
WHERE l.date = :target_date
  AND l.hour = :target_hour
ORDER BY l.lister_id, l.listing_id, l.created_at;

-- ============================================================================
-- QUERY 9: Get leads breakdown by lister (for developer/agent totals)
-- Used for: Calculating total_leads and leads_breakdown for users
-- Parameters: :lister_ids (array of UUIDs), :target_date (DATE, optional)
-- ============================================================================
SELECT 
  l.lister_id,
  l.lister_type,
  COUNT(DISTINCT l.id) AS total_leads,
  COUNT(DISTINCT CASE WHEN l.lead_actions::text LIKE '%"action_type":"phone"%' THEN l.id END) AS phone_leads,
  COUNT(DISTINCT CASE WHEN l.lead_actions::text LIKE '%"action_type":"whatsapp"%' THEN l.id END) AS whatsapp_leads,
  COUNT(DISTINCT CASE WHEN l.lead_actions::text LIKE '%"action_type":"direct_message"%' THEN l.id END) AS message_leads,
  COUNT(DISTINCT CASE WHEN l.lead_actions::text LIKE '%"action_type":"email"%' THEN l.id END) AS email_leads,
  COUNT(DISTINCT CASE WHEN l.lead_actions::text LIKE '%"action_type":"appointment"%' THEN l.id END) AS appointment_leads,
  COUNT(DISTINCT CASE WHEN l.lead_actions::text LIKE '%"action_type":"website"%' THEN l.id END) AS website_leads
FROM public.leads l
WHERE l.lister_id = ANY(:lister_ids::uuid[])
  AND (:target_date IS NULL OR l.date = :target_date)
GROUP BY l.lister_id, l.lister_type
ORDER BY l.lister_id;

-- ============================================================================
-- QUERY 10: Get all active developments with developer relationships
-- Used for: Development analytics, linking developments to developers
-- ============================================================================
SELECT 
  d.id AS development_id,
  d.developer_id,
  d.development_status,
  d.name AS development_name,
  d.created_at AS development_created_at,
  d.updated_at AS development_updated_at
FROM public.developments d
WHERE d.development_status = 'active'
  AND d.developer_id IS NOT NULL
ORDER BY d.developer_id, d.id;

-- ============================================================================
-- QUERY 11: Get last incomplete cron status (for resume/recovery)
-- Used for: Finding failed/running cron jobs to resume
-- ============================================================================
SELECT 
  acs.id,
  acs.run_id,
  acs.run_type,
  acs.status,
  acs.status_message,
  acs.start_time,
  acs.end_time,
  acs.target_date,
  acs.target_hour,
  acs.last_processed_event_timestamp,
  acs.last_processed_event_id,
  acs.events_processed,
  acs.events_fetched,
  acs.listings_processed,
  acs.users_processed,
  acs.developments_processed,
  acs.leads_processed,
  acs.started_at,
  acs.completed_at,
  acs.duration_seconds,
  acs.error_count,
  acs.last_error,
  acs.error_details,
  acs.posthog_api_calls,
  acs.posthog_api_errors,
  acs.posthog_rate_limit_hit,
  acs.metadata
FROM public.analytics_cron_status acs
WHERE acs.status IN ('running', 'failed', 'partial')
ORDER BY acs.started_at DESC
LIMIT 1;

-- ============================================================================
-- QUERY 12: Get last successful cron status
-- Used for: Determining next time range to process
-- ============================================================================
SELECT 
  acs.run_id,
  acs.status,
  acs.start_time,
  acs.end_time,
  acs.target_date,
  acs.target_hour,
  acs.completed_at,
  acs.events_processed,
  acs.events_fetched
FROM public.analytics_cron_status acs
WHERE acs.status = 'completed'
ORDER BY acs.completed_at DESC
LIMIT 1;

-- ============================================================================
-- QUERY 13: Get admin analytics for a specific date
-- Used for: Admin dashboard analytics
-- Parameters: :target_date (DATE)
-- ============================================================================
SELECT 
  aa.id,
  aa.date,
  aa.leads,
  aa.impressions,
  aa.views,
  aa.user_signups,
  aa.created_at,
  aa.updated_at
FROM public.admin_analytics aa
WHERE aa.date = :target_date
LIMIT 1;

-- ============================================================================
-- QUERY 14: Get listing analytics with share and leads breakdown
-- Used for: Updating listings table totals
-- Parameters: :listing_ids (array of UUIDs), :target_date (DATE)
-- ============================================================================
SELECT 
  la.listing_id,
  la.share_breakdown,
  la.leads_breakdown,
  la.impression_share,
  la.total_leads
FROM public.listing_analytics la
WHERE la.listing_id = ANY(:listing_ids::uuid[])
  AND la.date = :target_date
  -- Get the latest hour's data (or aggregate if needed)
  AND la.hour = (
    SELECT MAX(hour) 
    FROM public.listing_analytics 
    WHERE listing_id = la.listing_id 
      AND date = la.date
  )
ORDER BY la.listing_id;

-- ============================================================================
-- QUERY 15: Get all property seekers (for user_ids in getAllActiveEntities)
-- Used for: Getting all active user IDs
-- ============================================================================
SELECT 
  ps.user_id,
  ps.created_at,
  ps.updated_at
FROM public.property_seekers ps
WHERE ps.user_id IS NOT NULL
ORDER BY ps.user_id;

-- ============================================================================
-- CONSTRAINTS AND VALIDATION QUERIES
-- Use these to verify data integrity before running cron
-- ============================================================================

-- Check for listings with missing user_id or account_type
SELECT 
  COUNT(*) AS listings_with_missing_data,
  COUNT(CASE WHEN user_id IS NULL THEN 1 END) AS missing_user_id,
  COUNT(CASE WHEN account_type IS NULL THEN 1 END) AS missing_account_type
FROM public.listings
WHERE listing_status = 'active';

-- Check for developers with missing developer_id
SELECT 
  COUNT(*) AS developers_with_missing_id
FROM public.developers
WHERE developer_id IS NULL
  AND account_status = 'active';

-- Check for agents with missing agent_id
SELECT 
  COUNT(*) AS agents_with_missing_id
FROM public.agents
WHERE agent_id IS NULL
  AND account_status = 'active';

-- Check for orphaned listing_analytics (listings that don't exist)
SELECT 
  COUNT(DISTINCT la.listing_id) AS orphaned_analytics_count
FROM public.listing_analytics la
LEFT JOIN public.listings l ON la.listing_id = l.id
WHERE l.id IS NULL;

-- Check for orphaned user_analytics (users that don't exist)
SELECT 
  COUNT(DISTINCT ua.user_id) AS orphaned_user_analytics_count
FROM public.user_analytics ua
LEFT JOIN public.developers d ON ua.user_id = d.developer_id AND ua.user_type = 'developer'
LEFT JOIN public.agents a ON ua.user_id = a.agent_id AND ua.user_type = 'agent'
WHERE d.developer_id IS NULL AND a.agent_id IS NULL;

-- ============================================================================
-- PERFORMANCE OPTIMIZATION NOTES:
-- ============================================================================
-- 1. Ensure these indexes exist:
--    - CREATE INDEX idx_listings_user_status ON listings(user_id, listing_status);
--    - CREATE INDEX idx_listing_analytics_listing_date_hour ON listing_analytics(listing_id, date, hour);
--    - CREATE INDEX idx_user_analytics_user_type_date_hour ON user_analytics(user_id, user_type, date, hour);
--    - CREATE INDEX idx_leads_lister_date_hour ON leads(lister_id, date, hour);
--    - CREATE INDEX idx_leads_listing_date_hour ON leads(listing_id, date, hour);
--    - CREATE INDEX idx_cron_status_status_started ON analytics_cron_status(status, started_at DESC);
--    - CREATE INDEX idx_developers_account_status ON developers(account_status) WHERE account_status = 'active';
--    - CREATE INDEX idx_agents_account_status ON agents(account_status) WHERE account_status = 'active';
--
-- 2. Use parameterized queries to prevent SQL injection
-- 3. Batch queries when possible (use IN clauses with arrays)
-- 4. Use CTEs for complex queries
-- 5. Consider materialized views for frequently accessed aggregated data
-- ============================================================================

