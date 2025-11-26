'use client'

import React from 'react'
import { MapPin, Clock, Star, Navigation, GraduationCap, Hospital, Plane, Trees, ShoppingBag, Shield } from 'lucide-react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation as SwiperNavigation, Pagination } from 'swiper/modules'

// Import Swiper styles
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

// Amenity type configuration with proper icons
const amenityTypes = {
  schools: { 
    name: 'Schools', 
    Icon: GraduationCap
  },
  hospitals: { 
    name: 'Hospitals', 
    Icon: Hospital
  },
  airports: { 
    name: 'Airports', 
    Icon: Plane
  },
  parks: { 
    name: 'Parks', 
    Icon: Trees
  },
  shops: { 
    name: 'Shops & Markets', 
    Icon: ShoppingBag
  },
  police: { 
    name: 'Police Stations', 
    Icon: Shield
  }
}

// Individual amenity card component
const AmenityCard = ({ amenity }) => {
  // Get image URL
  const imageUrl = amenity.database_url || amenity.photoUrl || (amenity.photos && amenity.photos[0]?.url) || null

  return (
    <div className="  overflow-hidden h-full flex flex-col hover:border-gray-300 transition-colors duration-200">
      {/* Image Section */}
      <div className="relative h-52 w-full overflow-hidden bg-gray-50">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={amenity.name || 'Amenity'}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none'
            }}
          />
        ) : (
          <div className="w-full h-full bg-gray-100" />
        )}
        
        {/* Distance Badge */}
        {amenity.distance && (
          <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-md text-xs font-medium text-gray-900">
            {amenity.distance} km
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-5 flex-1 flex flex-col">
        {/* Title */}
        <h4 className="text-base font-semibold text-gray-900 mb-2 line-clamp-2 leading-snug">
          {amenity.name || 'Unknown'}
        </h4>

        {/* Location */}
        {amenity.address && (
          <div className="flex items-start text-xs text-gray-500 mb-4">
            <MapPin className="w-3 h-3 mr-1.5 mt-0.5 flex-shrink-0" />
            <span className="line-clamp-2 leading-relaxed">{amenity.address}</span>
          </div>
        )}

        {/* Bottom Section */}
        <div className="mt-auto pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            {/* Distance */}
            {amenity.distance && (
              <div className="flex items-center text-xs text-gray-600">
                <Navigation className="w-3 h-3 mr-1.5" />
                <span>{amenity.distance} km</span>
              </div>
            )}

            {/* Status Badge */}
            {amenity.openNow !== undefined && (
              <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                amenity.openNow 
                  ? 'text-green-700 bg-green-50' 
                  : 'text-red-700 bg-red-50'
              }`}>
                {amenity.openNow ? 'Open Now' : 'Closed'}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Main component
const NearbyAmenities = ({ socialAmenities, city, state }) => {
  if (!socialAmenities) {
    return null
  }

  // Get all categories that have amenities
  const categoriesWithAmenities = Object.keys(amenityTypes).filter(category => {
    const amenities = socialAmenities[category]
    return Array.isArray(amenities) && amenities.length > 0
  })

  if (categoriesWithAmenities.length === 0) {
    return null
  }

  return (
    <div className="py-16">
      {/* Main Header */}
      <div className="mb-12">
        <h3 className="text-2xl font-light text-gray-900 mb-1">Nearby Amenities</h3>
        {city && (
          <p className="text-sm text-gray-500 font-light">
            in {city}{state ? `, ${state}` : ''}
          </p>
        )}
      </div>

      {/* Render each amenity type as its own section */}
      <div className="space-y-16">
        {categoriesWithAmenities.map((category) => {
          const amenities = socialAmenities[category]
          const amenityType = amenityTypes[category]
          
          if (!Array.isArray(amenities) || amenities.length === 0) {
            return null
          }

          const IconComponent = amenityType.Icon

          return (
            <div key={category} className="amenity-type-section">
              {/* Section Header */}
              <div className="flex items-center gap-3 mb-6">
                <IconComponent className="w-5 h-5 text-gray-400" />
                <h4 className="text-lg font-normal text-gray-900">{amenityType.name}</h4>
                <span className="text-sm text-gray-400 font-light">
                  ({amenities.length})
                </span>
              </div>

              {/* Swiper Carousel */}
              <div className="relative">
                <Swiper
                  modules={[SwiperNavigation, Pagination]}
                  spaceBetween={20}
                  slidesPerView={1.2}
                  breakpoints={{
                    640: {
                      slidesPerView: 2.2,
                      spaceBetween: 20,
                    },
                    768: {
                      slidesPerView: 3.2,
                      spaceBetween: 24,
                    },
                    // 1024: {
                    //   slidesPerView: 4.2,
                    //   spaceBetween: 24,
                    // },
                    // 1280: {
                    //   slidesPerView: 4.5,
                    //   spaceBetween: 24,
                    // },
                  }}
                  navigation={{
                    nextEl: `.swiper-button-next-${category}`,
                    prevEl: `.swiper-button-prev-${category}`,
                  }}
                  pagination={{
                    clickable: true,
                    dynamicBullets: true,
                    dynamicMainBullets: 2,
                  }}
                  className={`nearby-amenities-swiper-${category}`}
                >
                  {amenities.map((amenity, index) => (
                    <SwiperSlide key={amenity.id || `${category}-${index}`}>
                      <AmenityCard amenity={amenity} />
                    </SwiperSlide>
                  ))}
                </Swiper>

                {/* Custom Navigation Buttons */}
                <button
                  className={`swiper-button-prev-${category} absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6 z-10 bg-white border border-gray-200 rounded-full p-2 shadow-sm hover:shadow-md transition-all opacity-0 group-hover:opacity-100 hover:border-gray-300`}
                  aria-label="Previous"
                >
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  className={`swiper-button-next-${category} absolute right-0 top-1/2 -translate-y-1/2 translate-x-6 z-10 bg-white border border-gray-200 rounded-full p-2 shadow-sm hover:shadow-md transition-all opacity-0 group-hover:opacity-100 hover:border-gray-300`}
                  aria-label="Next"
                >
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Custom Swiper Styles */}
      <style jsx global>{`
        .nearby-amenities-swiper-schools,
        .nearby-amenities-swiper-hospitals,
        .nearby-amenities-swiper-airports,
        .nearby-amenities-swiper-parks,
        .nearby-amenities-swiper-shops,
        .nearby-amenities-swiper-police {
          padding-bottom: 32px;
        }

        .nearby-amenities-swiper-schools .swiper-pagination,
        .nearby-amenities-swiper-hospitals .swiper-pagination,
        .nearby-amenities-swiper-airports .swiper-pagination,
        .nearby-amenities-swiper-parks .swiper-pagination,
        .nearby-amenities-swiper-shops .swiper-pagination,
        .nearby-amenities-swiper-police .swiper-pagination {
          bottom: 0 !important;
        }

        .nearby-amenities-swiper-schools .swiper-pagination-bullet,
        .nearby-amenities-swiper-hospitals .swiper-pagination-bullet,
        .nearby-amenities-swiper-airports .swiper-pagination-bullet,
        .nearby-amenities-swiper-parks .swiper-pagination-bullet,
        .nearby-amenities-swiper-shops .swiper-pagination-bullet,
        .nearby-amenities-swiper-police .swiper-pagination-bullet {
          width: 6px;
          height: 6px;
          background: #e5e7eb;
          opacity: 1;
          transition: all 0.3s;
        }

        .nearby-amenities-swiper-schools .swiper-pagination-bullet-active,
        .nearby-amenities-swiper-hospitals .swiper-pagination-bullet-active,
        .nearby-amenities-swiper-airports .swiper-pagination-bullet-active,
        .nearby-amenities-swiper-parks .swiper-pagination-bullet-active,
        .nearby-amenities-swiper-shops .swiper-pagination-bullet-active,
        .nearby-amenities-swiper-police .swiper-pagination-bullet-active {
          background: #9ca3af;
          width: 20px;
          border-radius: 3px;
        }
      `}</style>
    </div>
  )
}

export default NearbyAmenities
