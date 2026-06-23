'use client'

import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { userHasPermission, userCanAccessRoute } from '@/lib/permissionHelpers'

/**
 * Renders children only when the user has the required permission.
 * Pass `permission` (e.g. "leads.view") or `route` (e.g. "leads" → leads.view).
 */
export default function PermissionGate({ permission, route, children, fallback = null }) {
  const { user } = useAuth()

  let allowed = false
  if (route) {
    allowed = userCanAccessRoute(user, route)
  } else if (permission) {
    allowed = userHasPermission(user, permission)
  }

  if (!allowed) return fallback
  return <>{children}</>
}
