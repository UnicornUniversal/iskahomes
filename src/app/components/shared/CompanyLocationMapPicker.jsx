"use client"
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import dynamic from 'next/dynamic'
import { Wrapper } from '@googlemaps/react-wrapper'
import countryToCurrency from 'country-to-currency'
import {
  GoogleMapsFailureSync,
  hasGoogleMapsDomError,
  installGoogleMapsFailureDetection,
  subscribeToGoogleMapsFailure,
} from '@/lib/googleMapsFailure'
import {
  parseNominatimForCompanyLocation,
  reverseGeocodeNominatimForCompanyLocation,
  searchNominatim,
} from '@/lib/nominatim'

const MapComponent = dynamic(
  () => import('@/app/components/propertyManagement/modules/MapComponent'),
  {
    ssr: false,
    loading: () => (
      <div className="h-full min-h-[200px] bg-gray-100 rounded-lg flex items-center justify-center">
        Loading map...
      </div>
    ),
  }
)

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API

const GoogleMapViewer = React.memo(({ center, zoom, coordinates, onMapClick, onGoogleMapsError }) => {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markerRef = useRef(null)
  const isInitializedRef = useRef(false)
  const listenersRef = useRef([])

  const cleanup = useCallback(() => {
    listenersRef.current.forEach((listener) => {
      if (listener?.remove) listener.remove()
    })
    listenersRef.current = []

    if (markerRef.current) {
      markerRef.current.setMap(null)
      markerRef.current = null
    }

    mapInstanceRef.current = null
    isInitializedRef.current = false
  }, [])

  const handleMapClick = useCallback((e) => {
    onMapClick?.(e.latLng.lat(), e.latLng.lng())
  }, [onMapClick])

  const handleMarkerDrag = useCallback((e) => {
    onMapClick?.(e.latLng.lat(), e.latLng.lng())
  }, [onMapClick])

  useEffect(() => {
    if (!mapRef.current || isInitializedRef.current || !window.google?.maps) return

    const newMap = new window.google.maps.Map(mapRef.current, {
      center: { lat: center[0], lng: center[1] },
      zoom,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
    })

    const clickListener = newMap.addListener('click', handleMapClick)
    listenersRef.current.push(clickListener)

    mapInstanceRef.current = newMap
    isInitializedRef.current = true

    return cleanup
  }, [center, zoom, handleMapClick, cleanup])

  useEffect(() => {
    if (!mapInstanceRef.current || !isInitializedRef.current) return

    const currentCenter = mapInstanceRef.current.getCenter()
    const currentZoom = mapInstanceRef.current.getZoom()

    if (
      !currentCenter ||
      Math.abs(currentCenter.lat() - center[0]) > 0.0001 ||
      Math.abs(currentCenter.lng() - center[1]) > 0.0001 ||
      currentZoom !== zoom
    ) {
      mapInstanceRef.current.setCenter({ lat: center[0], lng: center[1] })
      mapInstanceRef.current.setZoom(zoom)
    }
  }, [center, zoom])

  useEffect(() => {
    if (!mapInstanceRef.current || !coordinates) return

    const [lat, lng] = Array.isArray(coordinates) ? coordinates : [coordinates[0], coordinates[1]]
    const latNum = parseFloat(lat)
    const lngNum = parseFloat(lng)

    if (Number.isNaN(latNum) || Number.isNaN(lngNum)) return

    const shouldUpdateMarker =
      !markerRef.current ||
      Math.abs(markerRef.current.getPosition().lat() - latNum) > 0.0001 ||
      Math.abs(markerRef.current.getPosition().lng() - lngNum) > 0.0001

    if (!shouldUpdateMarker) return

    if (markerRef.current) {
      markerRef.current.setMap(null)
    }

    const newMarker = new window.google.maps.Marker({
      position: { lat: latNum, lng: lngNum },
      map: mapInstanceRef.current,
      title: 'Location',
      draggable: true,
    })

    const dragListener = newMarker.addListener('dragend', handleMarkerDrag)
    listenersRef.current.push(dragListener)
    markerRef.current = newMarker
  }, [coordinates, handleMarkerDrag])

  useEffect(() => {
    if (!mapRef.current || !onGoogleMapsError) return

    const reportError = () => onGoogleMapsError()

    if (hasGoogleMapsDomError(mapRef.current)) {
      reportError()
      return undefined
    }

    const observer = new MutationObserver(() => {
      if (hasGoogleMapsDomError(mapRef.current)) {
        reportError()
        observer.disconnect()
      }
    })

    observer.observe(mapRef.current, { childList: true, subtree: true, characterData: true })

    const intervalId = window.setInterval(() => {
      if (hasGoogleMapsDomError(mapRef.current)) {
        reportError()
        window.clearInterval(intervalId)
      }
    }, 500)

    const timeoutId = window.setTimeout(() => window.clearInterval(intervalId), 10000)

    return () => {
      observer.disconnect()
      window.clearInterval(intervalId)
      window.clearTimeout(timeoutId)
    }
  }, [onGoogleMapsError])

  return <div ref={mapRef} className="w-full h-full" />
})

