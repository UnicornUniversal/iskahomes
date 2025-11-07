import { useState, useEffect } from 'react'

/**
 * Custom hook for accessing cached static data
 * @param {string} type - Type of data to fetch (categories, purposes, types, subtypes, amenities)
 * @param {boolean} autoFetch - Whether to automatically fetch data on mount
 * @returns {Object} Hook state and methods
 */
export function useStaticData(type, autoFetch = true) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [cached, setCached] = useState(false)

  const fetchData = async (forceRefresh = false) => {
    setLoading(true)
    setError(null)

    try {
      const url = forceRefresh 
        ? `/api/cache/static-data` 
        : `/api/cache/static-data?type=${type}`
      
      const method = forceRefresh ? 'POST' : 'GET'
      const body = forceRefresh ? JSON.stringify({ type }) : undefined

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body
      })

      const result = await response.json()

      if (response.ok) {
        setData(result.data)
        setCached(result.cached || false)
      } else {
        throw new Error(result.error || 'Failed to fetch data')
      }
    } catch (err) {
      setError(err.message)
      console.error(`Error fetching ${type}:`, err)
    } finally {
      setLoading(false)
    }
  }

  const refreshData = () => fetchData(true)

  useEffect(() => {
    if (autoFetch) {
      fetchData()
    }
  }, [type, autoFetch])

  return {
    data,
    loading,
    error,
    cached,
    refresh: refreshData,
    refetch: () => fetchData(false)
  }
}

/**
 * Hook for property categories
 */
export function usePropertyCategories(autoFetch = true) {
  return useStaticData('categories', autoFetch)
}

/**
 * Hook for property purposes
 */
export function usePropertyPurposes(autoFetch = true) {
  return useStaticData('purposes', autoFetch)
}

/**
 * Hook for property types
 */
export function usePropertyTypes(autoFetch = true) {
  return useStaticData('types', autoFetch)
}

/**
 * Hook for property subtypes
 */
export function usePropertySubtypes(autoFetch = true) {
  return useStaticData('subtypes', autoFetch)
}

/**
 * Hook for amenities
 */
export function useAmenities(autoFetch = true) {
  return useStaticData('amenities', autoFetch)
}

/**
 * Hook for cache statistics
 */
export function useCacheStats() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchStats = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/cache/static-data?action=stats')
      const result = await response.json()

      if (response.ok) {
        setStats(result.data)
      } else {
        throw new Error(result.error || 'Failed to fetch cache stats')
      }
    } catch (err) {
      setError(err.message)
      console.error('Error fetching cache stats:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  return {
    stats,
    loading,
    error,
    refresh: fetchStats
  }
}
