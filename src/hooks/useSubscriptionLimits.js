'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
  checkNumericLimit,
  checkFeatureEnabled
} from '@/lib/subscriptionLimits'

function getAuthToken(user) {
  if (!user) return null
  if (typeof window === 'undefined') return null
  const userType = user?.user_type
  if (userType === 'developer') {
    return localStorage.getItem('developer_token') || localStorage.getItem('developerToken')
  }
  if (userType === 'agency') {
    return localStorage.getItem('agency_token') || localStorage.getItem('agencyToken')
  }
  if (userType === 'agent') {
    return localStorage.getItem('agent_token') || localStorage.getItem('agentToken')
  }
  return localStorage.getItem('developer_token') || localStorage.getItem('agency_token') || null
}

/**
 * Fetches effective subscription limits + usage for the current user.
 * Returns limits (merged api_limits), usage (counts), hasClientManagementAddon, and helpers.
 */
export function useSubscriptionLimits() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchLimits = useCallback(async () => {
    const token = getAuthToken(user)
    if (!token || !user?.user_type) {
      setData(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/subscriptions/limits', {
        headers: { Authorization: `Bearer ${token}` }
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
  }, [user])

  useEffect(() => {
    fetchLimits()
  }, [fetchLimits])

  const limits = data?.limits ?? {}
  const usage = data?.usage ?? {}
  const hasClientManagementAddon = !!data?.hasClientManagementAddon
  const hasAddon = !!data?.hasAddon
  const userType = data?.userType ?? null

  const canAccessAddonFeature = useCallback(() => hasClientManagementAddon, [hasClientManagementAddon])

  const isWithinLimit = useCallback((limitKey, currentUsage = undefined) => {
    const usageVal = currentUsage ?? usage[limitKey] ?? 0
    const result = checkNumericLimit(limits, limitKey, Number(usageVal))
    return result.allowed
  }, [limits, usage])

  const getLimitValue = useCallback((limitKey) => {
    const entry = limits?.[limitKey]
    if (!entry) return undefined
    if (entry.data_type === 'number') return Number(entry.value)
    return entry.value
  }, [limits])

  const isFeatureEnabled = useCallback((featureKey) => checkFeatureEnabled(limits, featureKey), [limits])

  return {
    limits,
    usage,
    hasAddon,
    hasClientManagementAddon,
    userType,
    loading,
    error,
    refetch: fetchLimits,
    canAccessAddonFeature,
    isWithinLimit,
    getLimitValue,
    isFeatureEnabled
  }
}
