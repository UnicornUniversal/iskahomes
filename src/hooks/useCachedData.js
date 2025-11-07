"use client"
import { useState, useEffect, useCallback, useRef } from 'react'

// Cache storage for client-side caching
const cache = new Map()
const cacheTimestamps = new Map()
const pendingRequests = new Map() // Track pending requests to prevent duplicates
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes (for non-Redis data)
const REDIS_CACHE_DURATION = 10 * 1000 // 10 seconds (very short cache for Redis-backed data since Redis is already caching)

// Custom hook for cached data fetching
export function useCachedData(key, fetchFunction, dependencies = []) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const isMountedRef = useRef(true)

  const fetchData = useCallback(async () => {
    // Check if we have valid cached data
    const cachedData = cache.get(key)
    const cacheTimestamp = cacheTimestamps.get(key)
    const now = Date.now()

    if (cachedData && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
      setData(cachedData)
      return cachedData
    }

    // Check if there's already a pending request for this key
    if (pendingRequests.has(key)) {
      console.log(`Waiting for pending request for key: ${key}`)
      return pendingRequests.get(key)
    }

    // Create a new request promise
    const requestPromise = (async () => {
      setLoading(true)
      setError(null)

      try {
        console.log(`Fetching data for key: ${key}`)
        const result = await fetchFunction()
        
        if (isMountedRef.current) {
          setData(result)
          // Cache the result
          cache.set(key, result)
          cacheTimestamps.set(key, now)
          console.log(`Cached data for key: ${key}`)
        }
        
        return result
      } catch (err) {
        if (isMountedRef.current) {
          setError(err)
        }
        throw err
      } finally {
        if (isMountedRef.current) {
          setLoading(false)
        }
        // Remove from pending requests
        pendingRequests.delete(key)
      }
    })()

    // Store the promise to prevent duplicate requests
    pendingRequests.set(key, requestPromise)
    
    return requestPromise
  }, [key, fetchFunction])

  useEffect(() => {
    // Check cache first
    const cachedData = cache.get(key)
    const cacheTimestamp = cacheTimestamps.get(key)
    const now = Date.now()

    if (cachedData && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
      console.log(`Using cached data for key: ${key}`)
      setData(cachedData)
    } else {
      console.log(`Cache miss for key: ${key}, fetching...`)
      fetchData()
    }
  }, [key, fetchData, ...dependencies])

  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const invalidateCache = useCallback(() => {
    cache.delete(key)
    cacheTimestamps.delete(key)
  }, [key])

  const refreshData = useCallback(() => {
    invalidateCache()
    return fetchData()
  }, [invalidateCache, fetchData])

  return {
    data,
    loading,
    error,
    refresh: refreshData,
    invalidateCache
  }
}

// SUPER SIMPLE - Just fetch from API, NO caching, NO complexity
function useCachedDataAPI(type) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    
    setLoading(true)
    setError(null)

    fetch(`/api/cached-data?type=${type}`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        return response.json()
      })
      .then(result => {
        if (!cancelled) {
          setData(result.data || [])
          setLoading(false)
        }
      })
      .catch(err => {
        if (!cancelled) {
          console.error(`Error fetching ${type}:`, err)
          setError(err)
          setData([])
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [type])

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/cached-data?type=${type}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const result = await response.json()
      setData(result.data || [])
    } catch (err) {
      console.error(`Error fetching ${type}:`, err)
      setError(err)
      setData([])
    } finally {
      setLoading(false)
    }
  }, [type])

  return { data, loading, error, refresh }
}

// Specific hooks for property management data - using cached-data API
export function usePropertyPurposes() {
  return useCachedDataAPI('purposes')
}

export function usePropertyTypes() {
  return useCachedDataAPI('types')
}

export function usePropertyCategories() {
  return useCachedDataAPI('categories')
}

export function usePropertySubtypes() {
  return useCachedDataAPI('subtypes')
}

export function useDevelopments(developerId) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const isMountedRef = useRef(true)

  const fetchData = useCallback(async () => {
    if (!developerId) {
      setData([])
      return []
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const token = localStorage.getItem('developer_token')
      const response = await fetch(`/api/developments?developer_id=${developerId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      const developments = result.data || []
      
      if (isMountedRef.current) {
        setData(developments)
      }
      
      return developments
    } catch (err) {
      if (isMountedRef.current) {
        setError(err)
        setData([])
      }
      throw err
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [developerId])

  useEffect(() => {
    isMountedRef.current = true
    
    // Always fetch when developerId changes, don't rely on cache
    if (developerId) {
      fetchData()
    } else {
      setData([])
    }
    
    return () => {
      isMountedRef.current = false
    }
  }, [developerId, fetchData])

  const refresh = useCallback(() => {
    return fetchData()
  }, [fetchData])

  return {
    data,
    loading,
    error,
    refresh
  }
}

// Utility function to clear all caches
export function clearAllCaches() {
  cache.clear()
  cacheTimestamps.clear()
  pendingRequests.clear()
}

// Utility function to clear specific cache keys
export function clearCacheKeys(keys) {
  keys.forEach(key => {
    cache.delete(key)
    cacheTimestamps.delete(key)
    pendingRequests.delete(key)
  })
}

// Test function to verify caching is working
export function testCache() {
  console.log('Testing cache...')
  console.log('Current cache keys:', Array.from(cache.keys()))
  console.log('Current pending requests:', Array.from(pendingRequests.keys()))
  
  // Test if we can access cached data
  const testKey = 'property-purposes'
  const cachedData = cache.get(testKey)
  const cacheTimestamp = cacheTimestamps.get(testKey)
  const now = Date.now()
  
  if (cachedData && cacheTimestamp) {
    const age = now - cacheTimestamp
    console.log(`Cache for ${testKey}:`, {
      hasData: !!cachedData,
      age: `${Math.round(age / 1000)}s ago`,
      isValid: age < CACHE_DURATION,
      dataLength: cachedData.length
    })
  } else {
    console.log(`No cache found for ${testKey}`)
  }
}
