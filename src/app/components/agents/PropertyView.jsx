import React, { useState } from 'react'

const PropertyView = ({ propertySlug }) => {
  const [activeTab, setActiveTab] = useState('description')

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
                <p className="w-full px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-700">Spacious 3BR Home in East Legon</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-primary_color mb-2">
                  Description
                </label>
                <p className="w-full px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-700 min-h-[6rem]">
                  This beautiful 3-bedroom home features modern amenities, spacious rooms, and a prime location in East Legon. Perfect for families looking for comfort and convenience.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary_color mb-2">
                    Property Type
                  </label>
                  <p className="w-full px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-700">House</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-primary_color mb-2">
                    Listing Type
                  </label>
                  <p className="w-full px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-700">Rent</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-primary_color mb-2">
                    Furnishing
                  </label>
                  <p className="w-full px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-700">Fully furnished</p>
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
                  <p className="w-full px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-700">$2,500</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-primary_color mb-2">
                    Price Unit
                  </label>
                  <p className="w-full px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-700">Per Month</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-primary_color mb-2">
                    Negotiable
                  </label>
                  <p className="w-full px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-700">Yes</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary_color mb-2">
                    Available From
                  </label>
                  <p className="w-full px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-700">2024-01-15</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-primary_color mb-2">
                    Availability
                  </label>
                  <p className="w-full px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-700">Available</p>
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
                <p className="w-full px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-700">Completed</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-primary_color mb-2">
                  Sales Status
                </label>
                <p className="w-full px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-700">Active</p>
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
                  <p className="w-full px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-700">3</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-primary_color mb-2">
                    Bathrooms
                  </label>
                  <p className="w-full px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-700">2</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-primary_color mb-2">
                    Toilets
                  </label>
                  <p className="w-full px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-700">3</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-primary_color mb-2">
                    Floors
                  </label>
                  <p className="w-full px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-700">2</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary_color mb-2">
                    Floor Area (sqm)
                  </label>
                  <p className="w-full px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-700">180</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-primary_color mb-2">
                    Land Area (sqm)
                  </label>
                  <p className="w-full px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-700">250</p>
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
            <p className="w-full px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-700">2</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary_color mb-2">
              Amenities
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {['Air Conditioning', 'WiFi', 'CCTV', 'Balcony', 'Garden', 'Security', 'Water Heater', 'Kitchen Appliances'].map((amenity) => (
                <div key={amenity} className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-green-100 rounded flex items-center justify-center">
                    <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-700">{amenity}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary_color mb-2">
              Security Features
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {['Gated Community', 'CCTV', '24/7 Security', 'Security Guard'].map((feature) => (
                <div key={feature} className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-green-100 rounded flex items-center justify-center">
                    <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary_color mb-2">
              Accessibility Features
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {['Wheelchair Friendly', 'Ramp Access', 'Wide Doorways'].map((feature) => (
                <div key={feature} className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-green-100 rounded flex items-center justify-center">
                    <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-700">{feature}</span>
                </div>
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-100 rounded-lg p-4 text-center">
              <img src="/placeholder-property-1.jpg" alt="Property" className="w-full h-32 object-cover rounded mb-2" />
              <p className="text-sm text-gray-500">Main Image</p>
            </div>
            <div className="bg-gray-100 rounded-lg p-4 text-center">
              <img src="/placeholder-property-2.jpg" alt="Property" className="w-full h-32 object-cover rounded mb-2" />
              <p className="text-sm text-gray-500">Image 2</p>
            </div>
            <div className="bg-gray-100 rounded-lg p-4 text-center">
              <img src="/placeholder-property-3.jpg" alt="Property" className="w-full h-32 object-cover rounded mb-2" />
              <p className="text-sm text-gray-500">Image 3</p>
            </div>
            <div className="bg-gray-100 rounded-lg p-4 text-center">
              <img src="/placeholder-property-4.jpg" alt="Property" className="w-full h-32 object-cover rounded mb-2" />
              <p className="text-sm text-gray-500">Image 4</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-primary_color mb-2">
                Virtual Tour URL
              </label>
              <p className="w-full px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-700">https://example.com/virtual-tour</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-primary_color mb-2">
                Video URL
              </label>
              <p className="w-full px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-700">https://example.com/video.mp4</p>
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
            <p className="w-full px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-700">East Legon, Accra, Ghana</p>
            <p className="text-xs text-gray-500 mt-1">Type to search for cities, neighborhoods, or landmarks</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-primary_color mb-2">
                Country
              </label>
              <p className="w-full px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-700">Ghana</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-primary_color mb-2">
                Region
              </label>
              <p className="w-full px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-700">Greater Accra</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-primary_color mb-2">
                City
              </label>
              <p className="w-full px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-700">Accra</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-primary_color mb-2">
                Area/Neighborhood
              </label>
              <p className="w-full px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-700">East Legon</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary_color mb-2">
              Street Address
            </label>
            <p className="w-full px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-700">123 East Legon Street</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-primary_color mb-2">
                Postal Code
              </label>
              <p className="w-full px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-700">00233</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-primary_color mb-2">
                Latitude
              </label>
              <p className="w-full px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-700">5.5600</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-primary_color mb-2">
                Longitude
              </label>
              <p className="w-full px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-700">-0.2057</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary_color mb-2">
              Location Description
            </label>
            <p className="w-full px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-700 min-h-[4rem]">
              Prime location in East Legon, close to shopping malls, international schools, and major highways. Excellent accessibility and security.
            </p>
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
      <div className="space-y-6">
        <div className="text-left mb-8">
          <h3 className=" font-bold text-primary_color mb-2">Property Details</h3>
          <p className="text-sm text-gray-600">Viewing property details for: {propertySlug}</p>
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
      </div>
    </div>
  )
}

export default PropertyView

/*
Usage Examples:

1. For homeowners viewing properties:
   import PropertyView from '@/app/components/agents/PropertyView'
   
   const HomeownerPropertyPage = () => {
     return (
       <div>
         <h1>Property Details</h1>
         <PropertyView propertySlug="property-123" />
       </div>
     )
   }

2. For public property listings:
   import PropertyView from '@/app/components/agents/PropertyView'
   
   const PublicPropertyPage = () => {
     return (
       <div>
         <h1>Property Listing</h1>
         <PropertyView propertySlug="property-123" />
       </div>
     )
   }

3. For any read-only property display:
   <PropertyView propertySlug="property-123" />

The PropertyView component is designed for read-only display of property information.
It shows all property details in a clean, organized format without any input fields or edit functionality.
*/ 