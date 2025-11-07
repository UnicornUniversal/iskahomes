'use client'

import React from 'react'
import { MapPin, Clock, Star, Navigation } from 'lucide-react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation as SwiperNavigation, Pagination, Autoplay } from 'swiper/modules'

// Import Swiper styles
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

// Amenity type configuration
const amenityTypes = {
  schools: { name: 'Schools', icon: '🎓', color: 'from-blue-500 to-blue-600' },
  hospitals: { name: 'Hospitals', icon: '🏥', color: 'from-red-500 to-red-600' },
  airports: { name: 'Airports', icon: '✈️', color: 'from-purple-500 to-purple-600' },
  parks: { name: 'Parks', icon: '🌳', color: 'from-green-500 to-green-600' },
  shops: { name: 'Shops & Markets', icon: '🛍️', color: 'from-orange-500 to-orange-600' },
  police: { name: 'Police Stations', icon: '🚔', color: 'from-indigo-500 to-indigo-600' }
}

// Individual amenity card component
const AmenityCard = ({ amenity, type }) => {
  const amenityType = amenityTypes[type] || { name: type, icon: '📍', color: 'from-gray-500 to-gray-600' }
  
  // Get image URL - prioritize database_url, then photoUrl, then photos array
  const imageUrl = amenity.database_url || amenity.photoUrl || (amenity.photos && amenity.photos[0]?.url) || null

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden h-full flex flex-col">
      {/* Image Section */}
      {imageUrl ? (
        <div className="relative h-48 w-full overflow-hidden">
          <img
            src={imageUrl}
            alt={amenity.name || 'Amenity'}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to placeholder if image fails to load
              e.target.src = `https://via.placeholder.com/400x300?text=${encodeURIComponent(amenity.name || 'Amenity')}`
            }}
          />
          {/* Distance Badge */}
          {amenity.distance && (
            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold text-gray-900">
              {amenity.distance} km
            </div>
          )}
        </div>
      ) : (
        <div className={`h-48 w-full bg-gradient-to-br ${amenityType.color} flex items-center justify-center`}>
          <span className="text-6xl">{amenityType.icon}</span>
        </div>
      )}

      {/* Content Section */}
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h4 className="text-lg font-bold text-gray-900 mb-1 line-clamp-2">
              {amenity.name || 'Unknown'}
            </h4>
            {amenity.address && (
              <div className="flex items-start text-sm text-gray-600 mb-2">
                <MapPin className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" />
                <span className="line-clamp-2">{amenity.address}</span>
              </div>
            )}
          </div>
        </div>

        {/* Rating and Details */}
        <div className="mt-auto space-y-2">
          {amenity.rating && (
            <div className="flex items-center text-sm">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 mr-1" />
              <span className="font-semibold text-gray-900">{amenity.rating}</span>
              {amenity.user_ratings_total && (
                <span className="text-gray-600 ml-1">
                  ({amenity.user_ratings_total} reviews)
                </span>
              )}
            </div>
          )}

          {/* Distance and Travel Time */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            {amenity.distance && (
              <div className="flex items-center">
                <Navigation className="w-4 h-4 mr-1" />
                <span>{amenity.distance} km away</span>
              </div>
            )}
            {amenity.travelTime && (
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                <span>~{amenity.travelTime} min</span>
              </div>
            )}
          </div>

          {/* Additional Info */}
          {amenity.openNow !== undefined && (
            <div className="text-sm">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                amenity.openNow 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {amenity.openNow ? 'Open Now' : 'Closed'}
              </span>
            </div>
          )}
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
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="flex items-center mb-8">
        <MapPin className="w-6 h-6 text-blue-600 mr-3" />
        <h3 className="text-2xl font-bold text-gray-900">Nearby Amenities</h3>
        {city && (
          <span className="ml-4 text-gray-600 text-sm">
            in {city}{state ? `, ${state}` : ''}
          </span>
        )}
      </div>

      {/* Render each amenity type as its own section */}
      <div className="space-y-10">
        {categoriesWithAmenities.map((category) => {
          const amenities = socialAmenities[category]
          const amenityType = amenityTypes[category]
          
          if (!Array.isArray(amenities) || amenities.length === 0) {
            return null
          }

          return (
            <div key={category} className="amenity-type-section">
              {/* Section Header */}
              <div className="flex items-center mb-4">
                <span className="text-3xl mr-3">{amenityType.icon}</span>
                <h4 className="text-xl font-bold text-gray-900">{amenityType.name}</h4>
                <span className="ml-3 text-sm text-gray-500">
                  ({amenities.length} {amenities.length === 1 ? 'amenity' : 'amenities'})
                </span>
              </div>

              {/* Swiper Carousel for this category */}
              <Swiper
                modules={[SwiperNavigation, Pagination, Autoplay]}
                spaceBetween={20}
                slidesPerView={1}
                breakpoints={{
                  640: {
                    slidesPerView: 2,
                    spaceBetween: 20,
                  },
                  768: {
                    slidesPerView: 3,
                    spaceBetween: 24,
                  },
                  1024: {
                    slidesPerView: 4,
                    spaceBetween: 24,
                  },
                }}
                navigation={true}
                pagination={{
                  clickable: true,
                  dynamicBullets: true,
                }}
                autoplay={{
                  delay: 4000,
                  disableOnInteraction: false,
                }}
                className={`nearby-amenities-swiper-${category}`}
              >
                {amenities.map((amenity, index) => (
                  <SwiperSlide key={amenity.id || `${category}-${index}`}>
                    <AmenityCard amenity={amenity} type={category} />
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          )
        })}
      </div>

      {/* Custom Swiper Styles */}
      <style jsx global>{`
        .nearby-amenities-swiper-schools .swiper-button-next,
        .nearby-amenities-swiper-schools .swiper-button-prev,
        .nearby-amenities-swiper-hospitals .swiper-button-next,
        .nearby-amenities-swiper-hospitals .swiper-button-prev,
        .nearby-amenities-swiper-airports .swiper-button-next,
        .nearby-amenities-swiper-airports .swiper-button-prev,
        .nearby-amenities-swiper-parks .swiper-button-next,
        .nearby-amenities-swiper-parks .swiper-button-prev,
        .nearby-amenities-swiper-shops .swiper-button-next,
        .nearby-amenities-swiper-shops .swiper-button-prev,
        .nearby-amenities-swiper-police .swiper-button-next,
        .nearby-amenities-swiper-police .swiper-button-prev {
          color: #3b82f6;
          background: white;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }
        .nearby-amenities-swiper-schools .swiper-button-next:after,
        .nearby-amenities-swiper-schools .swiper-button-prev:after,
        .nearby-amenities-swiper-hospitals .swiper-button-next:after,
        .nearby-amenities-swiper-hospitals .swiper-button-prev:after,
        .nearby-amenities-swiper-airports .swiper-button-next:after,
        .nearby-amenities-swiper-airports .swiper-button-prev:after,
        .nearby-amenities-swiper-parks .swiper-button-next:after,
        .nearby-amenities-swiper-parks .swiper-button-prev:after,
        .nearby-amenities-swiper-shops .swiper-button-next:after,
        .nearby-amenities-swiper-shops .swiper-button-prev:after,
        .nearby-amenities-swiper-police .swiper-button-next:after,
        .nearby-amenities-swiper-police .swiper-button-prev:after {
          font-size: 18px;
        }
        .nearby-amenities-swiper-schools .swiper-pagination-bullet,
        .nearby-amenities-swiper-hospitals .swiper-pagination-bullet,
        .nearby-amenities-swiper-airports .swiper-pagination-bullet,
        .nearby-amenities-swiper-parks .swiper-pagination-bullet,
        .nearby-amenities-swiper-shops .swiper-pagination-bullet,
        .nearby-amenities-swiper-police .swiper-pagination-bullet {
          background: #3b82f6;
        }
        .nearby-amenities-swiper-schools .swiper-pagination-bullet-active,
        .nearby-amenities-swiper-hospitals .swiper-pagination-bullet-active,
        .nearby-amenities-swiper-airports .swiper-pagination-bullet-active,
        .nearby-amenities-swiper-parks .swiper-pagination-bullet-active,
        .nearby-amenities-swiper-shops .swiper-pagination-bullet-active,
        .nearby-amenities-swiper-police .swiper-pagination-bullet-active {
          background: #2563eb;
        }
      `}</style>
    </div>
  )
}

export default NearbyAmenities
