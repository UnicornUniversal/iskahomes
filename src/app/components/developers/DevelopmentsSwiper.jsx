'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import { MapPin, Building2, Eye } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

const DevelopmentsSwiper = ({ developerId }) => {
  const [developments, setDevelopments] = useState([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const [error, setError] = useState(null)
  const swiperRef = useRef(null)

  const fetchDevelopments = useCallback(async (pageNum = 1, append = false) => {
    if (!developerId) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(
        `/api/public/developments/by-developer?developer_id=${developerId}&page=${pageNum}&limit=10`
      )
      const result = await response.json()

      if (result.success) {
        const newDevelopments = result.data || []
        
        if (append) {
          setDevelopments(prev => [...prev, ...newDevelopments])
        } else {
          setDevelopments(newDevelopments)
        }

        setHasMore(result.pagination.hasMore)
        setPage(pageNum)
      } else {
        setError(result.error || 'Failed to fetch developments')
      }
    } catch (err) {
      console.error('Error fetching developments:', err)
      setError('Network error occurred')
    } finally {
      setLoading(false)
    }
  }, [developerId])

  // Initial load
  useEffect(() => {
    if (developerId) {
      fetchDevelopments(1, false)
    }
  }, [developerId, fetchDevelopments])

  // Handle reaching the end of swiper
  const handleReachEnd = useCallback(() => {
    if (hasMore && !loading) {
      fetchDevelopments(page + 1, true)
    }
  }, [hasMore, loading, page, fetchDevelopments])

  // Get location string
  const getLocation = (development) => {
    const parts = [development.city, development.state, development.country].filter(Boolean)
    return parts.length > 0 ? parts.join(', ') : 'Location not specified'
  }

  // Get banner image URL
  const getBannerUrl = (development) => {
    if (!development.banner) return null
    try {
      const banner = typeof development.banner === 'string'
        ? JSON.parse(development.banner)
        : development.banner
      return banner?.url || null
    } catch (e) {
      return development.banner?.url || development.banner || null
    }
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-sm">{error}</p>
      </div>
    )
  }

  if (developments.length === 0 && !loading) {
    return (
      <div className="text-center py-8">
        <Building2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-medium mb-2">No Developments Yet</h3>
        <p className="text-sm opacity-70">This developer hasn't added any developments yet.</p>
      </div>
    )
  }

  return (
    <div className="relative">
      <Swiper
        modules={[Navigation]}
        spaceBetween={16}
        slidesPerView="auto"
        navigation
        onSwiper={(swiper) => {
          swiperRef.current = swiper
        }}
        onReachEnd={handleReachEnd}
        className="developments-swiper"
        breakpoints={{
          640: {
            slidesPerView: 1.5,
          },
          768: {
            slidesPerView: 2,
          },
          1024: {
            slidesPerView: 2.5,
          },
          1280: {
            slidesPerView: 3,
          },
        }}
      >
        {developments.map((development, index) => {
          const bannerUrl = getBannerUrl(development)
          const location = getLocation(development)
          const imageHeight = index % 2 === 0 ? 'h-[20em] w-[320px]' : 'h-[15em] w-[500px]'

          return (
            <SwiperSlide key={development.id} style={{ width: 'auto' }}>
              <Link href={`/allDevelopments/${development.slug}`} className="block">
                <div className="group cursor-pointer  overflow-hidden transition-all duration-300 ">
                  {/* Banner Image */}
                  <div className={`relative ${imageHeight} overflow-hidden`}>
                    {bannerUrl ? (
                      <Image
                        src={bannerUrl}
                        alt={development.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary_color/20 to-primary_color/10 flex items-center justify-center">
                        <Building2 className="w-12 h-12 opacity-50" />
                      </div>
                    )}
                    {/* Status Badge */}
                    {development.status && (
                      <div className="absolute top-4 right-4">
                        <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium">
                          {development.status}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    {/* Title */}
                    <h3 className="text-lg font-medium mb-2 line-clamp-2  transition-colors">
                      {development.title}
                    </h3>

                    {/* Location */}
                    <div className="flex items-center gap-2 text-sm mb-3">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span className="line-clamp-1">{location}</span>
                    </div>

                    {/* Total Units and Views */}
                    <div className="flex items-center gap-4 text-sm">
                      {development.total_units !== undefined && development.total_units !== null && (
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 flex-shrink-0" />
                          <span>{development.total_units} {development.total_units === 1 ? 'Unit' : 'Units'}</span>
                        </div>
                      )}
                      {development.views !== undefined && development.views !== null && (
                        <div className="flex items-center gap-2">
                          <Eye className="w-4 h-4 flex-shrink-0" />
                          <span>{development.views} {development.views === 1 ? 'View' : 'Views'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            </SwiperSlide>
          )
        })}

        {/* Loading indicator at the end */}
        {loading && hasMore && (
          <SwiperSlide style={{ width: 'auto' }}>
            <div className="w-[320px] h-[300px] flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary_color"></div>
            </div>
          </SwiperSlide>
        )}
      </Swiper>

      {/* Custom Swiper Styles */}
      <style jsx>{`
        .developments-swiper {
          padding: 20px 0 50px 0;
        }
        .developments-swiper .swiper-button-next,
        .developments-swiper .swiper-button-prev {
          color: var(--color-primary_color);
          background: white;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          border: 1px solid var(--color-primary_color);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        .developments-swiper .swiper-button-next:after,
        .developments-swiper .swiper-button-prev:after {
          font-size: 16px;
          font-weight: bold;
        }
        .developments-swiper .swiper-button-disabled {
          opacity: 0.35;
        }
      `}</style>
    </div>
  )
}

export default DevelopmentsSwiper

