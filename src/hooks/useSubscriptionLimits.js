'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
  checkNumericLimit,
  checkFeatureEnabled,
  getMonthlyOverLimitIds,
  getCumulativeOverLimitIds,
  getUnitsPerDevelopmentOverLimitIds,
  canAddUnitToAnyDevelopment,
  getNumericLimit,
  getSubscriptionLimitTooltip,
  USAGE_KEY_BY_LIMIT,
} from '@/lib/subscriptionLimits'
import { getAuthTokenForUser } from '@/lib/authTokens'

/**
 * Fetches effective subscription limits + usage for the current user.
 * Agents and agency team members inherit the agency billing account.
 */
export function useSubscriptionLimits() {
  const { user, developerToken, agencyToken, agentToken } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchLimits = useCallback(async () => {
    const token = getAuthTokenForUser(user, { developerToken, agencyToken, agentToken })
    if (!token || !user?.user_type) {
      setData(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/subscriptions/limits', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json?.error || 'Failed to load limits')
        setData(null)
        return
      }
      setData(json?.data ?? null)
    } catch (err) {
      setError(err?.message || 'Failed to load limits')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [user, developerToken, agencyToken, agentToken])

  useEffect(() => {
    fetchLimits()
  }, [fetchLimits])

  const limits = data?.limits ?? {}
  const usage = data?.usage ?? {}
  const hasClientManagementAddon = !!data?.hasClientManagementAddon
  const hasAddon = !!data?.hasAddon
  const hasActiveSubscription = !!data?.hasActiveSubscription
  const packageName = data?.packageName ?? null
  const userType = data?.userType ?? null
  const actorType = data?.actorType ?? user?.user_type ?? null
  const billingUserId = data?.billingUserId ?? null

  const canAccessAddonFeature = useCallback(
    () => hasClientManagementAddon,
    [hasClientManagementAddon]
  )

  const isWithinLimit = useCallback(
    (limitKey, currentUsage = undefined) => {
      const usageVal = currentUsage ?? usage[limitKey] ?? 0
      const result = checkNumericLimit(limits, limitKey, Number(usageVal))
      return result.allowed
    },
    [limits, usage]
  )

  const canCreateMore = useCallback(
    (limitKey, currentUsageOverride) => {
      const usageKey = USAGE_KEY_BY_LIMIT[limitKey] || limitKey
      const usageVal = Number(currentUsageOverride ?? usage[usageKey] ?? 0)
      const result = checkNumericLimit(limits, limitKey, usageVal + 1)
      return result.allowed
    },
    [limits, usage]
  )

  const getLimitTooltip = useCallback((limitKey) => getSubscriptionLimitTooltip(limitKey), [])

  const getCumulativeLockedIds = useCallback(
    (items, limitKey, getCreatedAt, getId) =>
      getCumulativeOverLimitIds(items, limitKey, limits, getCreatedAt, getId),
    [limits]
  )

  const getUnitsDevelopmentLockedIds = useCallback(
    (items, getDevelopmentId, getCreatedAt, getId) =>
      getUnitsPerDevelopmentOverLimitIds(items, limits, getDevelopmentId, getCreatedAt, getId),
    [limits]
  )

  const canAddUnitAnyDevelopment = useCallback(
    (items, getDevelopmentId) => canAddUnitToAnyDevelopment(items, limits, getDevelopmentId),
    [limits]
  )

  const getLimitValue = useCallback((limitKey) => getNumericLimit(limits, limitKey), [limits])

  const isFeatureEnabled = useCallback(
    (featureKey) => checkFeatureEnabled(limits, featureKey),
    [limits]
  )

  const getMonthlyLockedIds = useCallback(
    (items, limitKey, getCreatedAt) =>
      getMonthlyOverLimitIds(items, limitKey, limits, getCreatedAt),
    [limits]
  )

  const usageSummary = useMemo(
    () => ({
      leadsThisMonth: usage.leads_per_month ?? 0,
      leadsLimit: getNumericLimit(limits, 'leads_per_month'),
      appointmentsThisMonth: usage.appointments_per_month ?? 0,
      appointmentsLimit: getNumericLimit(limits, 'appointments_per_month'),
      listings: usage.total_listings ?? 0,
      listingsLimit: getNumericLimit(limits, 'listing_limits'),
      developments: usage.total_developments ?? 0,
      developmentsLimit: getNumericLimit(limits, 'developments_limit'),
      agents: usage.total_agents ?? 0,
      agentsLimit: getNumericLimit(limits, 'number_of_agents'),
      teamMembers: usage.total_team_members ?? 0,
      teamMembersLimit: getNumericLimit(limits, 'total_users_limit'),
      roles: usage.total_roles ?? 0,
      rolesLimit: getNumericLimit(limits, 'total_roles_limit'),
    }),
    [limits, usage]
  )

  return {
    limits,
    usage,
    usageSummary,
    hasAddon,
    hasClientManagementAddon,
    hasActiveSubscription,
    packageName,
    userType,
    actorType,
    billingUserId,
    loading,
    error,
    refetch: fetchLimits,
    canAccessAddonFeature,
    isWithinLimit,
    canCreateMore,
    getLimitTooltip,
    getCumulativeLockedIds,
    getUnitsDevelopmentLockedIds,
    canAddUnitAnyDevelopment,
    getLimitValue,
    isFeatureEnabled,
    getMonthlyLockedIds,
  }
}
