'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Eye, TrendingUp, Loader2, Image as ImageIcon, MapPin } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { formatCurrency as formatCurrencyUtil } from '@/lib/utils'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

const PopularListings = ({ limit = 7, userId: propUserId = null, accountType: propAccountType = 'developer' }) => {
  const { user } = useAuth()
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)

  // Use provided userId/accountType or fall back to auth user
  const userId = propUserId || user?.id
  const accountType = propAccountType || user?.profile?.account_type || 'developer'

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    let isMounted = true

    const fetchPopularListings = async () => {
      try {
        const response = await fetch(`/api/listings/popular?user_id=${userId}&account_type=${accountType}&limit=${limit}`)
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
  }, [userId, accountType, limit])

  const formatCurrency = (amount, currencyCode = 'GHS') => {
    if (amount === null || amount === undefined || amount === 0) return 'Price on request'
    return formatCurrencyUtil(amount, currencyCode)
  }

  const formatLocation = (listing) => {
    const parts = [listing.city, listing.state, listing.country].filter(Boolean)
    return parts.length > 0 ? parts.join(', ') : listing.location || 'Location not specified'
  }

  if (loading) {
    return (
      <div className=" -lg shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span>Loading popular listings...</span>
        </div>
      </div>
    )
  }

  return (
    <div className=" overflow-hidden">
      <div className="px-6 pt-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 -full bg-primary_color/10 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h5 className="text-xl font-semibold">Popular Listings</h5>
            <p className="text-xs uppercase tracking-widest">Top {limit} this period</p>
          </div>
        </div>
        <span className="text-sm font-medium">{listings.length} showing</span>
      </div>

      <div className="p-6">
        {listings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Eye className="w-12 h-12 mb-3" />
            <p className="font-medium">No popular listings yet</p>
            <p className="text-sm mt-1">Listings will appear here as they gain views</p>
          </div>
        ) : (
          <Swiper
            modules={[Navigation, Pagination]}
            navigation
            pagination={{ clickable: true }}
            spaceBetween={16}
            slidesPerView={1}
            breakpoints={{
              640: { slidesPerView: 1.2 },
              768: { slidesPerView: 1.5 },
              1024: { slidesPerView: 2.2 },
              1440: { slidesPerView: 3 },
            }}
            className="popular-listings-swiper"
          >
            {listings.map((listing, index) => (
              <SwiperSlide key={listing.id}>
                <Link
                  href={listing.slug ? `/property/${listing.listing_type}/${listing.slug}/${listing.id}` : '#'}
                  className="block h-full"
                >
                  <div className="h-full flex flex-col -2xl ">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 -full bg-primary_color/10 flex items-center justify-center font-bold text-sm">
                          {index + 1}
                        </div>
                        <span className="text-xs uppercase tracking-wide">Top Listing</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        <Eye className="w-3 h-3" />
                        <span>{listing.total_views?.toLocaleString() || 0} views</span>
                      </div>
                    </div>

                    <div className="relative w-full h-[15em] -xl overflow-hidden mb-4">
                      {listing.image ? (
                        <Image
                          src={listing.image}
                          alt={listing.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <ImageIcon className="w-10 h-10" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 flex flex-col">
                      <h6 className="text-sm font-medium leading-tight line-clamp-2 mb-2">
                        {listing.title}
                      </h6>
                      <div className="flex items-center gap-2 text-sm mb-3">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate text-[0.8em]">{formatLocation(listing)}</span>
                      </div>

                      <div className="mt-auto">
                        <div className="flex items-baseline gap-3">
                          <span className="text-xl font-semibold">
                            {formatCurrency(listing.price, listing.currency)}
                          </span>
                          <span className="text-xs uppercase tracking-wide">
                            {listing.listing_type?.replace(/_/g, ' ') || 'Listing'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </SwiperSlide>
            ))}
          </Swiper>
        )}
      </div>

      {listings.length > 0 && (
        <div className="px-6 py-4 border-t border-white/40">
          <div className="text-center">
            <Link
              href={`/developer/${user?.profile?.slug || user?.profile?.id}/analytics/properties`}
              className="font-medium text-sm"
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
