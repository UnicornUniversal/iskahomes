'use client'

import React, { useState, useEffect } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination, Autoplay } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import Link from 'next/link'

const DevelopmentHeaders = () => {
  const [featuredDevelopers, setFeaturedDevelopers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFeaturedDevelopers = async () => {
      try {
        const response = await fetch('/api/developers?limit=5&featured=true')
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
      <div className="w-full h-96  rounded-lg flex items-center justify-center">
        <div className="text-gray-500">Loading featured developers...</div>
      </div>
    )
  }

  if (featuredDevelopers.length === 0) {
    return (
      <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-gray-500">No featured developers available</div>
      </div>
    )
  }

  return (
    <div className="w-full mb-8 ">
      <div className="container mx-auto ">
        <h5 className=" font-medium mb-6 text-left">
          Featured Developers
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
        {featuredDevelopers.map((developer) => {
          // Parse profile image - handle both string and object formats
          let profileImageUrl = null
          if (developer.profile_image) {
            if (typeof developer.profile_image === 'string') {
              try {
                const parsed = JSON.parse(developer.profile_image)
                profileImageUrl = parsed?.url || parsed || null
              } catch (e) {
                // If it's already a URL string, use it directly
                if (developer.profile_image.startsWith('http')) {
                  profileImageUrl = developer.profile_image
                }
              }
            } else if (typeof developer.profile_image === 'object') {
              profileImageUrl = developer.profile_image?.url || developer.profile_image || null
            }
          }

          // Parse cover image - handle both string and object formats
          let coverImageUrl = null
          if (developer.cover_image) {
            if (typeof developer.cover_image === 'string') {
              try {
                const parsed = JSON.parse(developer.cover_image)
                coverImageUrl = parsed?.url || parsed || null
              } catch (e) {
                // If it's already a URL string, use it directly
                if (developer.cover_image.startsWith('http')) {
                  coverImageUrl = developer.cover_image
                }
              }
            } else if (typeof developer.cover_image === 'object') {
              coverImageUrl = developer.cover_image?.url || developer.cover_image || null
            }
          }

          // Get location from primary location in company_locations
          let location = null
          if (developer.company_locations) {
            try {
              let companyLocations = developer.company_locations
              if (typeof companyLocations === 'string') {
                companyLocations = JSON.parse(companyLocations)
              }
              
              if (Array.isArray(companyLocations) && companyLocations.length > 0) {
                // Find primary location
                const primaryLocation = companyLocations.find(loc => 
                  loc.primary_location === true || 
                  loc.primary_location === 'true' ||
                  loc.primary_location === 1
                )
                
                if (primaryLocation) {
                  const parts = [
                    primaryLocation.city, 
                    primaryLocation.region, 
                    primaryLocation.country
                  ].filter(Boolean)
                  if (parts.length > 0) {
                    location = parts.join(', ')
                  }
                }
              }
            } catch (e) {
              console.error('Error parsing company_locations:', e, developer.company_locations)
            }
          }

          // Fallback to direct city/region/country fields
          if (!location) {
            const parts = [developer.city, developer.region, developer.country].filter(Boolean)
            if (parts.length > 0) {
              location = parts.join(', ')
            }
          }

          // Final fallback
          if (!location) {
            location = 'Location not specified'
          }

          return (
            <SwiperSlide key={developer.id}>
              <Link href={`/home/allDevelopers/${developer.slug}`}>
                <div className="relative h-96 w-full overflow-hidden hover:scale-105 transition-transform duration-300 cursor-pointer">
                  <img
                    src={coverImageUrl}
                    alt={developer.name}
                    className="w-full h-full object-cover"
                  />
                  {/* Gradient overlay from bottom to top */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/5 to-transparent"></div>
                  
                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-8">
                    <div className="flex items-end gap-6">
                      {/* Profile Image */}
                      <div className="flex-shrink-0">
                        {profileImageUrl ? (
                          <img
                            src={profileImageUrl}
                            alt={developer.name}
                            className="w-24 h-24 rounded-md object-cover border-4 border-white/50 shadow-lg"
                            onError={(e) => {
                              console.error('Profile image failed to load:', profileImageUrl)
                              e.target.style.display = 'none'
                            }}
                          />
                        ) : (
                          <div className="w-24 h-24 rounded-full border-4 border-white/50 shadow-lg bg-white/20 flex items-center justify-center">
                            <span className="text-white text-2xl font-bold">
                              {developer.name?.charAt(0)?.toUpperCase() || 'D'}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Developer Info */}
                      <div className="flex-1 text-white">
                        <h3 className="text-3xl !text-white ">{developer.name}</h3>
                        <p className="text-lg opacity-90 !text-white ">{location}</p>
                        <div className="flex items-center gap-6 text-sm">
                          <div>
                            <span className="opacity-75">Total Units: </span>
                            <span className="font-semibold">{developer.total_units || 0}</span>
                          </div>
                          <div>
                            <span className="opacity-75">Total Developments: </span>
                            <span className="font-semibold">{developer.total_developments || 0}</span>
                          </div>
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

export default DevelopmentHeaders
