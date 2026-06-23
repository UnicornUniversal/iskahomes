/**
 * Permission Helper Functions
 * Utilities for checking permissions in both frontend and backend
 */

import { hasPermission, canAccessRoute } from './rolesAndPermissions'

function normalizeUserPermissions(permissions) {
  if (!permissions) return null
  if (typeof permissions === 'string') {
    try {
      return JSON.parse(permissions)
    } catch {
      return null
    }
  }
  return typeof permissions === 'object' ? permissions : null
}

/**
 * Check if user has permission (for use in components)
 * @param {Object} user - User object from AuthContext
 * @param {string} permissionKey - Permission key (e.g., 'units.create')
 * @returns {boolean}
 */
export const userHasPermission = (user, permissionKey) => {
  if (!user) return false

  const permissions = normalizeUserPermissions(user.profile?.permissions)
  
  // If user is team member, check their permissions
  if (user.user_type === 'team_member' && permissions) {
    const organizationType = user.profile?.organization_type || 'developer'
    return hasPermission(permissions, permissionKey, organizationType)
  }
  
  // Developers and agencies — permissions resolved from organization_roles via role_id join
  if (user.user_type === 'developer' || user.user_type === 'agency') {
    // Check if user is Super Admin (permissions is null OR role_name is 'Super Admin')
    const isSuperAdmin = user.profile?.permissions === null || 
                         user.profile?.permissions === undefined ||
                         user.profile?.role_name === 'Super Admin'
    
    if (isSuperAdmin) {
      // Super Admin has all permissions
      return true
    }
    
    // Check if permissions are loaded from organization_team_members
    if (permissions) {
      const organizationType = user.user_type === 'developer' ? 'developer' : 'agency'
      return hasPermission(permissions, permissionKey, organizationType)
    }
    
    // If no permissions object, default to false (shouldn't happen, but safety check)
    return false
  }
  
  return false
}

/**
 * Check if user can access a route (for use in components)
 * @param {Object} user - User object from AuthContext
 * @param {string} routeCategory - Route category (e.g., 'dashboard', 'units')
 * @returns {boolean}
 */
export const userCanAccessRoute = (user, routeCategory) => {
  if (!user) return false

  const permissions = normalizeUserPermissions(user.profile?.permissions)
  
  // If user is team member, check their permissions
  if (user.user_type === 'team_member' && permissions) {
    const organizationType = user.profile?.organization_type || 'developer'
    return canAccessRoute(permissions, routeCategory, organizationType)
  }
  
  // Developers and agencies — permissions resolved from organization_roles via role_id join
  if (user.user_type === 'developer' || user.user_type === 'agency') {
    // Check if user is Super Admin (permissions is null OR role_name is 'Super Admin')
    const isSuperAdmin = user.profile?.permissions === null || 
                         user.profile?.permissions === undefined ||
                         user.profile?.role_name === 'Super Admin'
    
    if (isSuperAdmin) {
      // Super Admin has access to all routes
      return true
    }
    
    // Check if permissions are loaded from organization_team_members
    if (permissions) {
      const organizationType = user.user_type === 'developer' ? 'developer' : 'agency'
      return canAccessRoute(permissions, routeCategory, organizationType)
    }
    
    // If no permissions object, default to false (shouldn't happen, but safety check)
    return false
  }
  
  return false
}

/**
 * Get user's organization type
 * @param {Object} user - User object from AuthContext
 * @returns {string|null} 'developer', 'agency', or null
 */
export const getUserOrganizationType = (user) => {
  if (!user) return null
  
  if (user.user_type === 'team_member') {
    return user.profile?.organization_type || null
  }
  
  if (user.user_type === 'developer') return 'developer'
  if (user.user_type === 'agency') return 'agency'
  
  return null
}

/**
 * Get user's organization ID
 * @param {Object} user - User object from AuthContext
 * @returns {string|null} Organization ID or null
 */
export const getUserOrganizationId = (user) => {
  if (!user) return null
  
  if (user.user_type === 'team_member') {
    return user.profile?.organization_id || null
  }
  
  if (user.user_type === 'developer') {
    return user.profile?.developer_id || null
  }
  
  if (user.user_type === 'agency') {
    return user.profile?.agency_id || null
  }
  
  return null
}

/**
 * Check if user is owner/admin (has full permissions)
 * @param {Object} user - User object from AuthContext
 * @returns {boolean}
 */
