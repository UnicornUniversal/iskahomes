"use client"
import React from 'react'
import { useRouter } from 'next/navigation'
import { Heart, MapPin, Bed, Bath, Car, Square } from 'lucide-react'

const PropertyCard = ({ unit, development }) => {
  const router = useRouter()

  const formatPrice = (price) => {
    if (price >= 1000000) {
      return `$${(price / 1000000).toFixed(1)}M`
    } else if (price >= 1000) {
      return `$${(price / 1000).toFixed(0)}K`
    }
    return `$${price}`
  }

  const getPurposeColor = (purpose) => {
    switch (purpose.toLowerCase()) {
      case 'buy':
        return 'bg-green-100 text-green-800'
      case 'rent':
        return 'bg-blue-100 text-blue-800'
      case 'lease':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'available':
        return 'bg-green-100 text-green-800'
      case 'rented out':
        return 'bg-red-100 text-red-800'
      case 'sold':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  const handleCardClick = () => {
    // Navigate to single unit page
    router.push(`/developer/${development?.developerId || 'default'}/units/${unit.id}`)
  }

  return (
    <div 
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer border border-gray-200"
      onClick={handleCardClick}
    >
      {/* Image Section */}
      <div className="relative h-48 overflow-hidden rounded-t-lg">
        <img 
          src={unit.projectImages[0]} 
          alt={unit.title}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-3 left-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPurposeColor(unit.categorization.purpose)}`}>
            {unit.categorization.purpose}
          </span>
        </div>
        <div className="absolute top-3 right-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(unit.status)}`}>
            {unit.status}
          </span>
        </div>
        {/* <button className="absolute top-3 right-12 p-1 bg-white rounded-full shadow-md hover:bg-gray-50">
          <Heart className="w-4 h-4 text-gray-600" />
        </button> */}
      </div>

      {/* Content Section */}
      <div className="p-4">
            {/* Unit Title and Number */}
            <div className="mb-3">
          <h3 className="font-semibold text-lg text-gray-900 mb-1">{unit.title}</h3>
          <p className="text-sm text-gray-600">Unit {unit.unitNumber}</p>
        </div>
        {/* Development Info */}
        <div className="mb-2">
          <div className="flex items-center text-sm text-gray-600 mb-1">
            <MapPin className="w-3 h-3 mr-1" />
            <span>{development?.title || 'Development'}</span>
          </div>
          <p className="text-xs text-gray-500">
            {development?.location?.neighborhood}, {development?.location?.city}
          </p>
        </div>

    

        {/* Price */}
        <div className="mb-3">
          <p className="text-2xl font-bold text-gray-900">
            {formatPrice(unit.price)}
            <span className="text-sm font-normal text-gray-600 ml-1">
              {unit.categorization.purpose === 'Rent' || unit.categorization.purpose === 'Lease' ? '/month' : ''}
            </span>
          </p>
        </div>

        {/* Property Details */}
        {/* <div className="flex items-center justify-between mb-3 text-sm text-gray-600">
          {unit.details.bedrooms && (
            <div className="flex items-center">
              <Bed className="w-4 h-4 mr-1" />
              <span>{unit.details.bedrooms} bed</span>
            </div>
          )}
          {unit.details.washrooms && (
            <div className="flex items-center">
              <Bath className="w-4 h-4 mr-1" />
              <span>{unit.details.washrooms} bath</span>
            </div>
          )}
          {unit.details.areaSqFt && (
            <div className="flex items-center">
              <Square className="w-4 h-4 mr-1" />
              <span>{unit.details.areaSqFt} sq ft</span>
            </div>
          )}
          {unit.details.floor && (
            <div className="flex items-center">
              <span>Floor {unit.details.floor}</span>
            </div>
          )}
        </div> */}

        {/* Amenities */}
        {/* <div className="mb-3">
          <div className="flex flex-wrap gap-1">
            {unit.amenities.slice(0, 3).map((amenity, index) => (
              <span 
                key={index}
                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
              >
                {amenity}
              </span>
            ))}
            {unit.amenities.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                +{unit.amenities.length - 3} more
              </span>
            )}
          </div>
        </div> */}

        {/* Description */}
        <p className="text-sm text-gray-600 line-clamp-2 mb-3 preserve-whitespace">
          {unit.description}
        </p>

        {/* Property Type */}
        {/* <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 capitalize">
            {unit.categorization.type} • {unit.categorization.sector}
          </span>
        </div> */}
      </div>
    </div>
  )
}

export default PropertyCard
