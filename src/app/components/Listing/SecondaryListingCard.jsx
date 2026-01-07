'use client'

import React from 'react'
import Link from 'next/link'
import { MapPin, Bed, Bath, Square, Calendar, DollarSign, Users, Heart, Share2 } from 'lucide-react'
import { useAnalytics } from '@/hooks/useAnalytics'
import { toast } from 'react-toastify'
import { getSpecificationDataByTypeId, getFieldDataByKey } from '@/app/components/Data/StaticData'

const SecondaryListingCard = ({ listing, imageClasses = null }) => {
  const { trackPropertyView, trackListingImpression, trackSavedListing, trackShare } = useAnalytics()

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
    developers,
    available_from,
    is_featured,
    is_verified,
    is_premium,
    user_id,
    purpose_name,
    purpose_names,
    status
  } = listing

  // Get the first media file as the main image (supporting new albums structure)
  const getMainImage = () => {
    // Check for new albums structure
    if (media?.albums && Array.isArray(media.albums) && media.albums.length > 0) {
      for (const album of media.albums) {
        if (album?.images && Array.isArray(album.images) && album.images.length > 0) {
          return album.images[0].url
        }
      }
    }
    // Fallback to mediaFiles (backward compatibility)
    if (media?.mediaFiles && Array.isArray(media.mediaFiles) && media.mediaFiles.length > 0) {
      return media.mediaFiles[0].url
    }
    // Fallback to banner
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

  // Parse specifications and get field metadata
  const getSpecifications = () => {
    if (!specifications) return { parsed: {}, fields: [] }
    
    // Parse specifications JSON if it's a string
    let parsedSpecs = {}
    try {
      parsedSpecs = typeof specifications === 'string' 
        ? JSON.parse(specifications) 
        : specifications
    } catch (e) {
      console.error('Error parsing specifications:', e)
      return { parsed: {}, fields: [] }
    }

    // Get property type ID from types array
    let typeId = null
    try {
      const typesArray = typeof types === 'string' ? JSON.parse(types) : types
      if (Array.isArray(typesArray) && typesArray.length > 0) {
        typeId = typesArray[0]
      }
    } catch (e) {
      console.error('Error parsing types:', e)
    }

    // Get specification fields from StaticData based on type ID
    const specFields = typeId ? getSpecificationDataByTypeId(typeId) : null
    const fieldsToShow = []

    if (specFields && specFields.fields) {
      // Get common fields that are likely to be displayed
      const commonFields = ['bedrooms', 'bathrooms', 'property_size', 'size', 'floor_level', 'living_rooms']
      
      specFields.fields.forEach(field => {
        if (commonFields.includes(field.key) && parsedSpecs[field.key] !== undefined && parsedSpecs[field.key] !== null) {
          const fieldData = getFieldDataByKey(typeId, field.key)
          if (fieldData) {
            fieldsToShow.push({
              key: field.key,
              label: field.label,
              icon: field.icon,
              value: parsedSpecs[field.key],
              type: field.type,
              options: field.options || fieldData.options
            })
          }
        }
      })
    }

    // Fallback to basic specs if no type-specific fields found
    if (fieldsToShow.length === 0) {
      if (parsedSpecs.bedrooms !== undefined) {
        fieldsToShow.push({
          key: 'bedrooms',
          label: 'Bedrooms',
          icon: Bed,
          value: parsedSpecs.bedrooms,
          type: 'number'
        })
      }
      if (parsedSpecs.bathrooms !== undefined) {
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

  // Analytics tracking functions
  const handleCardClick = () => {
    trackPropertyView(id, {
      viewedFrom: 'homepage',
      listingType: listing_type,
      listing: listing, // Pass full listing object so lister_id can be extracted
      propertyTitle: title,
      propertyPrice: price,
      propertyLocation: `${city}, ${state}`
    })

    trackListingImpression(id, {
      viewedFrom: 'homepage',
      listingType: listing_type,
      listing: listing, // Pass full listing object so lister_id can be extracted
      propertyTitle: title,
      propertyPrice: price,
      propertyLocation: `${city}, ${state}`
    })
  }

  const handleSaveClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Track save action
    trackSavedListing(id, 'add', {
      viewedFrom: 'homepage',
      listingType: listing_type,
      listing: listing // Pass full listing object so lister_id can be extracted
    })
    
    toast.success('Property saved to favorites!')
  }

  const handleShareClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Track share action
    trackShare('listing', 'link', {
      listingId: id,
      viewedFrom: 'homepage',
      listingType: listing_type,
      listing: listing // Pass full listing object so lister_id can be extracted
    })
    
    // Copy link to clipboard
    const url = `${window.location.origin}/home/property/${listing_type}/${slug}/${id}`
    navigator.clipboard.writeText(url)
    toast.success('Link copied to clipboard!')
  }

  // Extract height classes from imageClasses, always use w-full for width
  const getImageClasses = () => {
    if (!imageClasses) return 'w-full h-[220px] md:h-[240px] lg:h-[260px]'
    
    // Extract only height classes (h-*) from the imageClasses string
    const classes = imageClasses.split(' ')
    const heightClasses = classes.filter(cls => cls.startsWith('h-'))
    
    // Always use w-full for width, combine with extracted height classes
    return heightClasses.length > 0 
      ? `w-full ${heightClasses.join(' ')}` 
      : 'w-full h-[220px] md:h-[240px] lg:h-[260px]'
  }

  // Ensure we have all required fields for the URL
  if (!listing_type || !slug || !id) {
    console.warn('Missing required fields for property URL:', { listing_type, slug, id })
    return null
  }

  return (
    <Link href={`/home/property/${listing_type}/${slug}/${id}`} onClick={handleCardClick} className="block">
      <div className="overflow-hidden transition-all mx-auto duration-300 transform hover:-translate-y-1 cursor-pointer group flex flex-col w-auto">
        {/* Image Section */}
        <div className={`relative overflow-hidden ${getImageClasses()}`}>
          {mainImage ? (
            <img
              src={mainImage}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover' }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center" style={{ width: '100%', height: '100%', minHeight: '200px' }}>
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

          {/* Action Buttons */}
          {/* <div className="absolute top-6 right-6 flex flex-col gap-2">
            <button
              onClick={handleSaveClick}
              className="bg-white/90 backdrop-blur-sm p-2 rounded-full hover:bg-white transition-colors"
              title="Save to favorites"
            >
              <Heart className="w-4 h-4 text-primary_color hover:text-red-500" />
            </button>
            <button
              onClick={handleShareClick}
              className="bg-white/90 backdrop-blur-sm p-2 rounded-full hover:bg-white transition-colors"
              title="Share property"
            >
              <Share2 className="w-4 h-4 text-primary_color hover:text-blue-500" />
            </button>
          </div> */}

          {/* Price Badge and purpose */}
          <div className="absolute bottom-4 left-4 flex flex-col gap-2 items-start">
            {purpose_name && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full whitespace-nowrap w-auto">
                {purpose_name}
              </span>
            )}
            <span className="text-sm bg-white/90 backdrop-blur-sm px-3 py-1  rounded-md font-bold text-primary_color w-auto">
              {formatPrice(price, currency, price_type, duration)}
            </span>
          </div>
        </div>

        {/* Content Section */}
        <div className="mt-4">
          {/* Title and Location */}
          <div className="mb-4">
            <div className="flex flex-col items-start justify-between ">
              <div className="flex flex-col gap-1 items-start">
              
                {status && (
                  <span className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
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
              </div>
              <h6 className=" font-medium line-clamp-2 flex-1">
                {title}
              </h6>
            </div>
            <div className="flex items-center text-primary_color text-sm">
              <MapPin className="w-4 h-4 mr-1" />
              <p className="line-clamp-1">
                {city && state ? `${city}, ${state}` : country}
              </p>
            </div>
          </div>

          {/* Description */}
          {/* <p className="text-primary_color text-sm mb-4 line-clamp-2">
            {description}
          </p> */}

          {/* Specifications */}
          <div className="flex items-center justify-between text-sm text-primary_color mb-4">
            <div className="flex items-center space-x-4 flex-wrap gap-2">
              {specs.fields.map((field, index) => {
                const IconComponent = field.icon
                const displayValue = field.type === 'select' 
                  ? (field.options?.find(opt => opt.value === field.value)?.label || field.value)
                  : field.value

                // Only show if value is meaningful (skip null/undefined, but allow 0 for some fields like floor_level)
                if (displayValue === null || displayValue === undefined) {
                  return null
                }
                
                // For bedrooms/bathrooms, don't show if 0
                if ((field.key === 'bedrooms' || field.key === 'bathrooms') && displayValue === 0) {
                  return null
                }

                return (
                  <div key={field.key || index} className="flex items-center">
                    {IconComponent && <IconComponent className="w-4 h-4 mr-1" />}
                    <span>
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

          {/* Additional Info */}
          {/* <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              <span>
                Available {available_from ? new Date(available_from).toLocaleDateString() : 'Now'}
              </span>
            </div>
            
         
            {listing_type === 'unit' && (
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-1" />
                <span className="line-clamp-1">Developer Unit</span>
              </div>
            )}
          </div> */}

          {/* Listing Type Badge */}
          {/* <div className="mt-4 pt-4 border-t border-gray-100">
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
              listing_type === 'unit' 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-green-100 text-green-800'
            }`}>
              {listing_type === 'unit' ? 'Unit' : 'Property'}
            </span>
          </div> */}
        </div>
      </div>
    </Link>
  )
}

export default SecondaryListingCard
