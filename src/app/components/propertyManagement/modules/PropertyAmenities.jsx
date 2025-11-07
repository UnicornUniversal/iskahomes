import React, { useState, useEffect, useMemo } from 'react'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { cn } from '@/lib/utils'
import { 
  getAmenitiesByPropertyType, 
  getAllAmenities,
  getAmenityIcon,
  getAmenityName,
  PROPERTY_TYPE_IDS,
  GENERAL_AMENITIES
} from '@/lib/StaticData'
import { FaSearch, FaTimes } from 'react-icons/fa'

const PropertyAmenities = ({ formData, updateFormData, mode }) => {
  const [newCustomAmenity, setNewCustomAmenity] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showGeneralAmenities, setShowGeneralAmenities] = useState(true)
  const [generalAmenitiesLimit, setGeneralAmenitiesLimit] = useState(10) // Start with 10
  const [typeSpecificAmenitiesLimit, setTypeSpecificAmenitiesLimit] = useState(10) // Start with 10

  // Show general amenities incrementally (start with 10, then load more)
  const generalAmenities = useMemo(() => {
    return GENERAL_AMENITIES.slice(0, generalAmenitiesLimit);
  }, [generalAmenitiesLimit]);
  
  const hasMoreGeneralAmenities = GENERAL_AMENITIES.length > generalAmenitiesLimit

  // Get all type-specific amenities when property type is selected
  const allTypeSpecificAmenities = useMemo(() => {
    if (!formData.types || formData.types.length === 0) {
      return [];
    }
    
    const propertyTypeId = formData.types[0];
    const allTypeAmenities = getAmenitiesByPropertyType(propertyTypeId);
    
    // Return only type-specific amenities (exclude general ones)
    const generalIds = GENERAL_AMENITIES.map(a => a.id);
    return allTypeAmenities.filter(a => !generalIds.includes(a.id));
  }, [formData.types]);

  // Show type-specific amenities incrementally (start with 10, then load more)
  const typeSpecificAmenities = useMemo(() => {
    return allTypeSpecificAmenities.slice(0, typeSpecificAmenitiesLimit);
  }, [allTypeSpecificAmenities, typeSpecificAmenitiesLimit]);
  
  const hasMoreTypeSpecificAmenities = allTypeSpecificAmenities.length > typeSpecificAmenitiesLimit


  const handleAmenityToggle = (amenityId, amenityType = 'inbuilt') => {
    const currentAmenities = formData.amenities || { inbuilt: [], custom: [] };
    const currentArray = currentAmenities[amenityType] || [];
    
    // Only store the amenity ID (string), not the full object
    const updatedArray = currentArray.includes(amenityId)
      ? currentArray.filter(id => id !== amenityId)
      : [...currentArray, amenityId];
    
    const updatedAmenities = {
      ...currentAmenities,
      [amenityType]: updatedArray
    };
    
    updateFormData({
      amenities: updatedAmenities
    });
  }

  const handleCustomAmenityAdd = () => {
    if (newCustomAmenity.trim()) {
      const currentAmenities = formData.amenities || { inbuilt: [], custom: [] };
      const currentCustomAmenities = currentAmenities.custom || [];
      // Only store the amenity name (string), not an object
      const newCustomAmenities = [...currentCustomAmenities, newCustomAmenity.trim()];
      
      const updatedAmenities = {
        ...currentAmenities,
        custom: newCustomAmenities
      };
      
      updateFormData({
        amenities: updatedAmenities
      });
      setNewCustomAmenity('');
    }
  }

  const handleCustomAmenityRemove = (index) => {
    const currentAmenities = formData.amenities || { inbuilt: [], custom: [] };
    const currentCustomAmenities = currentAmenities.custom || [];
    const newCustomAmenities = currentCustomAmenities.filter((_, i) => i !== index);
    
    const updatedAmenities = {
      ...currentAmenities,
      custom: newCustomAmenities
    };
    
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
    // Get selected amenity IDs from inbuilt array
    const selectedIds = formData.amenities?.inbuilt || [];
    const allAmenities = [...generalAmenities, ...typeSpecificAmenities];
    // Reconstruct full amenity objects from StaticData using the stored IDs
    return allAmenities.filter(amenity => 
      selectedIds.includes(amenity.id)
    )
  }

  // Get property type name for display
  const getPropertyTypeName = () => {
    if (!formData.types || formData.types.length === 0) {
      return 'General';
    }
    
    const typeId = formData.types[0];
    const typeNames = {
      [PROPERTY_TYPE_IDS.HOUSES_APARTMENTS]: 'Houses & Apartments',
      [PROPERTY_TYPE_IDS.OFFICES]: 'Offices',
      [PROPERTY_TYPE_IDS.WAREHOUSES]: 'Warehouses',
      [PROPERTY_TYPE_IDS.EVENT_CENTERS]: 'Event Centers',
      [PROPERTY_TYPE_IDS.LAND]: 'Land',
    };
    
    return typeNames[typeId] || 'General';
  }

  // Get selected amenity IDs (strings only, not full objects)
  const selectedInbuiltAmenityIds = formData.amenities?.inbuilt || [];
  const customAmenities = formData.amenities?.custom || [];
  const totalAmenities = selectedInbuiltAmenityIds.length + customAmenities.length;

  return (
    <div className="w-full p-6 bg-white rounded-lg shadow-sm">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Property Amenities</h2>
        <p className="text-gray-600">
          {mode === 'edit' ? 'Update the amenities available for this property' : 'Select the amenities available for this property'}
        </p>
        {formData.types && formData.types.length > 0 && (
          <div className="mt-2 p-2 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">Property Type:</span> {getPropertyTypeName()} - Showing relevant amenities
            </p>
          </div>
        )}
      </div>

      <div className="space-y-8">
        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaSearch className="h-5 w-5 text-gray-400" />
          </div>
          <Input
            type="text"
            placeholder="Search amenities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10 w-full"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <FaTimes className="h-5 w-5 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>

        {/* Selected Amenities Summary */}
        {totalAmenities > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">Selected Amenities</h3>
            <div className="space-y-2 flex flex-wrap gap-2">
              {/* General amenities */}
              {getSelectedAmenities().map(amenity => {
                const IconComponent = amenity.icon;
                return (
                  <div key={amenity.id} className="flex items-center border border-blue-200 rounded-full p-2 space-x-2">
                    {IconComponent && <IconComponent className="text-sm text-blue-600" />}
                    <span className="text-blue-800 text-sm">{amenity.name}</span>
                  </div>
                );
              })}
              
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
        )}

        {/* General Amenities Section */}
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
            <>
              {(() => {
                // Filter general amenities based on search
                const filteredGeneral = searchQuery.trim()
                  ? generalAmenities.filter(amenity => {
                      const query = searchQuery.toLowerCase();
                      return amenity.name.toLowerCase().includes(query) ||
                        amenity.description.toLowerCase().includes(query) ||
                        amenity.id.toLowerCase().includes(query);
                    })
                  : generalAmenities;

                return filteredGeneral.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredGeneral.map(amenity => {
                      const IconComponent = amenity.icon;
                      // Check if this amenity ID is in the selected inbuilt array
                      const isSelected = selectedInbuiltAmenityIds.includes(amenity.id);
                      
                      return (
                        <label
                          key={amenity.id}
                          className={cn(
                            "flex items-start space-x-3 p-4 border rounded-lg cursor-pointer transition-all hover:bg-gray-50",
                            isSelected
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200"
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleAmenityToggle(amenity.id, 'inbuilt')}
                            className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              {IconComponent && (
                                <IconComponent className="text-lg text-gray-700" />
                              )}
                              <span className="font-medium text-gray-900">{amenity.name}</span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{amenity.description}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No general amenities found matching "{searchQuery}"</p>
                    <p className="text-sm mt-1">Try a different search term</p>
                  </div>
                );
              })()}
              
              {/* Load More Button */}
              {!searchQuery && hasMoreGeneralAmenities && (
                <div className="flex justify-center mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setGeneralAmenitiesLimit(prev => Math.min(prev + 10, GENERAL_AMENITIES.length))}
                    className="text-sm"
                  >
                    Load More ({GENERAL_AMENITIES.length - generalAmenitiesLimit} remaining)
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Type-Specific Amenities Section */}
        {formData.types && formData.types.length > 0 && allTypeSpecificAmenities.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {getPropertyTypeName()} Specific Amenities
            </h3>
            
            {(() => {
              // Filter type-specific amenities based on search
              const filteredTypeSpecific = searchQuery.trim()
                ? typeSpecificAmenities.filter(amenity => {
                    const query = searchQuery.toLowerCase();
                    return amenity.name.toLowerCase().includes(query) ||
                      amenity.description.toLowerCase().includes(query) ||
                      amenity.id.toLowerCase().includes(query);
                  })
                : typeSpecificAmenities;

              return filteredTypeSpecific.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredTypeSpecific.map(amenity => {
                      const IconComponent = amenity.icon;
                      // Check if this amenity ID is in the selected inbuilt array
                      const isSelected = selectedInbuiltAmenityIds.includes(amenity.id);
                      
                      return (
                        <label
                          key={amenity.id}
                          className={cn(
                            "flex items-start space-x-3 p-4 border rounded-lg cursor-pointer transition-all hover:bg-gray-50",
                            isSelected
                              ? "border-green-500 bg-green-50"
                              : "border-gray-200"
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleAmenityToggle(amenity.id, 'inbuilt')}
                            className="mt-1 rounded border-gray-300 text-green-600 focus:ring-green-500"
                          />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              {IconComponent && (
                                <IconComponent className="text-lg text-gray-700" />
                              )}
                              <span className="font-medium text-gray-900">{amenity.name}</span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{amenity.description}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                  
                  {/* Load More Button for Type-Specific Amenities */}
                  {!searchQuery && hasMoreTypeSpecificAmenities && (
                    <div className="flex justify-center mt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setTypeSpecificAmenitiesLimit(prev => Math.min(prev + 10, allTypeSpecificAmenities.length))}
                        className="text-sm"
                      >
                        Load More ({allTypeSpecificAmenities.length - typeSpecificAmenitiesLimit} remaining)
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No {getPropertyTypeName().toLowerCase()} amenities found matching "{searchQuery}"</p>
                  <p className="text-sm mt-1">Try a different search term</p>
                </div>
              );
            })()}
          </div>
        )}

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
            {customAmenities.length > 0 && (
              <div className="space-y-2">
                {customAmenities.map((amenity, index) => (
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
                      <FaTimes className="w-5 h-5" />
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

export default PropertyAmenities
