"use client"
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Input } from '../../ui/input'
import { Wrapper } from '@googlemaps/react-wrapper'
import dynamic from 'next/dynamic'

// Dynamically import the map component to avoid SSR issues (OpenStreetMap fallback)
const MapComponent = dynamic(() => import('./MapComponent'), { 
  ssr: false,
  loading: () => <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">Loading map...</div>
})

// Google Map Component - Memoized with proper cleanup
const GoogleMapViewer = React.memo(({ center, zoom, coordinates, onMapClick }) => {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markerRef = useRef(null)
  const isInitializedRef = useRef(false)
  const listenersRef = useRef([])

  // Cleanup function
  const cleanup = useCallback(() => {
    // Remove all listeners
    listenersRef.current.forEach(listener => {
      if (listener && listener.remove) {
        listener.remove()
      }
    })
    listenersRef.current = []

    // Remove marker
    if (markerRef.current) {
      markerRef.current.setMap(null)
      markerRef.current = null
    }

    // Clear map instance
    if (mapInstanceRef.current) {
      mapInstanceRef.current = null
    }
    
    isInitializedRef.current = false
  }, [])

  // Memoized handlers
  const handleMapClick = useCallback((e) => {
    onMapClick?.(e.latLng.lat(), e.latLng.lng())
  }, [onMapClick])

  const handleMarkerDrag = useCallback((e) => {
    onMapClick?.(e.latLng.lat(), e.latLng.lng())
  }, [onMapClick])

  // Initialize map only once
  useEffect(() => {
    if (!mapRef.current || isInitializedRef.current || !window.google?.maps) return

    const newMap = new window.google.maps.Map(mapRef.current, {
      center: { lat: center[0], lng: center[1] },
      zoom: zoom,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
    })

    // Add click listener
    const clickListener = newMap.addListener('click', handleMapClick)
    listenersRef.current.push(clickListener)

    mapInstanceRef.current = newMap
    isInitializedRef.current = true

    return cleanup
  }, [center, zoom, handleMapClick, cleanup])

  // Update map center and zoom only when they actually change
  useEffect(() => {
    if (mapInstanceRef.current && isInitializedRef.current) {
      const currentCenter = mapInstanceRef.current.getCenter()
      const currentZoom = mapInstanceRef.current.getZoom()
      
      // Only update if values are actually different
      if (!currentCenter || 
          Math.abs(currentCenter.lat() - center[0]) > 0.0001 || 
          Math.abs(currentCenter.lng() - center[1]) > 0.0001 ||
          currentZoom !== zoom) {
        mapInstanceRef.current.setCenter({ lat: center[0], lng: center[1] })
        mapInstanceRef.current.setZoom(zoom)
      }
    }
  }, [center, zoom])

  // Update marker only when coordinates actually change
  useEffect(() => {
    if (!mapInstanceRef.current || !coordinates?.latitude || !coordinates?.longitude) return

    const lat = parseFloat(coordinates.latitude)
    const lng = parseFloat(coordinates.longitude)

    if (isNaN(lat) || isNaN(lng)) return

    // Check if we need to update the marker
    const shouldUpdateMarker = !markerRef.current || 
      Math.abs(markerRef.current.getPosition().lat() - lat) > 0.0001 ||
      Math.abs(markerRef.current.getPosition().lng() - lng) > 0.0001

    if (shouldUpdateMarker) {
      // Remove old marker
      if (markerRef.current) {
        markerRef.current.setMap(null)
      }

      // Create new marker
      const newMarker = new window.google.maps.Marker({
        position: { lat, lng },
        map: mapInstanceRef.current,
        title: 'Property Location',
        draggable: true,
      })

      // Add drag listener
      const dragListener = newMarker.addListener('dragend', handleMarkerDrag)
      listenersRef.current.push(dragListener)

      markerRef.current = newMarker
    }
  }, [coordinates?.latitude, coordinates?.longitude, handleMarkerDrag])

  return <div ref={mapRef} className="w-full h-full" />
})

GoogleMapViewer.displayName = 'GoogleMapViewer'

