import React, { useState, useEffect } from 'react'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { cn } from '@/lib/utils'

const DevelopmentLocation = ({ developmentData, isEditMode }) => {
  const [formData, setFormData] = useState({
    country: '',
    state: '',
    city: '',
    neighborhood: '',
    coordinates: {
      latitude: '',
      longitude: ''
    },
    additionalInformation: ''
  })

  const [isSearching, setIsSearching] = useState(false)

  // Populate form data when developmentData is available (edit mode)
  useEffect(() => {
    if (developmentData && isEditMode) {
      setFormData({
        country: developmentData.location?.country || '',
        state: developmentData.location?.state || '',
        city: developmentData.location?.city || '',
        neighborhood: developmentData.location?.neighborhood || '',
        coordinates: {
          latitude: developmentData.location?.coordinates?.lat?.toString() || '',
          longitude: developmentData.location?.coordinates?.lng?.toString() || ''
        },
        additionalInformation: developmentData.additionalInfo ? 
          `Completion Date: ${developmentData.additionalInfo.completionDate || developmentData.additionalInfo.expectedCompletion || 'N/A'}\nDeveloper: ${developmentData.additionalInfo.developer || 'N/A'}\nTotal Units: ${developmentData.additionalInfo.totalUnits || 'N/A'}\nAvailable Units: ${developmentData.additionalInfo.availableUnits || 'N/A'}` : ''
      });
    }
  }, [developmentData, isEditMode]);

  const countries = [
    'United States',
    'Canada',
    'United Kingdom',
    'Germany',
    'France',
    'Spain',
    'Italy',
    'Netherlands',
    'Belgium',
    'Switzerland',
    'Austria',
    'Sweden',
    'Norway',
    'Denmark',
    'Finland',
    'Poland',
    'Czech Republic',
    'Hungary',
    'Slovakia',
    'Slovenia',
    'Croatia',
    'Serbia',
    'Bulgaria',
    'Romania',
    'Greece',
    'Turkey',
    'Ukraine',
    'Russia',
    'Belarus',
    'Latvia',
    'Lithuania',
    'Estonia',
    'Ireland',
    'Portugal',
    'Luxembourg',
    'Malta',
    'Cyprus',
    'Iceland',
    'Liechtenstein',
    'Monaco',
    'Andorra',
    'San Marino',
    'Vatican City'
  ]

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleCoordinateChange = (type, value) => {
    setFormData(prev => ({
      ...prev,
      coordinates: {
        ...prev.coordinates,
        [type]: value
      }
    }))
  }

  const handleSearchLocation = () => {
    setIsSearching(true)
    // Simulate map search functionality
    setTimeout(() => {
      setIsSearching(false)
      // Here you would integrate with Google Maps API
      console.log('Searching for location on map...')
    }, 2000)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('Development Location Data:', formData)
    // Handle form submission - differentiate between add and edit
    if (isEditMode) {
      console.log('Updating location for existing development...');
      // Add your update logic here
    } else {
      console.log('Saving location for new development...');
      // Add your create logic here
    }
  }

  return (
    <div className=" p-6 bg-white rounded-lg shadow-sm">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Development Location</h2>
        <p className="text-gray-600">
          {isEditMode ? 'Update the location details' : 'Specify the location details of your development project'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Country */}
        <div>
          <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
            Country *
          </label>
          <select
            id="country"
            value={formData.country}
            onChange={(e) => handleInputChange('country', e.target.value)}
            required
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="">Select country</option>
            {countries.map(country => (
              <option key={country} value={country}>{country}</option>
            ))}
          </select>
        </div>

        {/* State/Region and City Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
              State/Region *
            </label>
            <Input
              id="state"
              type="text"
              placeholder="Enter state or region"
              value={formData.state}
              onChange={(e) => handleInputChange('state', e.target.value)}
              required
              className="w-full"
            />
          </div>

          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
              City *
            </label>
            <Input
              id="city"
              type="text"
              placeholder="Enter city name"
              value={formData.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
              required
              className="w-full"
            />
          </div>
        </div>

        {/* Neighborhood */}
        <div>
          <label htmlFor="neighborhood" className="block text-sm font-medium text-gray-700 mb-2">
            Neighborhood
          </label>
          <Input
            id="neighborhood"
            type="text"
            placeholder="Enter neighborhood name"
            value={formData.neighborhood}
            onChange={(e) => handleInputChange('neighborhood', e.target.value)}
            className="w-full"
          />
        </div>

        {/* Coordinates */}
        <div>
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
                value={formData.coordinates.latitude}
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
                value={formData.coordinates.longitude}
                onChange={(e) => handleCoordinateChange('longitude', e.target.value)}
                className="w-full"
              />
            </div>
          </div>
          <div className="mt-2">
            <Button
              type="button"
              onClick={handleSearchLocation}
              disabled={isSearching}
              variant="outline"
              className="text-sm"
            >
              {isSearching ? 'Searching...' : 'Search on Map'}
            </Button>
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
            value={formData.additionalInformation}
            onChange={(e) => handleInputChange('additionalInformation', e.target.value)}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-6">
          <Button type="submit" className="px-8">
            {isEditMode ? 'Update Location' : 'Save & Continue'}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default DevelopmentLocation
