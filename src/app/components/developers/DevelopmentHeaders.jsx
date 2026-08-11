'use client'

import React, { useState, useEffect } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, FreeMode } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/free-mode'
import Link from 'next/link'
import { withWebsiteLeadAttribution } from '@/lib/leadAttributionUrl'

// profile_image / cover_image come back as a URL string, a JSON string, or an object
const parseImageUrl = (value) => {
  if (!value) return null

  if (typeof value === 'object') {
    const resolved = value?.url
    return typeof resolved === 'string' && resolved.startsWith('http') ? resolved : null
  }

  if (typeof value !== 'string') return null

  try {
    const parsed = JSON.parse(value)
    const resolved = typeof parsed === 'string' ? parsed : parsed?.url
    return typeof resolved === 'string' && resolved.startsWith('http') ? resolved : null
  } catch {
    return value.startsWith('http') ? value : null
  }
}

const DevelopmentHeaders = () => {
  const [featuredDevelopers, setFeaturedDevelopers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFeaturedDevelopers = async () => {
      try {
        const response = await fetch('/api/developers?limit=12&featured=true')
        const result = await response.json()

        if (result.success) {
          setFeaturedDevelopers(result.data)
        }
      } catch (error) {
        console.error('Error fetching featured developers:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchFeaturedDevelopers()
  }, [])

  if (loading) {
    return (
      <div className="w-full mb-8">
        <div className="container mx-auto">
          <h5 className="heading_title font-medium mb-6 text-left">Featured Developers</h5>
          <div className="flex gap-16 overflow-hidden">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-32 w-full max-w-[220px] shrink-0 animate-pulse rounded-md bg-primary_color/5 sm:h-40 lg:h-48"
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Pre-launch: empty-state hidden so an empty roster isn't exposed
  if (featuredDevelopers.length === 0) return null

  return (
    <div className="w-full mb-8">
      <div className="container mx-auto">
        <h5 className="heading_title font-medium mb-6 text-left">Featured Developers</h5>

        <Swiper
          modules={[Autoplay, FreeMode]}
          slidesPerView="auto"
          spaceBetween={40}
          loop
          speed={12000}
          allowTouchMove
          freeMode={{ enabled: true, momentum: false }}
          autoplay={{ delay: 0, disableOnInteraction: false, pauseOnMouseEnter: true }}
          breakpoints={{
            640: { spaceBetween: 56 },
            1024: { spaceBetween: 72 },
          }}
          className="developer-logos-swiper w-full"
        >
          {featuredDevelopers.map((developer) => {
            const logoUrl = parseImageUrl(developer.profile_image)
            const initial = developer.name?.charAt(0)?.toUpperCase() || 'D'

            return (
              <SwiperSlide key={developer.id} className="!w-auto">
                <Link
                  href={withWebsiteLeadAttribution(`/home/allDevelopers/${developer.slug}`, 'featured')}
                  title={developer.name}
                  className="group flex h-28 items-center justify-center sm:h-36 lg:h-44"
                >
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt={developer.name}
                      loading="lazy"
                      /* height drives the size; width follows the logo's own ratio */
                      className="h-full w-auto max-w-none object-contain opacity-90 transition duration-500 ease-out group-hover:scale-[1.05] group-hover:opacity-100"
                      onError={(e) => {
                        // fall back to the initial badge rendered alongside
                        e.currentTarget.style.display = 'none'
                        e.currentTarget.nextElementSibling?.classList.remove('hidden')
                      }}
                    />
                  ) : null}
                  <span
                    className={`${logoUrl ? 'hidden ' : ''}flex h-20 w-20 items-center justify-center rounded-full bg-primary_color/10 text-3xl font-semibold text-primary_color sm:h-24 sm:w-24`}
                  >
                    {initial}
                  </span>
                </Link>
              </SwiperSlide>
            )
          })}
        </Swiper>
      </div>
    </div>
  )
}

export default DevelopmentHeaders
