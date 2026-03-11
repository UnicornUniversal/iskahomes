/**
 * Server-side audit logger using PostHog Node SDK.
 * Captures events from API routes with user context (user_id, user_type, timestamp).
 * Only logs important changes - not full request/response bodies.
 */

import { PostHog } from 'posthog-node'

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY || process.env.POSTHOG_PROJECT_API_KEY
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || process.env.POSTHOG_HOST || 'https://us.i.posthog.com'

let client = null

function getClient() {
  if (!POSTHOG_KEY) return null
  if (!client) {
    client = new PostHog(POSTHOG_KEY, {
      host: POSTHOG_HOST,
      flushAt: 1,
      flushInterval: 0,
    })
  }
  return client
}

/**
 * Capture an audit event to PostHog.
 * @param {string} eventName - Event name (e.g. 'auth_signup', 'listing_created')
 * @param {Object} properties - Event properties. Must include: user_id, user_type, timestamp
 * @param {string} [distinctId] - PostHog distinct_id (defaults to properties.user_id)
 */
export function captureAuditEvent(eventName, properties = {}, distinctId) {
  try {
    const posthog = getClient()
    if (!posthog) return

    const distinct = distinctId ?? properties.user_id ?? 'anonymous'
    const timestamp = properties.timestamp ?? new Date().toISOString()

    posthog.capture({
      distinctId: distinct,
      event: eventName,
      properties: {
        ...properties,
        timestamp,
        $lib: 'audit-logger',
        audit_source: 'audit_trail', // Explicit marker for filtering audit events
      },
      timestamp: new Date(timestamp),
    })
  } catch (err) {
    console.warn('[auditLogger] Failed to capture event:', err?.message)
  }
}

/**
 * Helper to build standard audit properties from user context.
 */
export function auditProps(user, extra = {}) {
  const userId = user?.user_id ?? user?.id ?? user?.developer_id ?? user?.agency_id ?? user?.agent_id
  const userType = user?.user_type ?? user?.account_type
  return {
    user_id: userId,
    user_type: userType,
    timestamp: new Date().toISOString(),
    ...extra,
  }
}
