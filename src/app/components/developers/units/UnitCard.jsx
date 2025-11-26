"use client"
import React from 'react'
import { useRouter } from 'next/navigation'
import { Heart, MapPin, Bed, Bath, Car, Square } from 'lucide-react'

const UnitCard = ({ unit, developerSlug }) => {
  const router = useRouter()

  const formatPrice = (price, currency = 'GHS') => {
    const numPrice = parseFloat(price)
    if (numPrice >= 1000000) {
      return `${currency} ${(numPrice / 1000000).toFixed(1)}M`
    } else if (numPrice >= 1000) {
      return `${currency} ${(numPrice / 1000).toFixed(0)}K`
    }
    return `${currency} ${numPrice}`
  }

  // Get cover image from media albums (new structure)
  const getCoverImage = () => {
    // Check if media.albums exists and has images
    if (unit.media?.albums && Array.isArray(unit.media.albums)) {
      // Loop through albums to find the first image
      for (const album of unit.media.albums) {
        if (album?.images && Array.isArray(album.images) && album.images.length > 0) {
          // Return the first image URL from the first album with images
          return album.images[0].url || null
        }
      }
    }
    // Fallback: Check for old mediaFiles structure (backward compatibility)
    if (unit.media?.mediaFiles && unit.media.mediaFiles.length > 0) {
      return unit.media.mediaFiles[0].url
    }
    return null
  }

  const coverImage = getCoverImage()

  const getPurposeColor = (priceType) => {
    switch (priceType?.toLowerCase()) {
      case 'buy':
      case 'sale':
        return 'bg-green-100 text-green-800'
      case 'rent':
        return 'bg-blue-100 text-blue-800'
      case 'lease':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 -800'
    }
  }

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'available':
        return 'bg-green-100 text-green-800'
      case 'rented out':
        return 'bg-red-100 text-red-800'
      case 'sold':
        return 'bg-gray-100 -800'
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  const handleCardClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Navigate to single unit page with developer context
    // Always use ID for the route - the page will handle it
    const slug = developerSlug || 'default'
    const unitId = unit.id
    
    if (!unitId) {
      console.error('Unit ID is missing:', unit)
      return
    }
    
    console.log('Navigating to unit:', { slug, unitId, unit })
    router.push(`/developer/${slug}/units/${unitId}`)
  }

  return (
    <div 
      className=" bg-white/70 backdrop-blur-sm   duration-300 cursor-pointer border border-gray-200"
      onClick={handleCardClick}
    >
      {/* Image Section */}
      <div className="relative h-48 text-primary_color overflow-hidden -t-lg">
        {coverImage ? (
          <img 
            src={coverImage} 
            alt={unit.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <div className="text-center -500">
              <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <p className="text-sm">No Image</p>
            </div>
          </div>
        )}
        <div className="absolute top-3 left-3">
          <span className={`px-2 py-1 -full text-xs font-medium ${getPurposeColor(unit.pricing?.price_type || unit.price_type)}`}>
            {unit.pricing?.price_type || unit.price_type || 'rent'}
          </span>
        </div>
        <div className="absolute top-3 right-3">
          <span className={`px-2 py-1 -full text-xs font-medium ${getStatusColor(unit.status)}`}>
            {unit.status}
          </span>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4">
        {/* Unit Title */}
        <div className="mb-3">
          <h3 className="font-semibold text-lg -900">{unit.title}</h3>
        </div>

        {/* Location Info */}
        <div className="mb-2">
          <div className="flex items-center text-sm -600 mb-1">
            <MapPin className="w-3 h-3 mr-1" />
            <span>{unit.city}, {unit.state}</span>
          </div>
          <p className="text-xs -500">
            {unit.town}
          </p>
        </div>

        {/* Price */}
        <div className="mb-3">
          <p className="text-2xl font-bold -900">
            {formatPrice(
              unit.pricing?.price || unit.price, 
              unit.pricing?.currency || unit.currency
            )}
            <span className="text-sm font-normal -600 ml-1">
              {(unit.pricing?.price_type || unit.price_type) === 'rent' 
                ? `/${unit.pricing?.duration || unit.duration || 'month'}` 
                : ''}
            </span>
          </p>
        </div>

        {/* Property Details */}
        {unit.specifications && (
          <div className="flex items-center justify-between mb-3 text-sm -600">
            {unit.specifications.bedrooms && (
              <div className="flex items-center">
                <Bed className="w-4 h-4 mr-1" />
                <span>{unit.specifications.bedrooms} bed</span>
              </div>
            )}
            {unit.specifications.bathrooms && (
              <div className="flex items-center">
                <Bath className="w-4 h-4 mr-1" />
                <span>{unit.specifications.bathrooms} bath</span>
              </div>
            )}
            {unit.specifications.kitchen && (
              <div className="flex items-center">
                <Square className="w-4 h-4 mr-1" />
                <span>{unit.specifications.kitchen} kitchen</span>
              </div>
            )}
            {unit.specifications.floor_level && (
              <div className="flex items-center">
                <span>Floor {unit.specifications.floor_level}</span>
              </div>
            )}
          </div>
        )}

        {/* Amenities */}
        {(() => {
          // Handle both new (inbuilt) and old (general) structures
          const amenities = unit.amenities || {}
          const inbuiltAmenities = amenities.inbuilt || []
          const generalAmenities = amenities.general || [] // backward compatibility
          const allAmenities = [...inbuiltAmenities, ...generalAmenities]
          
          if (allAmenities.length > 0) {
            return (
              <div className="mb-3">
                <div className="flex flex-wrap gap-1">
                  {allAmenities.slice(0, 3).map((amenity, index) => (
                    <span 
                      key={index}
                      className="px-2 py-1 bg-gray-100 -700 text-xs -full"
                    >
                      {typeof amenity === 'string' ? amenity.replace(/-/g, ' ') : amenity}
                    </span>
                  ))}
                  {allAmenities.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 -700 text-xs -full">
                      +{allAmenities.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            )
          }
          return null
        })()}

        {/* Property Type */}
        {/* <div className="flex items-center justify-between">
          <span className="text-xs -500 capitalize">
            {unit.listing_type} • {unit.property_status}
          </span>
        </div> */}
      </div>
    </div>
  )
}

export default UnitCard
