'use client'

import React from 'react'
import Link from 'next/link'
import { MapPin, Bed, Bath, Square, Calendar, DollarSign, Users } from 'lucide-react'

const ListingCard = ({ listing }) => {
  const {
    id,
    title,
    description,
    listing_type,
    price,
    currency,
    price_type,
    duration,
    media,
    specifications,
    city,
    state,
    country,
    slug,
    developers,
    available_from,
    is_featured,
    is_verified,
    is_premium
  } = listing

  // Get the first media file as the main image
  const mainImage = media?.mediaFiles?.[0]?.url || media?.banner?.url

  // Format price
  const formatPrice = (price, currency, priceType, duration) => {
    const priceNum = parseFloat(price)
    const formattedPrice = priceNum.toLocaleString()
    
    let priceText = `${currency} ${formattedPrice}`
    
    if (priceType === 'rent') {
      priceText += `/${duration}`
    }
    
    return priceText
  }

  // Get specifications based on listing type
  const getSpecifications = () => {
    if (!specifications) return {}
    
    if (listing_type === 'unit') {
      return {
        bedrooms: specifications.bedrooms || 0,
        bathrooms: specifications.bathrooms || 0,
        size: specifications.property_size || specifications.size || 0,
        floor: specifications.floor_level || 0,
        furnishing: specifications.furnishing || 'unfurnished'
      }
    } else {
      return {
        bedrooms: specifications.bedrooms || 0,
        bathrooms: specifications.bathrooms || 0,
        size: specifications.property_size || specifications.size || 0,
        floors: specifications.floors || 0,
        age: specifications.property_age || 'unknown'
      }
    }
  }

  const specs = getSpecifications()

  return (
    <Link href={`/property/${listing_type}/${slug}/${id}`}>
      <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group">
        {/* Image Section */}
        <div className="relative h-64 w-full overflow-hidden">
          {mainImage ? (
            <img
              src={mainImage}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <div className="text-white text-2xl font-bold">
                {title?.charAt(0) || 'P'}
              </div>
            </div>
          )}
          
          {/* Badges */}
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            {is_featured && (
              <span className="bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                Featured
              </span>
            )}
            {is_verified && (
              <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                Verified
              </span>
            )}
            {is_premium && (
              <span className="bg-purple-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                Premium
              </span>
            )}
          </div>

          {/* Price Badge */}
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
            <span className="text-sm font-bold text-gray-900">
              {formatPrice(price, currency, price_type, duration)}
            </span>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6">
          {/* Title and Location */}
          <div className="mb-4">
            <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
              {title}
            </h3>
            <div className="flex items-center text-gray-600 text-sm">
              <MapPin className="w-4 h-4 mr-1" />
              <span className="line-clamp-1">
                {city && state ? `${city}, ${state}` : country}
              </span>
            </div>
          </div>

          {/* Description */}
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {description}
          </p>

          {/* Specifications */}
          <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
            <div className="flex items-center space-x-4">
              {specs.bedrooms > 0 && (
                <div className="flex items-center">
                  <Bed className="w-4 h-4 mr-1" />
                  <span>{specs.bedrooms}</span>
                </div>
              )}
              {specs.bathrooms > 0 && (
                <div className="flex items-center">
                  <Bath className="w-4 h-4 mr-1" />
                  <span>{specs.bathrooms}</span>
                </div>
              )}
              {specs.size > 0 && (
                <div className="flex items-center">
                  <Square className="w-4 h-4 mr-1" />
                  <span>{specs.size} {listing_type === 'unit' ? 'sq ft' : 'sq m'}</span>
                </div>
              )}
            </div>
          </div>

          {/* Additional Info */}
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              <span>
                Available {available_from ? new Date(available_from).toLocaleDateString() : 'Now'}
              </span>
            </div>
            
            {/* Developer Info for Units */}
            {listing_type === 'unit' && (
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-1" />
                <span className="line-clamp-1">Developer Unit</span>
              </div>
            )}
          </div>

          {/* Listing Type Badge */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
              listing_type === 'unit' 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-green-100 text-green-800'
            }`}>
              {listing_type === 'unit' ? 'Unit' : 'Property'}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default ListingCard