/**
 * Display name for nav / headers — prefers profile name over email.
 */
import { userCanAccessRoute } from './permissionHelpers'

export function getUserDisplayName(user) {
  if (!user) return ''

  const profile = user.profile || {}
  const fullName = (profile.name || user.name || '').trim()
  if (fullName) return fullName

  const first = (profile.first_name || '').trim()
  const last = (profile.last_name || '').trim()
  if (first || last) return [first, last].filter(Boolean).join(' ')

  const orgName = (profile.organization_name || '').trim()
  if (orgName) return orgName

  return user.email || ''
}

/**
 * Resolves the dashboard URL for the current authenticated user.
 */
export function getDashboardHref(user) {
  if (!user) return null

  const profile = user.profile || {}
  const type = (user.user_type || '').toLowerCase()

  switch (type) {
    case 'developer':
      return `/developer/${profile.slug || profile.developer_id || user.id}/dashboard`
    case 'agency':
      return `/agency/${profile.slug || profile.agency_id || user.id}/dashboard`
    case 'agent':
      return `/agents/${profile.slug || profile.agent_id || user.id}/dashboard`
    case 'property_seeker':
      return `/propertySeeker/${profile.slug || profile.user_id || user.id}/dashboard`
    case 'team_member':
      if (profile.organization_type === 'agency') {
        return `/agency/${profile.organization_slug || profile.slug || user.id}/dashboard`
      }
      if (profile.organization_type === 'developer') {
        return `/developer/${profile.organization_slug || profile.slug || user.id}/dashboard`
      }
      return null
    case 'admin':
      return '/admin/dashboard'
    default:
      if (profile.agent_id) {
        return `/agents/${profile.slug || profile.agent_id}/dashboard`
      }
      if (profile.agency_id) {
        return `/agency/${profile.slug || profile.agency_id}/dashboard`
      }
      if (profile.developer_id) {
        return `/developer/${profile.slug || profile.developer_id}/dashboard`
      }
      return null
  }
}

/** Agency auth account id (agencies.agency_id) — for owners and team members acting on behalf of the agency. */
export function getAgencyAccountId(user) {
  if (!user) return null
  const profile = user.profile || {}
  if (profile.agency_id) return profile.agency_id
  if (user.user_type === 'agency') return user.id
  return null
}

export function getAgencySlug(user) {
  if (!user) return null
  const profile = user.profile || {}
  if (user.user_type === 'team_member' && profile.organization_type === 'agency') {
    return profile.organization_slug || profile.slug || null
  }
  return profile.slug || profile.organization_slug || null
}

const AGENCY_LANDING_ROUTES = [
  ['dashboard', 'dashboard'],
  ['agents', 'agents'],
  ['listings', 'properties'],
  ['appointments', 'appointments'],
  ['messages', 'messages'],
  ['leads', 'leads'],
  ['analytics', 'analytics/overview'],
  ['sales', 'sales'],
  ['subscriptions', 'subscriptions'],
  ['team', 'team'],
  ['audit_trail', 'audit'],
  ['profile', 'profile'],
]

/** First agency page the user is allowed to access (team members skip dashboard if denied). */
export function getAgencyLandingHref(user) {
  const slug = getAgencySlug(user)
  if (!slug) return getDashboardHref(user)

  if (user?.user_type === 'agency') {
    return `/agency/${slug}/dashboard`
  }

  if (user?.user_type === 'team_member' && user.profile?.organization_type === 'agency') {
    for (const [permission, path] of AGENCY_LANDING_ROUTES) {
      if (userCanAccessRoute(user, permission)) {
        return `/agency/${slug}/${path}`
      }
    }
    return `/agency/${slug}/profile`
  }

  return `/agency/${slug}/dashboard`
}
