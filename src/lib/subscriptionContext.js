/**
 * Resolve which account owns the subscription bill + shared usage pools.
 */

export function getCalendarMonthBounds(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0)
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)
  return { start, end }
}

export function isInCalendarMonth(dateInput, reference = new Date()) {
  if (!dateInput) return false
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput)
  if (Number.isNaN(date.getTime())) return false
  return (
    date.getFullYear() === reference.getFullYear() &&
    date.getMonth() === reference.getMonth()
  )
}

/**
 * From API userInfo (token middleware) or AuthContext user shape.
 */
export function resolveSubscriptionBillingAccount(actor) {
  if (!actor) return null

  const userType = actor.user_type
  const profile = actor.profile || {}

  if (userType === 'developer') {
    const userId = actor.developer_id || profile.developer_id || actor.user_id || actor.id
    return userId
      ? { userId, dbUserType: 'developer', scope: 'developer', actorType: 'developer' }
      : null
  }

  if (userType === 'agency') {
    const userId = actor.agency_id || profile.agency_id || actor.user_id || actor.id
    return userId
      ? { userId, dbUserType: 'agency', scope: 'agency', actorType: 'agency' }
      : null
  }

  if (userType === 'team_member') {
    if (profile.organization_type === 'agency' || actor.organization_type === 'agency') {
      const userId = profile.agency_id || actor.agency_id
      return userId
        ? {
            userId,
            dbUserType: 'agency',
            scope: 'agency',
            actorType: 'team_member',
          }
        : null
    }
    const userId = profile.developer_id || actor.developer_id
    return userId
      ? {
          userId,
          dbUserType: 'developer',
          scope: 'developer',
          actorType: 'team_member',
        }
      : null
  }

  if (userType === 'agent') {
    const agencyId = profile.agency_id || actor.agency_id
    const agentId = profile.agent_id || actor.agent_id || actor.user_id || actor.id
    return agencyId
      ? {
          userId: agencyId,
          dbUserType: 'agency',
          scope: 'agency',
          actorType: 'agent',
          agentId,
        }
      : null
  }

  return null
}

export function resolveSubscriptionBillingFromDecoded(decoded) {
  if (!decoded) return null

  if (decoded.user_type === 'team_member') {
    return resolveSubscriptionBillingAccount({
      user_type: 'team_member',
      organization_type: decoded.organization_type,
      agency_id: decoded.agency_id,
      developer_id: decoded.developer_id,
      profile: {
        organization_type: decoded.organization_type,
        agency_id: decoded.agency_id,
        developer_id: decoded.developer_id,
      },
    })
  }

  if (decoded.user_type === 'agency') {
    return resolveSubscriptionBillingAccount({
      user_type: 'agency',
      user_id: decoded.agency_id || decoded.user_id,
      agency_id: decoded.agency_id || decoded.user_id,
    })
  }

  if (decoded.user_type === 'developer') {
    return resolveSubscriptionBillingAccount({
      user_type: 'developer',
      user_id: decoded.developer_id || decoded.user_id,
      developer_id: decoded.developer_id || decoded.user_id,
    })
  }

  if (decoded.user_type === 'agent') {
    return resolveSubscriptionBillingAccount({
      user_type: 'agent',
      user_id: decoded.agent_id || decoded.user_id,
      agent_id: decoded.agent_id || decoded.user_id,
      agency_id: decoded.agency_id,
      profile: { agency_id: decoded.agency_id, agent_id: decoded.agent_id || decoded.user_id },
    })
  }

  return null
}
