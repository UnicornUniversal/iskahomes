"use client"
import React from 'react'

const UnitDescription = ({ formData, updateFormData, mode, developments }) => {
  // Property type configurations
  const propertyTypes = {
    houses: {
      label: 'Houses / Apartments',
      unitTypes: [
        'House', 'Apartment', 'Studio', 'Duplex', 'Semi-Detached', 'Townhouse', 'Penthouse'
      ],
      statusOptions: ['Furnished', 'Semi-Furnished', 'Unfurnished']
    },
    offices: {
      label: 'Offices',
      unitTypes: [
        'Shared Office', 'Private Office', 'Co-working Space', 'Virtual Office', 'Executive Suite'
      ],
      statusOptions: ['Available', 'Occupied']
    },
    warehouses: {
      label: 'Warehouses',
      unitTypes: [
        'Dry Storage', 'Cold Storage', 'Bonded Warehouse', 'Open Yard', 'Distribution Center'
      ],
      statusOptions: ['Available', 'Occupied']
    },
    event_centers: {
      label: 'Event Centers',
      unitTypes: [
        'Wedding Hall', 'Conference Center', 'Concert Venue', 'Party Hall', 'Exhibition Space'
      ],
      statusOptions: ['Available', 'Booked']
    },
    land: {
      label: 'Land',
      unitTypes: [
        'Residential Plot', 'Commercial Plot', 'Agricultural Land', 'Industrial Land', 'Mixed Use'
      ],
      statusOptions: ['Available', 'Sold']
    }
  }

  const currentPropertyType = propertyTypes[formData.property_type] || propertyTypes.houses

  const handleInputChange = (field, value) => {
    updateFormData({ [field]: value })
  }

  const handleNestedInputChange = (parent, field, value) => {
    updateFormData({
      [parent]: {
        ...formData[parent],
        [field]: value
      }
    })
  }

  const handleDeepNestedInputChange = (parent, child, field, value) => {
    updateFormData({
      [parent]: {
        ...formData[parent],
        [child]: {
          ...formData[parent][child],
          [field]: value
        }
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unit Title *
            </label>
            <input
              type="text"
              value={formData.title || ''}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter unit title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Property Type *
            </label>
            <select
              value={formData.property_type || 'houses'}
              onChange={(e) => handleInputChange('property_type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {Object.entries(propertyTypes).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unit Type *
            </label>
            <select
              value={formData.unit_type || ''}
              onChange={(e) => handleInputChange('unit_type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select unit type...</option>
              {currentPropertyType.unitTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status *
            </label>
            <select
              value={formData.status || 'available'}
              onChange={(e) => handleInputChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {currentPropertyType.statusOptions.map((status) => (
                <option key={status.toLowerCase()} value={status.toLowerCase()}>{status}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description *
          </label>
          <textarea
            value={formData.description || ''}
            onChange={(e) => handleInputChange('description', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
            placeholder="Describe the unit in detail..."
            required
          />
        </div>
      </div>

      {/* Location Information */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Location Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              City *
            </label>
            <input
              type="text"
              value={formData.location.city || ''}
              onChange={(e) => handleNestedInputChange('location', 'city', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter city"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Neighborhood
            </label>
            <input
              type="text"
              value={formData.location.neighborhood || ''}
              onChange={(e) => handleNestedInputChange('location', 'neighborhood', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter neighborhood"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Latitude
            </label>
            <input
              type="text"
              value={formData.location.gps_coordinates.latitude || ''}
              onChange={(e) => handleDeepNestedInputChange('location', 'gps_coordinates', 'latitude', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 5.6037"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Longitude
            </label>
            <input
              type="text"
              value={formData.location.gps_coordinates.longitude || ''}
              onChange={(e) => handleDeepNestedInputChange('location', 'gps_coordinates', 'longitude', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., -0.1870"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full Address
          </label>
          <input
            type="text"
            value={formData.location.address || ''}
            onChange={(e) => handleNestedInputChange('location', 'address', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter complete address"
          />
        </div>
      </div>

      {/* Size & Capacity Information */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Size & Capacity</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Houses/Apartments specific fields */}
          {(formData.property_type === 'houses' || formData.property_type === 'apartments') && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bedrooms
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.size.bedrooms || ''}
                  onChange={(e) => handleNestedInputChange('size', 'bedrooms', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Number of bedrooms"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bathrooms
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.size.bathrooms || ''}
                  onChange={(e) => handleNestedInputChange('size', 'bathrooms', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Number of bathrooms"
                />
              </div>
            </>
          )}

          {/* Offices/Event Centers specific fields */}
          {(formData.property_type === 'offices' || formData.property_type === 'event_centers') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Capacity (People)
              </label>
              <input
                type="number"
                min="0"
                value={formData.size.capacity || ''}
                onChange={(e) => handleNestedInputChange('size', 'capacity', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Number of people"
              />
            </div>
          )}

          {/* Warehouses specific fields */}
          {formData.property_type === 'warehouses' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ceiling Height (m)
              </label>
              <input
                type="text"
                value={formData.size.ceiling_height || ''}
                onChange={(e) => handleNestedInputChange('size', 'ceiling_height', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 4.5"
              />
            </div>
          )}

          {/* Common fields */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Living Space (sq ft/sq m) *
            </label>
            <input
              type="text"
              value={formData.size.living_space || ''}
              onChange={(e) => handleNestedInputChange('size', 'living_space', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 1200 sq ft"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Total Area
            </label>
            <input
              type="text"
              value={formData.size.total_area || ''}
              onChange={(e) => handleNestedInputChange('size', 'total_area', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 1500 sq ft"
            />
          </div>
        </div>
      </div>

      {/* Features & Amenities */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Features & Amenities</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Houses/Apartments features */}
          {(formData.property_type === 'houses' || formData.property_type === 'apartments') && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kitchen Type
                </label>
                <select
                  value={formData.features.kitchen_type || ''}
                  onChange={(e) => handleNestedInputChange('features', 'kitchen_type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select kitchen type...</option>
                  <option value="modern">Modern</option>
                  <option value="traditional">Traditional</option>
                  <option value="open-plan">Open Plan</option>
                  <option value="galley">Galley</option>
                  <option value="island">Island</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="balcony"
                  checked={formData.features.balcony || false}
                  onChange={(e) => handleNestedInputChange('features', 'balcony', e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="balcony" className="text-sm font-medium text-gray-700">
                  Balcony
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="garden"
                  checked={formData.features.garden || false}
                  onChange={(e) => handleNestedInputChange('features', 'garden', e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="garden" className="text-sm font-medium text-gray-700">
                  Garden
                </label>
              </div>
            </>
          )}

          {/* Offices features */}
          {formData.property_type === 'offices' && (
            <>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="conference_rooms"
                  checked={formData.features.conference_rooms || false}
                  onChange={(e) => handleNestedInputChange('features', 'conference_rooms', e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="conference_rooms" className="text-sm font-medium text-gray-700">
                  Conference Rooms
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="washrooms"
                  checked={formData.features.washrooms || false}
                  onChange={(e) => handleNestedInputChange('features', 'washrooms', e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="washrooms" className="text-sm font-medium text-gray-700">
                  Washrooms
                </label>
              </div>
            </>
          )}

          {/* Warehouses features */}
          {formData.property_type === 'warehouses' && (
            <>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="loading_docks"
                  checked={formData.features.loading_docks || false}
                  onChange={(e) => handleNestedInputChange('features', 'loading_docks', e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="loading_docks" className="text-sm font-medium text-gray-700">
                  Loading Docks
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="forklift_access"
                  checked={formData.features.forklift_access || false}
                  onChange={(e) => handleNestedInputChange('features', 'forklift_access', e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="forklift_access" className="text-sm font-medium text-gray-700">
                  Forklift Access
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="power_backup"
                  checked={formData.features.power_backup || false}
                  onChange={(e) => handleNestedInputChange('features', 'power_backup', e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="power_backup" className="text-sm font-medium text-gray-700">
                  Power Backup
                </label>
              </div>
            </>
          )}

          {/* Event Centers features */}
          {formData.property_type === 'event_centers' && (
            <>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="stage"
                  checked={formData.features.stage || false}
                  onChange={(e) => handleNestedInputChange('features', 'stage', e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="stage" className="text-sm font-medium text-gray-700">
                  Stage
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="lighting"
                  checked={formData.features.lighting || false}
                  onChange={(e) => handleNestedInputChange('features', 'lighting', e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="lighting" className="text-sm font-medium text-gray-700">
                  Professional Lighting
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="sound_system"
                  checked={formData.features.sound_system || false}
                  onChange={(e) => handleNestedInputChange('features', 'sound_system', e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="sound_system" className="text-sm font-medium text-gray-700">
                  Sound System
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="chairs_tables"
                  checked={formData.features.chairs_tables || false}
                  onChange={(e) => handleNestedInputChange('features', 'chairs_tables', e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="chairs_tables" className="text-sm font-medium text-gray-700">
                  Chairs & Tables
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="catering_services"
                  checked={formData.features.catering_services || false}
                  onChange={(e) => handleNestedInputChange('features', 'catering_services', e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="catering_services" className="text-sm font-medium text-gray-700">
                  Catering Services
                </label>
              </div>
            </>
          )}

          {/* Land features */}
          {formData.property_type === 'land' && (
            <>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="road_access"
                  checked={formData.features.road_access || false}
                  onChange={(e) => handleNestedInputChange('features', 'road_access', e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="road_access" className="text-sm font-medium text-gray-700">
                  Road Access
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="proximity_to_utilities"
                  checked={formData.features.proximity_to_utilities || false}
                  onChange={(e) => handleNestedInputChange('features', 'proximity_to_utilities', e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="proximity_to_utilities" className="text-sm font-medium text-gray-700">
                  Proximity to Utilities
                </label>
              </div>
            </>
          )}

          {/* Common features */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="security"
              checked={formData.features.security || false}
              onChange={(e) => handleNestedInputChange('features', 'security', e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="security" className="text-sm font-medium text-gray-700">
              Security
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="gated_community"
              checked={formData.features.gated_community || false}
              onChange={(e) => handleNestedInputChange('features', 'gated_community', e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="gated_community" className="text-sm font-medium text-gray-700">
              Gated Community
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="parking"
              checked={formData.features.parking || false}
              onChange={(e) => handleNestedInputChange('features', 'parking', e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="parking" className="text-sm font-medium text-gray-700">
              Parking
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="internet"
              checked={formData.features.internet || false}
              onChange={(e) => handleNestedInputChange('features', 'internet', e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="internet" className="text-sm font-medium text-gray-700">
              Internet Available
            </label>
          </div>
        </div>
      </div>

      {/* Utilities */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Utilities</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="water_supply"
              checked={formData.utilities.water_supply || false}
              onChange={(e) => handleNestedInputChange('utilities', 'water_supply', e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="water_supply" className="text-sm font-medium text-gray-700">
              Water Supply
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="electricity"
              checked={formData.utilities.electricity || false}
              onChange={(e) => handleNestedInputChange('utilities', 'electricity', e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="electricity" className="text-sm font-medium text-gray-700">
              Electricity
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="internet_utility"
              checked={formData.utilities.internet || false}
              onChange={(e) => handleNestedInputChange('utilities', 'internet', e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="internet_utility" className="text-sm font-medium text-gray-700">
              Internet
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="drainage"
              checked={formData.utilities.drainage || false}
              onChange={(e) => handleNestedInputChange('utilities', 'drainage', e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="drainage" className="text-sm font-medium text-gray-700">
              Drainage
            </label>
          </div>
        </div>
      </div>

      {/* Land-specific fields */}
      {formData.property_type === 'land' && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Land Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Topography
              </label>
              <select
                value={formData.topography || 'flat'}
                onChange={(e) => handleInputChange('topography', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="flat">Flat</option>
                <option value="hilly">Hilly</option>
                <option value="waterlogged">Waterlogged</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Documentation Type
              </label>
              <select
                value={formData.documentation?.lease_status || 'freehold'}
                onChange={(e) => handleNestedInputChange('documentation', 'lease_status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="freehold">Freehold</option>
                <option value="lease">Lease</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title Deed Available
              </label>
              <input
                type="text"
                value={formData.documentation?.title_deed || ''}
                onChange={(e) => handleNestedInputChange('documentation', 'title_deed', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Title deed information"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Land Certificate
              </label>
              <input
                type="text"
                value={formData.documentation?.land_certificate || ''}
                onChange={(e) => handleNestedInputChange('documentation', 'land_certificate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Land certificate information"
              />
            </div>
          </div>
        </div>
      )}

      {/* Pricing Information */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rent Price (GHS) *
            </label>
            <input
              type="number"
              min="0"
              value={formData.lease_terms.rent_price || ''}
              onChange={(e) => handleNestedInputChange('lease_terms', 'rent_price', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Monthly rent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Deposit (GHS) *
            </label>
            <input
              type="number"
              min="0"
              value={formData.lease_terms.deposit || ''}
              onChange={(e) => handleNestedInputChange('lease_terms', 'deposit', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Security deposit"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duration *
            </label>
            <select
              value={formData.lease_terms.duration || 'monthly'}
              onChange={(e) => handleNestedInputChange('lease_terms', 'duration', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="monthly">Monthly</option>
              <option value="annual">Annual</option>
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
            </select>
          </div>

          {/* Sale price for land */}
          {formData.property_type === 'land' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sale Price (GHS)
              </label>
              <input
                type="number"
                min="0"
                value={formData.pricing.sale_price || ''}
                onChange={(e) => handleNestedInputChange('pricing', 'sale_price', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Sale price"
              />
            </div>
          )}

          <div className="flex items-center">
            <input
              type="checkbox"
              id="flexible_terms"
              checked={formData.lease_terms.flexible_terms || false}
              onChange={(e) => handleNestedInputChange('lease_terms', 'flexible_terms', e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="flexible_terms" className="text-sm font-medium text-gray-700">
              Flexible Terms
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="negotiable"
              checked={formData.pricing.negotiable || false}
              onChange={(e) => handleNestedInputChange('pricing', 'negotiable', e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="negotiable" className="text-sm font-medium text-gray-700">
              Price Negotiable
            </label>
          </div>
        </div>

        {/* Additional lease terms */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cancellation Policy
            </label>
            <textarea
              value={formData.lease_terms.cancellation_policy || ''}
              onChange={(e) => handleNestedInputChange('lease_terms', 'cancellation_policy', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="Cancellation terms..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Security Requirements
            </label>
            <textarea
              value={formData.lease_terms.security_requirements || ''}
              onChange={(e) => handleNestedInputChange('lease_terms', 'security_requirements', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="Security requirements..."
            />
          </div>
        </div>
      </div>

      {/* Owner/Agent Information */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Owner/Agent Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Name *
            </label>
            <input
              type="text"
              value={formData.owner_info.name || ''}
              onChange={(e) => handleNestedInputChange('owner_info', 'name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Owner or agent name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Type
            </label>
            <select
              value={formData.owner_info.type || 'owner'}
              onChange={(e) => handleNestedInputChange('owner_info', 'type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="owner">Owner</option>
              <option value="agent">Agent</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number *
            </label>
            <input
              type="tel"
              value={formData.owner_info.phone || ''}
              onChange={(e) => handleNestedInputChange('owner_info', 'phone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Phone number"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              value={formData.owner_info.email || ''}
              onChange={(e) => handleNestedInputChange('owner_info', 'email', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Email address"
              required
            />
          </div>
        </div>
      </div>

      {/* Availability Information */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Availability</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Availability Status
            </label>
            <select
              value={formData.availability.status || 'available'}
              onChange={(e) => handleNestedInputChange('availability', 'status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="available">Available</option>
              <option value="occupied">Occupied</option>
              <option value="maintenance">Under Maintenance</option>
              <option value="reserved">Reserved</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Available From
            </label>
            <input
              type="date"
              value={formData.availability.available_from || ''}
              onChange={(e) => handleNestedInputChange('availability', 'available_from', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Booking Rules
          </label>
          <textarea
            value={formData.availability.booking_rules || ''}
            onChange={(e) => handleNestedInputChange('availability', 'booking_rules', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="Booking rules and requirements..."
          />
        </div>
      </div>
    </div>
  )
}

export default UnitDescription