'use client'

import React, { useEffect, useRef } from 'react'
import DevelopmentHeaders from '@/app/components/developers/DevelopmentHeaders'
import DeveloperCard from '@/app/components/developers/DeveloperCard'
import SearchBar from '@/app/components/developers/SearchBar'
import LoadingSpinner from '@/app/components/ui/LoadingSpinner'
import useInfiniteScroll from '@/hooks/useInfiniteScroll'

const AllDevelopersPage = () => {
  const { developers, loading, hasMore, error, loadMore, search } = useInfiniteScroll()
  const observerRef = useRef()
  const loadingRef = useRef()

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )

    if (loadingRef.current) {
      observer.observe(loadingRef.current)
    }

    return () => {
      if (loadingRef.current) {
        observer.unobserve(loadingRef.current)
      }
    }
  }, [hasMore, loading, loadMore])

  const handleSearch = (searchTerm) => {
    search(searchTerm)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Discover Developers
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Explore top developers and their amazing projects. Find your next dream home with trusted developers.
          </p>
        </div>
      </div>

      {/* Featured Developers Header - Full Width */}
      <DevelopmentHeaders />

      <div className="container mx-auto px-4 py-8">
        {/* Search Bar */}
        <SearchBar onSearch={handleSearch} loading={loading} />

        {/* Error State */}
        {error && (
          <div className="text-center py-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-red-600">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Developers Grid */}
        {developers.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                All Developers ({developers.length})
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {developers.map((developer, index) => (
                <DeveloperCard key={`${developer.id}-${index}`} developer={developer} />
              ))}
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && developers.length === 0 && (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="large" />
          </div>
        )}

        {/* No Results */}
        {!loading && developers.length === 0 && !error && (
          <div className="text-center py-12">
            <div className="bg-gray-100 rounded-lg p-8 max-w-md mx-auto">
              <div className="text-6xl mb-4">🏗️</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Developers Found
              </h3>
              <p className="text-gray-600">
                Try adjusting your search terms or check back later for new developers.
              </p>
            </div>
          </div>
        )}

        {/* Load More Trigger */}
        {hasMore && developers.length > 0 && (
          <div ref={loadingRef} className="flex justify-center py-8">
            {loading ? (
              <LoadingSpinner size="medium" />
            ) : (
              <button
                onClick={loadMore}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
              >
                Load More Developers
              </button>
            )}
          </div>
        )}

        {/* End of Results */}
        {!hasMore && developers.length > 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">
              You've reached the end of the list. No more developers to load.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default AllDevelopersPage