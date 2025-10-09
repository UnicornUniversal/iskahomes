"use client"
import React, { useState, useEffect } from 'react'

const UnitAmenities = ({ formData, updateFormData, mode }) => {
  const [amenitiesData, setAmenitiesData] = useState({
    database: [],
    loading: true
  })
  const [customAmenity, setCustomAmenity] = useState('')

  // Fetch amenities from database
  useEffect(() => {
    const fetchAmenities = async () => {
      try {
        setAmenitiesData(prev => ({ ...prev, loading: true }))
        
        const response = await fetch('/api/admin/property-amenities')
        if (response.ok) {
          const data = await response.json()
          setAmenitiesData({
            database: data.data || data || [],
            loading: false
          })
        } else {
          console.error('Failed to fetch amenities')
          setAmenitiesData(prev => ({ ...prev, loading: false }))
        }
      } catch (error) {
        console.error('Error fetching amenities:', error)
        setAmenitiesData(prev => ({ ...prev, loading: false }))
      }
    }

    fetchAmenities()
  }, [])

  // Property type specific amenity categories
  const getAmenityCategories = () => {
    switch (formData.property_type) {
      case 'houses':
      case 'apartments':
        return [
          'Kitchen & Dining',
          'Living & Entertainment',
          'Bedroom & Bathroom',
          'Outdoor & Garden',
          'Security & Safety',
          'Utilities & Services',
          'Parking & Storage'
        ]
      case 'offices':
        return [
          'Workspace Features',
          'Meeting & Conference',
          'Technology & Internet',
          'Security & Access',
          'Parking & Transportation',
          'Food & Beverage',
          'Recreation & Wellness'
        ]
      case 'warehouses':
        return [
          'Storage & Handling',
          'Loading & Access',
          'Security & Safety',
          'Utilities & Power',
          'Climate Control',
          'Equipment & Machinery',
          'Transportation'
        ]
      case 'event_centers':
        return [
          'Event Facilities',
          'Audio & Visual',
          'Catering & Food',
          'Seating & Tables',
          'Parking & Access',
          'Security & Safety',
          'Services & Support'
        ]
      case 'land':
        return [
          'Access & Roads',
          'Utilities & Services',
          'Topography & Features',
          'Zoning & Permits',
          'Security & Boundaries',
          'Environmental',
          'Development Potential'
        ]
      default:
        return ['General']
    }
  }

  const getGeneralAmenities = () => {
    switch (formData.property_type) {
      case 'houses':
      case 'apartments':
        return [
          'Air Conditioning',
          'Heating',
          'WiFi',
          'Cable TV',
          'Washing Machine',
          'Dryer',
          'Dishwasher',
          'Microwave',
          'Refrigerator',
          'Stove',
          'Balcony',
          'Terrace',
          'Garden',
          'Swimming Pool',
          'Gym',
          'Sauna',
          'Security System',
          'CCTV',
          'Intercom',
          'Parking Space',
          'Storage Room',
          'Elevator',
          'Pet Friendly',
          'Furnished',
          'Near Public Transport'
        ]
      case 'offices':
        return [
          'High-Speed Internet',
          'WiFi',
          'Air Conditioning',
          'Heating',
          'Reception Service',
          'Cleaning Service',
          'Security System',
          'CCTV',
          'Access Control',
          'Parking Space',
          'Elevator',
          'Kitchenette',
          'Coffee Machine',
          'Printer/Scanner',
          'Whiteboard',
          'Projector',
          'Phone System',
          'Mail Handling',
          'Flexible Hours',
          'Meeting Rooms',
          'Breakout Areas',
          'Quiet Zones',
          'Natural Light',
          'Near Public Transport',
          'Near Restaurants'
        ]
      case 'warehouses':
        return [
          'Loading Docks',
          'Forklift Access',
          'Crane Access',
          'Rail Access',
          'High Ceilings',
          'Wide Aisles',
          'Climate Control',
          'Security System',
          'CCTV',
          'Access Control',
          'Fire Suppression',
          'Sprinkler System',
          'Emergency Exits',
          'Office Space',
          'Restrooms',
          'Parking Space',
          'Truck Parking',
          'Power Supply',
          'Backup Generator',
          'Water Supply',
          'Drainage',
          'Insulation',
          'Ventilation',
          'Near Highways',
          'Near Ports'
        ]
      case 'event_centers':
        return [
          'Stage',
          'Lighting System',
          'Sound System',
          'Microphones',
          'Projector',
          'Screens',
          'Chairs',
          'Tables',
          'Linens',
          'Catering Kitchen',
          'Bar Area',
          'Dance Floor',
          'Bridal Suite',
          'Changing Rooms',
          'Parking Space',
          'Valet Service',
          'Security',
          'CCTV',
          'Air Conditioning',
          'Heating',
          'Restrooms',
          'Accessibility',
          'Outdoor Space',
          'Garden Area',
          'Near Hotels'
        ]
      case 'land':
        return [
          'Road Access',
          'Paved Roads',
          'Street Lighting',
          'Water Supply',
          'Electricity',
          'Sewer System',
          'Internet',
          'Phone Lines',
          'Gas Lines',
          'Drainage',
          'Surveyed',
          'Title Deed',
          'Building Permit',
          'Zoning Approval',
          'Environmental Clearance',
          'Security Fence',
          'Gate',
          'CCTV',
          'Near Schools',
          'Near Hospitals',
          'Near Shopping',
          'Near Public Transport',
          'Near Airport',
          'Scenic Views',
          'Development Ready'
        ]
      default:
        return []
    }
  }

  const handleDatabaseAmenityToggle = (amenity) => {
    const isSelected = formData.amenities.database.some(a => a.id === amenity.id)
    
    if (isSelected) {
      // Remove amenity
      updateFormData({
        amenities: {
          ...formData.amenities,
          database: formData.amenities.database.filter(a => a.id !== amenity.id)
        }
      })
    } else {
      // Add amenity
      updateFormData({
        amenities: {
          ...formData.amenities,
          database: [...formData.amenities.database, amenity]
        }
      })
    }
  }

  const handleGeneralAmenityToggle = (amenity) => {
    const isSelected = formData.amenities.general.includes(amenity)
    
    if (isSelected) {
      // Remove amenity
      updateFormData({
        amenities: {
          ...formData.amenities,
          general: formData.amenities.general.filter(a => a !== amenity)
        }
      })
    } else {
      // Add amenity
      updateFormData({
        amenities: {
          ...formData.amenities,
          general: [...formData.amenities.general, amenity]
        }
      })
    }
  }

  const handleCustomAmenityAdd = () => {
    if (customAmenity.trim() && !formData.amenities.custom.includes(customAmenity.trim())) {
      updateFormData({
        amenities: {
          ...formData.amenities,
          custom: [...formData.amenities.custom, customAmenity.trim()]
        }
      })
      setCustomAmenity('')
    }
  }

  const handleCustomAmenityRemove = (amenity) => {
    updateFormData({
      amenities: {
        ...formData.amenities,
        custom: formData.amenities.custom.filter(a => a !== amenity)
      }
    })
  }

  const getAmenitiesByCategory = (category) => {
    return amenitiesData.database.filter(amenity => 
      amenity.category === category || amenity.name.toLowerCase().includes(category.toLowerCase())
    )
  }

  const categories = getAmenityCategories()
  const generalAmenities = getGeneralAmenities()

  return (
    <div className="space-y-6">
      {/* Database Amenities */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Database Amenities</h3>
        
        {amenitiesData.loading ? (
          <div className="text-center py-4">
            <div className="text-gray-500">Loading amenities...</div>
          </div>
        ) : (
          <div className="space-y-4">
            {categories.map(category => {
              const categoryAmenities = getAmenitiesByCategory(category)
              if (categoryAmenities.length === 0) return null

              return (
                <div key={category}>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">{category}</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {categoryAmenities.map(amenity => {
                      const isSelected = formData.amenities.database.some(a => a.id === amenity.id)
                      return (
                        <label key={amenity.id} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleDatabaseAmenityToggle(amenity)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{amenity.name}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* General Amenities */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">General Amenities</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {generalAmenities.map(amenity => {
            const isSelected = formData.amenities.general.includes(amenity)
            return (
              <label key={amenity} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleGeneralAmenityToggle(amenity)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{amenity}</span>
              </label>
            )
          })}
        </div>
      </div>

      {/* Custom Amenities */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Custom Amenities</h3>
        
        <div className="space-y-4">
          <div className="flex space-x-2">
            <input
              type="text"
              value={customAmenity}
              onChange={(e) => setCustomAmenity(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCustomAmenityAdd()}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add custom amenity..."
            />
            <button
              type="button"
              onClick={handleCustomAmenityAdd}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Add
            </button>
          </div>

          {formData.amenities.custom.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.amenities.custom.map((amenity, index) => (
                <div key={index} className="flex items-center space-x-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                  <span>{amenity}</span>
                  <button
                    type="button"
                    onClick={() => handleCustomAmenityRemove(amenity)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Selected Amenities Summary */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">Selected Amenities Summary</h3>
        
        <div className="space-y-3">
          {formData.amenities.database.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-blue-800 mb-2">
                Database Amenities ({formData.amenities.database.length})
              </h4>
              <div className="flex flex-wrap gap-1">
                {formData.amenities.database.map(amenity => (
                  <span key={amenity.id} className="bg-blue-200 text-blue-800 px-2 py-1 rounded text-xs">
                    {amenity.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {formData.amenities.general.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-blue-800 mb-2">
                General Amenities ({formData.amenities.general.length})
              </h4>
              <div className="flex flex-wrap gap-1">
                {formData.amenities.general.map(amenity => (
                  <span key={amenity} className="bg-green-200 text-green-800 px-2 py-1 rounded text-xs">
                    {amenity}
                  </span>
                ))}
              </div>
            </div>
          )}

          {formData.amenities.custom.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-blue-800 mb-2">
                Custom Amenities ({formData.amenities.custom.length})
              </h4>
              <div className="flex flex-wrap gap-1">
                {formData.amenities.custom.map(amenity => (
                  <span key={amenity} className="bg-purple-200 text-purple-800 px-2 py-1 rounded text-xs">
                    {amenity}
                  </span>
                ))}
              </div>
            </div>
          )}

          {formData.amenities.database.length === 0 && 
           formData.amenities.general.length === 0 && 
           formData.amenities.custom.length === 0 && (
            <p className="text-blue-700 text-sm">No amenities selected yet.</p>
          )}
        </div>
      </div>

      {/* Amenities Guidelines */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-sm font-semibold text-gray-900 mb-2">Amenities Guidelines</h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• <strong>Database Amenities:</strong> Pre-defined amenities from our database</li>
          <li>• <strong>General Amenities:</strong> Common amenities for this property type</li>
          <li>• <strong>Custom Amenities:</strong> Add specific amenities unique to your property</li>
          <li>• Select amenities that accurately represent your property's features</li>
          <li>• Amenities help potential tenants/ buyers understand what's included</li>
        </ul>
      </div>
    </div>
  )
}

export default UnitAmenities