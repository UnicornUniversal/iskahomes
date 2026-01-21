/**
 * Permission Helper Functions
 * Utilities for checking permissions in both frontend and backend
 */

import { hasPermission, canAccessRoute } from './rolesAndPermissions'

/**
 * Check if user has permission (for use in components)
 * @param {Object} user - User object from AuthContext
 * @param {string} permissionKey - Permission key (e.g., 'units.create')
 * @returns {boolean}
 */
export const userHasPermission = (user, permissionKey) => {
  if (!user) return false
  
  // If user is team member, check their permissions
  if (user.user_type === 'team_member' && user.profile?.permissions) {
    const organizationType = user.profile?.organization_type || 'developer'
    return hasPermission(user.profile.permissions, permissionKey, organizationType)
  }
  
  // Developers and agencies should have permissions from organization_team_members
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
    if (user.profile?.permissions && typeof user.profile.permissions === 'object') {
      // Has explicit permissions - check them
      const organizationType = user.user_type === 'developer' ? 'developer' : 'agency'
      return hasPermission(user.profile.permissions, permissionKey, organizationType)
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
  
  // If user is team member, check their permissions
  if (user.user_type === 'team_member' && user.profile?.permissions) {
    const organizationType = user.profile?.organization_type || 'developer'
    return canAccessRoute(user.profile.permissions, routeCategory, organizationType)
  }
  
  // Developers and agencies should have permissions from organization_team_members
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
    if (user.profile?.permissions && typeof user.profile.permissions === 'object') {
      // Has explicit permissions - check them
      const organizationType = user.user_type === 'developer' ? 'developer' : 'agency'
      return canAccessRoute(user.profile.permissions, routeCategory, organizationType)
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
  
  // Map common routes to categories
  const routeMap = {
    'dashboard': 'dashboard',
    'units': 'units',
    'listings': 'listings',
    'developments': 'developments',
    'appointments': 'appointments',
    'leads': 'leads',
    'team': 'team',
    'analytics': 'analytics',
    'profile': 'profile',
    'subscriptions': 'subscriptions',
    'messages': 'messages',
    'media': 'media',
    'sales': 'sales',
    'favorites': 'favorites',
    'agents': 'agents',
    'reviews': 'reviews'
  }
  
  return routeMap[parts[0]] || null
}

export default {
  userHasPermission,
  userCanAccessRoute,
  getUserOrganizationType,
  getUserOrganizationId,
  isOwnerOrAdmin,
  extractRouteCategory
}
