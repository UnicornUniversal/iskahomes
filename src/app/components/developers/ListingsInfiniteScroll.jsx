'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import ListingList2 from '@/app/components/Listing/ListingList2'

const ListingsInfiniteScroll = ({ developerId }) => {
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const [error, setError] = useState(null)
  const observerRef = useRef(null)
  const loadingRef = useRef(null)

  const fetchListings = useCallback(async (pageNum = 1, append = false) => {
    if (!developerId) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(
        `/api/public/listings/by-developer?developer_id=${developerId}&page=${pageNum}&limit=12`
      )
      const result = await response.json()

      if (result.success) {
        const newListings = result.data || []
        
        if (append) {
          setListings(prev => [...prev, ...newListings])
        } else {
          setListings(newListings)
        }

        setHasMore(result.pagination.hasMore)
        setPage(pageNum)
      } else {
        setError(result.error || 'Failed to fetch listings')
      }
    } catch (err) {
      console.error('Error fetching listings:', err)
      setError('Network error occurred')
    } finally {
      setLoading(false)
    }
  }, [developerId])

  // Initial load
  useEffect(() => {
    if (developerId) {
      fetchListings(1, false)
    }
  }, [developerId, fetchListings])

  // Infinite scroll observer
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          fetchListings(page + 1, true)
        }
      },
      { threshold: 0.1 }
    )

    if (loadingRef.current) {
      observerRef.current.observe(loadingRef.current)
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [hasMore, loading, page, fetchListings])

  return (
    <div>
      <ListingList2 
        listings={listings} 
        loading={loading && listings.length === 0}
        error={error}
      />
      
      {/* Loading trigger for infinite scroll */}
      {hasMore && listings.length > 0 && (
        <div ref={loadingRef} className="flex justify-center py-8">
          {loading ? (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary_color"></div>
          ) : (
            <div className="h-8"></div>
          )}
        </div>
      )}

      {/* End of results */}
      {!hasMore && listings.length > 0 && (
        <div className="text-center py-8">
          <p className="text-sm opacity-70">No more listings to load.</p>
        </div>
      )}
    </div>
  )
}

export default ListingsInfiniteScroll

