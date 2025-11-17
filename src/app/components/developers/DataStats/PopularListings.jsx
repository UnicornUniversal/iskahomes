'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Eye, TrendingUp, Loader2, Image as ImageIcon, MapPin } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

const PopularListings = ({ limit = 7 }) => {
  const { user } = useAuth()
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    let isMounted = true

    const fetchPopularListings = async () => {
      try {
        const response = await fetch(`/api/listings/popular?user_id=${user.id}&limit=${limit}`)
        if (response.ok) {
          const result = await response.json()
          if (isMounted) {
            setListings(result.data || [])
          }
        }
      } catch (error) {
        console.error('Error fetching popular listings:', error)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchPopularListings()

    return () => {
      isMounted = false
    }
  }, [user?.id, limit])

  const formatCurrency = (amount, currencyCode = 'GHS') => {
    if (amount === null || amount === undefined || amount === 0) return 'Price on request'
    return `${currencyCode} ${Number(amount).toLocaleString('en-US')}`
  }

  const formatLocation = (listing) => {
    const parts = [listing.city, listing.state, listing.country].filter(Boolean)
    return parts.length > 0 ? parts.join(', ') : listing.location || 'Location not specified'
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
          <span className="text-gray-600">Loading popular listings...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h5 className="text-lg font-semibold text-gray-900">Popular Listings</h5>
          </div>
          <span className="text-sm text-gray-500">Top {limit} by views</span>
        </div>
      </div>

      {/* Listings */}
      <div className="p-6">
        {listings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Eye className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No popular listings yet</p>
            <p className="text-sm text-gray-400 mt-1">Listings will appear here as they gain views</p>
          </div>
        ) : (
          <div className="space-y-3">
            {listings.map((listing, index) => (
              <Link
                key={listing.id}
                href={listing.slug ? `/property/${listing.listing_type}/${listing.slug}/${listing.id}` : '#'}
                className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all group"
              >
                {/* Rank Badge */}
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                  {index + 1}
                </div>

                {/* Image */}
                {listing.image ? (
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={listing.image}
                      alt={listing.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                    <ImageIcon className="w-8 h-8 text-gray-400" />
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h6 className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                    {listing.title}
                  </h6>
                  <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{formatLocation(listing)}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-sm font-medium text-gray-900">
                      {formatCurrency(listing.price, listing.currency)}
                    </span>
                    <span className="text-gray-300">•</span>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Eye className="w-3 h-3" />
                      <span className="font-medium">{listing.total_views?.toLocaleString() || 0} views</span>
                    </div>
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex-shrink-0 text-gray-400 group-hover:text-blue-600 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {listings.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="text-center">
            <Link
              href={`/developer/${user?.profile?.slug || user?.profile?.id}/analytics/properties`}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              View All Properties →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

export default PopularListings
