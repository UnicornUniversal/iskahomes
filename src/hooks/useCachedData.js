"use client"
import { useState, useEffect, useCallback, useRef } from 'react'

// Cache storage for client-side caching
const cache = new Map()
const cacheTimestamps = new Map()
const pendingRequests = new Map() // Track pending requests to prevent duplicates
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes (for non-Redis data)
const REDIS_CACHE_DURATION = 30 * 60 * 1000 // 30 minutes (Redis-backed data - cache longer since Redis is already caching server-side)

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

// Optimized API hook with proper client-side caching
function useCachedDataAPI(type) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const cacheKey = `api-cached-${type}` // Unique cache key for this type

  // Check cache first
  useEffect(() => {
    const cachedData = cache.get(cacheKey)
    const cacheTimestamp = cacheTimestamps.get(cacheKey)
    const now = Date.now()

    // If we have valid cached data, use it immediately
    if (cachedData && cacheTimestamp && (now - cacheTimestamp) < REDIS_CACHE_DURATION) {
      console.log(`✅ Using cached data for ${type} (age: ${Math.round((now - cacheTimestamp) / 1000)}s)`)
      setData(cachedData)
      setLoading(false)
      return // Don't fetch if we have valid cache
    }

    // Check if there's already a pending request for this type
    if (pendingRequests.has(cacheKey)) {
      console.log(`⏳ Waiting for pending request for ${type}`)
      const pendingPromise = pendingRequests.get(cacheKey)
      pendingPromise
        .then(result => {
          setData(result)
          setLoading(false)
        })
        .catch(err => {
          setError(err)
          setData([])
          setLoading(false)
        })
      return
    }

    // Create a new request promise
    const requestPromise = (async () => {
      setLoading(true)
      setError(null)

      try {
        console.log(`📡 Fetching ${type} from API...`)
        const response = await fetch(`/api/cached-data?type=${type}`)
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const result = await response.json()
        const fetchedData = result.data || []
        
        // Cache the result
        cache.set(cacheKey, fetchedData)
        cacheTimestamps.set(cacheKey, Date.now())
        console.log(`💾 Cached ${type} (${fetchedData.length} items)`)
        
        setData(fetchedData)
        setLoading(false)
        
        return fetchedData
      } catch (err) {
        console.error(`❌ Error fetching ${type}:`, err)
        setError(err)
        setData([])
        setLoading(false)
        throw err
      } finally {
        // Remove from pending requests
        pendingRequests.delete(cacheKey)
      }
    })()

    // Store the promise to prevent duplicate requests
    pendingRequests.set(cacheKey, requestPromise)
  }, [type, cacheKey])

  const refresh = useCallback(async () => {
    // Invalidate cache and force refresh
    cache.delete(cacheKey)
    cacheTimestamps.delete(cacheKey)
    pendingRequests.delete(cacheKey)
    
    setLoading(true)
    setError(null)
    
    try {
      console.log(`🔄 Force refreshing ${type}...`)
      const response = await fetch(`/api/cached-data?type=${type}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const result = await response.json()
      const fetchedData = result.data || []
      
      // Update cache
      cache.set(cacheKey, fetchedData)
      cacheTimestamps.set(cacheKey, Date.now())
      
      setData(fetchedData)
    } catch (err) {
      console.error(`Error refreshing ${type}:`, err)
      setError(err)
      setData([])
    } finally {
      setLoading(false)
    }
  }, [type, cacheKey])

  return { data, loading, error, refresh }
}

// Hook to fetch all static data at once (more efficient than individual calls)
export function useAllStaticData() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const cacheKey = 'api-cached-all'

  useEffect(() => {
    const cachedData = cache.get(cacheKey)
    const cacheTimestamp = cacheTimestamps.get(cacheKey)
    const now = Date.now()

    // If we have valid cached data, use it immediately
    if (cachedData && cacheTimestamp && (now - cacheTimestamp) < REDIS_CACHE_DURATION) {
      console.log(`✅ Using cached all data (age: ${Math.round((now - cacheTimestamp) / 1000)}s)`)
      setData(cachedData)
      setLoading(false)
      return
    }

    // Check if there's already a pending request
    if (pendingRequests.has(cacheKey)) {
      console.log(`⏳ Waiting for pending all data request`)
      const pendingPromise = pendingRequests.get(cacheKey)
      pendingPromise
        .then(result => {
          setData(result)
          setLoading(false)
        })
        .catch(err => {
          setError(err)
          setData(null)
          setLoading(false)
        })
      return
    }

    // Create a new request promise
    const requestPromise = (async () => {
      setLoading(true)
      setError(null)

      try {
        console.log(`📡 Fetching all static data from API...`)
        const response = await fetch(`/api/cached-data?type=all`)
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const result = await response.json()
        const fetchedData = result.data || {}
        
        // Cache the result
        cache.set(cacheKey, fetchedData)
        cacheTimestamps.set(cacheKey, Date.now())
        console.log(`💾 Cached all static data`)
        
        setData(fetchedData)
        setLoading(false)
        
        return fetchedData
      } catch (err) {
        console.error(`❌ Error fetching all data:`, err)
        setError(err)
        setData(null)
        setLoading(false)
        throw err
      } finally {
        pendingRequests.delete(cacheKey)
      }
    })()

    pendingRequests.set(cacheKey, requestPromise)
  }, [cacheKey])

  const refresh = useCallback(async () => {
    cache.delete(cacheKey)
    cacheTimestamps.delete(cacheKey)
    pendingRequests.delete(cacheKey)
    
    setLoading(true)
    setError(null)
    
    try {
      console.log(`🔄 Force refreshing all data...`)
      const response = await fetch(`/api/cached-data?type=all`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const result = await response.json()
      const fetchedData = result.data || {}
      
      cache.set(cacheKey, fetchedData)
      cacheTimestamps.set(cacheKey, Date.now())
      
      setData(fetchedData)
    } catch (err) {
      console.error(`Error refreshing all data:`, err)
      setError(err)
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [cacheKey])

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
