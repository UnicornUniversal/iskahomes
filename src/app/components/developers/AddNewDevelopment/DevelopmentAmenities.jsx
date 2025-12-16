import React, { useState, useMemo } from 'react'
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

const DevelopmentAmenities = ({ formData, updateFormData, isEditMode }) => {
  const [newCustomAmenity, setNewCustomAmenity] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showGeneralAmenities, setShowGeneralAmenities] = useState(true)
  const [generalAmenitiesLimit, setGeneralAmenitiesLimit] = useState(10)
  const [typeSpecificAmenitiesLimit, setTypeSpecificAmenitiesLimit] = useState(10)

  // Convert old structure to new structure on mount
  React.useEffect(() => {
    if (formData.amenities) {
      const oldAmenities = formData.amenities;
      // Check if it's the old structure (database, general, custom)
      if (oldAmenities.database || oldAmenities.general) {
        const newAmenities = {
          inbuilt: [
            ...(oldAmenities.database || []),
            ...(oldAmenities.general || [])
          ],
          custom: oldAmenities.custom || []
        };
        updateFormData({ amenities: newAmenities });
      }
    }
  }, []);

  // Show general amenities incrementally
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

  // Show type-specific amenities incrementally
  const typeSpecificAmenities = useMemo(() => {
    return allTypeSpecificAmenities.slice(0, typeSpecificAmenitiesLimit);
  }, [allTypeSpecificAmenities, typeSpecificAmenitiesLimit]);
  
  const hasMoreTypeSpecificAmenities = allTypeSpecificAmenities.length > typeSpecificAmenitiesLimit

  const handleAmenityToggle = (amenityId, amenityType = 'inbuilt') => {
    const currentAmenities = formData.amenities || { inbuilt: [], custom: [] };
    const currentArray = currentAmenities[amenityType] || [];
    
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
    const selectedIds = formData.amenities?.inbuilt || [];
    const allAmenities = [...generalAmenities, ...typeSpecificAmenities];
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

  const selectedInbuiltAmenityIds = formData.amenities?.inbuilt || [];
  const customAmenities = formData.amenities?.custom || [];
  const totalAmenities = selectedInbuiltAmenityIds.length + customAmenities.length;

  // Get all available amenities (general + type-specific)
  const allAvailableAmenities = useMemo(() => {
    return [...GENERAL_AMENITIES, ...allTypeSpecificAmenities];
  }, [allTypeSpecificAmenities]);

  // Check if all amenities are selected
  const areAllAmenitiesSelected = useMemo(() => {
    if (allAvailableAmenities.length === 0) return false;
    return allAvailableAmenities.every(amenity => 
      selectedInbuiltAmenityIds.includes(amenity.id)
    );
  }, [allAvailableAmenities, selectedInbuiltAmenityIds]);

  // Handle select/deselect all amenities
  const handleSelectAllAmenities = () => {
    const currentAmenities = formData.amenities || { inbuilt: [], custom: [] };
    
    if (areAllAmenitiesSelected) {
      // Deselect all
      updateFormData({
        amenities: {
          ...currentAmenities,
          inbuilt: []
        }
      });
    } else {
      // Select all available amenities
      const allAmenityIds = allAvailableAmenities.map(amenity => amenity.id);
      updateFormData({
        amenities: {
          ...currentAmenities,
          inbuilt: allAmenityIds
        }
      });
    }
  };

  // Handle select/deselect all general amenities
  const handleSelectAllGeneral = () => {
    const currentAmenities = formData.amenities || { inbuilt: [], custom: [] };
    const currentSelected = currentAmenities.inbuilt || [];
    const generalIds = GENERAL_AMENITIES.map(a => a.id);
    const selectedGeneralIds = currentSelected.filter(id => generalIds.includes(id));
    const allGeneralSelected = selectedGeneralIds.length === GENERAL_AMENITIES.length;
    
    if (allGeneralSelected) {
      // Deselect all general amenities
      const updatedSelected = currentSelected.filter(id => !generalIds.includes(id));
      updateFormData({
        amenities: {
          ...currentAmenities,
          inbuilt: updatedSelected
        }
      });
    } else {
      // Select all general amenities
      const updatedSelected = [...new Set([...currentSelected, ...generalIds])];
      updateFormData({
        amenities: {
          ...currentAmenities,
          inbuilt: updatedSelected
        }
      });
    }
  };

  // Handle select/deselect all type-specific amenities
  const handleSelectAllTypeSpecific = () => {
    if (allTypeSpecificAmenities.length === 0) return;
    
    const currentAmenities = formData.amenities || { inbuilt: [], custom: [] };
    const currentSelected = currentAmenities.inbuilt || [];
    const typeSpecificIds = allTypeSpecificAmenities.map(a => a.id);
    const selectedTypeSpecificIds = currentSelected.filter(id => typeSpecificIds.includes(id));
    const allTypeSpecificSelected = selectedTypeSpecificIds.length === allTypeSpecificAmenities.length;
    
    if (allTypeSpecificSelected) {
      // Deselect all type-specific amenities
      const updatedSelected = currentSelected.filter(id => !typeSpecificIds.includes(id));
      updateFormData({
        amenities: {
          ...currentAmenities,
          inbuilt: updatedSelected
        }
      });
    } else {
      // Select all type-specific amenities
      const updatedSelected = [...new Set([...currentSelected, ...typeSpecificIds])];
      updateFormData({
        amenities: {
          ...currentAmenities,
          inbuilt: updatedSelected
        }
      });
    }
  };

  // Check if all general amenities are selected
  const areAllGeneralSelected = useMemo(() => {
    if (GENERAL_AMENITIES.length === 0) return false;
    const generalIds = GENERAL_AMENITIES.map(a => a.id);
    return generalIds.every(id => selectedInbuiltAmenityIds.includes(id));
  }, [selectedInbuiltAmenityIds]);

  // Check if all type-specific amenities are selected
  const areAllTypeSpecificSelected = useMemo(() => {
    if (allTypeSpecificAmenities.length === 0) return false;
    const typeSpecificIds = allTypeSpecificAmenities.map(a => a.id);
    return typeSpecificIds.every(id => selectedInbuiltAmenityIds.includes(id));
  }, [allTypeSpecificAmenities, selectedInbuiltAmenityIds]);

  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="mb-2">Development Amenities</h2>
        <p>
          {isEditMode ? 'Update the amenities available in your development' : 'Select the amenities available in your development project'}
        </p>
      </div>

      <div className="space-y-8">
        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaSearch className="h-5 w-5 " />
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
              <FaTimes className="h-5 w-5  hover:" />
            </button>
          )}
        </div>

        {/* Selected Amenities Summary */}
        {totalAmenities > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold ">Selected Amenities</h3>
              {allAvailableAmenities.length > 0 && (
                <button
                  type="button"
                  onClick={handleSelectAllAmenities}
                  className="secondary_button text-sm"
                >
                  {areAllAmenitiesSelected ? 'Deselect All' : 'Select All'}
                </button>
              )}
            </div>
            <div className="space-y-2 flex flex-wrap gap-2">
              {getSelectedAmenities().map(amenity => {
                const IconComponent = amenity.icon;
                return (
                  <div key={amenity.id} className="flex items-center border border-blue-200 rounded-full p-2 space-x-2">
                    {IconComponent && <IconComponent className="text-sm " />}
                    <span className=" text-sm">{amenity.name}</span>
                  </div>
                );
              })}
              
              {customAmenities.map((amenity, index) => (
                <div key={`custom-${index}`} className="flex items-center border border-blue-200 rounded-full p-2 space-x-2">
                  <span className="text-lg">✨</span>
                  <span className=" text-sm">{amenity}</span>
                </div>
              ))}
            </div>
            <p className="text-sm  mt-3">
              Total: {totalAmenities} amenities selected
            </p>
          </div>
        )}

        {/* General Amenities Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold ">General Amenities</h3>
            <div className="flex items-center gap-2">
              {showGeneralAmenities && (
                <button
                  type="button"
                  onClick={handleSelectAllGeneral}
                  className="secondary_button text-sm"
                >
                  {areAllGeneralSelected ? 'Deselect All' : 'Select All'}
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowGeneralAmenities(!showGeneralAmenities)}
                className="secondary_button"
              >
                {showGeneralAmenities ? 'Hide' : 'Show'} General Amenities
              </button>
            </div>
          </div>
          
          {showGeneralAmenities && (
            <>
              {(() => {
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
                            className="mt-1 rounded border-gray-300  focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              {IconComponent && (
                                <IconComponent className="text-lg " />
                              )}
                              <span className="font-medium ">{amenity.name}</span>
                            </div>
                            <p className="text-sm  mt-1">{amenity.description}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 ">
                    <p>No general amenities found matching "{searchQuery}"</p>
                    <p className="text-sm mt-1">Try a different search term</p>
                  </div>
                );
              })()}
              
              {!searchQuery && hasMoreGeneralAmenities && (
                <div className="flex justify-center mt-4">
                  <button
                    type="button"
                    onClick={() => setGeneralAmenitiesLimit(prev => Math.min(prev + 10, GENERAL_AMENITIES.length))}
                    className="secondary_button"
                  >
                    Load More ({GENERAL_AMENITIES.length - generalAmenitiesLimit} remaining)
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Type-Specific Amenities Section */}
        {formData.types && formData.types.length > 0 && allTypeSpecificAmenities.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold ">
                {getPropertyTypeName()} Specific Amenities
              </h3>
              <button
                type="button"
                onClick={handleSelectAllTypeSpecific}
                className="secondary_button text-sm"
              >
                {areAllTypeSpecificSelected ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            
            {(() => {
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
                            className="mt-1 rounded border-gray-300  focus:ring-green-500"
                          />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              {IconComponent && (
                                <IconComponent className="text-lg " />
                              )}
                              <span className="font-medium ">{amenity.name}</span>
                            </div>
                            <p className="text-sm  mt-1">{amenity.description}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                  
                  {!searchQuery && hasMoreTypeSpecificAmenities && (
                    <div className="flex justify-center mt-4">
                      <button
                        type="button"
                        onClick={() => setTypeSpecificAmenitiesLimit(prev => Math.min(prev + 10, allTypeSpecificAmenities.length))}
                        className="secondary_button"
                      >
                        Load More ({allTypeSpecificAmenities.length - typeSpecificAmenitiesLimit} remaining)
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 ">
                  <p>No {getPropertyTypeName().toLowerCase()} amenities found matching "{searchQuery}"</p>
                  <p className="text-sm mt-1">Try a different search term</p>
                </div>
              );
            })()}
          </div>
        )}

        {/* Custom Amenities */}
        <div>
          <h3 className="text-lg font-semibold  mb-4">Additional Custom Amenities</h3>
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
              <button
                type="button"
                onClick={handleCustomAmenityAdd}
                disabled={!newCustomAmenity.trim()}
                className="primary_button"
              >
                Add
              </button>
            </div>

            {customAmenities.length > 0 && (
              <div className="space-y-2">
                {customAmenities.map((amenity, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <span className="">{amenity}</span>
                    <button
                      type="button"
                      onClick={() => handleCustomAmenityRemove(index)}
                      className="tertiary_button"
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

export default DevelopmentAmenities
