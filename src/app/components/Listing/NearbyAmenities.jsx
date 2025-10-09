'use client'

import React, { useState, useEffect } from 'react'
import { MapPin, Clock, Loader2 } from 'lucide-react'

// Individual amenity component
const AmenityCard = ({ amenityType, location, latitude, longitude }) => {
  const [amenities, setAmenities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Get location string based on hierarchy: coordinates → town → city
  const getLocationString = () => {
    if (latitude && longitude) {
      return `${latitude},${longitude}`
    }
    
    if (location.town) {
      return location.town
    }
    
    if (location.city) {
      return location.city
    }
    
    return null
  }

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371 // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return Math.round(R * c * 100) / 100 // Round to 2 decimal places
  }

  // Fetch amenities for this specific type
  const fetchAmenities = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const locationString = getLocationString()
      if (!locationString) {
        setError('No location available')
        return
      }
      
      // Use Nominatim API for OpenStreetMap data
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(amenityType.searchTerm)} near ${encodeURIComponent(locationString)}&` +
        `format=json&` +
        `limit=5&` +
        `addressdetails=1&` +
        `extratags=1`
      )
      
      if (!response.ok) {
        throw new Error('Failed to fetch amenities')
      }
      
      const data = await response.json()
      
      // Process and enhance the data
      const processedAmenities = data.map((amenity) => {
        let distance = null
        let travelTime = null
        
        // Calculate distance and travel time if we have coordinates
        if (latitude && longitude && amenity.lat && amenity.lon) {
          distance = calculateDistance(
            parseFloat(latitude),
            parseFloat(longitude),
            parseFloat(amenity.lat),
            parseFloat(amenity.lon)
          )
          
          // Estimate travel time (assuming average speed of 30 km/h in city)
          travelTime = Math.round((distance / 30) * 60) // in minutes
        }
        
        return {
          name: amenity.display_name.split(',')[0] || amenity.name || 'Unknown',
          address: amenity.display_name,
          lat: amenity.lat,
          lon: amenity.lon,
          distance: distance,
          travelTime: travelTime,
          type: amenity.type,
          category: amenity.category
        }
      })
      
      setAmenities(processedAmenities)
      
    } catch (err) {
      console.error(`Error fetching ${amenityType.name}:`, err)
      setError(`Failed to load ${amenityType.name.toLowerCase()}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAmenities()
  }, [latitude, longitude, location.town, location.city])

  const locationString = getLocationString()
  if (!locationString) {
    return null
  }

  return (
    <div className="bg-gray-50 rounded-xl p-6">
      <div className="flex items-center mb-4">
        <span className="text-2xl mr-3">{amenityType.icon}</span>
        <h4 className="text-lg font-semibold text-gray-900">
          {amenityType.name} Near {location.town || location.city || 'Location'}
        </h4>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-blue-600 mr-2" />
          <span className="text-gray-600">Loading...</span>
        </div>
      ) : error ? (
        <div className="text-center py-4">
          <p className="text-red-500 text-sm">{error}</p>
        </div>
      ) : amenities.length > 0 ? (
        <div className="space-y-3">
          {amenities.map((amenity, index) => (
            <div key={index} className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h5 className="font-medium text-gray-900 text-sm line-clamp-1">
                    {amenity.name}
                  </h5>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                    {amenity.address}
                  </p>
                </div>
                <div className="ml-3 flex-shrink-0">
                  {amenity.distance && (
                    <div className="text-right">
                      <div className="flex items-center text-xs text-gray-600 mb-1">
                        <MapPin className="w-3 h-3 mr-1" />
                        {amenity.distance} km
                      </div>
                      {amenity.travelTime && (
                        <div className="flex items-center text-xs text-gray-600">
                          <Clock className="w-3 h-3 mr-1" />
                          {amenity.travelTime} min
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-gray-500 text-sm">No {amenityType.name.toLowerCase()} found nearby</p>
        </div>
      )}
    </div>
  )
}

// Main component that renders all amenity cards
const NearbyAmenities = ({ latitude, longitude, town, city, state, country }) => {
  const amenityTypes = [
    { key: 'hospitals', name: 'Hospitals', icon: '🏥', searchTerm: 'hospital' },
    { key: 'schools', name: 'Schools', icon: '🎓', searchTerm: 'school' },
    { key: 'shopping', name: 'Shopping Centers', icon: '🛍️', searchTerm: 'shopping mall' },
    { key: 'parks', name: 'Parks', icon: '🌳', searchTerm: 'park' },
    { key: 'restaurants', name: 'Restaurants', icon: '🍽️', searchTerm: 'restaurant' }
  ]

  // Location hierarchy: coordinates → town → city
  const location = {
    town: town,
    city: city,
    state: state,
    country: country
  }

  // Check if we have any location data
  const hasLocation = latitude && longitude || town || city

  if (!hasLocation) {
    return null
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="flex items-center mb-6">
        <MapPin className="w-6 h-6 text-blue-600 mr-3" />
        <h3 className="text-2xl font-bold text-gray-900">Nearby Amenities</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {amenityTypes.map((amenityType) => (
          <AmenityCard
            key={amenityType.key}
            amenityType={amenityType}
            location={location}
            latitude={latitude}
            longitude={longitude}
          />
        ))}
      </div>
      
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-center text-blue-800 text-sm">
          <MapPin className="w-4 h-4 mr-2" />
          <span>
            Showing amenities near {latitude && longitude ? 'your location' : `${town || city || 'this area'}`}
          </span>
        </div>
      </div>
    </div>
  )
}

export default NearbyAmenities