const PropertyLocation = ({ formData, updateFormData, isEditMode, companyLocations = [] }) => {
  // Get unique countries from company_locations
  const availableCountries = useMemo(() => {
    const countries = new Set()
    companyLocations.forEach(loc => {
      if (loc.country) {
        countries.add(loc.country)
      }
    })
    return Array.from(countries).sort()
  }, [companyLocations])
  const [locationData, setLocationData] = useState({
    country: '',
    countryCode: '', // ISO country code for currency lookup
    state: '',
    city: '',
    town: '',
    fullAddress: '',
    coordinates: {
      latitude: '',
      longitude: ''
    },
    additionalInformation: ''
  })

  const [searchQuery, setSearchQuery] = useState('')
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false)
  const [mapCenter, setMapCenter] = useState([7.9465, -1.0232]) // Ghana coordinates
  const [mapZoom, setMapZoom] = useState(6) // Zoom level for Ghana
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [autocompleteService, setAutocompleteService] = useState(null)
  const [placesService, setPlacesService] = useState(null)
  
  // Refs to prevent circular updates
  const isUpdatingFromFormDataRef = useRef(false)
  const isUpdatingFromMapRef = useRef(false)
  const autocompleteTimeoutRef = useRef(null)
  const lastFormDataRef = useRef(null)
  const scheduleTimerRef = useRef(null)

  const scheduleParentUpdate = useCallback((nextLocation) => {
    // Avoid setState during render of child by deferring to task queue
    if (scheduleTimerRef.current) clearTimeout(scheduleTimerRef.current)
    scheduleTimerRef.current = setTimeout(() => {
      updateFormData({ location: nextLocation })
      scheduleTimerRef.current = null
    }, 0)
  }, [updateFormData])

  // Commented out GeoNames functionality
  // const [countries, setCountries] = useState([])
  // const [states, setStates] = useState([])
  // const [cities, setCities] = useState([])
  // const [towns, setTowns] = useState([])
  // const [loading, setLoading] = useState({
  //   countries: false,
  //   states: false,
  //   cities: false,
  //   towns: false
  // })

  // Google Maps API configuration - memoized to prevent re-renders
  const mapOptions = useMemo(() => ({
    apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API,
    libraries: ['places']
  }), [])

  // Initialize simple state from incoming formData.location - FIXED: Only update when formData.location actually changes
  useEffect(() => {
    const currentLocation = formData?.location
    const previousLocation = lastFormDataRef.current

    // Deep compare to prevent unnecessary updates
    if (JSON.stringify(currentLocation) === JSON.stringify(previousLocation)) {
      return
    }

    lastFormDataRef.current = currentLocation

    if (isUpdatingFromMapRef.current) {
      isUpdatingFromMapRef.current = false
      return
    }
    
    if (!currentLocation) return

    const newLocationData = {
      country: currentLocation.country || '',
      countryCode: currentLocation.countryCode || '', // ISO country code
      state: currentLocation.state || '',
      city: currentLocation.city || '',
      town: currentLocation.town || '',
      fullAddress: currentLocation.fullAddress || '',
      coordinates: {
        latitude: currentLocation.coordinates?.latitude || '',
        longitude: currentLocation.coordinates?.longitude || ''
      },
      additionalInformation: currentLocation.additionalInformation || ''
    }
    
    // Only update if data is actually different
    const hasChanged = JSON.stringify(locationData) !== JSON.stringify(newLocationData)
    if (hasChanged) {
      isUpdatingFromFormDataRef.current = true
      setLocationData(newLocationData)
      
      // Update map center if coordinates exist
      const lat = currentLocation.coordinates?.latitude
      const lng = currentLocation.coordinates?.longitude
      
      if (lat && lng) {
        const newCenter = [parseFloat(lat), parseFloat(lng)]
        setMapCenter(newCenter)
        setMapZoom(15)
      }
      
      setTimeout(() => {
        isUpdatingFromFormDataRef.current = false
      }, 100)
    }
  }, [formData?.location]) // Only depend on formData.location

  // Commented out GeoNames useEffect hooks
  // useEffect(() => {
  //   fetchCountries()
  // }, [])

  // useEffect(() => {
  //   if (locationData.country) {
  //     const selectedCountry = countries.find(c => c.name === locationData.country)
  //     if (selectedCountry?.geonameId) {
  //       fetchStates(selectedCountry.geonameId)
  //     }
  //   } else {
  //     setStates([])
  //     setCities([])
  //     setTowns([])
  //   }
  // }, [locationData.country, countries])

  // useEffect(() => {
  //   if (locationData.state) {
  //     const selectedState = states.find(s => s.name === locationData.state)
  //     if (selectedState?.geonameId) {
  //       fetchCities(selectedState.geonameId)
  //     }
  //   } else {
  //     setCities([])
  //     setTowns([])
  //   }
  // }, [locationData.state, states])

  // useEffect(() => {
  //   if (locationData.city) {
  //     const selectedCity = cities.find(c => c.name === locationData.city)
  //     if (selectedCity?.geonameId) {
  //       fetchTowns(selectedCity.geonameId)
  //     }
  //   } else {
  //     setTowns([])
  //   }
  // }, [locationData.city, cities])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autocompleteTimeoutRef.current) {
        clearTimeout(autocompleteTimeoutRef.current)
      }
    }
  }, [])

  // Commented out GeoNames API functions
  // const fetchCountries = async () => {
  //   setLoading(prev => ({ ...prev, countries: true }))
  //   try {
  //     const response = await fetch('http://api.geonames.org/countryInfoJSON?username=iskahomes')
  //     if (response.ok) {
  //       const data = await response.json()
  //       const countryList = data.geonames.map(country => ({
  //         name: country.countryName,
  //         code: country.countryCode,
  //         geonameId: country.geonameId
  //       })).sort((a, b) => a.name.localeCompare(b.name))
  //       setCountries(countryList)
  //     }
  //   } catch (error) {
  //     console.error('Error fetching countries:', error)
  //   } finally {
  //     setLoading(prev => ({ ...prev, countries: false }))
  //   }
  // }

  // Initialize Google Places services when Google Maps loads
  useEffect(() => {
    const initializePlacesServices = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        try {
          const autocomplete = new window.google.maps.places.AutocompleteService()
          const places = new window.google.maps.places.PlacesService(document.createElement('div'))
          setAutocompleteService(autocomplete)
          setPlacesService(places)
          setIsGoogleMapsLoaded(true)
        } catch (error) {
          console.error('Error initializing Google Places services:', error)
        }
      } else {
        // Retry after a short delay if Places API isn't loaded yet
        setTimeout(initializePlacesServices, 100)
      }
    }

    initializePlacesServices()
  }, [])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autocompleteTimeoutRef.current) {
        clearTimeout(autocompleteTimeoutRef.current)
      }
    }
  }, [])

  // Handle autocomplete search - memoized to prevent recreation
  const handleAutocompleteSearch = useCallback((query) => {
    if (!autocompleteService || !query.trim()) {
      setAutocompleteSuggestions([])
      setShowSuggestions(false)
      return
    }

    try {
      // Limit autocomplete to company_locations countries
      // Get country codes from company_locations if available
      const countryCodes = availableCountries.length > 0 
        ? availableCountries.map(c => {
            // Simple country code mapping
            const countryCodeMap = {
              'Ghana': 'gh',
              'United Kingdom': 'gb',
              'United States': 'us',
              'Nigeria': 'ng',
              'Kenya': 'ke',
              'South Africa': 'za'
            }
            return countryCodeMap[c] || (c ? c.substring(0, 2).toLowerCase() : null)
          }).filter(Boolean)
        : undefined // No restriction if no company locations
      
      // Simplified autocomplete search with better performance
      autocompleteService.getPlacePredictions(
        { 
          input: query,
          componentRestrictions: countryCodes && countryCodes.length > 0 ? { country: countryCodes } : undefined
        }, 
        (predictions, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            setAutocompleteSuggestions(predictions.slice(0, 5)) // Limit to 5 suggestions
            setShowSuggestions(true)
          } else {
            setAutocompleteSuggestions([])
            setShowSuggestions(false)
          }
        }
      )
    } catch (error) {
      console.error('❌ Error in autocomplete search:', error)
      setAutocompleteSuggestions([])
      setShowSuggestions(false)
    }
  }, [autocompleteService, availableCountries])

  // Google Places API functions - defined first to avoid circular dependency
  const handlePlaceSelect = useCallback((place) => {
    if (!place) return

    const addressComponents = place.address_components || []
    const geometry = place.geometry || {}
    const location = geometry.location

    // Extract address components
    let country = ''
    let countryCode = ''
    let state = ''
    let city = ''
    let town = ''

    addressComponents.forEach(component => {
      const types = component.types
      if (types.includes('country')) {
        country = component.long_name
        countryCode = component.short_name // ISO 3166-1 alpha-2 code (e.g., 'LV', 'GH', 'US')
      } else if (types.includes('administrative_area_level_1')) {
        state = component.long_name
      } else if (types.includes('locality')) {
        city = component.long_name
      } else if (types.includes('sublocality') || types.includes('neighborhood')) {
        town = component.long_name
      }
    })

    // If no city found, try administrative_area_level_2
    if (!city) {
      addressComponents.forEach(component => {
        if (component.types.includes('administrative_area_level_2')) {
          city = component.long_name
        }
      })
    }

    const newLocationData = {
      country,
      countryCode, // Store ISO country code for currency lookup
      state,
      city,
      town,
      fullAddress: place.formatted_address || '',
      coordinates: {
        latitude: location ? location.lat().toString() : '',
        longitude: location ? location.lng().toString() : ''
      },
      additionalInformation: locationData.additionalInformation
    }

    setLocationData(newLocationData)
    scheduleParentUpdate(newLocationData)

    // Update map center
    if (location) {
      const lat = location.lat()
      const lng = location.lng()
      const newCenter = [lat, lng]
      const currentCenter = mapCenter
      
      if (Math.abs(currentCenter[0] - newCenter[0]) > 0.0001 || Math.abs(currentCenter[1] - newCenter[1]) > 0.0001) {
        setMapCenter(newCenter)
        setMapZoom(15)
      }
    }
  }, [locationData.additionalInformation, scheduleParentUpdate, mapCenter])

  // Handle suggestion selection - memoized (defined after handlePlaceSelect)
  const handleSuggestionSelect = useCallback((prediction) => {
    if (!placesService) return

    try {
      const request = {
        placeId: prediction.place_id,
        fields: ['address_components', 'formatted_address', 'geometry']
      }

      placesService.getDetails(request, (place, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
          handlePlaceSelect(place)
          setSearchQuery(prediction.description)
          setShowSuggestions(false)
          setAutocompleteSuggestions([])
        } else {
          console.error('Error getting place details:', status)
        }
      })
    } catch (error) {
      console.error('Error in suggestion selection:', error)
    }
  }, [placesService, handlePlaceSelect])

  // Handle input change with debounced autocomplete
  const handleInputChange = useCallback((value) => {
    setSearchQuery(value)
    
    // Clear any existing timeout
    if (autocompleteTimeoutRef.current) {
      clearTimeout(autocompleteTimeoutRef.current)
    }
    
    // Debounce the autocomplete search
    autocompleteTimeoutRef.current = setTimeout(() => {
      handleAutocompleteSearch(value)
    }, 300)
  }, [handleAutocompleteSearch])

  // Handle input focus - memoized
  const handleInputFocus = useCallback(() => {
    if (autocompleteSuggestions.length > 0) {
      setShowSuggestions(true)
    }
  }, [autocompleteSuggestions.length])

  // Handle input blur (with delay to allow clicking on suggestions) - memoized
  const handleInputBlur = useCallback(() => {
    setTimeout(() => {
      setShowSuggestions(false)
    }, 200)
  }, [])

  const handleChange = useCallback((field, value) => {
    if (isUpdatingFromFormDataRef.current) return
    
    setLocationData(prev => {
      const next = { ...prev, [field]: value }
      updateFormData({ location: next })
      return next
    })
  }, [updateFormData])

  const handleCoordChange = useCallback((field, value) => {
    if (isUpdatingFromFormDataRef.current) return
    
    setLocationData(prev => {
      const next = {
        ...prev,
        coordinates: { ...prev.coordinates, [field]: value }
      }
      updateFormData({ location: next })
      
      // Update map center if both coordinates are provided and valid
      if (next.coordinates.latitude && next.coordinates.longitude) {
        const lat = parseFloat(next.coordinates.latitude)
        const lng = parseFloat(next.coordinates.longitude)
        
        if (!isNaN(lat) && !isNaN(lng)) {
          const newCenter = [lat, lng]
          const currentCenter = mapCenter
          if (Math.abs(currentCenter[0] - newCenter[0]) > 0.0001 || Math.abs(currentCenter[1] - newCenter[1]) > 0.0001) {
            setMapCenter(newCenter)
            setMapZoom(15)
          }
        }
      }
      
      return next
    })
  }, [updateFormData, mapCenter])

  const handleMapClick = useCallback((lat, lng) => {
    isUpdatingFromMapRef.current = true
    
    setLocationData(prev => {
      const next = {
        ...prev,
        coordinates: {
          latitude: lat.toString(),
          longitude: lng.toString()
        }
      }
      scheduleParentUpdate(next)
      return next
    })
    
    const newCenter = [lat, lng]
    const currentCenter = mapCenter
    if (Math.abs(currentCenter[0] - newCenter[0]) > 0.0001 || Math.abs(currentCenter[1] - newCenter[1]) > 0.0001) {
      setMapCenter(newCenter)
      setMapZoom(15)
    }
  }, [scheduleParentUpdate, mapCenter])

  return (
    <div className="p-4 sm:p-6 bg-white rounded-lg shadow-sm">
      <div className="mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Property Location</h2>
        <p className="text-sm sm:text-base text-gray-600">
          {isEditMode ? 'Update the location details' : 'Specify the location details of your property'}
        </p>
      </div>

      <div className="space-y-4 sm:space-y-6">
        {/* Google Places Autocomplete Search */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
          <label className="block text-sm font-medium text-blue-900 mb-2">
            Search Location
          </label>
          <p className="text-blue-700 text-sm mb-4">
            Start typing an address to see suggestions and automatically fill in location details
          </p>
          
          <Wrapper {...mapOptions} render={(status) => {
            if (status === 'LOADING') {
              return (
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="e.g., East Legon, Accra, Ghana"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                    disabled={true}
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                    Loading...
                  </div>
                </div>
              )
            }
            
            if (status === 'FAILURE') {
              return (
                <div className="text-red-600 text-sm">
                  Failed to load Google Maps. Please check your API key.
                </div>
              )
            }
            
            return (
              <div className="relative">
                <Input
                  type="text"
                  placeholder={isGoogleMapsLoaded ? "e.g., East Legon, Accra, Ghana" : "Loading location services..."}
                  value={searchQuery}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                  className="w-full"
                  disabled={!isGoogleMapsLoaded}
                />
                
                {/* Autocomplete Suggestions Dropdown */}
                {showSuggestions && autocompleteSuggestions.length > 0 && isGoogleMapsLoaded && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {autocompleteSuggestions.map((prediction, index) => (
                      <div
                        key={prediction.place_id}
                        className="px-4 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                        onClick={() => handleSuggestionSelect(prediction)}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 mt-1">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {prediction.structured_formatting?.main_text || prediction.description}
                            </p>
                            {prediction.structured_formatting?.secondary_text && (
                              <p className="text-xs text-gray-500 truncate">
                                {prediction.structured_formatting.secondary_text}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Loading indicator */}
                {!isGoogleMapsLoaded && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                    Loading...
                  </div>
                )}
              </div>
            )
          }} />
        </div>

        {/* Interactive Map - Right after search */}
        <div className="bg-gradient-to-r from-teal-50 to-cyan-50 p-4 rounded-lg border border-teal-200">
          <label className="block text-sm font-medium text-teal-900 mb-2">
            Interactive Map
          </label>
          <p className="text-teal-700 text-sm mb-4">
            Click or drag the marker on the map to set the exact location. Coordinates will update automatically.
          </p>
          
          <div className="h-96 rounded-lg overflow-hidden border border-teal-300">
            <Wrapper {...mapOptions} render={(status) => {
              if (status === 'LOADING') {
                return <div className="h-full bg-gray-100 rounded-lg flex items-center justify-center">Loading Google Maps...</div>
              }
              
              if (status === 'FAILURE') {
                // Fallback to OpenStreetMap if Google Maps fails
                return (
                  <div>
                    <div className="text-xs text-orange-600 p-2 bg-orange-50 mb-2 rounded">
                      Google Maps unavailable. Using OpenStreetMap as fallback.
                    </div>
                    <MapComponent
                      center={mapCenter}
                      zoom={mapZoom}
                      onMapClick={handleMapClick}
                      coordinates={locationData.coordinates}
                    />
                  </div>
                )
              }
              
              return (
                <GoogleMapViewer
                  center={mapCenter}
                  zoom={mapZoom}
                  coordinates={locationData.coordinates}
                  onMapClick={handleMapClick}
                />
              )
            }} />
          </div>
          
          {/* Display current coordinates */}
          {locationData.coordinates.latitude && locationData.coordinates.longitude && (
            <div className="mt-3 p-3 bg-white rounded-md border border-teal-200">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Current Location:</span>
                <span className="font-mono text-teal-700">
                  {parseFloat(locationData.coordinates.latitude).toFixed(6)}, {parseFloat(locationData.coordinates.longitude).toFixed(6)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Manual Location Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">Country</label>
            {availableCountries.length > 0 ? (
              <select
                suppressHydrationWarning
                id="country"
                value={locationData.country}
                onChange={(e) => handleChange('country', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Select country</option>
                {availableCountries.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            ) : (
              <Input
                id="country"
                type="text"
                placeholder="e.g., Ghana"
                value={locationData.country}
                onChange={(e) => handleChange('country', e.target.value)}
                className="w-full"
              />
            )}
          </div>
          <div>
            <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">State/Region</label>
            <Input
              id="state"
              type="text"
              placeholder="e.g., Greater Accra Region"
              value={locationData.state}
              onChange={(e) => handleChange('state', e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">City</label>
            <Input
              id="city"
              type="text"
              placeholder="e.g., Accra"
              value={locationData.city}
              onChange={(e) => handleChange('city', e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <label htmlFor="town" className="block text-sm font-medium text-gray-700 mb-2">Town/Area</label>
            <Input
              id="town"
              type="text"
              placeholder="e.g., East Legon"
              value={locationData.town}
              onChange={(e) => handleChange('town', e.target.value)}
              className="w-full"
            />
          </div>
        </div>

        {/* Address */}
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">Full Address</label>
          <textarea
            id="address"
            rows={3}
            placeholder="e.g., 123 Main Street, East Legon, Accra, Greater Accra Region, Ghana"
            value={locationData.fullAddress}
            onChange={(e) => handleChange('fullAddress', e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Coordinates - Manual Entry (Optional) */}
        <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-4 rounded-lg border border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">Manual Coordinates Entry</label>
          <p className="text-xs text-gray-500 mb-3">
            You can manually enter coordinates here, or use the map above to set them automatically
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="latitude" className="block text-xs text-gray-600 mb-1">Latitude</label>
              <Input
                id="latitude"
                type="number"
                step="any"
                placeholder="e.g., 6.47876"
                value={locationData.coordinates.latitude || ''}
                onChange={(e) => handleCoordChange('latitude', e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label htmlFor="longitude" className="block text-xs text-gray-600 mb-1">Longitude</label>
              <Input
                id="longitude"
                type="number"
                step="any"
                placeholder="e.g., -2.49259"
                value={locationData.coordinates.longitude || ''}
                onChange={(e) => handleCoordChange('longitude', e.target.value)}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div>
          <label htmlFor="additionalInformation" className="block text-sm font-medium text-gray-700 mb-2">Additional Location Information</label>
          <textarea
            id="additionalInformation"
            rows={4}
            placeholder="Any additional location details, landmarks, or directions..."
            value={locationData.additionalInformation}
            onChange={(e) => handleChange('additionalInformation', e.target.value)}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>
      </div>
    </div>
  )
}

export default React.memo(PropertyLocation)
