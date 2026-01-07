'use client'

import React from 'react'
import Link from 'next/link'
import { MapPin, Bed, Bath, Square } from 'lucide-react'
import { useAnalytics } from '@/hooks/useAnalytics'
import { getSpecificationDataByTypeId, getFieldDataByKey } from '@/app/components/Data/StaticData'

const ExplorePropertyCard = ({ listing }) => {
  const { trackPropertyView, trackListingImpression } = useAnalytics()

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
    types,
    city,
    state,
    country,
    slug,
    is_featured,
    is_verified,
    is_premium,
    purpose_name,
    status
  } = listing

  // Get the first media file as the main image
  const getMainImage = () => {
    if (media?.albums && Array.isArray(media.albums) && media.albums.length > 0) {
      for (const album of media.albums) {
        if (album?.images && Array.isArray(album.images) && album.images.length > 0) {
          return album.images[0].url
        }
      }
    }
    if (media?.mediaFiles && Array.isArray(media.mediaFiles) && media.mediaFiles.length > 0) {
      return media.mediaFiles[0].url
    }
    if (media?.banner?.url) {
      return media.banner.url
    }
    return null
  }
  
  const mainImage = getMainImage()

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

  // Parse specifications
  const getSpecifications = () => {
    if (!specifications) return { parsed: {}, fields: [] }
    
    let parsedSpecs = {}
    try {
      parsedSpecs = typeof specifications === 'string' 
        ? JSON.parse(specifications) 
        : specifications
    } catch (e) {
      return { parsed: {}, fields: [] }
    }

    let typeId = null
    try {
      const typesArray = typeof types === 'string' ? JSON.parse(types) : types
      if (Array.isArray(typesArray) && typesArray.length > 0) {
        typeId = typesArray[0]
      }
    } catch (e) {
      // Ignore
    }

    const specFields = typeId ? getSpecificationDataByTypeId(typeId) : null
    const fieldsToShow = []

    if (specFields && specFields.fields) {
      const commonFields = ['bedrooms', 'bathrooms', 'property_size', 'size']
      
      specFields.fields.forEach(field => {
        if (commonFields.includes(field.key) && parsedSpecs[field.key] !== undefined && parsedSpecs[field.key] !== null) {
          const fieldData = getFieldDataByKey(typeId, field.key)
          if (fieldData) {
            fieldsToShow.push({
              key: field.key,
              label: field.label,
              icon: field.icon,
              value: parsedSpecs[field.key],
              type: field.type
            })
          }
        }
      })
    }

    // Fallback to basic specs
    if (fieldsToShow.length === 0) {
      if (parsedSpecs.bedrooms !== undefined && parsedSpecs.bedrooms > 0) {
        fieldsToShow.push({
          key: 'bedrooms',
          label: 'Bedrooms',
          icon: Bed,
          value: parsedSpecs.bedrooms,
          type: 'number'
        })
      }
      if (parsedSpecs.bathrooms !== undefined && parsedSpecs.bathrooms > 0) {
        fieldsToShow.push({
          key: 'bathrooms',
          label: 'Bathrooms',
          icon: Bath,
          value: parsedSpecs.bathrooms,
          type: 'number'
        })
      }
      if (parsedSpecs.property_size !== undefined || parsedSpecs.size !== undefined) {
        fieldsToShow.push({
          key: 'size',
          label: 'Size',
          icon: Square,
          value: parsedSpecs.property_size || parsedSpecs.size,
          type: 'number'
        })
      }
    }

    return { parsed: parsedSpecs, fields: fieldsToShow }
  }

  const specs = getSpecifications()

  const handleCardClick = () => {
    trackPropertyView(id, {
      viewedFrom: 'explore',
      listingType: listing_type,
      listing: listing,
      propertyTitle: title,
      propertyPrice: price,
      propertyLocation: `${city}, ${state}`
    })

    trackListingImpression(id, {
      viewedFrom: 'explore',
      listingType: listing_type,
      listing: listing,
      propertyTitle: title,
      propertyPrice: price,
      propertyLocation: `${city}, ${state}`
    })
  }

  // Ensure we have all required fields for the URL
  if (!listing_type || !slug || !id) {
    console.warn('Missing required fields for property URL:', { listing_type, slug, id })
    return null
  }

  return (
    <Link href={`/home/property/${listing_type}/${slug}/${id}`} onClick={handleCardClick} className="block">
      <div className="bg-white rounded-lg border border-primary_color/10 overflow-hidden hover:shadow-lg transition-shadow duration-300">
        <div className="flex flex-row gap-4 p-4">
          {/* Image Section - Left */}
          <div className="relative flex-shrink-0 w-32 h-32 md:w-40 md:h-40 rounded-lg overflow-hidden">
            {mainImage ? (
              <img
                src={mainImage}
                alt={title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <div className="text-white text-xl font-bold">
                  {title?.charAt(0) || 'P'}
                </div>
              </div>
            )}
            
            {/* Badges - Overlay on image */}
            <div className="absolute top-2 left-2 flex flex-col gap-1">
              {is_featured && (
                <span className="bg-yellow-500 text-white px-1.5 py-0.5 rounded text-[10px] font-medium">
                  Featured
                </span>
              )}
              {is_verified && (
                <span className="bg-green-500 text-white px-1.5 py-0.5 rounded text-[10px] font-medium">
                  Verified
                </span>
              )}
              {is_premium && (
                <span className="bg-purple-500 text-white px-1.5 py-0.5 rounded text-[10px] font-medium">
                  Premium
                </span>
              )}
            </div>
          </div>

          {/* Content Section - Right */}
          <div className="flex-1 flex flex-col justify-between min-w-0">
            {/* Top Section */}
            <div className="flex-1">
              {/* Status and Purpose */}
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {status && (
                  <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${
                    status.toLowerCase() === 'available' 
                      ? 'bg-green-100 text-green-800'
                      : status.toLowerCase() === 'sold'
                      ? 'bg-red-100 text-red-800'
                      : status.toLowerCase() === 'rented'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {status}
                  </span>
                )}
                {purpose_name && (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-medium rounded-full">
                    {purpose_name}
                  </span>
                )}
              </div>

              {/* Title */}
              <h6 className="font-semibold text-sm md:text-base line-clamp-2 mb-2 text-primary_color">
                {title}
              </h6>

              {/* Location */}
              <div className="flex items-center text-primary_color text-xs mb-2">
                <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                <p className="line-clamp-1">
                  {city && state ? `${city}, ${state}` : country}
                </p>
              </div>

              {/* Price - Under location */}
              <div className="mb-3">
                <span className="text-sm md:text-base font-bold text-primary_color">
                  {formatPrice(price, currency, price_type, duration)}
                </span>
              </div>
            </div>

            {/* Bottom Section - Specifications */}
            <div className="flex items-center gap-3 text-xs text-primary_color flex-wrap">
              {specs.fields.map((field, index) => {
                const IconComponent = field.icon
                const displayValue = field.value

                if (displayValue === null || displayValue === undefined) {
                  return null
                }
                
                if ((field.key === 'bedrooms' || field.key === 'bathrooms') && displayValue === 0) {
                  return null
                }

                return (
                  <div key={field.key || index} className="flex items-center gap-1">
                    {IconComponent && <IconComponent className="w-3 h-3" />}
                    <span className="whitespace-nowrap">
                      {(field.type === 'number' && (field.key === 'size' || field.key === 'property_size'))
                        ? `${displayValue} ${listing_type === 'unit' ? 'sq ft' : 'sq m'}`
                        : displayValue
                      }
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default ExplorePropertyCard

