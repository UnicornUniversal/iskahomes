/**
 * API Permission Middleware
 * Helper functions for checking permissions in API routes
 */

import { supabaseAdmin } from './supabase'
import { verifyToken } from './jwt'
import { hasPermission } from './rolesAndPermissions'

/**
 * Get user info from token (supports both owner/admin and team members)
 * @param {string} token - JWT token
 * @returns {Object|null} User info or null
 */
export const getUserFromToken = async (token) => {
  try {
    const decoded = verifyToken(token)
    if (!decoded) return null

    // If team member, get their info from organization_team_members
    if (decoded.user_type === 'team_member') {
      const { data: teamMember, error } = await supabaseAdmin
        .from('organization_team_members')
        .select(`
          *,
          role:organization_roles(id, name, description, is_system_role)
        `)
        .eq('user_id', decoded.user_id)
        .eq('status', 'active')
        .maybeSingle()

      if (error || !teamMember) return null

      return {
        user_id: decoded.user_id,
        user_type: 'team_member',
        organization_type: teamMember.organization_type,
        organization_id: teamMember.organization_id,
        team_member_id: teamMember.id,
        role_id: teamMember.role_id,
        permissions: teamMember.permissions,
        role: teamMember.role
      }
    }

    // If developer/agency owner - check organization_team_members for permissions
    if (decoded.user_type === 'developer') {
      const { data: developer, error } = await supabaseAdmin
        .from('developers')
        .select('id, developer_id')
        .eq('developer_id', decoded.user_id)
        .single()

      if (error || !developer) return null

      // CRITICAL: Load permissions from organization_team_members
      // Even owners need to be in organization_team_members
      const { data: teamMember } = await supabaseAdmin
        .from('organization_team_members')
        .select('permissions, role_id')
        .eq('organization_type', 'developer')
        .eq('organization_id', developer.id)
        .eq('user_id', decoded.user_id)
        .eq('status', 'active')
        .maybeSingle()

      return {
        user_id: decoded.user_id,
        user_type: 'developer',
        organization_type: 'developer',
        organization_id: developer.id,
        developer_id: developer.developer_id,
        // Load permissions from organization_team_members, or null if not found (Super Admin)
        permissions: teamMember?.permissions || null,
        role_id: teamMember?.role_id || null
      }
    }

    if (decoded.user_type === 'agency') {
      const { data: agency, error } = await supabaseAdmin
        .from('agencies')
        .select('id, agency_id')
        .eq('agency_id', decoded.user_id)
        .single()

      if (error || !agency) return null

      // CRITICAL: Load permissions from organization_team_members
      // Even owners need to be in organization_team_members
      const { data: teamMember } = await supabaseAdmin
        .from('organization_team_members')
        .select('permissions, role_id')
        .eq('organization_type', 'agency')
        .eq('organization_id', agency.id)
        .eq('user_id', decoded.user_id)
        .eq('status', 'active')
        .maybeSingle()

      return {
        user_id: decoded.user_id,
        user_type: 'agency',
        organization_type: 'agency',
        organization_id: agency.id,
        agency_id: agency.agency_id,
        // Load permissions from organization_team_members, or null if not found (Super Admin)
        permissions: teamMember?.permissions || null,
        role_id: teamMember?.role_id || null
      }
    }

    return null
  } catch (error) {
    console.error('Error getting user from token:', error)
    return null
  }
}

/**
 * Check if user has permission
 * @param {Object} userInfo - User info from getUserFromToken
 * @param {string} permissionKey - Permission key (e.g., 'units.create')
 * @returns {boolean}
 */
export const checkPermission = (userInfo, permissionKey) => {
  if (!userInfo) return false

  // Owners/admins have all permissions (permissions is null)
  if (userInfo.permissions === null) return true

  // Check permissions for team members, developers, and agencies
  if (userInfo.permissions) {
    return hasPermission(
      userInfo.permissions,
      permissionKey,
      userInfo.organization_type || (userInfo.user_type === 'developer' ? 'developer' : 'agency')
    )
  }

  return false
}

/**
 * Authenticate request and get user info
 * @param {Request} request - Next.js request object
 * @returns {Object} { userInfo, error }
 */
export const authenticateRequest = async (request) => {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { error: 'Authorization header missing', status: 401 }
    }

    const token = authHeader.split(' ')[1]
    const userInfo = await getUserFromToken(token)

    if (!userInfo) {
      return { error: 'Invalid token or user not found', status: 401 }
    }

    return { userInfo, error: null }
  } catch (error) {
    console.error('Authentication error:', error)
    return { error: 'Authentication failed', status: 401 }
  }
}

/**
 * Middleware to check if user has required permission
 * @param {Request} request - Next.js request object
 * @param {string} requiredPermission - Required permission key
 * @returns {Object} { userInfo, error }
 */
export const requirePermission = async (request, requiredPermission) => {
  const { userInfo, error } = await authenticateRequest(request)
  
  if (error) {
    return { userInfo: null, error, status: error.status || 401 }
  }

  if (!checkPermission(userInfo, requiredPermission)) {
    return {
      userInfo: null,
      error: 'Insufficient permissions',
      status: 403
    }
  }

  return { userInfo, error: null }
}

/**
 * Middleware to check if user can access organization
 * @param {Request} request - Next.js request object
 * @param {string} organizationId - Organization ID to check
 * @returns {Object} { userInfo, error }
 */
export const requireOrganizationAccess = async (request, organizationId) => {
  const { userInfo, error } = await authenticateRequest(request)
  
  if (error) {
    return { userInfo: null, error, status: error.status || 401 }
  }

  // Check if user belongs to this organization
  if (userInfo.organization_id !== organizationId) {
    return {
      userInfo: null,
      error: 'Access denied to this organization',
      status: 403
    }
  }

  return { userInfo, error: null }
}

export default {
  getUserFromToken,
  checkPermission,
  authenticateRequest,
  requirePermission,
  requireOrganizationAccess
}
