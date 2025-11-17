'use client'

import React from 'react'
import SecondaryListingCard from './SecondaryListingCard'

// 5 different size configurations (width, height)
const CARD_SIZES = [
  { width: 'w-[280px]', height: 'h-[450px]' },
  { width: 'w-[320px]', height: 'h-[500px]' },
  { width: 'w-[300px]', height: 'h-[480px]' },
  { width: 'w-[340px]', height: 'h-[520px]' },
  { width: 'w-[290px]', height: 'h-[460px]' },
]

const ListingList2 = ({ listings = [], loading = false, error = null }) => {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
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
    )
  }

  if (!listings || listings.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 mb-4">
          <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No properties found</h3>
          <p className="text-gray-600">Try adjusting your filters to see more results.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-4 justify-start items-start">
        {listings.map((listing, index) => {
          // Cycle through the 5 size configurations
          const sizeConfig = CARD_SIZES[index % CARD_SIZES.length]
          
          return (
            <div 
              key={listing.id || index} 
              className={`${sizeConfig.width} ${sizeConfig.height} flex-shrink-0`}
            >
              <div className={`w-full ${sizeConfig.height} h-full`}>
                <SecondaryListingCard listing={listing} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ListingList2