export const isOwnerOrAdmin = (user) => {
  if (!user) return false
  
  // Team members are never owners/admins
  if (user.user_type === 'team_member') {
    return false
  }
  
  // Developers and agencies are owners/admins
  return user.user_type === 'developer' || user.user_type === 'agency'
}

/**
 * Extract route category from pathname
 * @param {string} pathname - Route pathname (e.g., '/developer/[slug]/dashboard')
 * @returns {string|null} Category name or null
 */
export const extractRouteCategory = (pathname) => {
  if (!pathname) return null
  
  // Remove organization prefix and slug
  const parts = pathname.split('/').filter(p => p && p !== 'developer' && p !== 'agency' && !p.match(/^\[.*\]$/))
  
  if (parts.length === 0) return null
  
  // Map common routes to categories (check all path parts for agency/developer routes)
  const routeMap = {
    'dashboard': 'dashboard',
    'units': 'units',
    'listings': 'listings',
    'developments': 'developments',
    'appointments': 'appointments',
    'leads': 'leads',
    'team': 'team',
    'roles': 'team',
    'analytics': 'analytics',
    'profile': 'profile',
    'subscriptions': 'subscriptions',
    'messages': 'messages',
    'media': 'media',
    'sales': 'sales',
    'audit-trail': 'audit_trail',
    'audit': 'audit_trail',
    'favorites': 'favorites',
    'agents': 'agents',
    'reviews': 'reviews'
  }

  const routePart = parts.find(p => routeMap[p])
  return routePart ? routeMap[routePart] : null
}

/** Super Admin is reserved for the organization owner who signed up — not assignable. */
export const isSuperAdminTeamRole = (role) => {
  const name = typeof role === 'string' ? role : role?.name
  return /^super\s*admin$/i.test(String(name || '').trim())
}

export const filterAssignableTeamRoles = (roles = []) => {
  return roles.filter((role) => !isSuperAdminTeamRole(role))
}

export const userCanViewAllLeads = (user) => {
  if (!user) return false
  if (
    user.profile?.permissions === null ||
    user.profile?.permissions === undefined ||
    /super\s*admin/i.test(String(user.profile?.role_name || ''))
  ) {
    return true
  }
  return userHasPermission(user, 'leads.view_all')
}

/** Whether leads should be scoped to the current user's assignee id (developer context). */
export const shouldScopeLeadsToAssignee = (user, listerType) => {
  if (!user || listerType === 'agent' || listerType === 'agency') return false
  return !userCanViewAllLeads(user)
}

export function canViewAllLeadsForUserInfo(userInfo) {
  if (!userInfo) return false
  const roleName = userInfo?.role?.name || userInfo?.role_name || ''
  if (userInfo.permissions === null || userInfo.permissions === undefined) return true
  if (/super\s*admin/i.test(String(roleName))) return true
  const permissions = normalizeUserPermissions(userInfo.permissions)
  if (!permissions) return false
  const orgType =
    userInfo.organization_type ||
    (userInfo.user_type === 'developer' ? 'developer' : 'agency')
  return hasPermission(permissions, 'leads.view_all', orgType)
}

export function resolveLeadsAssignedUserFilter(
  userInfo,
  { listerType, assignedUserFilter, isSuperAdmin, agentOwnsLister }
) {
  if (isSuperAdmin || agentOwnsLister) {
    return assignedUserFilter || null
  }

  if (listerType === 'agency') {
    const isAgencyActor =
      userInfo.user_type === 'agency' ||
      (userInfo.user_type === 'team_member' && userInfo.organization_type === 'agency')
    if (isAgencyActor) {
      return assignedUserFilter || null
    }
  }

  if (canViewAllLeadsForUserInfo(userInfo)) {
    return assignedUserFilter || null
  }

  return assignedUserFilter || userInfo.user_id || null
}

export { normalizeUserPermissions }

export default {
  userHasPermission,
  userCanAccessRoute,
  getUserOrganizationType,
  getUserOrganizationId,
  isOwnerOrAdmin,
  extractRouteCategory,
  isSuperAdminTeamRole,
  filterAssignableTeamRoles,
  userCanViewAllLeads,
  shouldScopeLeadsToAssignee,
  canViewAllLeadsForUserInfo,
  resolveLeadsAssignedUserFilter,
  normalizeUserPermissions,
}
