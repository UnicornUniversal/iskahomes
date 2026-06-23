'use client'

import React, { useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { usePathname } from 'next/navigation'

const VALID_STATUSES = new Set(['approved', 'valid', 'active'])

const normalizeStatus = (value) => String(value || '').trim().toLowerCase()
const hasStatusValue = (value) => normalizeStatus(value).length > 0
const getStatusFromProfile = (profile) => {
  if (!profile) return ''
  return (
    profile.admin_status ||
    profile.profileStatus ||
    profile.profile_status ||
    profile.account_status ||
    profile.agent_status ||
    profile.status ||
    profile.organization_admin_status ||
    profile.organization_profile_status ||
    ''
  )
}

export default function AccountStatusGuard({ children, entityType }) {
  const { user, loading, hydrating } = useAuth()
  const pathname = usePathname()
  const isAllowedPendingRoute = useMemo(() => {
    const path = String(pathname || '').toLowerCase()
    return path.includes('/profile') || path.includes('/subscriptions')
  }, [pathname])
  const adminStatus = useMemo(() => {
    if (!user?.profile) return ''

    const currentUserType = normalizeStatus(user.user_type)
    const targetType = normalizeStatus(entityType)
    const profile = user.profile

    // Team members should be checked against their organization context from auth payload.
    if (
      currentUserType === 'team_member' &&
      profile.organization_type &&
      normalizeStatus(profile.organization_type) !== targetType
    ) {
      return ''
    }

    const statusFromProfile = getStatusFromProfile(profile)
    // IMPORTANT: Do not auto-promote unknown status to active.
    return hasStatusValue(statusFromProfile) ? statusFromProfile : ''
  }, [entityType, user])

  const isValidAccount = useMemo(() => VALID_STATUSES.has(normalizeStatus(adminStatus)), [adminStatus])

  if (loading || hydrating) {
    return (
      <div className="w-full min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (isValidAccount || isAllowedPendingRoute) {
    return children
  }

  const statusLabel = String(adminStatus || 'unknown').toUpperCase()

  return (
    <div className="w-full min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center justify-center gap-2">
        <p>Account Status:</p>
        <h3 className="text-primary_color text-4xl font-bold">{statusLabel}</h3>
      </div>
    </div>
  )
}
