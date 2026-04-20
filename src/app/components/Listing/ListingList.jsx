'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, LayoutGroup } from 'framer-motion'
import SecondaryListingCard from './SecondaryListingCard'

// Fisher-Yates shuffle (returns new array)
function shuffleArray(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const ListingList = ({
  listings = [],
  loading = false,
  error = null,
  col1Y,
  col2Y,
  col3Y,
  col1Opacity,
  col2Opacity,
  col3Opacity,
  shuffleActive = false,
}) => {
  // Shuffled order — holds array of listing ids/indices in display order
  const [displayOrder, setDisplayOrder] = useState([])
  const [hovered, setHovered] = useState(false)
  const intervalRef = useRef(null)

  // Initialise display order when listings arrive
  useEffect(() => {
    if (listings.length > 0) {
      setDisplayOrder(listings.map((_, i) => i))
    }
  }, [listings])

  // Shuffle every 3s when active and not hovered
  useEffect(() => {
    if (shuffleActive && !hovered && listings.length > 0) {
      intervalRef.current = setInterval(() => {
        setDisplayOrder((prev) => shuffleArray(prev))
      }, 3000)
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [shuffleActive, hovered, listings.length])

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

  // Build ordered list from displayOrder
  const ordered = displayOrder.length === listings.length
    ? displayOrder.map((i) => listings[i])
    : listings

  // Round-robin distribute into 3 columns — always even, no gaps
  const colItems = [[], [], []]
  ordered.forEach((listing, i) => {
    colItems[i % 3].push(listing)
  })

  const columns = [
    { items: colItems[0], y: col1Y, opacity: col1Opacity },
    { items: colItems[1], y: col2Y, opacity: col2Opacity },
    { items: colItems[2], y: col3Y, opacity: col3Opacity },
  ]

  return (
    <div className="w-full">
      <LayoutGroup>
        <div
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '20px',
            alignItems: 'start',
          }}
        >
          {columns.map((col, colIdx) => (
            <motion.div
              key={colIdx}
              style={{
                y: col.y,
                opacity: col.opacity,
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
              }}
            >
              {col.items.map((listing) => (
                <motion.div
                  key={listing.id}
                  layout
                  transition={{
                    layout: { type: 'spring', stiffness: 120, damping: 20, mass: 0.8 }
                  }}
                  style={{ aspectRatio: '16 / 10' }}
                >
                  <SecondaryListingCard
                    listing={listing}
                    overlay
                  />
                </motion.div>
              ))}
            </motion.div>
          ))}
        </div>
      </LayoutGroup>
    </div>
  )
}

export default ListingList

