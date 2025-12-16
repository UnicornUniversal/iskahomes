"use client"
import React, { useState, useEffect } from 'react'
import ListingList from './Listing/ListingList'
import Filter from './Filters/Filter'
import LoadingSpinner from './ui/LoadingSpinner'
// import { listings as dummyListings } from './Data/StaticData'

const HomeProperties = () => {
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(false)
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
        <div className="flex  items-start justify-start w-full">
          <h1 className="font md:text-[2em] max-w-4xl w-full text-left text-primary_color">
            Discover our main properties
          </h1>
          {/* <p className="text-sm text-gray-500">
            Discover our main properties and find your dream home
          </p> */}
        </div>
      </div>

      {/* Sticky Filter */}
      {/* <div className="mb-6 sticky top-20 z-10 flex flex-col items-start">
        <div className="rounded-md p-4 inline-block">
          <Filter filters={filters} setFilters={setFilters} totalProperties={listings.length} />
        </div>
      </div> */}

      {/* Properties List */}
      <ListingList listings={listings} loading={loading} error={error} />
    </div>
  )
}

export default HomeProperties
