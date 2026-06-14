'use client'

import React, { useState, useEffect } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination, Autoplay } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import Link from 'next/link'
import { withWebsiteLeadAttribution } from '@/lib/leadAttributionUrl'
import { Building2 } from 'lucide-react'

const FALLBACK_BANNER =
  'https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.1.0'

const parseImageUrl = (value) => {
  if (!value) return null

  try {
    if (typeof value === 'string') {
      const parsed = JSON.parse(value)
      const resolved = parsed?.url || parsed || null
      return typeof resolved === 'string' && resolved.startsWith('http') ? resolved : null
    }

    if (typeof value === 'object') {
      const resolved = value?.url || value || null
      return typeof resolved === 'string' && resolved.startsWith('http') ? resolved : null
    }
  } catch {
    if (typeof value === 'string' && value.startsWith('http')) {
      return value
    }
  }

  return null
}

const getDevelopmentLocation = (development) => {
  if (development.development_locations) {
    try {
      const locations =
        typeof development.development_locations === 'string'
          ? JSON.parse(development.development_locations)
          : development.development_locations

      if (Array.isArray(locations) && locations.length > 0) {
        const primaryLocation = locations.find((loc) => loc.isPrimary) || locations[0]
        const parts = [primaryLocation.city, primaryLocation.state, primaryLocation.country].filter(Boolean)

        if (parts.length > 0) {
          return parts.join(', ')
        }
      }
    } catch (error) {
      console.error('Error parsing development_locations:', error)
    }
  }

  const parts = [development.town, development.city, development.state, development.country].filter(Boolean)

  if (parts.length > 0) {
    return parts.join(', ')
  }

  return development.full_address || 'Location not specified'
}

const getDeveloperLocation = (developer) => {
  if (developer?.company_locations) {
    try {
      let companyLocations = developer.company_locations

      if (typeof companyLocations === 'string') {
        companyLocations = JSON.parse(companyLocations)
      }

      if (Array.isArray(companyLocations) && companyLocations.length > 0) {
        const primaryLocation = companyLocations.find(
          (loc) =>
            loc.primary_location === true ||
            loc.primary_location === 'true' ||
            loc.primary_location === 1
        )

        if (primaryLocation) {
          const parts = [primaryLocation.city, primaryLocation.region, primaryLocation.country].filter(Boolean)

          if (parts.length > 0) {
            return parts.join(', ')
          }
        }
      }
    } catch (error) {
      console.error('Error parsing company_locations:', error)
    }
  }

  const parts = [developer?.city, developer?.region, developer?.country].filter(Boolean)

  if (parts.length > 0) {
    return parts.join(', ')
  }

  return null
}

const FeaturedDevelopments = ({ linkContext = 'featured' }) => {
  const [featuredDevelopments, setFeaturedDevelopments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFeaturedDevelopments = async () => {
      try {
        const response = await fetch('/api/public/developments/featured')
        const result = await response.json()

        if (result.success) {
          setFeaturedDevelopments(result.data || [])
        }
      } catch (error) {
        console.error('Error fetching featured developments:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchFeaturedDevelopments()
  }, [])

  if (loading) {
    return (
      <div className="w-full h-96 rounded-lg flex items-center justify-center">
        <div className="text-gray-500">Loading featured developments...</div>
      </div>
    )
  }

  if (featuredDevelopments.length === 0) {
    return (
      <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-gray-500">No featured developments available</div>
      </div>
    )
  }

  return (
    <div className="w-full mb-8">
      <div className="container mx-auto">
        <h5 className="heading_title font-medium mb-6 text-left">Featured Developments</h5>
      </div>

      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        spaceBetween={0}
        slidesPerView={1}
        navigation={{ enabled: false }}
        pagination={{ clickable: true }}
        autoplay={{
          delay: 4000,
          disableOnInteraction: false
        }}
        breakpoints={{
          768: {
            navigation: { enabled: true }
          }
        }}
        className="featured-developers-swiper w-full"
      >
        {featuredDevelopments.map((development) => {
          const developer = development.developer
          const developerImageUrl = parseImageUrl(developer?.profile_image)
          const bannerImage = development.banner_url || FALLBACK_BANNER
          const developmentLocation = getDevelopmentLocation(development)
          const developerLocation = getDeveloperLocation(developer)

          return (
            <SwiperSlide key={development.id}>
              <Link
                href={withWebsiteLeadAttribution(`/home/allDevelopments/${development.slug}`, linkContext)}
                className="block"
              >
                <div className="relative h-[420px] md:h-96 w-full overflow-hidden cursor-pointer">
                  <img
                    src={bannerImage}
                    alt={development.title}
                    className="w-full h-full object-cover"
                    onError={(event) => {
                      event.currentTarget.src = FALLBACK_BANNER
                    }}
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/5 to-transparent" />

                  <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8">
                    <div className="flex flex-col md:flex-row md:items-end gap-4 md:gap-6">
                      <div className="flex-shrink-0">
                        {developerImageUrl ? (
                          <img
                            src={developerImageUrl}
                            alt={developer?.name || 'Developer'}
                            className="w-20 h-20 md:w-24 md:h-24 rounded-md object-cover border-4 border-white/50 shadow-lg"
                            onError={(event) => {
                              event.currentTarget.style.display = 'none'
                            }}
                          />
                        ) : (
                          <div className="w-20 h-20 md:w-24 md:h-24 rounded-md border-4 border-white/50 shadow-lg bg-white/20 flex items-center justify-center">
                            <Building2 className="w-10 h-10 text-white" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 text-white">
                        <h3 className="text-2xl md:text-3xl !text-white leading-tight">{development.title}</h3>

                        {developer?.name && (
                          <p className="text-base md:text-lg opacity-90 !text-white mt-1">
                            by {developer.name}
                          </p>
                        )}

                        <p className="text-sm md:text-base opacity-85 !text-white mt-1">
                          {developmentLocation}
                        </p>

                        {developerLocation && developerLocation !== developmentLocation && (
                          <p className="text-sm opacity-75 !text-white mt-1">
                            Developer: {developerLocation}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm mt-3">
                          <div>
                            <span className="opacity-75">Status: </span>
                            <span className="font-semibold">{development.status || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="opacity-75">Total Units: </span>
                            <span className="font-semibold">{development.total_units || 0}</span>
                          </div>
                          {developer?.total_developments !== undefined && developer?.total_developments !== null && (
                            <div>
                              <span className="opacity-75">Developer Projects: </span>
                              <span className="font-semibold">{developer.total_developments}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </SwiperSlide>
          )
        })}
      </Swiper>
    </div>
  )
}

export default FeaturedDevelopments
