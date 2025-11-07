"use client"
import React, { useState, useEffect } from 'react'
import SecondaryListingCard from './Listing/SecondaryListingCard'
import Filter from './Filters/Filter'
import LoadingSpinner from './ui/LoadingSpinner'

const HomeProperties = () => {
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({
    purpose: '',
    sector: '',
    category: '',
    location: ''
  });

  // Fetch listings from API
  useEffect(() => {
    const fetchListings = async () => {
      try {
        setLoading(true)
        console.log('Fetching listings from /api/get-listings...')
        
        const response = await fetch('/api/get-listings')
        const result = await response.json()
        
        console.log('API Response:', result)
        
        if (result.success) {
          // Parse JSON fields if they come as strings
          const parsedListings = result.data.map(listing => {
            const parsed = { ...listing }
            
            // Parse media if it's a string
            if (typeof parsed.media === 'string') {
              try {
                parsed.media = JSON.parse(parsed.media)
              } catch (e) {
                console.error('Error parsing media:', e)
              }
            }
            
            return parsed
          })
          
          setListings(parsedListings)
          console.log('Listings set:', parsedListings.length)
        } else {
          setError(result.error || 'Failed to fetch listings')
        }
      } catch (err) {
        console.error('Error fetching listings:', err)
        setError('Failed to fetch listings')
      } finally {
        setLoading(false)
      }
    }

    fetchListings()
  }, []); // Remove filters dependency since we're not using them

  return (
    <div className='w-full h-full'>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between w-full">
          <h2 className="font-bold md:text-[3em] w-full text-left text-primary_color">
            Discover our main properties
          </h2>
        </div>
      </div>

      {/* Sticky Filter */}
      <div className="mb-6 sticky top-20 z-10 flex flex-col items-start">
        <div className="rounded-md p-4 inline-block">
          <Filter filters={filters} setFilters={setFilters} totalProperties={listings.length} />
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="large" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-12">
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

      {/* Properties Grid */}
      {!loading && !error && (
        <div className="w-full">
          {listings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {listings.map((listing, index) => (
                <SecondaryListingCard key={listing.id || index} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">
                <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No properties found</h3>
                <p className="text-gray-600">Try adjusting your filters to see more results.</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default HomeProperties
