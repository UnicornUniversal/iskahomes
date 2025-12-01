'use client'

import React from 'react'
import SecondaryListingCard from './SecondaryListingCard'
import { dynamic_images } from '@/app/components/Data/StaticData'

const ListingList2 = ({ listings = [], loading = false, error = null }) => {
  if (loading && listings.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary_color"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="border border-red-200 rounded-lg p-4 max-w-md mx-auto">
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!listings || listings.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mb-4">
          <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <h3 className="text-lg font-medium mb-2">No properties found</h3>
          <p className="text-sm opacity-70">Try adjusting your filters to see more results.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2  gap-4 md:gap-[2em]">
        {listings.map((listing, index) => {
          const configIndex = index % dynamic_images.length
          const selectedConfig = dynamic_images[configIndex]
          
          // Extract only height classes from imageClasses, always use w-full for width
          const allClasses = selectedConfig.imageClasses.split(' ')
          const heightClasses = allClasses.filter(cls => cls.startsWith('h-'))
          const imageHeightClasses = heightClasses.length > 0 ? heightClasses.join(' ') : 'h-[220px]'

          // Add top margin for even indices on medium devices and above
          const marginClass = index % 2 === 0 ? 'md:mt-[2em]' : ''

          return (
            <div 
              key={listing.id || index} 
              className={`w-full ${marginClass}`}
            >
              <SecondaryListingCard 
                listing={listing} 
                imageClasses={`w-full ${imageHeightClasses}`}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ListingList2
