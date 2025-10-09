"use client"
import React, { useState, useEffect } from 'react'
import { Input } from '../../ui/input'
import dynamic from 'next/dynamic'

// Dynamically import the map component to avoid SSR issues
const MapComponent = dynamic(() => import('./MapComponent'), { 
  ssr: false,
  loading: () => <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">Loading map...</div>
})

const PropertyLocation = ({ formData, updateFormData, isEditMode }) => {
  const [locationData, setLocationData] = useState({
    country: '',
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

  const [countries, setCountries] = useState([])
  const [states, setStates] = useState([])
  const [cities, setCities] = useState([])
  const [towns, setTowns] = useState([])
  const [loading, setLoading] = useState({
    countries: false,
    states: false,
    cities: false,
    towns: false
  })
  const [mapCenter, setMapCenter] = useState([7.9465, -1.0232]) // Ghana coordinates
  const [mapZoom, setMapZoom] = useState(6) // Zoom level for Ghana

  // Initialize simple state from incoming formData.location
  useEffect(() => {
    const loc = formData?.location || {}
    setLocationData({
      country: loc.country || '',
      state: loc.state || '',
      city: loc.city || '',
      town: loc.town || '',
      fullAddress: loc.fullAddress || '',
      coordinates: {
        latitude: loc.coordinates?.latitude || '',
        longitude: loc.coordinates?.longitude || ''
      },
      additionalInformation: loc.additionalInformation || ''
    })
    
    // Set map center if coordinates exist
    const lat = loc.coordinates?.latitude || loc.latitude
    const lng = loc.coordinates?.longitude || loc.longitude
    
    if (lat && lng) {
      console.log('🗺️ Setting map center from coordinates:', lat, lng)
      setMapCenter([parseFloat(lat), parseFloat(lng)])
      setMapZoom(15)
    }
  }, [formData?.location])

  // Fetch countries on mount
  useEffect(() => {
    fetchCountries()
  }, [])

  // Fetch states when country changes
  useEffect(() => {
    if (locationData.country) {
      const selectedCountry = countries.find(c => c.name === locationData.country)
      if (selectedCountry?.geonameId) {
        fetchStates(selectedCountry.geonameId)
      }
    } else {
      setStates([])
      setCities([])
      setTowns([])
    }
  }, [locationData.country, countries])

  // Fetch cities when state changes
  useEffect(() => {
    if (locationData.state) {
      const selectedState = states.find(s => s.name === locationData.state)
      if (selectedState?.geonameId) {
        fetchCities(selectedState.geonameId)
      }
    } else {
      setCities([])
      setTowns([])
    }
  }, [locationData.state, states])

  // Fetch towns when city changes
  useEffect(() => {
    if (locationData.city) {
      const selectedCity = cities.find(c => c.name === locationData.city)
      if (selectedCity?.geonameId) {
        fetchTowns(selectedCity.geonameId)
      }
    } else {
      setTowns([])
    }
  }, [locationData.city, cities])

  // Debug log for current location data
  useEffect(() => {
    console.log('PropertyLocation - locationData:', locationData)
  }, [locationData])

  // Update map center when coordinates change
  useEffect(() => {
    if (locationData.coordinates.latitude && locationData.coordinates.longitude) {
      const lat = parseFloat(locationData.coordinates.latitude)
      const lng = parseFloat(locationData.coordinates.longitude)
      
      // Only update if coordinates are valid numbers
      if (!isNaN(lat) && !isNaN(lng)) {
        console.log('🗺️ Updating map center from coordinates change:', lat, lng)
        setMapCenter([lat, lng])
        setMapZoom(15)
      }
    }
  }, [locationData.coordinates.latitude, locationData.coordinates.longitude])

  // GeoNames API functions
  const fetchCountries = async () => {
    setLoading(prev => ({ ...prev, countries: true }))
    try {
      const response = await fetch('http://api.geonames.org/countryInfoJSON?username=iskahomes')
      if (response.ok) {
        const data = await response.json()
        const countryList = data.geonames.map(country => ({
          name: country.countryName,
          code: country.countryCode,
          geonameId: country.geonameId
        })).sort((a, b) => a.name.localeCompare(b.name))
        setCountries(countryList)
      }
    } catch (error) {
      console.error('Error fetching countries:', error)
    } finally {
      setLoading(prev => ({ ...prev, countries: false }))
    }
  }

  const fetchStates = async (countryGeonameId) => {
    setLoading(prev => ({ ...prev, states: true }))
    try {
      const response = await fetch(`http://api.geonames.org/childrenJSON?geonameId=${countryGeonameId}&username=iskahomes`)
      if (response.ok) {
        const data = await response.json()
        if (data.geonames && data.geonames.length > 0) {
          let stateList = data.geonames.map(state => ({
            name: state.name,
            geonameId: state.geonameId
          })).sort((a, b) => a.name.localeCompare(b.name))
          
          // Ensure saved state is included even if not in GeoNames results
          const savedState = locationData.state
          if (savedState && !stateList.some(s => s.name === savedState)) {
            stateList = [{ name: savedState, geonameId: null }, ...stateList]
          }
          
          setStates(stateList)
        }
      }
    } catch (error) {
      console.error('Error fetching states:', error)
    } finally {
      setLoading(prev => ({ ...prev, states: false }))
    }
  }

  const fetchCities = async (stateGeonameId) => {
    setLoading(prev => ({ ...prev, cities: true }))
    try {
      const response = await fetch(`http://api.geonames.org/childrenJSON?geonameId=${stateGeonameId}&username=iskahomes`)
      if (response.ok) {
        const data = await response.json()
        if (data.geonames && data.geonames.length > 0) {
          let cityList = data.geonames.map(city => ({
            name: city.name,
            geonameId: city.geonameId,
            lat: city.lat,
            lng: city.lng
          })).sort((a, b) => a.name.localeCompare(b.name))
          
          // Ensure saved city is included even if not in GeoNames results
          const savedCity = locationData.city
          if (savedCity && !cityList.some(c => c.name === savedCity)) {
            cityList = [{ name: savedCity, geonameId: null, lat: null, lng: null }, ...cityList]
          }
          
          setCities(cityList)
        }
      }
    } catch (error) {
      console.error('Error fetching cities:', error)
    } finally {
      setLoading(prev => ({ ...prev, cities: false }))
    }
  }

  const fetchTowns = async (cityGeonameId) => {
    setLoading(prev => ({ ...prev, towns: true }))
    try {
      const response = await fetch(`http://api.geonames.org/childrenJSON?geonameId=${cityGeonameId}&username=iskahomes`)
      if (response.ok) {
        const data = await response.json()
        if (data.geonames && data.geonames.length > 0) {
          let townList = data.geonames.map(town => ({
            name: town.name,
            geonameId: town.geonameId,
            lat: town.lat,
            lng: town.lng
          })).sort((a, b) => a.name.localeCompare(b.name))
          
          // Ensure saved town is included even if not in GeoNames results
          const savedTown = locationData.town
          if (savedTown && !townList.some(t => t.name === savedTown)) {
            townList = [{ name: savedTown, geonameId: null, lat: null, lng: null }, ...townList]
          }
          
          setTowns(townList)
        }
      }
    } catch (error) {
      console.error('Error fetching towns:', error)
    } finally {
      setLoading(prev => ({ ...prev, towns: false }))
    }
  }

  const handleChange = (field, value) => {
    const next = { ...locationData, [field]: value }
    setLocationData(next)
    updateFormData({ location: next })
  }

  const handleCoordChange = (field, value) => {
    const next = {
      ...locationData,
      coordinates: { ...locationData.coordinates, [field]: value }
    }
    setLocationData(next)
    updateFormData({ location: next })
    
    // Update map center if both coordinates are provided and valid
    if (next.coordinates.latitude && next.coordinates.longitude) {
      const lat = parseFloat(next.coordinates.latitude)
      const lng = parseFloat(next.coordinates.longitude)
      
      if (!isNaN(lat) && !isNaN(lng)) {
        console.log('🗺️ Updating map center from coordinate input:', lat, lng)
        setMapCenter([lat, lng])
        setMapZoom(15)
      }
    }
  }

  const handleMapClick = (lat, lng) => {
    const next = {
      ...locationData,
      coordinates: {
        latitude: lat.toString(),
        longitude: lng.toString()
      }
    }
    setLocationData(next)
    updateFormData({ location: next })
    setMapCenter([lat, lng])
    setMapZoom(15)
  }

  return (
    <div className="p-4 sm:p-6 bg-white rounded-lg shadow-sm">
      <div className="mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Property Location</h2>
        <p className="text-sm sm:text-base text-gray-600">
          {isEditMode ? 'Update the location details' : 'Specify the location details of your property'}
        </p>
      </div>

      <div className="space-y-4 sm:space-y-6">
        {/* Basic fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">Country</label>
            <select
              id="country"
              value={locationData.country}
              onChange={(e) => handleChange('country', e.target.value)}
              className="w-full rounded-md border border-gray-300 px-2 sm:px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select country</option>
              {loading.countries ? (
                <option disabled>Loading countries...</option>
              ) : (
                countries.map(country => (
                  <option key={country.geonameId} value={country.name}>{country.name}</option>
                ))
              )}
            </select>
          </div>
          <div>
            <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">State/Region</label>
            <select
              id="state"
              value={locationData.state}
              onChange={(e) => handleChange('state', e.target.value)}
              disabled={!locationData.country}
              className="w-full rounded-md border border-gray-300 px-2 sm:px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="">Select state/region</option>
              {loading.states ? (
                <option disabled>Loading states...</option>
              ) : (
                states.map(state => (
                  <option key={state.geonameId} value={state.name}>{state.name}</option>
                ))
              )}
            </select>
          </div>
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">City</label>
            <select
              id="city"
              value={locationData.city}
              onChange={(e) => handleChange('city', e.target.value)}
              disabled={!locationData.state}
              className="w-full rounded-md border border-gray-300 px-2 sm:px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="">Select city</option>
              {loading.cities ? (
                <option disabled>Loading cities...</option>
              ) : (
                cities.map(city => (
                  <option key={city.geonameId} value={city.name}>{city.name}</option>
                ))
              )}
            </select>
          </div>
          <div>
            <label htmlFor="town" className="block text-sm font-medium text-gray-700 mb-2">Town/Area</label>
            <select
              id="town"
              value={locationData.town}
              onChange={(e) => handleChange('town', e.target.value)}
              disabled={!locationData.city}
              className="w-full rounded-md border border-gray-300 px-2 sm:px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="">Select town/area</option>
              {loading.towns ? (
                <option disabled>Loading towns...</option>
              ) : (
                towns.map(town => (
                  <option key={town.geonameId} value={town.name}>{town.name}</option>
                ))
              )}
            </select>
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

        {/* Coordinates */}
        <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-4 rounded-lg border border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">Coordinates</label>
          <div className="text-xs text-gray-500 mb-2">
            Debug: {JSON.stringify(locationData.coordinates)}
          </div>
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

        {/* Interactive Map */}
        <div className="bg-gradient-to-r from-teal-50 to-cyan-50 p-4 rounded-lg border border-teal-200">
          <label className="block text-sm font-medium text-teal-900 mb-2">
            Interactive Map
          </label>
          <p className="text-teal-700 text-sm mb-4">Click on the map to set the exact location of your property</p>
          
          
          <div className="h-96 rounded-lg overflow-hidden border border-teal-300">
            <MapComponent
              center={mapCenter}
              zoom={mapZoom}
              onMapClick={handleMapClick}
              coordinates={locationData.coordinates}
            />
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

export default PropertyLocation
