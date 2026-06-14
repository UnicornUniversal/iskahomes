/**
 * Resolve the JWT for API calls based on lister or user type.
 */
export function getAuthTokenForListerType(listerType, tokens = {}) {
  const { developerToken, agencyToken, agentToken } = tokens
  if (listerType === 'agency') return agencyToken || null
  if (listerType === 'agent') return agentToken || null
  return developerToken || null
}

export function getAuthTokenForUser(user, tokens = {}) {
  if (!user) return null
  const type = user.user_type
  if (type === 'agent') return tokens.agentToken || null
  if (type === 'agency') return tokens.agencyToken || null
  if (type === 'team_member') {
    if (user.profile?.organization_type === 'agency') return tokens.agencyToken || null
    return tokens.developerToken || null
  }
  if (type === 'developer') return tokens.developerToken || null
  return getAuthTokenForListerType('developer', tokens)
}
