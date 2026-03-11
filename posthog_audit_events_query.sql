-- =============================================================================
-- PostHog HogQL Query: Fetch ALL audit trail events
-- =============================================================================
-- Use this in PostHog: Data Management → SQL → New query
-- Or via the Query API: POST /api/projects/{id}/query/
--
-- Audit events are captured by src/lib/auditLogger.js via captureAuditEvent()
-- They include: auth_signup, auth_signin, listing_updated, lead_created, etc.
-- =============================================================================

-- Option 1: Filter by known audit event names (recommended)
SELECT
    event,
    timestamp,
    distinct_id,
    properties.user_id as user_id,
    properties.user_type as user_type,
    properties.timestamp as event_timestamp,
    properties.api_route as api_route,
    properties.metadata as metadata,
    properties.listing_id as listing_id,
    properties.development_id as development_id,
    properties.$lib as lib
FROM events
WHERE
    event NOT LIKE '$%'
    AND event IN (
        'auth_signup',
        'auth_signin',
        'auth_signout',
        'auth_email_verified',
        'auth_password_reset',
        'auth_password_changed',
        'auth_password_reset_requested',
        'auth_admin_created',
        'agent_invitation_sent',
        'agent_invitation_accepted',
        'team_invitation_sent',
        'team_invitation_accepted',
        'developer_profile_updated',
        'agency_profile_updated',
        'agent_profile_updated',
        'seeker_profile_updated',
        'listing_updated',
        'listing_deleted',
        'development_created',
        'lead_created',
        'saved_listing_added',
        'saved_listing_removed',
        'team_member_updated',
        'team_member_removed',
        'agent_updated',
        'message_sent',
        'conversation_created',
        'subscription_created'
    )
    -- Optional: date range (uncomment and adjust)
    -- AND timestamp >= now() - interval 7 day
    -- AND timestamp <= now()
ORDER BY timestamp DESC
LIMIT 500;


-- =============================================================================
-- Option 2: Filter by $lib = 'audit-logger' (auditLogger adds this to all events)
-- Use this if you want to catch any future audit events without updating the list
-- =============================================================================
/*
SELECT
    event,
    timestamp,
    distinct_id,
    properties.user_id as user_id,
    properties.user_type as user_type,
    properties.timestamp as event_timestamp,
    properties.api_route as api_route,
    properties.metadata as metadata,
    properties.$lib as lib
FROM events
WHERE
    event NOT LIKE '$%'
    AND properties.$lib = 'audit-logger'
ORDER BY timestamp DESC
LIMIT 500;
*/


-- =============================================================================
-- Option 3: Filter by organization (e.g. developer_id or agency_id)
-- Add to WHERE: AND (properties.user_id = 'YOUR_DEV_ID' OR distinct_id = 'YOUR_DEV_ID')
-- Or for org members: use a subquery or IN clause with team member IDs
-- =============================================================================
