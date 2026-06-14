'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

const profileCache = new Map()
const inflightRequests = new Map()

async function fetchAgentProfile(token) {
  const response = await fetch('/api/agents/profile', {
    headers: { Authorization: `Bearer ${token}` },
  })
  const result = await response.json()
  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Failed to load agent profile')
  }
  return result.data
}

/**
 * Shared agent profile from /api/agents/profile (deduped across components).
 */
export default function useAgentProfile(options = {}) {
  const { enabled = true } = options
  const { user, agentToken } = useAuth()
  const token = agentToken || user?.token
  const cacheKey = user?.id || token || null

  const [agent, setAgent] = useState(() => (cacheKey ? profileCache.get(cacheKey) : null) ?? null)
  const [loading, setLoading] = useState(enabled && !!cacheKey && !profileCache.has(cacheKey))
  const [error, setError] = useState(null)

  const refetch = useCallback(async () => {
    if (!token || !cacheKey) return null
    profileCache.delete(cacheKey)
    inflightRequests.delete(cacheKey)
    setLoading(true)
    setError(null)
    try {
      const data = await fetchAgentProfile(token)
      profileCache.set(cacheKey, data)
      setAgent(data)
      return data
    } catch (err) {
      setError(err.message || 'Failed to load agent profile')
      return null
    } finally {
      setLoading(false)
    }
  }, [token, cacheKey])

  useEffect(() => {
    if (!enabled || !token || !cacheKey) {
      setLoading(false)
      return
    }

    const cached = profileCache.get(cacheKey)
    if (cached) {
      setAgent(cached)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    async function load() {
      try {
        let request = inflightRequests.get(cacheKey)
        if (!request) {
          request = fetchAgentProfile(token).finally(() => inflightRequests.delete(cacheKey))
          inflightRequests.set(cacheKey, request)
        }
        const data = await request
        if (!cancelled) {
          profileCache.set(cacheKey, data)
          setAgent(data)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Failed to load agent profile')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [enabled, token, cacheKey])

  return { agent, loading, error, refetch }
}

export function clearAgentProfileCache(userId) {
  if (userId) {
    profileCache.delete(userId)
    inflightRequests.delete(userId)
  } else {
    profileCache.clear()
    inflightRequests.clear()
  }
}
