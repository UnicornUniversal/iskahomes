'use client'

import React, { useState, useEffect } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination, Autoplay } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import Link from 'next/link'
import { Building2, MapPin, CheckCircle } from 'lucide-react'

const FeaturedDevelopments = () => {
  const [featuredDevelopments, setFeaturedDevelopments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFeaturedDevelopments = async () => {
      try {
        const response = await fetch('/api/public/developments/featured?limit=5')
        const result = await response.json()
        
        if (result.success) {
          setFeaturedDevelopments(result.data)
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
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary_color mx-auto mb-4"></div>
          <div className="text-gray-500">Loading featured developments...</div>
        </div>
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
        <h5 className="font-medium mb-6 text-left text-primary_color text-2xl">
          Featured Developments
        </h5>
      </div>
      
      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        spaceBetween={0}
        slidesPerView={1}
        navigation
        pagination={{ clickable: true }}
        autoplay={{
          delay: 4000,
          disableOnInteraction: false,
        }}
        className="featured-developers-swiper w-full"
      >
        {featuredDevelopments.map((development) => {
          // Get location
          let location = null
          if (development.development_locations) {
            try {
              const locations = typeof development.development_locations === 'string'
                ? JSON.parse(development.development_locations)
                : development.development_locations
              
              if (Array.isArray(locations) && locations.length > 0) {
                const primaryLocation = locations.find(loc => loc.isPrimary) || locations[0]
                const parts = [
                  primaryLocation.city,
                  primaryLocation.state,
                  primaryLocation.country
                ].filter(Boolean)
                if (parts.length > 0) {
                  location = parts.join(', ')
                }
              }
            } catch (e) {
              console.error('Error parsing development_locations:', e)
            }
          }

          // Fallback to direct fields
          if (!location) {
            const parts = [development.city, development.state, development.country].filter(Boolean)
            if (parts.length > 0) {
              location = parts.join(', ')
            }
          }

          if (!location) {
            location = 'Location not specified'
          }

          // Get property types as string
          const propertyTypesText = development.property_types && development.property_types.length > 0
            ? development.property_types.map(pt => pt.name).join(', ')
            : 'Various types'

          // Parse developer profile image
          let developerImageUrl = null
          if (development.developer?.profile_image) {
            try {
              if (typeof development.developer.profile_image === 'string') {
                const parsed = JSON.parse(development.developer.profile_image)
                developerImageUrl = parsed?.url || parsed || null
              } else if (typeof development.developer.profile_image === 'object') {
                developerImageUrl = development.developer.profile_image?.url || development.developer.profile_image || null
              }
              if (developerImageUrl && !developerImageUrl.startsWith('http')) {
                developerImageUrl = null
              }
            } catch (e) {
              if (development.developer.profile_image.startsWith('http')) {
                developerImageUrl = development.developer.profile_image
              }
            }
          }

          // Use banner or fallback image
          const bannerImage = development.banner_url || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.1.0'

          return (
            <SwiperSlide key={development.id}>
              <Link href={`/home/allDevelopments/${development.slug}`}>
                <div className="relative h-96 w-full overflow-hidden hover:scale-105 transition-transform duration-300 cursor-pointer">
                  <img
                    src={bannerImage}
                    alt={development.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.1.0'
                    }}
                  />
                  {/* Gradient overlay from bottom to top */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent"></div>
                  
                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-8">
                    <div className="flex items-end gap-6">
                      {/* Developer Image/Icon */}
                      <div className="flex-shrink-0">
                        {developerImageUrl ? (
                          <img
                            src={developerImageUrl}
                            alt={development.developer?.name || 'Developer'}
                            className="w-24 h-24 rounded-md object-cover border-4 border-white/50 shadow-lg"
                            onError={(e) => {
                              e.target.style.display = 'none'
                              e.target.nextElementSibling.style.display = 'flex'
                            }}
                          />
                        ) : null}
                        <div 
                          className={`w-24 h-24 rounded-md border-4 border-white/50 shadow-lg bg-primary_color/80 flex items-center justify-center ${developerImageUrl ? 'hidden' : ''}`}
                        >
                          <Building2 className="w-12 h-12 text-white" />
                        </div>
                      </div>
                      
                      {/* Development Info */}
                      <div className="flex-1 text-white">
                        <h3 className="text-3xl font-bold mb-2 !text-white">
                          {development.title}
                        </h3>
                        
                        {/* Developer Name */}
                        {development.developer?.name && (
                          <p className="text-lg opacity-90 !text-white mb-2 flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            {development.developer.name}
                          </p>
                        )}

                        {/* Location */}
                        <p className="text-base opacity-85 !text-white mb-4 flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          {location}
                        </p>

                        {/* Stats */}
                        <div className="flex flex-wrap items-center gap-6 text-sm">
                          {/* Status */}
                          <div className="flex items-center gap-2">
                            <span className="opacity-75">Status:</span>
                            <span className="font-semibold bg-primary_color/30 px-3 py-1 rounded-full">
                              {development.status || 'N/A'}
                            </span>
                          </div>

                          {/* Total Units */}
                          <div>
                            <span className="opacity-75">Units: </span>
                            <span className="font-semibold">{development.total_units || 0}</span>
                          </div>

                          {/* Property Types */}
                          {development.property_types && development.property_types.length > 0 && (
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="opacity-75">Types:</span>
                              <div className="flex flex-wrap gap-1">
                                {development.property_types.slice(0, 3).map((type, idx) => (
                                  <span
                                    key={idx}
                                    className="bg-white/20 backdrop-blur-sm px-2 py-1 rounded text-xs font-medium"
                                  >
                                    {type.name}
                                  </span>
                                ))}
                                {development.property_types.length > 3 && (
                                  <span className="bg-white/20 backdrop-blur-sm px-2 py-1 rounded text-xs font-medium">
                                    +{development.property_types.length - 3}
                                  </span>
                                )}
                              </div>
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
