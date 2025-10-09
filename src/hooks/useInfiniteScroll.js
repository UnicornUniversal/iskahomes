'use client'

import { useState, useEffect, useCallback } from 'react'

const useInfiniteScroll = (initialData = [], searchTerm = '') => {
  const [developers, setDevelopers] = useState(initialData)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const [error, setError] = useState(null)

  const fetchDevelopers = useCallback(async (pageNum = 1, search = '', reset = false) => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '10'
      })

      if (search) {
        params.append('search', search)
      }

      const response = await fetch(`/api/developers?${params}`)
      const result = await response.json()

      if (result.success) {
        const newDevelopers = result.data || []
        
        if (reset) {
          setDevelopers(newDevelopers)
        } else {
          setDevelopers(prev => [...prev, ...newDevelopers])
        }

        setHasMore(pageNum < result.pagination.pages)
        setPage(pageNum)
      } else {
        setError('Failed to fetch developers')
      }
    } catch (err) {
      setError('Network error occurred')
      console.error('Error fetching developers:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchDevelopers(page + 1, searchTerm, false)
    }
  }, [loading, hasMore, page, searchTerm, fetchDevelopers])

  const search = useCallback((term) => {
    setPage(1)
    setHasMore(true)
    fetchDevelopers(1, term, true)
  }, [fetchDevelopers])

  const reset = useCallback(() => {
    setPage(1)
    setHasMore(true)
    setDevelopers([])
    fetchDevelopers(1, '', true)
  }, [fetchDevelopers])

  useEffect(() => {
    // Initial load
    if (developers.length === 0) {
      fetchDevelopers(1, searchTerm, true)
    }
  }, [fetchDevelopers, searchTerm, developers.length])

  return {
    developers,
    loading,
    hasMore,
    error,
    loadMore,
    search,
    reset
  }
}

export default useInfiniteScroll
