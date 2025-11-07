"use client"
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'

const DEBUG = false

const SocialAmenities = React.memo(({ formData, updateFormData, isEditMode }) => {
  const [amenities, setAmenities] = useState({
    schools: [],
    hospitals: [],
    airports: [],
    parks: [],
    shops: [],
    police: []
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [loadedOnce, setLoadedOnce] = useState(false)
  
  // Refs for debouncing and tracking
  const lastFetchedLocationRef = useRef(null)
  const fetchTimeoutRef = useRef(null)
  const isMountedRef = useRef(true)
  const inFlightRef = useRef(false)
  const lastKeyRef = useRef(null)
  const lastTimeRef = useRef(0)
  const MIN_INTERVAL_MS = 800
  // no slider/scroller; render as simple grid per category

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current)
      }
    }
  }, [])

  // Debounced fetch function
  const fetchNearbyAmenities = useCallback(async () => {
    console.log('🔍 SocialAmenities: fetchNearbyAmenities called')
    console.log('🔍 SocialAmenities: formData.location?.coordinates:', formData.location?.coordinates)
    
    if (!formData.location?.coordinates?.latitude || !formData.location?.coordinates?.longitude) {
      console.log('❌ SocialAmenities: Missing coordinates - not fetching amenities')
      return
    }

    const latRaw = formData.location.coordinates.latitude
    const lngRaw = formData.location.coordinates.longitude
    const lat = parseFloat(latRaw)
    const lng = parseFloat(lngRaw)
    const roundedLat = Math.round(lat * 1e5) / 1e5
    const roundedLng = Math.round(lng * 1e5) / 1e5
    console.log('🔎 SocialAmenities: coordinates to API', { latitude: latRaw, longitude: lngRaw, lat, lng, roundedLat, roundedLng })
    const currentKey = `${roundedLat},${roundedLng}`

    // Prevent duplicate/thrashy calls
    const now = Date.now()
    if (inFlightRef.current) {
      console.log('⏳ SocialAmenities: fetch already in flight; skipping')
      return
    }
    if (lastKeyRef.current === currentKey && now - lastTimeRef.current < MIN_INTERVAL_MS) {
      console.log('↩️ SocialAmenities: throttled duplicate for', currentKey)
      return
    }

    console.log('🚀 SocialAmenities: Fetching amenities for location:', currentKey)
    
    lastFetchedLocationRef.current = currentKey
    setLoading(true)
    setError(null)
    inFlightRef.current = true
    lastKeyRef.current = currentKey
    lastTimeRef.current = now
    
    try {
      const response = await fetch('/api/social-amenities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: roundedLat,
          longitude: roundedLng,
          radius: 10000
        })
      })

      // if (!isMountedRef.current) return

      if (response.ok) {
        const result = await response.json()
        console.log('✅ SocialAmenities: API response received. Sample counts:', Object.fromEntries(Object.entries(result.data || {}).map(([k,v]) => [k, Array.isArray(v) ? v.length : 0])))
        // Normalize to arrays for all expected keys
        const d = result?.data || {}
        const normalized = {
          schools: Array.isArray(d.schools) ? d.schools : [],
          hospitals: Array.isArray(d.hospitals) ? d.hospitals : [],
          airports: Array.isArray(d.airports) ? d.airports : [],
          parks: Array.isArray(d.parks) ? d.parks : [],
          shops: Array.isArray(d.shops) ? d.shops : [],
          police: Array.isArray(d.police) ? d.police : []
        }
        setAmenities(normalized)
        setLoadedOnce(true)
        
        // Save to formData so it's included in submission
        updateFormData({ social_amenities: normalized })
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to fetch amenities')
      }
    } catch (error) {
      if (isMountedRef.current) {
        setError('Network error while fetching amenities')
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
      inFlightRef.current = false
    }
  }, [formData.location?.coordinates?.latitude, formData.location?.coordinates?.longitude])

  // Fetch immediately when coordinates are set/changed
  useEffect(() => {
    console.log('🛰️ SocialAmenities: coordinates changed', formData.location?.coordinates)
    if (DEBUG) {
      console.log('🔍 SocialAmenities useEffect triggered')
      console.log('🔍 formData.location:', formData.location)
      console.log('🔍 coordinates check:', {
        latitude: formData.location?.coordinates?.latitude,
        longitude: formData.location?.coordinates?.longitude
      })
    }
    
    if (!formData.location?.coordinates?.latitude || !formData.location?.coordinates?.longitude) {
      if (DEBUG) console.log('❌ useEffect: Missing coordinates - not setting timeout')
      return
    }

    fetchNearbyAmenities()

    return () => {}
  }, [formData.location?.coordinates?.latitude, formData.location?.coordinates?.longitude, fetchNearbyAmenities])

  const handleRefresh = useCallback(() => {
    lastFetchedLocationRef.current = null // Force refresh
    fetchNearbyAmenities()
  }, [fetchNearbyAmenities])

  // Memoized helper functions
  const getAmenityName = useCallback((type) => {
    const names = {
      schools: 'Schools',
      hospitals: 'Hospitals',
      airports: 'Airports',
      parks: 'Parks',
      shops: 'Shops & Markets',
      police: 'Police Stations'
    }
    return names[type] || type
  }, [])

  const getAmenityIcon = useCallback((type) => {
    const icons = {
      schools: 'School',
      hospitals: 'Hospital',
      airports: 'Airport',
      parks: 'Park',
      shops: 'Shop',
      police: 'Police'
    }
    return icons[type] || 'Place'
  }, [])

  // Component to render individual amenity card
  const AmenityCard = React.memo(({ amenity }) => {
    return (
      <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden h-full">
        {/* Image Section: show first photo if available */}
        {amenity.database_url || (Array.isArray(amenity.photos) && amenity.photos.length > 0) || amenity.photoUrl ? (
          <div className="w-full h-48 rounded-t-lg overflow-hidden">
            <img
              src={amenity.database_url || amenity.photos?.[0]?.url || amenity.photoUrl || '/placeholder.png'}
              alt={amenity.name || 'Amenity'}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.onerror = null
                e.currentTarget.src = '/placeholder.png'
              }}
            />
          </div>
        ) : (
          <div className="w-full h-48 bg-gray-200 rounded-t-lg flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="text-2xl mb-2">📷</div>
              <p className="text-sm">No image</p>
            </div>
          </div>
        )}
        
        {/* Content Section */}
        <div className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-semibold text-gray-900 text-base line-clamp-2">{amenity.name}</h4>
            <div className="flex items-center space-x-2 ml-2">
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap">
                {amenity.distance || 0} km
              </span>
            </div>
          </div>
          
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{amenity.address}</p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {amenity.rating && amenity.rating > 0 && (
                <div className="flex items-center space-x-1">
                  <span className="text-yellow-500">⭐</span>
                  <span className="text-sm font-medium text-gray-700">{amenity.rating}</span>
                </div>
              )}
              
              {amenity.openNow !== null && amenity.openNow !== undefined && (
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  amenity.openNow 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {amenity.openNow ? 'Open' : 'Closed'}
                </span>
              )}
            </div>
            
            {amenity.priceLevel && (
              <div className="text-xs text-gray-500">
                {Array.from({ length: amenity.priceLevel }, (_, i) => '$').join('')}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  })

  AmenityCard.displayName = 'AmenityCard'

  const categoriesOrder = ['schools','hospitals','airports','parks','shops','police']
  const [expanded, setExpanded] = useState({
    schools: false,
    hospitals: false,
    airports: false,
    parks: false,
    shops: false,
    police: false
  })

  const toggleExpanded = useCallback((type) => {
    setExpanded(prev => ({ ...prev, [type]: !prev[type] }))
  }, [])

  const hasAnyData = useMemo(() => {
    return Object.values(amenities || {}).some(v => Array.isArray(v) && v.length > 0)
  }, [amenities])

  return (
    <>
      <style jsx global>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    <div className="p-4 sm:p-6 bg-white rounded-lg shadow-sm">
      <div className="mb-4 sm:mb-6">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Social Amenities</h2>
          {formData.location?.coordinates?.latitude && formData.location?.coordinates?.longitude && (
            <button
              onClick={handleRefresh}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Refresh
            </button>
          )}
        </div>
        <p className="text-sm sm:text-base text-gray-600">
          {isEditMode ? 'Nearby social amenities and facilities' : 'Discover nearby social amenities and facilities'}
        </p>
      </div>

      {!formData.location?.coordinates?.latitude ? (
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">Please set a location first to see nearby amenities</p>
        </div>
      ) : error ? (
        <div className="text-center py-8 text-red-600">
          <p className="text-sm">Error: {error}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {loading && !loadedOnce && (
            <div className="text-center py-8">
              <div className="text-blue-600">Loading amenities...</div>
            </div>
          )}
          {categoriesOrder.map((type) => {
            const amenityList = Array.isArray(amenities?.[type]) ? amenities[type] : []
            return (
            <div key={type} className="space-y-3">
              <button
                type="button"
                onClick={() => toggleExpanded(type)}
                className="w-full flex items-center justify-between py-2"
                aria-expanded={expanded[type] ? 'true' : 'false'}
              >
                <h3 className="text-lg font-bold" style={{ color: 'var(--primary_color)' }}>
                  {getAmenityName(type)} ({amenityList.length})
                </h3>
                <span className="text-gray-500 text-xl">{expanded[type] ? '▾' : '▸'}</span>
              </button>
              {expanded[type] && (
                amenityList.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {amenityList.map((amenity, index) => (
                      <AmenityCard key={amenity.id || index} amenity={amenity} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <div className="text-gray-400 text-4xl mb-2">🏥</div>
                    <p className="text-gray-500 text-sm">No {getAmenityName(type).toLowerCase()} found nearby</p>
                  </div>
                )
              )}
            </div>
            )
          })}
        </div>
      )}
    </div>
    </>
  )
})

SocialAmenities.displayName = 'SocialAmenities'

export default SocialAmenities
