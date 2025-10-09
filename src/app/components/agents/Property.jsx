'use client'
import React, { useState, useEffect } from 'react'
import { agentProperties, homeowners } from '../Data/Data'

const Property = ({ propertySlug }) => {
  const [activeTab, setActiveTab] = useState('description')
  const [propertyData, setPropertyData] = useState(null)
  const [formData, setFormData] = useState({})

  // Fetch property data when component mounts
  useEffect(() => {
    if (propertySlug !== 'addNewProperty') {
      const property = agentProperties.find(prop => prop.slug === propertySlug)
      if (property) {
        setPropertyData(property)
        // Initialize form data with property data
        setFormData({
          propertyTitle: property.propertyName || '',
          description: property.description || '',
          propertyType: property.categorization?.sector?.toLowerCase() || '',
          listingType: property.categorization?.purpose?.toLowerCase() || '',
          furnishing: property.details?.furnished ? 'fully-furnished' : 'unfurnished',
          price: property.price || '',
          priceUnit: property.categorization?.purpose === 'Rent' ? 'per-month' : 'outright',
          negotiable: 'yes',
          availableFrom: property.listingDate || '',
          availability: property.status?.toLowerCase() || 'available',
          propertyStatus: 'completed',
          salesStatus: property.status === 'Rented Out' ? 'deal-closed' : 'active',
          bedrooms: property.details?.bedrooms || '',
          bathrooms: property.details?.washrooms || '',
          toilets: property.details?.washrooms || '',
          floors: property.details?.floor || '',
          floorArea: property.details?.areaSqFt || '',
          landArea: '',
          parkingSpaces: property.details?.parking ? '2' : '0',
          country: property.address?.country || '',
          region: property.address?.state || '',
          city: property.address?.city || '',
          neighborhood: property.address?.neighborhood || '',
          streetAddress: property.address?.street || '',
          postalCode: '',
          latitude: '',
          longitude: '',
          locationDescription: '',
          virtualTourUrl: '',
          videoUrl: property.videoUrl || '',
          homeowner: property.homeowner || ''
        })
      }
    }
  }, [propertySlug])

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Handle save changes
  const handleSaveChanges = () => {
    console.log('Saving changes:', formData)
    // Here you would typically make an API call to save the changes
    alert('Changes saved successfully!')
  }

  // Handle delete property
  const handleDeleteProperty = () => {
    if (confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
      console.log('Deleting property:', propertySlug)
      // Here you would typically make an API call to delete the property
      alert('Property deleted successfully!')
    }
  }

  // Get assigned homeowners for the current agent (assuming agent ID 12345 for demo)
  const assignedHomeowners = homeowners.filter(homeowner =>
    homeowner.assignedAgents.includes('12345')
  )

  // Sub-component: Property Description
  const PropertyDescription = () => {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h3 className="text-lg font-semibold text-primary_color mb-4">Property Description</h3>
        <div className="space-y-6">
          {/* Basic Information Section */}
          <div>
            <h4 className="text-md font-semibold text-primary_color mb-3 border-b border-gray-200 pb-2">Basic Information</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary_color mb-2">
                  Property Title
                </label>
                <input
                  type="text"
                  placeholder="e.g., Spacious 3BR Home in East Legon"
                  value={formData.propertyTitle || ''}
                  onChange={(e) => handleInputChange('propertyTitle', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary_color focus:border-transparent text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary_color mb-2">
                  Homeowner
                </label>
                <select 
                  value={formData.homeowner || ''}
                  onChange={(e) => handleInputChange('homeowner', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary_color focus:border-transparent text-sm"
                >
                  <option value="">Select homeowner</option>
                  {assignedHomeowners.map((homeowner) => (
                    <option key={homeowner.id} value={homeowner.id}>
                      {homeowner.name} - {homeowner.totalProperties} properties
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Choose the homeowner this property belongs to
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-primary_color mb-2">
                  Description
                </label>
                <textarea
                  rows={4}
                  placeholder="Describe the property features, amenities, and highlights..."
                  value={formData.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary_color focus:border-transparent text-sm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary_color mb-2">
                    Property Type
                  </label>
                  <select 
                    value={formData.propertyType || ''}
                    onChange={(e) => handleInputChange('propertyType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary_color focus:border-transparent text-sm"
                  >
                    <option value="">Select type</option>
                    <option value="apartment">Apartment</option>
                    <option value="house">House</option>
                    <option value="duplex">Duplex</option>
                    <option value="studio">Studio</option>
                    <option value="office">Office</option>
                    <option value="land">Land</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-primary_color mb-2">
                    Listing Type
                  </label>
                  <select 
                    value={formData.listingType || ''}
                    onChange={(e) => handleInputChange('listingType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary_color focus:border-transparent text-sm"
                  >
                    <option value="">Select type</option>
                    <option value="rent">Rent</option>
                    <option value="sale">Sale</option>
                    <option value="lease">Lease</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-primary_color mb-2">
                    Furnishing
                  </label>
                  <select 
                    value={formData.furnishing || ''}
                    onChange={(e) => handleInputChange('furnishing', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary_color focus:border-transparent text-sm"
                  >
                    <option value="">Select furnishing</option>
                    <option value="unfurnished">Unfurnished</option>
                    <option value="semi-furnished">Semi-furnished</option>
                    <option value="fully-furnished">Fully furnished</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Section */}
          <div>
            <h4 className="text-md font-semibold text-primary_color mb-3 border-b border-gray-200 pb-2">Pricing & Availability</h4>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary_color mb-2">
                    Price
                  </label>
                  <input
                    type="number"
                    placeholder="Enter price"
                    value={formData.price || ''}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary_color focus:border-transparent text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-primary_color mb-2">
                    Price Unit
                  </label>
                  <select 
                    value={formData.priceUnit || ''}
                    onChange={(e) => handleInputChange('priceUnit', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary_color focus:border-transparent text-sm"
                  >
                    <option value="">Select unit</option>
                    <option value="per-month">Per Month</option>
                    <option value="per-year">Per Year</option>
                    <option value="outright">Outright Sale</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-primary_color mb-2">
                    Negotiable
                  </label>
                  <select 
                    value={formData.negotiable || ''}
                    onChange={(e) => handleInputChange('negotiable', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary_color focus:border-transparent text-sm"
                  >
                    <option value="">Select option</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary_color mb-2">
                    Available From
                  </label>
                  <input
                    type="date"
                    value={formData.availableFrom || ''}
                    onChange={(e) => handleInputChange('availableFrom', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary_color focus:border-transparent text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-primary_color mb-2">
                    Availability
                  </label>
                  <select 
                    value={formData.availability || ''}
                    onChange={(e) => handleInputChange('availability', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary_color focus:border-transparent text-sm"
                  >
                    <option value="">Select availability</option>
                    <option value="available">Available</option>
                    <option value="unavailable">Unavailable</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Status Section */}
          <div>
            <h4 className="text-md font-semibold text-primary_color mb-3 border-b border-gray-200 pb-2">Status Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-primary_color mb-2">
                  Property Status
                </label>
                <select 
                  value={formData.propertyStatus || ''}
                  onChange={(e) => handleInputChange('propertyStatus', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary_color focus:border-transparent text-sm"
                >
                  <option value="">Select status</option>
                  <option value="under-construction">Under Construction</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="renovated">Renovated</option>
                  <option value="old">Old</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-primary_color mb-2">
                  Sales Status
                </label>
                <select 
                  value={formData.salesStatus || ''}
                  onChange={(e) => handleInputChange('salesStatus', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary_color focus:border-transparent text-sm"
                >
                  <option value="">Select sales status</option>
                  <option value="deal-closed">Deal Closed</option>
                  <option value="pending">Pending</option>
                  <option value="lost">Lost</option>
                  <option value="active">Active</option>
                </select>
              </div>
            </div>
          </div>

          {/* Property Details Section */}
          <div>
            <h4 className="text-md font-semibold text-primary_color mb-3 border-b border-gray-200 pb-2">Property Details</h4>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary_color mb-2">
                    Bedrooms
                  </label>
                  <input
                    type="number"
                    placeholder="Number of bedrooms"
                    value={formData.bedrooms || ''}
                    onChange={(e) => handleInputChange('bedrooms', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary_color focus:border-transparent text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-primary_color mb-2">
                    Bathrooms
                  </label>
                  <input
                    type="number"
                    placeholder="Number of bathrooms"
                    value={formData.bathrooms || ''}
                    onChange={(e) => handleInputChange('bathrooms', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary_color focus:border-transparent text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-primary_color mb-2">
                    Toilets
                  </label>
                  <input
                    type="number"
                    placeholder="Number of toilets"
                    value={formData.toilets || ''}
                    onChange={(e) => handleInputChange('toilets', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary_color focus:border-transparent text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-primary_color mb-2">
                    Floors
                  </label>
                  <input
                    type="number"
                    placeholder="Number of floors"
                    value={formData.floors || ''}
                    onChange={(e) => handleInputChange('floors', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary_color focus:border-transparent text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary_color mb-2">
                    Floor Area (sqm)
                  </label>
                  <input
                    type="number"
                    placeholder="Interior space"
                    value={formData.floorArea || ''}
                    onChange={(e) => handleInputChange('floorArea', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary_color focus:border-transparent text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-primary_color mb-2">
                    Land Area (sqm)
                  </label>
                  <input
                    type="number"
                    placeholder="Land area for houses/lands"
                    value={formData.landArea || ''}
                    onChange={(e) => handleInputChange('landArea', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary_color focus:border-transparent text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Sub-component: Property Amenities
  const PropertyAmenities = () => {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h3 className="text-lg font-semibold text-primary_color mb-4">Amenities & Features</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary_color mb-2">
              Parking Spaces
            </label>
            <input
              type="number"
              placeholder="Number of parking spaces"
              value={formData.parkingSpaces || ''}
              onChange={(e) => handleInputChange('parkingSpaces', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary_color focus:border-transparent text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary_color mb-2">
              Amenities
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                'Air Conditioning', 'Borehole', 'WiFi', 'CCTV', 'Balcony', 'Pool',
                'Gym', 'Garden', 'Terrace', 'Storage', 'Elevator', 'Security',
                'Water Heater', 'Kitchen Appliances', 'Wardrobes', 'Study Room',
                'Guest Room', 'Servant Quarters', 'Generator', 'Solar Panels'
              ].map((amenity) => (
                <label key={amenity} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-primary_color focus:ring-primary_color"
                  />
                  <span className="text-sm text-gray-700">{amenity}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary_color mb-2">
              Security Features
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                'Gated Community', 'CCTV', '24/7 Security', 'Security Guard',
                'Alarm System', 'Intercom', 'Access Control', 'Fire Safety'
              ].map((feature) => (
                <label key={feature} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-primary_color focus:ring-primary_color"
                  />
                  <span className="text-sm text-gray-700">{feature}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary_color mb-2">
              Accessibility Features
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                'Wheelchair Friendly', 'Elevator', 'Ramp Access', 'Wide Doorways',
                'Grab Bars', 'Low Countertops', 'Accessible Parking'
              ].map((feature) => (
                <label key={feature} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-primary_color focus:ring-primary_color"
                  />
                  <span className="text-sm text-gray-700">{feature}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Sub-component: Property Media
  const PropertyMedia = () => {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h3 className="text-lg font-semibold text-primary_color mb-4">Property Media</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary_color mb-2">
              Upload Images (Minimum 6)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <div className="text-gray-500">
                <svg className="mx-auto h-12 w-12 mb-4" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="text-sm">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-400">PNG, JPG, GIF up to 10MB (Minimum 6 images)</p>
              </div>
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-primary_color mb-2">
                Virtual Tour URL
              </label>
              <input
                type="url"
                placeholder="https://example.com/virtual-tour"
                value={formData.virtualTourUrl || ''}
                onChange={(e) => handleInputChange('virtualTourUrl', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary_color focus:border-transparent text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-primary_color mb-2">
                Video URL (Optional)
              </label>
              <input
                type="url"
                placeholder="https://example.com/video.mp4"
                value={formData.videoUrl || ''}
                onChange={(e) => handleInputChange('videoUrl', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary_color focus:border-transparent text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary_color mb-2">
              Floor Plan(s)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <div className="text-gray-500">
                <svg className="mx-auto h-12 w-12 mb-4" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="text-sm">Upload floor plan images</p>
                <p className="text-xs text-gray-400">PDF, PNG, JPG up to 5MB</p>
              </div>
              <input
                type="file"
                multiple
                accept=".pdf,image/*"
                className="hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-100 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-500">Main Image</p>
            </div>
            <div className="bg-gray-100 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-500">Image 2</p>
            </div>
            <div className="bg-gray-100 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-500">Image 3</p>
            </div>
            <div className="bg-gray-100 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-500">Image 4</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Sub-component: Property Location
  const PropertyLocation = () => {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h3 className="text-lg font-semibold text-primary_color mb-4">Property Location</h3>
        <div className="space-y-4">
          {/* Location Search Bar */}
          <div>
            <label className="block text-sm font-medium text-primary_color mb-2">
              Search Location
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search for city, area, or landmark..."
                className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary_color focus:border-transparent text-sm"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">Type to search for cities, neighborhoods, or landmarks</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-primary_color mb-2">
                Country
              </label>
              <select 
                value={formData.country || ''}
                onChange={(e) => handleInputChange('country', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary_color focus:border-transparent text-sm"
              >
                <option value="">Select country</option>
                <option value="Ghana">Ghana</option>
                <option value="Nigeria">Nigeria</option>
                <option value="Kenya">Kenya</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-primary_color mb-2">
                Region
              </label>
              <select 
                value={formData.region || ''}
                onChange={(e) => handleInputChange('region', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary_color focus:border-transparent text-sm"
              >
                <option value="">Select region</option>
                <option value="Greater Accra">Greater Accra</option>
                <option value="Ashanti Region">Ashanti Region</option>
                <option value="Western Region">Western Region</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-primary_color mb-2">
                City
              </label>
              <input
                type="text"
                placeholder="e.g., Accra"
                value={formData.city || ''}
                onChange={(e) => handleInputChange('city', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary_color focus:border-transparent text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-primary_color mb-2">
                Area/Neighborhood
              </label>
              <input
                type="text"
                placeholder="e.g., East Legon"
                value={formData.neighborhood || ''}
                onChange={(e) => handleInputChange('neighborhood', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary_color focus:border-transparent text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary_color mb-2">
              Street Address
            </label>
            <input
              type="text"
              placeholder="Enter street address"
              value={formData.streetAddress || ''}
              onChange={(e) => handleInputChange('streetAddress', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary_color focus:border-transparent text-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-primary_color mb-2">
                Postal Code
              </label>
              <input
                type="text"
                placeholder="Enter postal code"
                value={formData.postalCode || ''}
                onChange={(e) => handleInputChange('postalCode', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary_color focus:border-transparent text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-primary_color mb-2">
                Latitude
              </label>
              <input
                type="number"
                step="any"
                placeholder="Enter latitude"
                value={formData.latitude || ''}
                onChange={(e) => handleInputChange('latitude', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary_color focus:border-transparent text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-primary_color mb-2">
                Longitude
              </label>
              <input
                type="number"
                step="any"
                placeholder="Enter longitude"
                value={formData.longitude || ''}
                onChange={(e) => handleInputChange('longitude', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary_color focus:border-transparent text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary_color mb-2">
              Location Description
            </label>
            <textarea
              rows={3}
              placeholder="Highlights about the location (e.g., close to mall, beach view, schools nearby)"
              value={formData.locationDescription || ''}
              onChange={(e) => handleInputChange('locationDescription', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary_color focus:border-transparent text-sm"
            />
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-primary_color mb-2">Map Preview</h4>
            <div className="h-48 bg-gray-200 rounded-lg flex items-center justify-center">
              <p className="text-gray-500 text-sm">Map will be displayed here</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {propertySlug === 'addNewProperty' ? (
        <div className="space-y-6">
          <div className="text-left mb-8">
            <h3 className=" font-bold text-primary_color mb-2">Adding New Property</h3>
            <p className="text-sm text-gray-600">Fill in the details below to add a new property to your listings.</p>
          </div>
          
          {/* Tab Buttons */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setActiveTab('description')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                activeTab === 'description'
                  ? 'bg-primary_color text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Description
            </button>
            <button
              onClick={() => setActiveTab('amenities')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                activeTab === 'amenities'
                  ? 'bg-primary_color text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Amenities
            </button>
            <button
              onClick={() => setActiveTab('media')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                activeTab === 'media'
                  ? 'bg-primary_color text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Media
            </button>
            <button
              onClick={() => setActiveTab('location')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                activeTab === 'location'
                  ? 'bg-primary_color text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Location
            </button>
          </div>
          
          {/* Conditional Component Rendering */}
          {activeTab === 'description' && <PropertyDescription />}
          {activeTab === 'amenities' && <PropertyAmenities />}
          {activeTab === 'media' && <PropertyMedia />}
          {activeTab === 'location' && <PropertyLocation />}
          
          {/* Save Button */}
          <div className="flex justify-center mx-auto">
            <button className="px-6 py-2 bg-primary_color text-white rounded-lg hover:bg-primary_color/90 transition-colors duration-200 text-sm">
              Save Property
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="text-left mb-8">
            <div className='flex justify-between items-start flex-wrap'> 
            <h3 className=" font-bold text-primary_color mb-2">Property Details</h3>
            <button 
              onClick={handleDeleteProperty}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 text-sm"
            >
              Delete Property
            </button>
            </div>
           
            <p className="text-sm text-gray-600">
              {propertyData ? `Editing: ${propertyData.propertyName}` : `Viewing property details for: ${propertySlug}`}
            </p>
          </div>
          
          {/* Tab Buttons */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setActiveTab('description')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                activeTab === 'description'
                  ? 'bg-primary_color text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Description
            </button>
            <button
              onClick={() => setActiveTab('amenities')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                activeTab === 'amenities'
                  ? 'bg-primary_color text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Amenities
            </button>
            <button
              onClick={() => setActiveTab('media')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                activeTab === 'media'
                  ? 'bg-primary_color text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Media
            </button>
            <button
              onClick={() => setActiveTab('location')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                activeTab === 'location'
                  ? 'bg-primary_color text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Location
            </button>
          </div>
          
          {/* Conditional Component Rendering */}
          {activeTab === 'description' && <PropertyDescription />}
          {activeTab === 'amenities' && <PropertyAmenities />}
          {activeTab === 'media' && <PropertyMedia />}
          {activeTab === 'location' && <PropertyLocation />}
          
          {/* Action Buttons for Existing Properties */}
          <div className="flex justify-center gap-4 mx-auto">
            <button 
              onClick={handleSaveChanges}
              className="px-6 py-2 bg-primary_color text-white rounded-lg hover:bg-primary_color/90 transition-colors duration-200 text-sm"
            >
              Save Changes
            </button>
         
          </div>
        </div>
      )}
    </div>
  )
}

export default Property