GoogleMapViewer.displayName = 'GoogleMapViewer'

const applyCurrencyToLocation = (location, supportedCurrencies) => {
  let autoCurrency = 'GHS'
  let autoCurrencyName = 'Ghanaian Cedi'

  if (location.countryCode && countryToCurrency[location.countryCode]) {
    autoCurrency = countryToCurrency[location.countryCode]
    const currencyInfo = supportedCurrencies.find((currency) => currency.code === autoCurrency)
    if (currencyInfo) {
      autoCurrencyName = currencyInfo.name
    }
  }

  const { countryCode, ...rest } = location

  return {
    ...rest,
    currency: autoCurrency,
    currency_name: autoCurrencyName,
  }
}

const parseAddressComponents = (addressComponents) => {
  const get = (type, returnShort = false) => {
    const comp = addressComponents?.find((component) => component.types?.includes(type))
    if (!comp) return ''
    return returnShort ? comp.short_name : comp.long_name
  }

  const country = get('country')
  const countryCode = get('country', true)
  const region = get('administrative_area_level_1') || get('administrative_area_level_2')
  const city = get('locality') || get('sublocality') || get('postal_town')

  return { country, countryCode, region, city }
}

export default function CompanyLocationMapPicker({
  searchQuery,
  onSearchQueryChange,
  mapCenter,
  mapZoom,
  onMapViewChange,
  latitude,
  longitude,
  onLocationChange,
  supportedCurrencies = [],
}) {
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false)
  const [useOsmFallback, setUseOsmFallback] = useState(!GOOGLE_MAPS_API_KEY)
  const [osmSuggestions, setOsmSuggestions] = useState([])
  const [showOsmSuggestions, setShowOsmSuggestions] = useState(false)
  const [isOsmSearching, setIsOsmSearching] = useState(false)
  const [osmMapMounted, setOsmMapMounted] = useState(false)
  const [googleSuggestions, setGoogleSuggestions] = useState([])

  const autocompleteServiceRef = useRef(null)
  const placesServiceRef = useRef(null)
  const googleAutocompleteTimerRef = useRef(null)
  const osmSearchTimeoutRef = useRef(null)

  const mapOptions = useMemo(
    () => ({
      apiKey: GOOGLE_MAPS_API_KEY,
      libraries: ['places'],
    }),
    []
  )

  const coordinates =
    latitude !== 0 && longitude !== 0 ? [latitude, longitude] : null

  const osmCoordinates =
    latitude !== 0 && longitude !== 0
      ? { latitude: latitude.toString(), longitude: longitude.toString() }
      : null

  const handleGoogleMapsFailure = useCallback(() => {
    setUseOsmFallback(true)
  }, [])

  useEffect(() => {
    installGoogleMapsFailureDetection()
  }, [])

  useEffect(() => subscribeToGoogleMapsFailure(handleGoogleMapsFailure), [handleGoogleMapsFailure])

  useEffect(() => {
    if (!useOsmFallback) {
      setOsmMapMounted(false)
      return undefined
    }

    const timeoutId = window.setTimeout(() => setOsmMapMounted(true), 100)
    return () => {
      window.clearTimeout(timeoutId)
      setOsmMapMounted(false)
    }
  }, [useOsmFallback])

  useEffect(() => {
    if (useOsmFallback) return

    const initializePlacesServices = () => {
      if (useOsmFallback) return

      if (window.google && window.google.maps && window.google.maps.places) {
        try {
          autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService()
          placesServiceRef.current = new window.google.maps.places.PlacesService(document.createElement('div'))
          setIsGoogleMapsLoaded(true)
        } catch (error) {
          console.error('Failed initializing Google Places:', error)
          handleGoogleMapsFailure()
        }
      } else {
        // Retry after a short delay if Places API isn't loaded yet
        setTimeout(initializePlacesServices, 100)
      }
    }

    initializePlacesServices()
  }, [useOsmFallback, handleGoogleMapsFailure])

  useEffect(() => () => {
    if (googleAutocompleteTimerRef.current) clearTimeout(googleAutocompleteTimerRef.current)
    if (osmSearchTimeoutRef.current) clearTimeout(osmSearchTimeoutRef.current)
  }, [])

  const updateMapView = useCallback((center, zoom) => {
    onMapViewChange?.(center, zoom)
  }, [onMapViewChange])

  const emitLocationChange = useCallback((location) => {
    onLocationChange?.(applyCurrencyToLocation(location, supportedCurrencies))
  }, [onLocationChange, supportedCurrencies])

  const handleGooglePlaceInputChange = useCallback((value) => {
    onSearchQueryChange?.(value)

    if (!isGoogleMapsLoaded || !autocompleteServiceRef.current) return

    if (googleAutocompleteTimerRef.current) {
      clearTimeout(googleAutocompleteTimerRef.current)
    }

    googleAutocompleteTimerRef.current = setTimeout(() => {
      try {
        autocompleteServiceRef.current.getPlacePredictions({ input: value }, (predictions, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            setGoogleSuggestions(predictions.slice(0, 6))
          } else {
            setGoogleSuggestions([])
          }
        })
      } catch (error) {
        console.error('Autocomplete error:', error)
        setGoogleSuggestions([])
      }
    }, 250)
  }, [isGoogleMapsLoaded, onSearchQueryChange])

  const handleGoogleSuggestionClick = useCallback((prediction) => {
    if (!placesServiceRef.current) return

    try {
      placesServiceRef.current.getDetails(
        { placeId: prediction.place_id, fields: ['address_components', 'formatted_address', 'geometry'] },
        (place, status) => {
          if (status !== window.google.maps.places.PlacesServiceStatus.OK || !place) return

          const lat = place.geometry?.location?.lat?.()
          const lng = place.geometry?.location?.lng?.()
          const { country, countryCode, region, city } = parseAddressComponents(place.address_components)
          const newLat = typeof lat === 'number' ? lat : 0
          const newLng = typeof lng === 'number' ? lng : 0

          emitLocationChange({
            place_id: prediction.place_id,
            description: prediction.description || place.formatted_address || '',
            address: place.formatted_address || '',
            country: country || '',
            countryCode: countryCode || '',
            region: region || '',
            city: city || '',
            latitude: newLat,
            longitude: newLng,
          })

          onSearchQueryChange?.(prediction.description || place.formatted_address || '')
          setGoogleSuggestions([])

          if (newLat !== 0 && newLng !== 0) {
            updateMapView([newLat, newLng], 15)
          }
        }
      )
    } catch (error) {
      console.error('Places details error:', error)
    }
  }, [emitLocationChange, onSearchQueryChange, updateMapView])

  const handleOsmAutocompleteSearch = useCallback(async (query) => {
    if (!query.trim()) {
      setOsmSuggestions([])
      setShowOsmSuggestions(false)
      return
    }

    setIsOsmSearching(true)
    try {
      const results = await searchNominatim(query)
      setOsmSuggestions(results)
      setShowOsmSuggestions(results.length > 0)
    } catch (error) {
      console.error('Error searching OpenStreetMap:', error)
      setOsmSuggestions([])
      setShowOsmSuggestions(false)
    } finally {
      setIsOsmSearching(false)
    }
  }, [])

  const handleOsmSuggestionSelect = useCallback((result) => {
    const parsed = parseNominatimForCompanyLocation(result)

    emitLocationChange(parsed)
    onSearchQueryChange?.(result.display_name || '')
    setShowOsmSuggestions(false)
    setOsmSuggestions([])

    if (parsed.latitude !== 0 && parsed.longitude !== 0) {
      updateMapView([parsed.latitude, parsed.longitude], 15)
    }
  }, [emitLocationChange, onSearchQueryChange, updateMapView])

  const handleOsmInputChange = useCallback((value) => {
    onSearchQueryChange?.(value)

    if (osmSearchTimeoutRef.current) {
      clearTimeout(osmSearchTimeoutRef.current)
    }

    osmSearchTimeoutRef.current = setTimeout(() => {
      handleOsmAutocompleteSearch(value)
    }, 400)
  }, [handleOsmAutocompleteSearch, onSearchQueryChange])

  const handleMapClick = useCallback(async (lat, lng) => {
    if (useOsmFallback) {
      try {
        const geocoded = await reverseGeocodeNominatimForCompanyLocation(lat, lng)
        if (geocoded) {
          emitLocationChange({
            ...geocoded,
            latitude: lat,
            longitude: lng,
          })
          onSearchQueryChange?.(geocoded.address || geocoded.description || '')
        } else {
          emitLocationChange({
            place_id: '',
            description: '',
            address: '',
            country: '',
            countryCode: '',
            region: '',
            city: '',
            latitude: lat,
            longitude: lng,
          })
        }
      } catch (error) {
        console.error('Error reverse geocoding with OpenStreetMap:', error)
        emitLocationChange({
          place_id: '',
          description: '',
          address: '',
          country: '',
          countryCode: '',
          region: '',
          city: '',
          latitude: lat,
          longitude: lng,
        })
      }
    } else {
      emitLocationChange({
        place_id: '',
        description: '',
        address: '',
        country: '',
        countryCode: '',
        region: '',
        city: '',
        latitude: lat,
        longitude: lng,
      })
    }

    updateMapView([lat, lng], 15)
  }, [emitLocationChange, onSearchQueryChange, updateMapView, useOsmFallback])

  const renderOsmMap = () => {
    if (!osmMapMounted) {
      return (
        <div className="h-full min-h-[200px] bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-gray-500">Loading map...</div>
        </div>
      )
    }

    return (
      <MapComponent
        center={mapCenter}
        zoom={mapZoom}
        onMapClick={handleMapClick}
        coordinates={osmCoordinates}
      />
    )
  }

  const renderSearchField = () => {
    if (useOsmFallback) {
      return (
        <div className="relative">
          <div className="text-xs text-orange-700 mb-2">
            Google Maps unavailable. Location search powered by OpenStreetMap.
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleOsmInputChange(e.target.value)}
            onFocus={() => {
              if (osmSuggestions.length > 0) setShowOsmSuggestions(true)
            }}
            onBlur={() => {
              setTimeout(() => setShowOsmSuggestions(false), 200)
            }}
            placeholder="e.g., East Legon, Accra, Ghana"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary_color focus:border-transparent transition-all duration-200"
          />

          {showOsmSuggestions && osmSuggestions.length > 0 && (
            <div className="absolute z-20 w-full mt-1 border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto bg-white">
              {osmSuggestions.map((result) => (
                <button
                  key={result.place_id}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => handleOsmSuggestionSelect(result)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                >
                  <div className="font-medium truncate">{result.display_name}</div>
                </button>
              ))}
            </div>
          )}

          {isOsmSearching && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
              Searching...
            </div>
          )}
        </div>
      )
    }

    return (
      <Wrapper
        {...mapOptions}
        render={(status) => {
          if (status === 'LOADING') {
            return (
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => onSearchQueryChange?.(event.target.value)}
                  placeholder="e.g., East Legon, Accra, Ghana"
                  disabled
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                  Loading...
                </div>
              </div>
            )
          }

          if (status === 'FAILURE') {
            return (
              <>
                <GoogleMapsFailureSync failed onFailure={handleGoogleMapsFailure} />
                <div className="relative">
                  <div className="text-xs text-orange-700 mb-2">
                    Google Maps unavailable. Using OpenStreetMap for search.
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(event) => handleOsmInputChange(event.target.value)}
                    placeholder="e.g., East Legon, Accra, Ghana"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary_color focus:border-transparent transition-all duration-200"
                  />
                </div>
              </>
            )
          }

          return (
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => handleGooglePlaceInputChange(event.target.value)}
                placeholder={isGoogleMapsLoaded ? 'Type an address or area' : 'Loading location services...'}
                disabled={!isGoogleMapsLoaded}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary_color focus:border-transparent transition-all duration-200 disabled:opacity-60"
              />

              {isGoogleMapsLoaded && searchQuery && googleSuggestions.length > 0 && (
                <div className="absolute z-20 w-full mt-1 border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto bg-white">
                  {googleSuggestions.map((prediction) => (
                    <button
                      key={prediction.place_id}
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => handleGoogleSuggestionClick(prediction)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium">
                        {prediction.structured_formatting?.main_text || prediction.description}
                      </div>
                      <div className="text-sm text-gray-600">
                        {prediction.structured_formatting?.secondary_text || ''}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        }}
      />
    )
  }

  const renderInteractiveMap = () => {
    if (useOsmFallback) {
      return (
        <div className="h-full flex flex-col">
          <div className="text-xs p-2 bg-orange-50 shrink-0 text-orange-800">
            Google Maps unavailable. Using OpenStreetMap.
          </div>
          <div className="flex-1 min-h-0">{renderOsmMap()}</div>
        </div>
      )
    }

    return (
      <Wrapper
        {...mapOptions}
        render={(status) => {
          if (status === 'LOADING') {
            return (
              <div className="h-full bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2" />
                  <p className="text-gray-600">Loading Google Maps...</p>
                </div>
              </div>
            )
          }

          if (status === 'FAILURE') {
            return (
              <>
                <GoogleMapsFailureSync failed onFailure={handleGoogleMapsFailure} />
                <div className="h-full bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-gray-500">Loading map...</div>
                </div>
              </>
            )
          }

          return (
            <GoogleMapViewer
              center={mapCenter}
              zoom={mapZoom}
              coordinates={coordinates}
              onMapClick={handleMapClick}
              onGoogleMapsError={handleGoogleMapsFailure}
            />
          )
        }}
      />
    )
  }

  return (
    <>
      <div>
        <label className="block font-medium mb-2">
          Search Location {useOsmFallback ? '(OpenStreetMap)' : '(Google Maps)'}
        </label>
        {renderSearchField()}
      </div>

      <div>
        <label className="block font-medium mb-2">
          Map Selector - Click on the map to set location
        </label>
        <p className="mb-3">
          Use the pin on the map or search above to select your location. You can also click directly on the map to set coordinates. Drag the marker to fine-tune the position.
        </p>
        <div className="h-96 rounded-lg overflow-hidden border border-gray-300">
          {renderInteractiveMap()}
        </div>
        {latitude !== 0 && longitude !== 0 && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <span>Current Location:</span>
              <span className="font-mono">
                {latitude.toFixed(6)}, {longitude.toFixed(6)}
              </span>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
