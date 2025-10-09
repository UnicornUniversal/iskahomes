import React, { useState, useEffect } from 'react'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { cn } from '@/lib/utils'
// React Icons imports
import { FaDumbbell, FaCar, FaHome, FaGlassMartiniAlt, FaPaintBrush, FaBook, FaSwimmer, FaSpa, FaUtensils, FaCoffee, FaChild, FaSeedling, FaTableTennis, FaBasketballBall, FaLock, FaUserTie, FaWifi, FaTshirt, FaBoxOpen, FaDog, FaBicycle, FaCity, FaBriefcase, FaFilm, FaWineBottle, FaGolfBall, FaShip, FaHelicopter } from 'react-icons/fa'
import { FaElevator } from "react-icons/fa6";

const DevelopmentAmenities = ({ formData, updateFormData, isEditMode }) => {
  const [amenitiesData, setAmenitiesData] = useState({
    amenities: [],
    customAmenities: []
  })

  const [databaseAmenities, setDatabaseAmenities] = useState([])
  const [loadingAmenities, setLoadingAmenities] = useState(false)
  const [newCustomAmenity, setNewCustomAmenity] = useState('')
  const [showGeneralAmenities, setShowGeneralAmenities] = useState(false)

  // Initialize with form data
  useEffect(() => {
    if (formData.amenities) {
      setAmenitiesData(prev => ({
        ...prev,
        amenities: formData.amenities
      }));
    }
  }, [formData.amenities]);

  // Fetch amenities based on selected property types
  useEffect(() => {
    if (formData.types && formData.types.length > 0) {
      fetchAmenitiesForTypes(formData.types);
    } else {
      setDatabaseAmenities([]);
    }
  }, [formData.types]);

  const fetchAmenitiesForTypes = async (propertyTypeIds) => {
    setLoadingAmenities(true);
    try {
      const response = await fetch('/api/admin/property-amenities');
      if (response.ok) {
        const result = await response.json();
        
        // Filter amenities that match any of the selected property types
        // Since property_type is now an array in the database, we need to check if any of the amenity's property types match our selected types
        const relevantAmenities = result.data?.filter(amenity => {
          const amenityPropertyTypes = Array.isArray(amenity.property_type) ? amenity.property_type : [amenity.property_type];
          return amenityPropertyTypes.some(type => propertyTypeIds.includes(type));
        }) || [];
        
        setDatabaseAmenities(relevantAmenities);
      } else {
        console.error('Failed to fetch amenities');
        setDatabaseAmenities([]);
      }
    } catch (error) {
      console.error('Error fetching amenities:', error);
      setDatabaseAmenities([]);
    } finally {
      setLoadingAmenities(false);
    }
  };

  const predefinedAmenities = [
    { id: 'gym', name: 'Gym', icon: <FaDumbbell />, description: 'Fitness center with modern equipment' },
    { id: 'parking', name: 'Parking Space', icon: <FaCar />, description: 'Designated parking areas' },
    { id: 'garage', name: 'Garage', icon: <FaHome />, description: 'Private garage spaces' },
    { id: 'bar', name: 'Bar', icon: <FaGlassMartiniAlt />, description: 'On-site bar and lounge' },
    { id: 'art-studio', name: 'Art Studio', icon: <FaPaintBrush />, description: 'Creative workspace for artists' },
    { id: 'library', name: 'Library', icon: <FaBook />, description: 'Quiet reading and study area' },
    { id: 'pool', name: 'Swimming Pool', icon: <FaSwimmer />, description: 'Outdoor or indoor swimming pool' },
    { id: 'spa', name: 'Spa & Wellness', icon: <FaSpa />, description: 'Relaxation and wellness center' },
    { id: 'restaurant', name: 'Restaurant', icon: <FaUtensils />, description: 'Fine dining restaurant' },
    { id: 'cafe', name: 'Café', icon: <FaCoffee />, description: 'Casual coffee shop' },
    { id: 'playground', name: 'Playground', icon: <FaChild />, description: "Children's play area" },
    { id: 'garden', name: 'Garden', icon: <FaSeedling />, description: 'Landscaped gardens and green spaces' },
    { id: 'tennis', name: 'Tennis Court', icon: <FaTableTennis />, description: 'Tennis facilities' },
    { id: 'basketball', name: 'Basketball Court', icon: <FaBasketballBall />, description: 'Basketball court' },
    { id: 'security', name: '24/7 Security', icon: <FaLock />, description: 'Round-the-clock security service' },
    { id: 'concierge', name: 'Concierge', icon: <FaUserTie />, description: 'Concierge services' },
    { id: 'elevator', name: 'Elevator', icon: <FaElevator />, description: 'Modern elevator system' },
    { id: 'wifi', name: 'High-Speed WiFi', icon: <FaWifi />, description: 'High-speed internet access' },
    { id: 'laundry', name: 'Laundry Room', icon: <FaTshirt />, description: 'On-site laundry facilities' },
    { id: 'storage', name: 'Storage Units', icon: <FaBoxOpen />, description: 'Additional storage space' },
    { id: 'pet-friendly', name: 'Pet Friendly', icon: <FaDog />, description: 'Pet-friendly policies' },
    { id: 'bike-storage', name: 'Bike Storage', icon: <FaBicycle />, description: 'Secure bicycle storage' },
    { id: 'rooftop', name: 'Rooftop Terrace', icon: <FaCity />, description: 'Rooftop gathering space' },
    { id: 'business-center', name: 'Business Center', icon: <FaBriefcase />, description: 'Professional workspace' },
    { id: 'movie-room', name: 'Movie Room', icon: <FaFilm />, description: 'Private cinema room' },
    { id: 'wine-cellar', name: 'Wine Cellar', icon: <FaWineBottle />, description: 'Temperature-controlled wine storage' },
    { id: 'golf', name: 'Golf Course', icon: <FaGolfBall />, description: 'Golf course access' },
    { id: 'marina', name: 'Marina', icon: <FaShip />, description: 'Boat docking facilities' },
    { id: 'helipad', name: 'Helipad', icon: <FaHelicopter />, description: 'Private helicopter landing pad' }
  ]

  const handleAmenityToggle = (amenityId, amenityType = 'general') => {
    const currentAmenities = formData.amenities || { database: [], general: [], custom: [] };
    const currentArray = currentAmenities[amenityType] || [];
    
    const updatedArray = currentArray.includes(amenityId)
      ? currentArray.filter(id => id !== amenityId)
      : [...currentArray, amenityId];
    
    const updatedAmenities = {
      ...currentAmenities,
      [amenityType]: updatedArray
    };
    
    setAmenitiesData(prev => ({
      ...prev,
      amenities: updatedAmenities
    }));
    
    updateFormData({
      amenities: updatedAmenities
    });
  }

  const handleCustomAmenityAdd = () => {
    if (newCustomAmenity.trim()) {
      const currentAmenities = formData.amenities || { database: [], general: [], custom: [] };
      const currentCustomAmenities = currentAmenities.custom || [];
      const newCustomAmenities = [...currentCustomAmenities, newCustomAmenity.trim()];
      
      const updatedAmenities = {
        ...currentAmenities,
        custom: newCustomAmenities
      };
      
      setAmenitiesData(prev => ({
        ...prev,
        amenities: updatedAmenities
      }));
      
      updateFormData({
        amenities: updatedAmenities
      });
      setNewCustomAmenity('');
    }
  }

  const handleCustomAmenityRemove = (index) => {
    const currentAmenities = formData.amenities || { database: [], general: [], custom: [] };
    const currentCustomAmenities = currentAmenities.custom || [];
    const newCustomAmenities = currentCustomAmenities.filter((_, i) => i !== index);
    
    const updatedAmenities = {
      ...currentAmenities,
      custom: newCustomAmenities
    };
    
    setAmenitiesData(prev => ({
      ...prev,
      amenities: updatedAmenities
    }));
    
    updateFormData({
      amenities: updatedAmenities
    });
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleCustomAmenityAdd()
    }
  }

  const getSelectedAmenities = () => {
    const generalAmenities = formData.amenities?.general || [];
    return predefinedAmenities.filter(amenity => 
      generalAmenities.includes(amenity.id)
    )
  }

  return (
    <div className="w-full  p-6 bg-white rounded-lg shadow-sm">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Development Amenities</h2>
        <p className="text-gray-600">
          {isEditMode ? 'Update the amenities available in your development' : 'Select the amenities available in your development project'}
        </p>
      </div>

      <div className="space-y-8">
        {/* Database Amenities (Category-based) */}
        {formData.types && formData.types.length > 0 ? (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Amenities for Selected Property Types
            </h3>
            {loadingAmenities ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Loading amenities...</p>
              </div>
            ) : databaseAmenities.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {databaseAmenities.map(amenity => (
                  <label
                    key={amenity.id}
                    className={cn(
                      "flex items-start space-x-3 p-4 border rounded-lg cursor-pointer transition-all hover:bg-gray-50",
                      (formData.amenities?.database || []).includes(amenity.id.toString())
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={(formData.amenities?.database || []).includes(amenity.id.toString())}
                      onChange={() => handleAmenityToggle(amenity.id.toString(), 'database')}
                      className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        {amenity.icon ? (
                          <img 
                            src={amenity.icon} 
                            alt={amenity.name}
                            className="w-6 h-6 object-contain"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'inline';
                            }}
                          />
                        ) : null}
                        <span className="text-xl" style={{ display: amenity.icon ? 'none' : 'inline' }}>🏢</span>
                        <span className="font-medium text-gray-900">{amenity.name}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{amenity.description || 'No description available'}</p>
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No specific amenities found for the selected property types.</p>
                <p className="text-sm mt-1">You can still select from the general amenities below.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>Please select property types first to see relevant amenities.</p>
          </div>
        )}

        {/* Selected Amenities Summary - Show First */}
        {(() => {
          const selectedDatabaseAmenities = formData.amenities?.database || [];
          const generalAmenities = formData.amenities?.general || [];
          const customAmenities = formData.amenities?.custom || [];
          const totalAmenities = selectedDatabaseAmenities.length + generalAmenities.length + customAmenities.length;
          
          return totalAmenities > 0 ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">Selected Amenities</h3>
              <div className="space-y-2">
                {/* Database amenities */}
                {selectedDatabaseAmenities.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-blue-800 mb-1">From Database:</h4>
                    {selectedDatabaseAmenities.map((amenityId, index) => {
                      const amenity = databaseAmenities.find(a => a.id === amenityId) || { name: amenityId };
                      return (
                        <div key={`db-${index}`} className="flex items-center space-x-2 ml-2">
                          <span className="text-lg">🏢</span>
                          <span className="text-blue-800">{amenity.name}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
                
                {/* General amenities */}
                {getSelectedAmenities().map(amenity => (
                  <div key={amenity.id} className="flex items-center space-x-2">
                    <span className="text-lg">{amenity.icon}</span>
                    <span className="text-blue-800">{amenity.name}</span>
                  </div>
                ))}
                
                {/* Custom amenities */}
                {customAmenities.map((amenity, index) => (
                  <div key={`custom-${index}`} className="flex items-center space-x-2">
                    <span className="text-lg">✨</span>
                    <span className="text-blue-800">{amenity}</span>
                  </div>
                ))}
              </div>
              <p className="text-sm text-blue-600 mt-3">
                Total: {totalAmenities} amenities selected
              </p>
            </div>
          ) : null;
        })()}

        {/* General Predefined Amenities */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">General Amenities</h3>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowGeneralAmenities(!showGeneralAmenities)}
              className="text-sm"
            >
              {showGeneralAmenities ? 'Hide' : 'Show'} General Amenities
            </Button>
          </div>
          
          {showGeneralAmenities && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {predefinedAmenities.map(amenity => (
                <label
                  key={amenity.id}
                  className={cn(
                    "flex items-start space-x-3 p-4 border rounded-lg cursor-pointer transition-all hover:bg-gray-50",
                    (formData.amenities?.general || []).includes(amenity.id)
                      ? "border-primary bg-primary/5"
                      : "border-gray-200"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={(formData.amenities?.general || []).includes(amenity.id)}
                    onChange={() => handleAmenityToggle(amenity.id, 'general')}
                    className="mt-1 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">{amenity.icon}</span>
                      <span className="font-medium text-gray-900">{amenity.name}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{amenity.description}</p>
                  </div>
                </label>
              ))}
            </div>
          )}
          
        </div>

        {/* Custom Amenities */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Additional Custom Amenities</h3>
          <div className="space-y-4">
            <div className="flex space-x-2">
              <Input
                type="text"
                placeholder="Add a custom amenity..."
                value={newCustomAmenity}
                onChange={(e) => setNewCustomAmenity(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleCustomAmenityAdd}
                disabled={!newCustomAmenity.trim()}
              >
                Add
              </Button>
            </div>

            {/* Custom Amenities List */}
            {(formData.amenities?.custom || []).length > 0 && (
              <div className="space-y-2">
                {(formData.amenities?.custom || []).map((amenity, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <span className="text-gray-900">{amenity}</span>
                    <button
                      type="button"
                      onClick={() => handleCustomAmenityRemove(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  )
}

export default DevelopmentAmenities
