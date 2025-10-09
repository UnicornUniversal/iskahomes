"use client"
import React, { useState, useEffect } from 'react'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { cn } from '@/lib/utils'
import dynamic from 'next/dynamic'

// Dynamically import the map component to avoid SSR issues
const MapComponent = dynamic(() => import('./MapComponent'), { 
  ssr: false,
  loading: () => <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">Loading map...</div>
})

const DevelopmentLocation = ({ formData, updateFormData, isEditMode }) => {
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

  // Initialize with form data
  useEffect(() => {
    if (formData.location) {
      setLocationData(prev => ({
        ...prev,
        ...formData.location
      }));
      
      // Set map center if coordinates exist
      if (formData.location.coordinates?.latitude && formData.location.coordinates?.longitude) {
        setMapCenter([parseFloat(formData.location.coordinates.latitude), parseFloat(formData.location.coordinates.longitude)]);
        setMapZoom(15);
      }
    }
  }, [formData.location]);

  // Fetch countries on component mount
  useEffect(() => {
    fetchCountries();
  }, []);

  // Fetch states when country changes
  useEffect(() => {
    if (locationData.country) {
      const selectedCountry = countries.find(c => c.name === locationData.country);
      if (selectedCountry && selectedCountry.geonameId) {
        fetchStates(selectedCountry.geonameId);
      }
      // Reset state and city when country changes
      setLocationData(prev => ({
        ...prev,
        state: '',
        city: '',
        town: '',
        coordinates: { latitude: '', longitude: '' }
      }));
      setStates([]);
      setCities([]);
    } else {
      setStates([]);
      setCities([]);
    }
  }, [locationData.country, countries]);

  // Fetch cities when state changes
  useEffect(() => {
    if (locationData.state) {
      const selectedState = states.find(s => s.name === locationData.state);
      if (selectedState) {
        fetchCities(selectedState.code);
      }
      // Reset city when state changes
      setLocationData(prev => ({
        ...prev,
        city: '',
        town: '',
        coordinates: { latitude: '', longitude: '' }
      }));
      setCities([]);
    } else {
      setCities([]);
    }
  }, [locationData.state, states]);

  // Fetch towns when city changes
  useEffect(() => {
    if (locationData.city) {
      const selectedCity = cities.find(c => c.name === locationData.city);
      if (selectedCity && selectedCity.code) {
        fetchTowns(selectedCity.code);
      }
      // Reset town when city changes
      setLocationData(prev => ({
        ...prev,
        town: '',
        coordinates: { latitude: '', longitude: '' }
      }));
      setTowns([]);
    } else {
      setTowns([]);
    }
  }, [locationData.city, cities]);

  // GeoNames API functions
  const fetchCountries = async () => {
    setLoading(prev => ({ ...prev, countries: true }));
    try {
      const response = await fetch('http://api.geonames.org/countryInfoJSON?username=iskahomes');
      if (response.ok) {
        const data = await response.json();
        const countryList = data.geonames.map(country => ({
          name: country.countryName,
          code: country.countryCode,
          geonameId: country.geonameId
        })).sort((a, b) => a.name.localeCompare(b.name));
        setCountries(countryList);
      }
    } catch (error) {
      console.error('Error fetching countries:', error);
    } finally {
      setLoading(prev => ({ ...prev, countries: false }));
    }
  };

  const fetchStates = async (countryGeonameId) => {
    setLoading(prev => ({ ...prev, states: true }));
    try {
      const response = await fetch(`http://api.geonames.org/childrenJSON?geonameId=${countryGeonameId}&username=iskahomes`);
      if (response.ok) {
        const data = await response.json();
        if (data.geonames && data.geonames.length > 0) {
          const states = data.geonames.map(state => ({
            name: state.name,
            code: state.geonameId
          })).sort((a, b) => a.name.localeCompare(b.name));
          setStates(states);
        }
      }
    } catch (error) {
      console.error('Error fetching states:', error);
    } finally {
      setLoading(prev => ({ ...prev, states: false }));
    }
  };

  const fetchCities = async (stateCode) => {
    setLoading(prev => ({ ...prev, cities: true }));
    try {
      const response = await fetch(`http://api.geonames.org/childrenJSON?geonameId=${stateCode}&username=iskahomes`);
      if (response.ok) {
        const data = await response.json();
        if (data.geonames && data.geonames.length > 0) {
          const cities = data.geonames.map(city => ({
            name: city.name,
            code: city.geonameId,
            lat: city.lat,
            lng: city.lng
          })).sort((a, b) => a.name.localeCompare(b.name));
          setCities(cities);
        }
      }
    } catch (error) {
      console.error('Error fetching cities:', error);
    } finally {
      setLoading(prev => ({ ...prev, cities: false }));
    }
  };

  const fetchTowns = async (cityCode) => {
    setLoading(prev => ({ ...prev, towns: true }));
    try {
      const response = await fetch(`http://api.geonames.org/childrenJSON?geonameId=${cityCode}&username=iskahomes`);
      if (response.ok) {
        const data = await response.json();
        if (data.geonames && data.geonames.length > 0) {
          const towns = data.geonames.map(town => ({
            name: town.name,
            code: town.geonameId,
            lat: town.lat,
            lng: town.lng
          })).sort((a, b) => a.name.localeCompare(b.name));
          setTowns(towns);
        }
      }
    } catch (error) {
      console.error('Error fetching towns:', error);
    } finally {
      setLoading(prev => ({ ...prev, towns: false }));
    }
  };

  // Update map zoom based on location specificity
  useEffect(() => {
    if (locationData.coordinates.latitude && locationData.coordinates.longitude) {
      // Determine zoom level based on what's selected
      let zoom = 2; // Default world view
      
      if (locationData.country) zoom = 4; // Country level
      if (locationData.state) zoom = 6;   // State level
      if (locationData.city) zoom = 10;   // City level
      if (locationData.town) zoom = 13;   // Town level
      
      setMapCenter([parseFloat(locationData.coordinates.latitude), parseFloat(locationData.coordinates.longitude)]);
      setMapZoom(zoom);
    }
  }, [locationData.country, locationData.state, locationData.city, locationData.town, locationData.coordinates]);

  const handleInputChange = (field, value) => {
    const newLocationData = {
      ...locationData,
      [field]: value
    };
    
    setLocationData(newLocationData);
    updateFormData({
      location: newLocationData
    });

    // Clear dependent fields when parent changes
    if (field === 'country') {
      setLocationData(prev => ({
        ...prev,
        state: '',
        city: '',
        town: ''
      }));
    } else if (field === 'state') {
      setLocationData(prev => ({
        ...prev,
        city: '',
        town: ''
      }));
    } else if (field === 'city') {
      setLocationData(prev => ({
        ...prev,
        town: ''
      }));
    }
  }

  const handleCityChange = (cityName) => {
    const selectedCity = cities.find(c => c.name === cityName);
    if (selectedCity && selectedCity.lat && selectedCity.lng) {
      // Update coordinates when city is selected
      const newLocationData = {
        ...locationData,
        city: cityName,
        coordinates: {
          latitude: selectedCity.lat,
          longitude: selectedCity.lng
        }
      };
      setLocationData(newLocationData);
      updateFormData({
        location: newLocationData
      });
      
      // Update map center
      setMapCenter([parseFloat(selectedCity.lat), parseFloat(selectedCity.lng)]);
      setMapZoom(12);
    } else {
      // Regular city selection without coordinates
      const newLocationData = {
        ...locationData,
        city: cityName
      };
      setLocationData(newLocationData);
      updateFormData({
        location: newLocationData
      });
    }
  }

  const handleTownChange = (townName) => {
    const selectedTown = towns.find(t => t.name === townName);
    if (selectedTown && selectedTown.lat && selectedTown.lng) {
      // Update coordinates when town is selected
      const newLocationData = {
        ...locationData,
        town: townName,
        coordinates: {
          latitude: selectedTown.lat,
          longitude: selectedTown.lng
        }
      };
      setLocationData(newLocationData);
      updateFormData({
        location: newLocationData
      });
      
      // Update map center
      setMapCenter([parseFloat(selectedTown.lat), parseFloat(selectedTown.lng)]);
      setMapZoom(13);
    } else {
      // Regular town selection without coordinates
      const newLocationData = {
        ...locationData,
        town: townName
      };
      setLocationData(newLocationData);
      updateFormData({
        location: newLocationData
      });
    }
  }

  const handleCoordinateChange = (type, value) => {
    const newCoordinates = {
      ...locationData.coordinates,
      [type]: value
    };
    
    const newLocationData = {
      ...locationData,
      coordinates: newCoordinates
    };
    
    setLocationData(newLocationData);
    updateFormData({
      location: newLocationData
    });

    // Update map center if both coordinates are provided
    if (newCoordinates.latitude && newCoordinates.longitude) {
      setMapCenter([parseFloat(newCoordinates.latitude), parseFloat(newCoordinates.longitude)]);
      setMapZoom(15);
    }
  }

  const handleMapClick = (lat, lng) => {
    const newCoordinates = {
      latitude: lat.toString(),
      longitude: lng.toString()
    };
    
    const newLocationData = {
      ...locationData,
      coordinates: newCoordinates
    };
    
    setLocationData(newLocationData);
    updateFormData({
      location: newLocationData
    });
  }



  return (
    <div className="p-6 bg-white rounded-lg shadow-sm">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Development Location</h2>
        <p className="text-gray-600">
          {isEditMode ? 'Update the location details' : 'Specify the location details of your development project'}
        </p>
      </div>

      <div className="space-y-6">
        {/* Location Selection */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Location Selection</h3>
          
          {/* Location Hierarchy */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Country */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
              <label htmlFor="country" className="block text-sm font-medium text-green-900 mb-2">
                Country *
              </label>
              <select
                id="country"
                value={locationData.country}
                onChange={(e) => handleInputChange('country', e.target.value)}
                required
                className="w-full rounded-md border border-green-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
              >
                <option value="">Select country</option>
                {loading.countries ? (
                  <option disabled>Loading countries...</option>
                ) : (
                  countries.map(country => (
                    <option key={country.code} value={country.name}>{country.name}</option>
                  ))
                )}
              </select>
            </div>

            {/* State */}
            <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-4 rounded-lg border border-purple-200">
              <label htmlFor="state" className="block text-sm font-medium text-purple-900 mb-2">
                State/Region *
              </label>
              <select
                id="state"
                value={locationData.state}
                onChange={(e) => handleInputChange('state', e.target.value)}
                required
                disabled={!locationData.country}
                className="w-full rounded-md border border-purple-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
              >
                <option value="">Select state</option>
                {loading.states ? (
                  <option disabled>Loading states...</option>
                ) : (
                  states.map(state => (
                    <option key={state.code} value={state.name}>{state.name}</option>
                  ))
                )}
              </select>
            </div>

            {/* City */}
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-lg border border-orange-200">
              <label htmlFor="city" className="block text-sm font-medium text-orange-900 mb-2">
                City *
              </label>
              <select
                id="city"
                value={locationData.city}
                onChange={(e) => handleCityChange(e.target.value)}
                required
                disabled={!locationData.state}
                className="w-full rounded-md border border-orange-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100"
              >
                <option value="">Select city</option>
                {loading.cities ? (
                  <option disabled>Loading cities...</option>
                ) : (
                  cities.map(city => (
                    <option key={city.name} value={city.name}>{city.name}</option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* Town */}
          <div className="bg-gradient-to-r from-pink-50 to-rose-50 p-4 rounded-lg border border-pink-200">
            <label htmlFor="town" className="block text-sm font-medium text-pink-900 mb-2">
              Town/Area
            </label>
            <select
              id="town"
              value={locationData.town}
              onChange={(e) => handleTownChange(e.target.value)}
              disabled={!locationData.city}
              className="w-full rounded-md border border-pink-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 disabled:bg-gray-100"
            >
              <option value="">Select a town</option>
              {loading.towns ? (
                <option disabled>Loading towns...</option>
              ) : (
                towns.map(town => (
                  <option key={town.code} value={town.name}>{town.name}</option>
                ))
              )}
            </select>
          </div>
        </div>

        {/* Address Field */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
          <label htmlFor="address" className="block text-sm font-medium text-blue-900 mb-2">
            Full Address
          </label>
          <p className="text-blue-700 text-sm mb-4">Enter the complete address of your development</p>
          <textarea
            id="address"
            rows={3}
            placeholder="e.g., 123 Main Street, East Legon, Accra, Greater Accra Region, Ghana"
            value={locationData.fullAddress}
            onChange={(e) => handleInputChange('fullAddress', e.target.value)}
            className="w-full rounded-md border border-blue-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>


        {/* Clear Location Button */}
        {(locationData.country || locationData.state || locationData.city || locationData.town || locationData.fullAddress) && (
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setLocationData({
                  country: '',
                  state: '',
                  city: '',
                  town: '',
                  fullAddress: '',
                  coordinates: { latitude: '', longitude: '' },
                  additionalInformation: locationData.additionalInformation
                });
                updateFormData({
                  location: {
                    country: '',
                    state: '',
                    city: '',
                    town: '',
                    fullAddress: '',
                    coordinates: { latitude: '', longitude: '' },
                    additionalInformation: locationData.additionalInformation
                  }
                });
                setMapCenter([7.9465, -1.0232]); // Reset to Ghana
                setMapZoom(6);
              }}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Clear Location
            </Button>
          </div>
        )}


        {/* Coordinates */}
        <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-4 rounded-lg border border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Coordinates
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="latitude" className="block text-xs text-gray-600 mb-1">
                Latitude
              </label>
              <Input
                id="latitude"
                type="number"
                step="any"
                placeholder="e.g., 40.7128"
                value={locationData.coordinates.latitude || ''}
                onChange={(e) => handleCoordinateChange('latitude', e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label htmlFor="longitude" className="block text-xs text-gray-600 mb-1">
                Longitude
              </label>
              <Input
                id="longitude"
                type="number"
                step="any"
                placeholder="e.g., -74.0060"
                value={locationData.coordinates.longitude || ''}
                onChange={(e) => handleCoordinateChange('longitude', e.target.value)}
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
          <p className="text-teal-700 text-sm mb-4">Click on the map to set the exact location of your development</p>
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
          <label htmlFor="additionalInformation" className="block text-sm font-medium text-gray-700 mb-2">
            Additional Location Information
          </label>
          <textarea
            id="additionalInformation"
            rows={4}
            placeholder="Any additional location details, landmarks, or directions..."
            value={locationData.additionalInformation}
            onChange={(e) => handleInputChange('additionalInformation', e.target.value)}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      </div>
    </div>
  )
}

export default DevelopmentLocation
