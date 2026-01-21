'use client'

import React, { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { userCanAccessRoute, extractRouteCategory, isOwnerOrAdmin } from '@/lib/permissionHelpers'
import { toast } from 'react-toastify'

/**
 * ProtectedRoute Component
 * Wraps routes that require permission checks
 * Redirects users without proper permissions
 */
const ProtectedRoute = ({ children, requiredPermission = null, requiredRouteCategory = null }) => {
  const { user, loading, isAuthenticated } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Wait for auth to load
    if (loading) return

    // Check if user is authenticated
    if (!isAuthenticated || !user) {
      router.push('/home/signin')
      return
    }

    // Owners/admins have access to everything
    if (isOwnerOrAdmin(user)) {
      return
    }

    // For team members, check permissions
    if (user.user_type === 'team_member') {
      // Check route category access
      if (requiredRouteCategory) {
        if (!userCanAccessRoute(user, requiredRouteCategory)) {
          toast.error('You do not have permission to access this page')
          router.push(`/developer/${user.profile?.organization_slug || 'dashboard'}/dashboard`)
          return
        }
      } else {
        // Auto-detect route category from pathname
        const routeCategory = extractRouteCategory(pathname)
        if (routeCategory && !userCanAccessRoute(user, routeCategory)) {
          toast.error('You do not have permission to access this page')
          router.push(`/developer/${user.profile?.organization_slug || 'dashboard'}/dashboard`)
          return
        }
      }

      // Check specific permission if required
      if (requiredPermission) {
        const { userHasPermission } = require('@/lib/permissionHelpers')
        if (!userHasPermission(user, requiredPermission)) {
          toast.error('You do not have permission to perform this action')
          router.push(`/developer/${user.profile?.organization_slug || 'dashboard'}/dashboard`)
          return
        }
      }
    }
  }, [user, loading, isAuthenticated, pathname, requiredPermission, requiredRouteCategory, router])

  // Show loading while checking permissions
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Don't render if not authenticated
  if (!isAuthenticated || !user) {
    return null
  }

  // Render children if user has access
  return <>{children}</>
}

export default ProtectedRoute
