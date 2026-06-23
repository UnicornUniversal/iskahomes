/**
 * Team member effective permissions always come from organization_roles (via role_id join).
 * The permissions column on organization_team_members is a legacy snapshot only.
 */

export const TEAM_MEMBER_WITH_ROLE_SELECT = `
  *,
  role:organization_roles(id, name, description, is_system_role, permissions)
`

export function parsePermissionsField(value) {
  if (value == null) return null
  if (typeof value === 'string') {
    try {
      return JSON.parse(value)
    } catch {
      return null
    }
  }
  return typeof value === 'object' ? value : null
}

export function isSuperAdminRole(role) {
  if (!role) return false
  const name = String(role.name || '').trim()
  return Boolean(role.is_system_role && /^super\s*admin$/i.test(name))
}

/**
 * Resolve live permissions from the joined organization_roles row.
 * Returns null for Super Admin (full access).
 */
export function resolvePermissionsFromTeamMember(teamMember) {
  if (!teamMember) return null

  const role = teamMember.role
  if (isSuperAdminRole(role)) {
    return null
  }

  const fromRole = parsePermissionsField(role?.permissions)
  if (fromRole) {
    return fromRole
  }

  // Broken/missing role join — last resort only
  return parsePermissionsField(teamMember.permissions)
}

export function withEffectiveTeamMemberPermissions(member) {
  if (!member) return member
  return {
    ...member,
    permissions: resolvePermissionsFromTeamMember(member),
    role_name: member.role?.name ?? member.role_name ?? null,
  }
}
