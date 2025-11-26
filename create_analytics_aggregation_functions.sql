-- =====================================================
-- ANALYTICS AGGREGATION FUNCTIONS
-- Optimized SQL functions to replace inefficient batch fetching
-- =====================================================

-- Function 1: Get cumulative listing views and leads
-- Replaces: Nested chunking with 2000+ queries
-- Returns: Aggregated totals per listing_id
CREATE OR REPLACE FUNCTION get_cumulative_listing_analytics(listing_ids UUID[])
RETURNS TABLE (
  listing_id UUID,
  total_views BIGINT,
  total_leads BIGINT,
  total_impressions BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    la.listing_id,
    COALESCE(SUM(la.total_views), 0)::BIGINT as total_views,
    COALESCE(SUM(la.total_leads), 0)::BIGINT as total_leads,
    COALESCE(SUM(la.total_impressions), 0)::BIGINT as total_impressions
  FROM listing_analytics la
  WHERE la.listing_id = ANY(listing_ids)
  GROUP BY la.listing_id;
END;
$$ LANGUAGE plpgsql;

-- Function 2: Get cumulative listing views only (for developers table)
-- Optimized version for just views
CREATE OR REPLACE FUNCTION get_cumulative_listing_views(listing_ids UUID[])
RETURNS TABLE (
  listing_id UUID,
  total_views BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    la.listing_id,
    COALESCE(SUM(la.total_views), 0)::BIGINT as total_views
  FROM listing_analytics la
  WHERE la.listing_id = ANY(listing_ids)
  GROUP BY la.listing_id;
END;
$$ LANGUAGE plpgsql;

-- Function 3: Get aggregated listing analytics by user_id (for user_analytics)
-- Groups listings by user_id and sums their analytics
CREATE OR REPLACE FUNCTION get_listing_analytics_by_user(
  user_ids UUID[],
  target_date DATE,
  target_hour INTEGER
)
RETURNS TABLE (
  user_id UUID,
  total_listing_views BIGINT,
  total_listing_leads BIGINT,
  total_listing_impressions BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.user_id,
    COALESCE(SUM(la.total_views), 0)::BIGINT as total_listing_views,
    COALESCE(SUM(la.total_leads), 0)::BIGINT as total_listing_leads,
    COALESCE(SUM(la.total_impressions), 0)::BIGINT as total_listing_impressions
  FROM listings l
  INNER JOIN listing_analytics la ON la.listing_id = l.id
  WHERE l.user_id = ANY(user_ids)
    AND l.listing_status = 'active'
    AND la.date = target_date
    AND la.hour = target_hour
  GROUP BY l.user_id;
END;
$$ LANGUAGE plpgsql;

-- Function 4: Get platform-wide aggregated metrics for admin_analytics
-- Replaces: Sequential batch fetching of all listing_analytics
CREATE OR REPLACE FUNCTION get_platform_analytics_aggregates(target_date DATE)
RETURNS TABLE (
  total_views BIGINT,
  unique_views BIGINT,
  logged_in_views BIGINT,
  anonymous_views BIGINT,
  views_from_home BIGINT,
  views_from_explore BIGINT,
  views_from_search BIGINT,
  views_from_direct BIGINT,
  total_impressions BIGINT,
  impression_social_media BIGINT,
  impression_website_visit BIGINT,
  impression_share BIGINT,
  impression_saved_listing BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(la.total_views), 0)::BIGINT as total_views,
    COALESCE(SUM(la.unique_views), 0)::BIGINT as unique_views,
    COALESCE(SUM(la.logged_in_views), 0)::BIGINT as logged_in_views,
    COALESCE(SUM(la.anonymous_views), 0)::BIGINT as anonymous_views,
    COALESCE(SUM(la.views_from_home), 0)::BIGINT as views_from_home,
    COALESCE(SUM(la.views_from_explore), 0)::BIGINT as views_from_explore,
    COALESCE(SUM(la.views_from_search), 0)::BIGINT as views_from_search,
    COALESCE(SUM(la.views_from_direct), 0)::BIGINT as views_from_direct,
    COALESCE(SUM(la.total_impressions), 0)::BIGINT as total_impressions,
    COALESCE(SUM(la.impression_social_media), 0)::BIGINT as impression_social_media,
    COALESCE(SUM(la.impression_website_visit), 0)::BIGINT as impression_website_visit,
    COALESCE(SUM(la.impression_share), 0)::BIGINT as impression_share,
    COALESCE(SUM(la.impression_saved_listing), 0)::BIGINT as impression_saved_listing
  FROM listing_analytics la
  WHERE la.date = target_date;
END;
$$ LANGUAGE plpgsql;

-- Function 5: Get cumulative user analytics totals
-- For calculating cumulative totals for developers table
CREATE OR REPLACE FUNCTION get_cumulative_user_analytics(user_ids UUID[])
RETURNS TABLE (
  user_id UUID,
  total_views BIGINT,
  total_leads BIGINT,
  total_impressions BIGINT,
  total_listings_views BIGINT,
  total_profile_views BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ua.user_id,
    COALESCE(SUM(ua.total_views), 0)::BIGINT as total_views,
    COALESCE(SUM(ua.total_leads), 0)::BIGINT as total_leads,
    COALESCE(SUM(ua.total_impressions_received), 0)::BIGINT as total_impressions,
    COALESCE(SUM(ua.total_listing_views), 0)::BIGINT as total_listings_views,
    COALESCE(SUM(ua.profile_views), 0)::BIGINT as total_profile_views
  FROM user_analytics ua
  WHERE ua.user_id = ANY(user_ids)
  GROUP BY ua.user_id;
END;
$$ LANGUAGE plpgsql;

-- Function 6: Get unique counts using COUNT DISTINCT
-- Replaces: Storing all IDs in Set objects
-- Note: This is for reference - unique counts should be calculated from events, not stored
-- But we can use this for historical data aggregation
CREATE OR REPLACE FUNCTION get_unique_counts_from_analytics(
  listing_ids UUID[],
  target_date DATE
)
RETURNS TABLE (
  listing_id UUID,
  unique_views_count BIGINT,
  unique_leads_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    la.listing_id,
    -- Note: unique_views is already aggregated in listing_analytics
    -- This function is for reference only
    COALESCE(MAX(la.unique_views), 0)::BIGINT as unique_views_count,
    COALESCE(MAX(la.unique_leads), 0)::BIGINT as unique_leads_count
  FROM listing_analytics la
  WHERE la.listing_id = ANY(listing_ids)
    AND la.date = target_date
  GROUP BY la.listing_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Index on listing_analytics for faster aggregation
CREATE INDEX IF NOT EXISTS idx_listing_analytics_listing_id_date 
ON listing_analytics(listing_id, date, hour);

-- Index on listing_analytics for user aggregation
CREATE INDEX IF NOT EXISTS idx_listing_analytics_date_hour 
ON listing_analytics(date, hour);

-- Index on listings for user_id lookups
CREATE INDEX IF NOT EXISTS idx_listings_user_id_status 
ON listings(user_id, listing_status) 
WHERE listing_status = 'active';

-- Index on user_analytics for cumulative aggregation
CREATE INDEX IF NOT EXISTS idx_user_analytics_user_id
ON user_analytics(user_id);

-- Function 7: Get cumulative leads breakdown for developers
-- Aggregates all leads from leads table (expands lead_actions JSONB array) and calculates percentages in SQL
-- Returns: JSONB-ready structure with totals and percentages per developer
-- Now properly breaks down lead_message by message_type (direct_message, whatsapp, email)
-- Drop the old function first since we're changing the return type
DROP FUNCTION IF EXISTS get_developer_leads_breakdown(uuid[]);
CREATE OR REPLACE FUNCTION get_developer_leads_breakdown(developer_ids UUID[])
RETURNS TABLE (
  user_id UUID,
  total_leads BIGINT,
  phone_leads BIGINT,
  phone_percentage NUMERIC(5,2),
  whatsapp_leads BIGINT,
  whatsapp_percentage NUMERIC(5,2),
  direct_message_leads BIGINT,
  direct_message_percentage NUMERIC(5,2),
  email_leads BIGINT,
  email_percentage NUMERIC(5,2),
  appointment_leads BIGINT,
  appointment_percentage NUMERIC(5,2),
  website_leads BIGINT,
  website_percentage NUMERIC(5,2)
) AS $$
BEGIN
  RETURN QUERY
  WITH lead_actions_expanded AS (
    SELECT
      l.lister_id,
      jsonb_array_elements(l.lead_actions) AS action
    FROM leads l
    WHERE l.lister_type = 'developer'
      AND l.lister_id = ANY(developer_ids)
  ),
  lead_types AS (
    SELECT
      lister_id,
      -- Phone leads
      CASE WHEN (action->>'action_type') = 'lead_phone' THEN 1 ELSE 0 END AS is_phone,
      -- Message leads - break down by message_type
      CASE 
        WHEN (action->>'action_type') = 'lead_message' 
          AND LOWER(COALESCE(action->'action_metadata'->>'message_type', action->'action_metadata'->>'messageType', 'direct_message')) = 'whatsapp'
        THEN 1 
        ELSE 0 
      END AS is_whatsapp,
      CASE 
        WHEN (action->>'action_type') = 'lead_message' 
          AND LOWER(COALESCE(action->'action_metadata'->>'message_type', action->'action_metadata'->>'messageType', 'direct_message')) = 'email'
        THEN 1 
        ELSE 0 
      END AS is_email_from_message,
      CASE 
        WHEN (action->>'action_type') = 'lead_message' 
          AND LOWER(COALESCE(action->'action_metadata'->>'message_type', action->'action_metadata'->>'messageType', 'direct_message')) NOT IN ('whatsapp', 'email')
        THEN 1 
        ELSE 0 
      END AS is_direct_message,
      -- Other lead types
      CASE WHEN (action->>'action_type') = 'lead_email' THEN 1 ELSE 0 END AS is_email_legacy,
      CASE WHEN (action->>'action_type') = 'lead_appointment' THEN 1 ELSE 0 END AS is_appointment,
      CASE WHEN (action->>'action_type') = 'lead_website' THEN 1 ELSE 0 END AS is_website
    FROM lead_actions_expanded
  ),
  aggregated AS (
    SELECT
      lister_id,
      COALESCE(SUM(is_phone), 0)::BIGINT AS phone_leads,
      COALESCE(SUM(is_whatsapp), 0)::BIGINT AS whatsapp_leads,
      COALESCE(SUM(is_direct_message), 0)::BIGINT AS direct_message_leads,
      -- Email can come from lead_message (message_type='email') OR legacy lead_email action
      COALESCE(SUM(is_email_from_message + is_email_legacy), 0)::BIGINT AS email_leads,
      COALESCE(SUM(is_appointment), 0)::BIGINT AS appointment_leads,
      COALESCE(SUM(is_website), 0)::BIGINT AS website_leads,
      COALESCE(SUM(is_phone + is_whatsapp + is_direct_message + is_email_from_message + is_email_legacy + is_appointment + is_website), 0)::BIGINT AS total_actions
    FROM lead_types
    GROUP BY lister_id
  )
  SELECT
    a.lister_id AS user_id,
    a.total_actions AS total_leads,
    a.phone_leads,
    CASE 
      WHEN a.total_actions = 0 THEN 0
      ELSE ROUND((a.phone_leads * 100.0 / a.total_actions), 2)
    END AS phone_percentage,
    a.whatsapp_leads,
    CASE 
      WHEN a.total_actions = 0 THEN 0
      ELSE ROUND((a.whatsapp_leads * 100.0 / a.total_actions), 2)
    END AS whatsapp_percentage,
    a.direct_message_leads,
    CASE 
      WHEN a.total_actions = 0 THEN 0
      ELSE ROUND((a.direct_message_leads * 100.0 / a.total_actions), 2)
    END AS direct_message_percentage,
    a.email_leads,
    CASE 
      WHEN a.total_actions = 0 THEN 0
      ELSE ROUND((a.email_leads * 100.0 / a.total_actions), 2)
    END AS email_percentage,
    a.appointment_leads,
    CASE 
      WHEN a.total_actions = 0 THEN 0
      ELSE ROUND((a.appointment_leads * 100.0 / a.total_actions), 2)
    END AS appointment_percentage,
    a.website_leads,
    CASE 
      WHEN a.total_actions = 0 THEN 0
      ELSE ROUND((a.website_leads * 100.0 / a.total_actions), 2)
    END AS website_percentage
  FROM aggregated a;
END;
$$ LANGUAGE plpgsql;

-- Function 8: Get admin analytics leads breakdown for a specific date
-- Aggregates leads by type, context, and lister_type using SQL aggregation
-- Returns: Counts and percentages for all lead types
CREATE OR REPLACE FUNCTION get_admin_leads_breakdown(target_date DATE)
RETURNS TABLE (
  phone_leads_total BIGINT,
  phone_leads_unique BIGINT,
  message_leads_total BIGINT,
  message_leads_unique BIGINT,
  email_leads_total BIGINT,
  email_leads_unique BIGINT,
  appointment_leads_total BIGINT,
  appointment_leads_unique BIGINT,
  website_leads_total BIGINT,
  website_leads_unique BIGINT,
  total_leads BIGINT,
  developer_leads BIGINT,
  agent_leads BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH lead_actions_expanded AS (
    SELECT
      l.id,
      l.seeker_id,
      l.lister_type,
      l.context_type,
      jsonb_array_elements(l.lead_actions) AS action
    FROM leads l
    WHERE l.date = target_date OR l.first_action_date = target_date
  ),
  lead_types AS (
    SELECT
      id,
      seeker_id,
      lister_type,
      context_type,
      CASE WHEN (action->>'action_type') = 'lead_phone' THEN 1 ELSE 0 END AS is_phone,
      CASE WHEN (action->>'action_type') = 'lead_message' THEN 1 ELSE 0 END AS is_message,
      CASE WHEN (action->>'action_type') = 'lead_email' THEN 1 ELSE 0 END AS is_email,
      CASE WHEN (action->>'action_type') = 'lead_appointment' THEN 1 ELSE 0 END AS is_appointment,
      CASE WHEN (action->>'action_type') = 'lead_website' THEN 1 ELSE 0 END AS is_website
    FROM lead_actions_expanded
  )
  SELECT
    COALESCE(SUM(CASE WHEN is_phone = 1 THEN 1 ELSE 0 END), 0)::BIGINT AS phone_leads_total,
    COALESCE(COUNT(DISTINCT CASE WHEN is_phone = 1 THEN seeker_id END), 0)::BIGINT AS phone_leads_unique,
    COALESCE(SUM(CASE WHEN is_message = 1 THEN 1 ELSE 0 END), 0)::BIGINT AS message_leads_total,
    COALESCE(COUNT(DISTINCT CASE WHEN is_message = 1 THEN seeker_id END), 0)::BIGINT AS message_leads_unique,
    COALESCE(SUM(CASE WHEN is_email = 1 THEN 1 ELSE 0 END), 0)::BIGINT AS email_leads_total,
    COALESCE(COUNT(DISTINCT CASE WHEN is_email = 1 THEN seeker_id END), 0)::BIGINT AS email_leads_unique,
    COALESCE(SUM(CASE WHEN is_appointment = 1 THEN 1 ELSE 0 END), 0)::BIGINT AS appointment_leads_total,
    COALESCE(COUNT(DISTINCT CASE WHEN is_appointment = 1 THEN seeker_id END), 0)::BIGINT AS appointment_leads_unique,
    COALESCE(SUM(CASE WHEN is_website = 1 THEN 1 ELSE 0 END), 0)::BIGINT AS website_leads_total,
    COALESCE(COUNT(DISTINCT CASE WHEN is_website = 1 THEN seeker_id END), 0)::BIGINT AS website_leads_unique,
    COALESCE(COUNT(DISTINCT id), 0)::BIGINT AS total_leads,
    COALESCE(COUNT(DISTINCT CASE WHEN lister_type = 'developer' THEN id END), 0)::BIGINT AS developer_leads,
    COALESCE(COUNT(DISTINCT CASE WHEN lister_type = 'agent' THEN id END), 0)::BIGINT AS agent_leads
  FROM lead_types;
END;
$$ LANGUAGE plpgsql;

-- Function 9: Get user signups for a specific hour
-- Combines all user type signup counts into a single query
-- Returns: Counts for developers, agents, property_seekers, and agencies
CREATE OR REPLACE FUNCTION get_user_signups_for_hour(
  signup_start TIMESTAMPTZ,
  signup_end TIMESTAMPTZ
)
RETURNS TABLE (
  developer_signups BIGINT,
  agent_signups BIGINT,
  property_seeker_signups BIGINT,
  agency_signups BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*)::BIGINT FROM developers WHERE created_at >= signup_start AND created_at < signup_end) AS developer_signups,
    (SELECT COUNT(*)::BIGINT FROM agents WHERE created_at >= signup_start AND created_at < signup_end) AS agent_signups,
    (SELECT COUNT(*)::BIGINT FROM property_seekers WHERE created_at >= signup_start AND created_at < signup_end) AS property_seeker_signups,
    (SELECT COALESCE(COUNT(*)::BIGINT, 0) FROM agencies WHERE created_at >= signup_start AND created_at < signup_end) AS agency_signups;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Test Function 1: Get cumulative listing analytics
-- SELECT * FROM get_cumulative_listing_analytics(ARRAY['listing-id-1'::UUID, 'listing-id-2'::UUID]);

-- Test Function 3: Get listing analytics by user
-- SELECT * FROM get_listing_analytics_by_user(
--   ARRAY['user-id-1'::UUID, 'user-id-2'::UUID],
--   '2025-11-13'::DATE,
--   17
-- );

-- Test Function 4: Get platform analytics
-- SELECT * FROM get_platform_analytics_aggregates('2025-11-13'::DATE);

