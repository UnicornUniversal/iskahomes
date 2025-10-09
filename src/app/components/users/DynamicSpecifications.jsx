"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'

const DynamicSpecifications = ({ propertyTypeId, purposeId, onSpecificationsChange }) => {
  const [specifications, setSpecifications] = useState({})
  const [loading, setLoading] = useState(false)

  // Fetch property type details to determine which specifications to show
  useEffect(() => {
    if (propertyTypeId) {
      fetchPropertyTypeSpecifications(propertyTypeId)
    } else {
      setSpecifications({})
    }
  }, [propertyTypeId, purposeId])

  const fetchPropertyTypeSpecifications = async (typeId) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/property-types/${typeId}`)
      if (response.ok) {
        const result = await response.json()
        const propertyType = result.data
        
        // Initialize specifications based on property type
        const initialSpecs = initializeSpecifications(propertyType)
        setSpecifications(initialSpecs)
        onSpecificationsChange(initialSpecs)
      }
    } catch (error) {
      console.error('Error fetching property type:', error)
    } finally {
      setLoading(false)
    }
  }

  const initializeSpecifications = (propertyType) => {
    const specs = {}
    
    // Common specifications for all property types
    specs.bedrooms = 0
    specs.bathrooms = 0
    specs.property_size = 0
    
    // Type-specific specifications
    switch (propertyType.id) {
      case '16f02534-40e4-445f-94f2-2a01531b8503': // Apartments and Houses
        specs.living_rooms = 0
        specs.kitchen = 0
        specs.toilets = 0
        specs.floor_level = 0
        specs.furnishing = ''
        specs.property_age = ''
        specs.condition = ''
        break
        
      case 'fc7d2abc-e19e-40bc-942b-5c1b1561565c': // Offices
        specs.capacity = 0
        specs.meeting_rooms = 0
        specs.reception_area = ''
        specs.parking_spaces = 0
        specs.air_conditioning = ''
        specs.internet = ''
        specs.security = ''
        break
        
      case '0f2df1a6-86ad-4690-82f6-e9358b973fd7': // Warehouses
        specs.ceiling_height = 0
        specs.loading_docks = 0
        specs.floor_type = ''
        specs.temperature_control = ''
        specs.access_type = ''
        specs.power_supply = ''
        specs.office_space = ''
        break
        
      case '40ae5053-1143-4c74-8f29-8a3e467e9b43': // Event Centers
        specs.capacity = 0
        specs.stage = ''
        specs.sound_system = ''
        specs.lighting = ''
        specs.catering = ''
        specs.parking_spaces = 0
        specs.accessibility = ''
        break
        
      case 'a389610d-1d0a-440b-a3c4-91f392ebd27c': // Land
        specs.area = 0
        specs.topography = ''
        specs.soil_type = ''
        specs.road_access = ''
        specs.utilities = ''
        specs.zoning = ''
        specs.survey = ''
        specs.title_deed = ''
        break
        
      default:
        break
    }
    
    return specs
  }

  const handleInputChange = (field, value) => {
    const newSpecs = {
      ...specifications,
      [field]: value
    }
    setSpecifications(newSpecs)
    onSpecificationsChange(newSpecs)
  }

  const renderSpecificationFields = () => {
    if (!propertyTypeId) {
      return (
        <div className="text-center py-8 text-gray-500">
          <p>Select a property type to see specifications</p>
        </div>
      )
    }

    if (loading) {
      return (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary_color mx-auto mb-2"></div>
          <p className="text-gray-500">Loading specifications...</p>
        </div>
      )
    }

    // Render specifications based on property type
    switch (propertyTypeId) {
      case '16f02534-40e4-445f-94f2-2a01531b8503': // Apartments and Houses
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bedrooms</label>
              <Input
                type="number"
                min="0"
                value={specifications.bedrooms || ''}
                onChange={(e) => handleInputChange('bedrooms', parseInt(e.target.value) || 0)}
                placeholder="Number of bedrooms"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bathrooms</label>
              <Input
                type="number"
                min="0"
                step="0.5"
                value={specifications.bathrooms || ''}
                onChange={(e) => handleInputChange('bathrooms', parseFloat(e.target.value) || 0)}
                placeholder="Number of bathrooms"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Property Size (sq ft)</label>
              <Input
                type="number"
                min="0"
                value={specifications.property_size || ''}
                onChange={(e) => handleInputChange('property_size', parseFloat(e.target.value) || 0)}
                placeholder="Total property size"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Furnishing</label>
              <select
                value={specifications.furnishing || ''}
                onChange={(e) => handleInputChange('furnishing', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select furnishing</option>
                <option value="furnished">Furnished</option>
                <option value="semi-furnished">Semi-Furnished</option>
                <option value="unfurnished">Unfurnished</option>
              </select>
            </div>
          </div>
        )

      case 'fc7d2abc-e19e-40bc-942b-5c1b1561565c': // Offices
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Capacity (People)</label>
              <Input
                type="number"
                min="1"
                value={specifications.capacity || ''}
                onChange={(e) => handleInputChange('capacity', parseInt(e.target.value) || 0)}
                placeholder="Maximum capacity"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Meeting Rooms</label>
              <Input
                type="number"
                min="0"
                value={specifications.meeting_rooms || ''}
                onChange={(e) => handleInputChange('meeting_rooms', parseInt(e.target.value) || 0)}
                placeholder="Number of meeting rooms"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Air Conditioning</label>
              <select
                value={specifications.air_conditioning || ''}
                onChange={(e) => handleInputChange('air_conditioning', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select AC</option>
                <option value="central">Central AC</option>
                <option value="individual">Individual Units</option>
                <option value="none">No AC</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Internet</label>
              <select
                value={specifications.internet || ''}
                onChange={(e) => handleInputChange('internet', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select internet</option>
                <option value="fiber">Fiber Optic</option>
                <option value="broadband">Broadband</option>
                <option value="wifi">WiFi</option>
                <option value="none">No Internet</option>
              </select>
            </div>
          </div>
        )

      case 'a389610d-1d0a-440b-a3c4-91f392ebd27c': // Land
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Area (sq ft)</label>
              <Input
                type="number"
                min="0"
                value={specifications.area || ''}
                onChange={(e) => handleInputChange('area', parseFloat(e.target.value) || 0)}
                placeholder="Land area in square feet"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Topography</label>
              <select
                value={specifications.topography || ''}
                onChange={(e) => handleInputChange('topography', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select topography</option>
                <option value="flat">Flat</option>
                <option value="hilly">Hilly</option>
                <option value="sloping">Sloping</option>
                <option value="waterlogged">Waterlogged</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Road Access</label>
              <select
                value={specifications.road_access || ''}
                onChange={(e) => handleInputChange('road_access', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select road access</option>
                <option value="tarred">Tarred Road</option>
                <option value="gravel">Gravel Road</option>
                <option value="dirt">Dirt Road</option>
                <option value="none">No Road Access</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Utilities</label>
              <select
                value={specifications.utilities || ''}
                onChange={(e) => handleInputChange('utilities', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select utilities</option>
                <option value="all">All Utilities</option>
                <option value="electricity-water">Electricity & Water</option>
                <option value="electricity">Electricity Only</option>
                <option value="water">Water Only</option>
                <option value="none">No Utilities</option>
              </select>
            </div>
          </div>
        )

      default:
        return (
          <div className="text-center py-8 text-gray-500">
            <p>Specifications for this property type are not yet available</p>
          </div>
        )
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Specifications</h3>
      {renderSpecificationFields()}
    </div>
  )
}

export default DynamicSpecifications
