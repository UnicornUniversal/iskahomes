"use client"
import React, { useState, useEffect } from 'react'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { CustomSelect } from '../../ui/custom-select'
import { cn } from '@/lib/utils'
import { 
  usePropertyPurposes, 
  usePropertyTypes, 
  usePropertyCategories, 
  usePropertySubtypes 
} from '@/hooks/useCachedData'

const PropertyCategories = ({ formData, updateFormData, isEditMode }) => {
  
  // Use cached data hooks
  const { data: purposes = [], loading: purposesLoading } = usePropertyPurposes()
  const { data: types = [], loading: typesLoading } = usePropertyTypes()
  const { data: allCategories = [], loading: categoriesLoading } = usePropertyCategories()
  const { data: allSubtypes = [], loading: subtypesLoading } = usePropertySubtypes()
  
  // Local state for filtered data
  const [filteredCategories, setFilteredCategories] = useState([])
  const [filteredSubtypes, setFilteredSubtypes] = useState([])

  // Built-in property types for custom selection (hidden from main view)
  const builtInPropertyTypes = [
    'Studio', '1 Bedroom', '1 Bedroom + Study', '2 Bedroom', '2 Bedroom + Study',
    '3 Bedroom', '3 Bedroom + Study', '4 Bedroom', '4 Bedroom + Study', '5 Bedroom',
    '5 Bedroom + Study', 'Penthouse', 'Duplex', 'Triplex', 'Townhouse', 'Villa',
    'Bungalow', 'Cottage', 'Mansion', 'Chalet', 'Cabin', 'Loft', 'Apartment',
    'Condominium', 'Co-op', 'Co-housing', 'Micro-apartment', 'Co-living Space',
    'Student Housing', 'Senior Living', 'Assisted Living', 'Independent Living',
    'Memory Care', 'Skilled Nursing', 'Active Adult', '55+ Community',
    'Retirement Community', 'Continuing Care', 'Affordable Housing', 'Social Housing',
    'Public Housing', 'Subsidized Housing', 'Low-income Housing', 'Workforce Housing',
    'Transitional Housing', 'Emergency Housing', 'Temporary Housing', 'Mobile Home',
    'Manufactured Home', 'Modular Home', 'Prefab Home', 'Tiny Home', 'Container Home',
    'Earthship', 'Straw Bale Home', 'Cob House', 'Adobe House', 'Rammed Earth',
    'Log Cabin', 'Treehouse', 'Houseboat', 'Floating Home', 'Yurt', 'Tipi', 'Igloo',
    'Cave House', 'Underground Home', 'Dome Home', 'Geodesic Dome', 'A-frame House',
    'Split-level', 'Ranch', 'Colonial', 'Victorian', 'Craftsman', 'Modern',
    'Contemporary', 'Minimalist', 'Mid-century Modern', 'Art Deco', 'Mediterranean',
    'Spanish Colonial', 'Tudor', 'Cape Cod', 'Federal', 'Georgian', 'Neoclassical',
    'Greek Revival', 'Italianate', 'Queen Anne', 'Gothic Revival', 'Romanesque',
    'Prairie', 'Mission', 'Shingle', 'Stick', 'Folk Victorian', 'Second Empire',
    'Beaux-Arts', 'Art Nouveau', 'Bauhaus', 'International', 'Brutalist',
    'Postmodern', 'Deconstructivist', 'High-tech', 'Sustainable', 'Green Building',
    'LEED Certified', 'Passive House', 'Net Zero', 'Carbon Neutral',
    'Energy Efficient', 'Solar Powered', 'Wind Powered', 'Geothermal',
    'Rainwater Harvesting', 'Greywater System', 'Composting Toilet',
    'Living Roof', 'Green Wall', 'Permaculture', 'Off-grid', 'Self-sufficient',
    'Eco-friendly', 'Biophilic', 'Wellness-focused', 'Smart Home', 'Connected Home',
    'IoT Enabled', 'Automated', 'Voice Controlled', 'App Controlled',
    'Remote Monitoring', 'Security System', 'Surveillance', 'Access Control',
    'Fire Safety', 'Emergency Systems', 'Backup Power', 'Generator', 'UPS',
    'Battery Storage', 'Inverter', 'Solar Panel', 'Wind Turbine', 'Heat Pump',
    'HVAC', 'Air Conditioning', 'Heating', 'Ventilation', 'Insulation',
    'Weatherproofing', 'Waterproofing', 'Fireproofing', 'Soundproofing',
    'Vibration Control', 'Seismic Design', 'Hurricane Resistant', 'Tornado Resistant',
    'Earthquake Resistant', 'Flood Resistant', 'Wildfire Resistant', 'Blast Resistant',
    'Bullet Resistant', 'Radiation Shielding', 'EMF Protection', 'Air Purification',
    'Water Filtration', 'Waste Management', 'Recycling', 'Composting',
    'Greywater Recycling', 'Blackwater Treatment', 'Sewage Treatment',
    'Septic System', 'Municipal Connection', 'Well Water', 'City Water',
    'Electricity', 'Gas', 'Internet', 'Cable', 'Satellite', 'Fiber Optic',
    'WiFi', 'Bluetooth', 'Zigbee', 'Z-Wave', 'Thread', 'Matter', 'HomeKit',
    'Google Home', 'Amazon Alexa', 'Samsung SmartThings', 'Hubitat',
    'Home Assistant', 'OpenHAB', 'Domoticz', 'Homebridge', 'Scrypted',
    'Frigate', 'Blue Iris', 'Synology Surveillance', 'QNAP Surveillance',
    'UniFi Protect', 'Ring', 'Nest', 'Arlo', 'Wyze', 'Eufy', 'SimpliSafe',
    'ADT', 'Vivint', 'Frontpoint', 'Brinks', 'Protect America',
    'Link Interactive', 'Cove', 'Abode', 'Scout', 'Kangaroo',
    'Deep Sentinel', 'Guardian Protection', 'Vector Security', 'Monitronics',
    'CPI Security', 'Bay Alarm', 'SafeStreets', 'Smith Thompson', 'Mace Security'
  ]

  const [customPropertyType, setCustomPropertyType] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [showBuiltInTypes, setShowBuiltInTypes] = useState(false)
  const [searchBuiltInTypes, setSearchBuiltInTypes] = useState('')
  const [hydratedFromExisting, setHydratedFromExisting] = useState(false)

  // Auto-populate categories and subtypes when property types change
  useEffect(() => {
    if (formData?.types && formData.types.length > 0) {
      autoPopulateCategoriesAndSubtypes(formData.types)
    } else {
      setFilteredCategories([])
      setFilteredSubtypes([])
    }
  }, [formData?.types, allCategories, allSubtypes])

  // Hydrate option lists from existing saved IDs so the selects show names by default
  useEffect(() => {
    if (!hydratedFromExisting && Array.isArray(formData?.types) && formData.types.length > 0) {
      // Populate categories and subtypes based on the saved type
      autoPopulateCategoriesAndSubtypes(formData.types).finally(() => setHydratedFromExisting(true))
    }
  }, [hydratedFromExisting, formData?.types])

  // Debug logging for subtype selection
  useEffect(() => {
    const propertyTypes = formData.listing_types || { database: [], inbuilt: [], custom: [] };
  }, [formData.listing_types, filteredSubtypes])


  const handleCategoryToggle = (categoryType, item) => {
    // For single selection, replace the entire array with just the selected item
    const updatedCategories = [item.id];
    
    updateFormData({
      [categoryType]: updatedCategories
    });

    // Auto-populate categories and subtypes when property types change
    if (categoryType === 'types') {
      autoPopulateCategoriesAndSubtypes(updatedCategories);
    }
  };

  const autoPopulateCategoriesAndSubtypes = async (selectedTypes) => {
    if (selectedTypes.length === 0) {
      // Clear categories and subtypes if no types selected
      updateFormData({
        categories: []
      });
      setFilteredCategories([]);
      setFilteredSubtypes([]);
      return;
    }

    try {
      // Filter categories that have any of the selected property types
      const relevantCategories = allCategories.filter(category => {
        const categoryPropertyTypes = Array.isArray(category.property_type) 
          ? category.property_type 
          : [category.property_type];
        
        // Check if any of the category's property types match any of the selected types
        return categoryPropertyTypes.some(type => selectedTypes.includes(type));
      });
      
      // Auto-select all relevant categories
      const categoryIds = relevantCategories.map(cat => cat.id);
      updateFormData({
        categories: categoryIds
      });

      // Update the filtered categories state
      setFilteredCategories(relevantCategories);

      // Filter subtypes that match any of the selected property types
      const relevantSubtypes = allSubtypes.filter(subtype => 
        selectedTypes.includes(subtype.property_type)
      );
      
      // Store relevant subtypes in state for manual selection (don't auto-select)
      setFilteredSubtypes(relevantSubtypes);
    } catch (error) {
      console.error('Error auto-populating categories and subtypes:', error);
    }
  };

  const handleRemoveCategory = (categoryType, itemId) => {
    const updatedCategories = formData[categoryType].filter(id => id !== itemId);
    updateFormData({
      [categoryType]: updatedCategories
    });

    // Re-populate categories and subtypes when property types are removed
    if (categoryType === 'types') {
      autoPopulateCategoriesAndSubtypes(updatedCategories);
    }
  };

  const getSelectedItems = (categoryType) => {
    const items = categoryType === 'purposes' ? purposes :
                  categoryType === 'types' ? types :
                  categoryType === 'categories' ? filteredCategories :
                  filteredSubtypes;
    return items.filter(item => formData[categoryType].includes(item.id));
  };

  const handlePropertyTypeToggle = (propertyType) => {
    // For single selection of subtype, store ONLY the ID in database array
    const currentPropertyTypes = formData.listing_types || { database: [], inbuilt: [], custom: [] };
    const propertyTypes = { ...currentPropertyTypes };
    
    const isDatabaseSubtype = typeof propertyType === 'object' && propertyType.id;
    
    if (isDatabaseSubtype) {
      // Replace the entire database array with just the selected subtype ID
      propertyTypes.database = [propertyType.id];
    } else {
      propertyTypes.inbuilt = [propertyType];
    }
    
    
    updateFormData({ listing_types: propertyTypes });
  };

  const handleCustomOptionClick = () => {
    setShowCustomInput(true);
  };

  const handleBuiltInTypeSelect = (propertyType) => {
    // Ensure listing_types structure exists
    const propertyTypes = formData.listing_types || { database: [], inbuilt: [], custom: [] };
    
    // Prevent duplicates across inbuilt/custom
    const isInInbuilt = propertyTypes.inbuilt.includes(propertyType);
    const isInCustom = propertyTypes.custom.includes(propertyType);
    if (isInInbuilt || isInCustom) return;

    const updatedPropertyTypes = { ...propertyTypes };
    updatedPropertyTypes.inbuilt = [...updatedPropertyTypes.inbuilt, propertyType];
    
    updateFormData({ listing_types: updatedPropertyTypes });
    setSearchBuiltInTypes('');
  };

  const handleCustomPropertyTypeSubmit = () => {
    if (customPropertyType.trim()) {
      const trimmedPropertyType = customPropertyType.trim();
      
      // Ensure listing_types structure exists
      const propertyTypes = formData.listing_types || { database: [], inbuilt: [], custom: [] };
      
      // Check if the property type already exists in any category
      const isInDatabase = propertyTypes.database.includes(trimmedPropertyType);
      const isInInbuilt = propertyTypes.inbuilt.includes(trimmedPropertyType);
      const isInCustom = propertyTypes.custom.includes(trimmedPropertyType);
      
      if (isInDatabase || isInInbuilt || isInCustom) {
        return; // Don't add if it already exists
      }
      
      const updatedPropertyTypes = { ...propertyTypes };
      updatedPropertyTypes.custom = [...updatedPropertyTypes.custom, trimmedPropertyType];
      
      updateFormData({ listing_types: updatedPropertyTypes });
      setCustomPropertyType('');
      setShowCustomInput(false);
    }
  };

  const removePropertyType = (propertyType, type) => {
    // Ensure listing_types structure exists
    const propertyTypes = formData.listing_types || { database: [], inbuilt: [], custom: [] };
    
    const updatedPropertyTypes = { ...propertyTypes };
    
    if (type === 'database') {
      const propertyTypeId = typeof propertyType === 'object' ? propertyType.id : propertyType;
      updatedPropertyTypes.database = updatedPropertyTypes.database.filter(type => 
        (typeof type === 'object' ? type.id : type) !== propertyTypeId
      );
    } else if (type === 'inbuilt') {
      const propertyTypeName = typeof propertyType === 'object' ? propertyType.name : propertyType;
      updatedPropertyTypes.inbuilt = updatedPropertyTypes.inbuilt.filter(type => type !== propertyTypeName);
    } else if (type === 'custom') {
      const propertyTypeName = typeof propertyType === 'object' ? propertyType.name : propertyType;
      updatedPropertyTypes.custom = updatedPropertyTypes.custom.filter(type => type !== propertyTypeName);
    }
    
    updateFormData({ listing_types: updatedPropertyTypes });
  };

  return (
    <div className="p-4 sm:p-6  rounded-lg shadow-sm">
    

      <div className="grid grid-cols-1 sm:grid-cols-2  gap-4 sm:gap-6">
        {/* Property Purpose */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 sm:p-4 rounded-xl border border-blue-200">
          <div className="flex items-center mb-2 sm:mb-3">
            <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-500 rounded-full flex items-center justify-center mr-2">
              <span className="text-white text-xs font-bold">1</span>
            </div>
            <label className="text-xs sm:text-sm font-semibold text-blue-900">
              Property Purpose *
            </label>
          </div>
          <p className="text-blue-700 text-xs mb-2 sm:mb-3">Select the primary purpose</p>
          
          <CustomSelect
            value={formData.purposes.length > 0 ? formData.purposes[0] : ''}
            onChange={(e) => {
              if (e.target.value) {
                handleCategoryToggle('purposes', { id: e.target.value });
              } else {
                updateFormData({ purposes: [] });
              }
            }}
            options={purposesLoading 
              ? [{ value: '', label: 'Loading...' }]
              : [
                  { value: '', label: 'Select Purpose' },
                  ...purposes.map(purpose => ({ value: purpose.id, label: purpose.name }))
                ]
            }
            placeholder="Select Purpose"
            required
            disabled={purposesLoading}
          />
        </div>

        {/* Property Type */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-3 sm:p-4 rounded-xl border border-green-200">
          <div className="flex items-center mb-2 sm:mb-3">
            <div className="w-5 h-5 sm:w-6 sm:h-6 bg-green-500 rounded-full flex items-center justify-center mr-2">
              <span className="text-white text-xs font-bold">2</span>
            </div>
            <label className="text-xs sm:text-sm font-semibold text-green-900">
              Property Type *
            </label>
          </div>
          <p className="text-green-700 text-xs mb-2 sm:mb-3">Choose the property type</p>
          
          <CustomSelect
            value={formData.types.length > 0 ? formData.types[0] : ''}
            onChange={(e) => {
              if (e.target.value) {
                handleCategoryToggle('types', { id: e.target.value });
              } else {
                updateFormData({ types: [] });
              }
            }}
            options={typesLoading 
              ? [{ value: '', label: 'Loading...' }]
              : [
                  { value: '', label: 'Select Property Type' },
                  ...types.map(type => ({ value: type.id, label: type.name }))
                ]
            }
            placeholder="Select Property Type"
            required
            disabled={typesLoading}
          />
        </div>

        {/* Property Category */}
        <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-3 sm:p-4 rounded-xl border border-purple-200">
          <div className="flex items-center mb-2 sm:mb-3">
            <div className="w-5 h-5 sm:w-6 sm:h-6 bg-purple-500 rounded-full flex items-center justify-center mr-2">
              <span className="text-white text-xs font-bold">3</span>
            </div>
            <label className="text-xs sm:text-sm font-semibold text-purple-900">
              Category
            </label>
          </div>
          <p className="text-purple-700 text-xs mb-2 sm:mb-3">Auto-populated</p>
          {/* <p>{formData.categories.length > 0 ? formData.categories[0] : 'Nothing is showing'}</p>
           */}
          <CustomSelect
            value={formData.categories.length > 0 ? formData.categories[0] : ''}
            onChange={(e) => {
              if (e.target.value) {
                handleCategoryToggle('categories', { id: e.target.value });
              } else {
                updateFormData({ categories: [] });
              }
            }}
            options={
              categoriesLoading 
                ? [{ value: '', label: 'Loading...' }]
                : formData.types.length === 0
                ? [{ value: '', label: 'Select type first', disabled: true }]
                : filteredCategories.map(category => ({ value: category.id, label: category.name }))
            }
            placeholder="Select category"
            disabled={formData.types.length === 0 || categoriesLoading}
          />
        </div>

        {/* Property Subtype */}
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-3 sm:p-4 rounded-xl border border-orange-200">
          <div className="flex items-center mb-2 sm:mb-3">
            <div className="w-5 h-5 sm:w-6 sm:h-6 bg-orange-500 rounded-full flex items-center justify-center mr-2">
              <span className="text-white text-xs font-bold">4</span>
            </div>
            <label className="text-xs sm:text-sm font-semibold text-orange-900">
              Subtype *
            </label>
          </div>
          <p className="text-orange-700 text-xs mb-2 sm:mb-3">Select specific subtype</p>
          
          {formData.types.length > 0 ? (
            <CustomSelect
              value={(() => {
                const propertyTypes = formData.listing_types || { database: [], inbuilt: [], custom: [] };
                if (!propertyTypes.database || propertyTypes.database.length === 0) return '';
                const dbVal = propertyTypes.database[0];
                const subtypeId = typeof dbVal === 'object' ? dbVal.id : dbVal;
                
                // Find the subtype by ID to ensure it exists in available options
                const foundSubtype = filteredSubtypes.find(subtype => subtype.id === subtypeId);
                return foundSubtype ? foundSubtype.id : '';
              })()}
              onChange={(e) => {
                if (e.target.value) {
                  handlePropertyTypeToggle({ id: e.target.value });
                } else {
                  updateFormData({ listing_types: { database: [], inbuilt: [], custom: [] } });
                }
              }}
              options={
                subtypesLoading 
                  ? [{ value: '', label: 'Loading...' }]
                  : filteredSubtypes.length > 0
                  ? filteredSubtypes.map(subtype => ({ value: subtype.id, label: subtype.name }))
                  : [{ value: '', label: 'No subtypes available', disabled: true }]
              }
              placeholder="Select subtype"
              required
              disabled={subtypesLoading}
            />
          ) : (
            <div className="text-orange-600 text-xs italic">
              Select property type first
            </div>
          )}
        </div>
      </div>

      {/* Custom Property Types Section */}
      <div className="mt-6 bg-gradient-to-r from-gray-50 to-slate-50 p-4 rounded-xl border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <h4 className="text-sm font-semibold text-gray-800">Custom Property Types:</h4>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCustomOptionClick}
              className="border-gray-300 text-gray-700 hover:bg-gray-50 text-xs"
            >
              Add Custom
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowBuiltInTypes(!showBuiltInTypes)}
              className="border-gray-300 text-gray-700 hover:bg-gray-50 text-xs"
            >
              {showBuiltInTypes ? 'Hide' : 'Show'} Built-in Types
            </Button>
          </div>
        </div>

        {/* Built-in Types Modal */}
        {showBuiltInTypes && (
          <div className="border border-gray-200 rounded-lg p-4 bg-white mb-4">
            <div className="mb-3">
              <Input
                type="text"
                placeholder="Search built-in property types..."
                value={searchBuiltInTypes}
                onChange={(e) => setSearchBuiltInTypes(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="max-h-48 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {builtInPropertyTypes
                  .filter(type => 
                    type.toLowerCase().includes(searchBuiltInTypes.toLowerCase())
                  )
                  .map(propertyType => {
                    const propertyTypes = formData.listing_types || { database: [], inbuilt: [], custom: [] };
                    const isSelected = propertyTypes.database.includes(propertyType) ||
                                      propertyTypes.inbuilt.includes(propertyType) ||
                                      propertyTypes.custom.includes(propertyType);
                    return (
                      <button
                        key={propertyType}
                        type="button"
                        onClick={() => handleBuiltInTypeSelect(propertyType)}
                        disabled={isSelected}
                        className={`text-left p-2 rounded-lg transition-colors text-xs ${
                          isSelected 
                            ? 'bg-gray-200 text-gray-600 cursor-not-allowed opacity-60' 
                            : 'hover:bg-gray-100 text-gray-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{propertyType}</span>
                          {isSelected && <span className="text-gray-600">✓</span>}
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {/* Custom Property Type Input */}
        {showCustomInput && (
          <div className="p-3 bg-gray-100 rounded-lg border border-gray-200 mb-4">
            <h4 className="text-sm font-semibold text-gray-800 mb-2">Add Custom Property Type</h4>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                type="text"
                placeholder="Enter custom property type..."
                value={customPropertyType}
                onChange={(e) => setCustomPropertyType(e.target.value)}
                className="flex-1 text-sm"
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={handleCustomPropertyTypeSubmit}
                  className="bg-gray-600 hover:bg-gray-700 text-white text-xs"
                >
                  Add
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCustomInput(false);
                    setCustomPropertyType('');
                  }}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50 text-xs"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Selected Custom Property Types */}
        {(() => {
          const propertyTypes = formData.listing_types || formData.unit_types || { database: [], inbuilt: [], custom: [] };
          return propertyTypes.inbuilt.length > 0 || propertyTypes.custom.length > 0;
        })() && (
          <div className="mt-4">
            <h4 className="text-sm font-semibold text-gray-800 mb-2">Selected Custom Types:</h4>
            <div className="flex flex-wrap gap-2">
              {(() => {
                const propertyTypes = formData.listing_types || formData.unit_types || { database: [], inbuilt: [], custom: [] };
                return (
                  <>
                    {/* Inbuilt property types */}
                    {propertyTypes.inbuilt.map(propertyType => (
                      <span
                        key={`inbuilt-${propertyType}`}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-200 text-green-900 border border-green-300"
                      >
                        <span className="truncate max-w-[150px]">{propertyType}</span>
                        <button
                          type="button"
                          onClick={() => updateFormData({ listing_types: { database: [], inbuilt: [], custom: [] }, unit_types: { database: [], inbuilt: [], custom: [] } })}
                          className="ml-1 text-green-700 hover:text-green-900 font-bold flex-shrink-0"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    
                    {/* Custom property types */}
                    {propertyTypes.custom.map(propertyType => (
                      <span
                        key={`custom-${propertyType}`}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-200 text-purple-900 border border-purple-300"
                      >
                        <span className="truncate max-w-[150px]">{propertyType}</span>
                        <button
                          type="button"
                          onClick={() => updateFormData({ listing_types: { database: [], inbuilt: [], custom: [] }, unit_types: { database: [], inbuilt: [], custom: [] } })}
                          className="ml-1 text-purple-700 hover:text-purple-900 font-bold flex-shrink-0"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PropertyCategories