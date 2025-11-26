"use client"
import React, { useState, useEffect } from 'react'
import { Input } from '../../ui/input'
import { cn } from '@/lib/utils'

const DevelopmentCategories = ({ formData, updateFormData, isEditMode }) => {
  const [categoriesData, setCategoriesData] = useState({
    purposes: [],
    types: [],
    categories: [],
    subtypes: []
  })

  // Built-in unit types for custom selection (hidden from main view)
  const builtInUnitTypes = [
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

  const [loading, setLoading] = useState({
    purposes: false,
    types: false,
    categories: false,
    subtypes: false
  })

  const [customUnitType, setCustomUnitType] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [showBuiltInTypes, setShowBuiltInTypes] = useState(false)
  const [searchBuiltInTypes, setSearchBuiltInTypes] = useState('')

  // Fetch all categories data on component mount
  useEffect(() => {
    fetchCategoriesData();
  }, []);

  const fetchCategoriesData = async () => {
    await Promise.all([
      fetchPurposes(),
      fetchTypes()
    ]);
  };

  const fetchPurposes = async () => {
    setLoading(prev => ({ ...prev, purposes: true }));
    try {
      const response = await fetch('/api/admin/property-purposes');
      if (response.ok) {
        const result = await response.json();
        setCategoriesData(prev => ({ ...prev, purposes: result.data || [] }));
      } else {
        console.error('Failed to fetch purposes');
      }
    } catch (error) {
      console.error('Error fetching purposes:', error);
    } finally {
      setLoading(prev => ({ ...prev, purposes: false }));
    }
  };

  const fetchTypes = async () => {
    setLoading(prev => ({ ...prev, types: true }));
    try {
      const response = await fetch('/api/admin/property-types');
      if (response.ok) {
        const result = await response.json();
        setCategoriesData(prev => ({ ...prev, types: result.data || [] }));
      } else {
        console.error('Failed to fetch types');
      }
    } catch (error) {
      console.error('Error fetching types:', error);
    } finally {
      setLoading(prev => ({ ...prev, types: false }));
    }
  };

  const handleCategoryToggle = (categoryType, item) => {
    const updatedCategories = formData[categoryType].includes(item.id)
      ? formData[categoryType].filter(id => id !== item.id)
      : [...formData[categoryType], item.id];
    
    updateFormData({
      [categoryType]: updatedCategories
    });

    // Auto-populate categories and subtypes when property types change
    if (categoryType === 'types') {
      autoPopulateCategoriesAndSubtypes(updatedCategories);
    }
  };

  const handlePropertyTypeToggle = (type) => {
    const updatedTypes = formData.types.includes(type.id)
      ? formData.types.filter(id => id !== type.id)
      : [...formData.types, type.id];
    
    updateFormData({
      types: updatedTypes
    });

    // Auto-populate categories and subtypes when property types change
    autoPopulateCategoriesAndSubtypes(updatedTypes);
  };

  const autoPopulateCategoriesAndSubtypes = async (selectedTypes) => {
    if (selectedTypes.length === 0) {
      // Clear categories and subtypes if no types selected
      updateFormData({
        categories: []
      });
      setCategoriesData(prev => ({ 
        ...prev, 
        categories: [],
        subtypes: []
      }));
      return;
    }

    try {
      // Fetch all categories and filter by selected types
      const categoriesResponse = await fetch('/api/admin/property-categories');
      if (categoriesResponse.ok) {
        const categoriesResult = await categoriesResponse.json();
        
        // Filter categories that have any of the selected property types
        const relevantCategories = categoriesResult.data?.filter(category => {
          const categoryPropertyTypes = Array.isArray(category.property_type) 
            ? category.property_type 
            : [category.property_type];
          
          // Check if any of the category's property types match any of the selected types
          return categoryPropertyTypes.some(type => selectedTypes.includes(type));
        }) || [];
        
        console.log('All categories:', categoriesResult.data);
        console.log('Selected types:', selectedTypes);
        console.log('Relevant categories:', relevantCategories);
        
        // Auto-select all relevant categories
        const categoryIds = relevantCategories.map(cat => cat.id);
        updateFormData({
          categories: categoryIds
        });

        // Update the categories data state to show the filtered categories
        setCategoriesData(prev => ({ 
          ...prev, 
          categories: relevantCategories 
        }));

        // Fetch subtypes based on selected property types (not categories)
        const subtypesResponse = await fetch('/api/admin/property-subtypes');
        if (subtypesResponse.ok) {
          const subtypesResult = await subtypesResponse.json();
          
          // Filter subtypes that match any of the selected property types
          const relevantSubtypes = subtypesResult.data?.filter(subtype => 
            selectedTypes.includes(subtype.property_type)
          ) || [];
          
          console.log('All subtypes:', subtypesResult.data);
          console.log('Relevant subtypes:', relevantSubtypes);
          
          // Store relevant subtypes in state for manual selection (don't auto-select)
          setCategoriesData(prev => ({ 
            ...prev, 
            subtypes: relevantSubtypes 
          }));
        }
      }
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
    const items = categoriesData[categoryType] || [];
    return items.filter(item => formData[categoryType].includes(item.id));
  };

  const handleUnitTypeToggle = (unitType) => {
    // Ensure unit_types structure exists
    const unitTypes = formData.unit_types || { database: [], inbuilt: [], custom: [] };
    
    const updatedUnitTypes = { ...unitTypes };
    
    // Check if it's a database subtype (object) or string
    const isDatabaseSubtype = typeof unitType === 'object' && unitType.id;
    const unitTypeId = isDatabaseSubtype ? unitType.id : unitType;
    const unitTypeName = isDatabaseSubtype ? unitType.name : unitType;
    
    const isInDatabase = updatedUnitTypes.database.some(type => 
      (typeof type === 'object' ? type.id : type) === unitTypeId
    );
    const isInInbuilt = updatedUnitTypes.inbuilt.includes(unitTypeName);
    const isInCustom = updatedUnitTypes.custom.includes(unitTypeName);
    
    if (isInDatabase) {
      updatedUnitTypes.database = updatedUnitTypes.database.filter(type => 
        (typeof type === 'object' ? type.id : type) !== unitTypeId
      );
    } else if (isInInbuilt) {
      updatedUnitTypes.inbuilt = updatedUnitTypes.inbuilt.filter(type => type !== unitTypeName);
    } else if (isInCustom) {
      updatedUnitTypes.custom = updatedUnitTypes.custom.filter(type => type !== unitTypeName);
    } else {
      // Add to appropriate category
      if (isDatabaseSubtype) {
        updatedUnitTypes.database = [...updatedUnitTypes.database, unitType];
      } else {
        updatedUnitTypes.inbuilt = [...updatedUnitTypes.inbuilt, unitTypeName];
      }
    }
    
    updateFormData({
      unit_types: updatedUnitTypes
    });
  };

  const handleCustomOptionClick = () => {
    setShowCustomInput(true);
  };

  const handleBuiltInTypeSelect = (unitType) => {
    // Ensure unit_types structure exists
    const unitTypes = formData.unit_types || { database: [], inbuilt: [], custom: [] };
    
    // Check if the unit type already exists in any category
    const isInDatabase = unitTypes.database.includes(unitType);
    const isInInbuilt = unitTypes.inbuilt.includes(unitType);
    const isInCustom = unitTypes.custom.includes(unitType);
    
    if (isInDatabase || isInInbuilt || isInCustom) {
      return; // Don't add if it already exists
    }

    const updatedUnitTypes = { ...unitTypes };
    updatedUnitTypes.inbuilt = [...updatedUnitTypes.inbuilt, unitType];
    
    updateFormData({
      unit_types: updatedUnitTypes
    });
    // Don't close the modal - let user select multiple types
    setSearchBuiltInTypes('');
  };

  const handleCustomUnitTypeSubmit = () => {
    if (customUnitType.trim()) {
      const trimmedUnitType = customUnitType.trim();
      
      // Ensure unit_types structure exists
      const unitTypes = formData.unit_types || { database: [], inbuilt: [], custom: [] };
      
      // Check if the unit type already exists in any category
      const isInDatabase = unitTypes.database.includes(trimmedUnitType);
      const isInInbuilt = unitTypes.inbuilt.includes(trimmedUnitType);
      const isInCustom = unitTypes.custom.includes(trimmedUnitType);
      
      if (isInDatabase || isInInbuilt || isInCustom) {
        return; // Don't add if it already exists
      }
      
      const updatedUnitTypes = { ...unitTypes };
      updatedUnitTypes.custom = [...updatedUnitTypes.custom, trimmedUnitType];
      
      updateFormData({
        unit_types: updatedUnitTypes
      });
      setCustomUnitType('');
      setShowCustomInput(false);
    }
  };

  const removeUnitType = (unitType, type) => {
    // Ensure unit_types structure exists
    const unitTypes = formData.unit_types || { database: [], inbuilt: [], custom: [] };
    
    const updatedUnitTypes = { ...unitTypes };
    
    if (type === 'database') {
      const unitTypeId = typeof unitType === 'object' ? unitType.id : unitType;
      updatedUnitTypes.database = updatedUnitTypes.database.filter(type => 
        (typeof type === 'object' ? type.id : type) !== unitTypeId
      );
    } else if (type === 'inbuilt') {
      const unitTypeName = typeof unitType === 'object' ? unitType.name : unitType;
      updatedUnitTypes.inbuilt = updatedUnitTypes.inbuilt.filter(type => type !== unitTypeName);
    } else if (type === 'custom') {
      const unitTypeName = typeof unitType === 'object' ? unitType.name : unitType;
      updatedUnitTypes.custom = updatedUnitTypes.custom.filter(type => type !== unitTypeName);
    }
    
    updateFormData({
      unit_types: updatedUnitTypes
    });
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="mb-2">Development Categories</h2>
        <p>
          {isEditMode ? 'Update the development categories' : 'Select the appropriate categories for your development'}
        </p>
      </div>

      <div className="space-y-8">
        {/* Purposes Section */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
              <span className="text-white text-sm font-bold">1</span>
            </div>
            <label className="text-lg font-semibold ">
              Development Purpose *
            </label>
          </div>
          <p className="text-sm mb-4">Select the primary purpose(s) for your development project</p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
            {loading.purposes ? (
              <div className="col-span-full text-center py-4">Loading purposes...</div>
            ) : (
              categoriesData.purposes.map(purpose => (
                <label key={purpose.id} className="flex items-center space-x-2 cursor-pointer p-2 rounded-lg hover:bg-blue-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.purposes.includes(purpose.id)}
                    onChange={() => handleCategoryToggle('purposes', purpose)}
                    className="rounded border-blue-300  focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium">{purpose.name}</span>
                </label>
              ))
            )}
          </div>
          
          {/* Selected Purposes */}
          {formData.purposes.length > 0 && (
            <div className="mt-4 p-3 bg-blue-100 rounded-lg">
              <h4 className="text-sm font-semibold  mb-2">Selected Purposes:</h4>
              <div className="flex flex-wrap gap-2">
                {getSelectedItems('purposes').map(purpose => (
                  <span
                    key={purpose.id}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-200 border border-blue-300"
                  >
                    {purpose.name}
                    <button
                      type="button"
                      onClick={() => handleRemoveCategory('purposes', purpose.id)}
                      className="ml-2 font-bold"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Types Section */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
              <span className="text-white text-sm font-bold">2</span>
            </div>
            <label className="text-lg font-semibold ">
              Property Types *
            </label>
          </div>
          <p className="text-sm mb-4">Choose the type(s) of properties in your development (you can select multiple)</p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
            {loading.types ? (
              <div className="col-span-full text-center py-4">Loading types...</div>
            ) : (
              categoriesData.types.map(type => (
                <label key={type.id} className="flex items-center space-x-2 cursor-pointer p-2 rounded-lg hover:bg-green-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.types.includes(type.id)}
                    onChange={() => handlePropertyTypeToggle(type)}
                    className="rounded border-green-300 focus:ring-green-500"
                  />
                  <span className="text-sm font-medium">{type.name}</span>
                </label>
              ))
            )}
          </div>
          
          {/* Selected Types */}
          {formData.types.length > 0 && (
            <div className="mt-4 p-3 bg-green-100 rounded-lg">
              <h4 className="text-sm font-semibold  mb-2">Selected Types:</h4>
              <div className="flex flex-wrap gap-2">
                {getSelectedItems('types').map(type => (
                  <span
                    key={type.id}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-200 border border-green-300"
                  >
                    {type.name}
                    <button
                      type="button"
                      onClick={() => handleRemoveCategory('types', type.id)}
                      className="ml-2 font-bold"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Categories Section */}
        <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-6 rounded-xl border border-purple-200">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center mr-3">
              <span className="text-white text-sm font-bold">3</span>
            </div>
            <label className="text-lg font-semibold ">
              Property Categories
            </label>
            <span className="text-sm ml-2 bg-purple-200 px-2 py-1 rounded-full">Auto-populated</span>
          </div>
          <p className="text-sm mb-4">Categories are automatically selected based on your chosen property types</p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
            {loading.categories ? (
              <div className="col-span-full text-center py-4">Loading categories...</div>
            ) : formData.types.length > 0 ? (
              categoriesData.categories.map(category => (
                <label key={category.id} className="flex items-center space-x-2 cursor-pointer p-2 rounded-lg hover:bg-purple-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.categories.includes(category.id)}
                    onChange={() => handleCategoryToggle('categories', category)}
                    className="rounded border-purple-300 focus:ring-purple-500"
                  />
                  <span className="text-sm font-medium">{category.name}</span>
                </label>
              ))
            ) : (
              <div className="col-span-full text-center py-6 bg-purple-100 rounded-lg">
                <div className="text-lg mb-2">🏗️</div>
                <p>Please select property types to see categories</p>
              </div>
            )}
          </div>
          
          {/* Selected Categories */}
          {formData.categories.length > 0 && (
            <div className="mt-4 p-3 bg-purple-100 rounded-lg">
              <h4 className="text-sm font-semibold  mb-2">Selected Categories:</h4>
              <div className="flex flex-wrap gap-2">
                {getSelectedItems('categories').map(category => (
                  <span
                    key={category.id}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-200 border border-purple-300"
                  >
                    {category.name}
                    <button
                      type="button"
                      onClick={() => handleRemoveCategory('categories', category.id)}
                      className="ml-2 font-bold"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Unit Types Section */}
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 sm:p-6 rounded-xl border border-orange-200">
          <div className="flex items-center mb-4">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-orange-500 rounded-full flex items-center justify-center mr-2 sm:mr-3">
              <span className="text-white text-xs sm:text-sm font-bold">4</span>
            </div>
            <label className="text-base sm:text-lg font-semibold ">
              Unit Types *
            </label>
          </div>
          <p className=" text-xs sm:text-sm mb-4">Select unit types from project categories or add custom types</p>
          
          {/* Database Unit Types from Property Types */}
          {formData.types.length > 0 ? (
            <div className="mb-4">
              <h4 className="text-sm font-semibold  mb-2">Available Unit Types from Database:</h4>
              <div className="max-h-48 overflow-y-auto border border-orange-200 rounded-lg p-2 sm:p-3">
                {loading.subtypes ? (
                  <div className="text-center py-4 text-sm">Loading unit types...</div>
                ) : categoriesData.subtypes.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {categoriesData.subtypes.map(subtype => (
                      <label key={subtype.id} className="flex items-center space-x-2 cursor-pointer p-2 rounded-lg hover:bg-orange-100 transition-colors">
                        <input
                          type="checkbox"
                          checked={(() => {
                            const unitTypes = formData.unit_types || { database: [], inbuilt: [], custom: [] };
                            return unitTypes.database.some(type => 
                              (typeof type === 'object' ? type.id : type) === subtype.id
                            );
                          })()}
                          onChange={() => handleUnitTypeToggle(subtype)}
                          className="rounded border-orange-300 focus:ring-orange-500"
                        />
                        <span className="text-xs sm:text-sm font-medium">{subtype.name}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs sm:text-sm italic">No unit types available for selected property types</p>
                )}
              </div>
            </div>
          ) : (
            <div className="mb-4 p-3 bg-orange-100 rounded-lg">
              <p className="text-sm">
                <span className="font-semibold">Note:</span> Please select property types first to see available unit types from the database.
              </p>
            </div>
          )}

          {/* Custom Unit Types Section */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <h4 className="text-sm font-semibold ">Custom Unit Types:</h4>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={handleCustomOptionClick}
                  className="secondary_button text-xs sm:text-sm"
                >
                  Add Custom
                </button>
                <button
                  type="button"
                  onClick={() => setShowBuiltInTypes(!showBuiltInTypes)}
                  className="secondary_button text-xs sm:text-sm"
                >
                  {showBuiltInTypes ? 'Hide' : 'Show'} Built-in Types
                </button>
              </div>
            </div>

            {/* Built-in Types Modal */}
            {showBuiltInTypes && (
              <div className="border border-orange-200 rounded-lg p-4">
                <div className="mb-3">
                  <Input
                    type="text"
                    placeholder="Search built-in unit types..."
                    value={searchBuiltInTypes}
                    onChange={(e) => setSearchBuiltInTypes(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {builtInUnitTypes
                      .filter(type => 
                        type.toLowerCase().includes(searchBuiltInTypes.toLowerCase())
                      )
                      .map(unitType => {
                        const unitTypes = formData.unit_types || { database: [], inbuilt: [], custom: [] };
                        const isSelected = unitTypes.database.includes(unitType) ||
                                          unitTypes.inbuilt.includes(unitType) ||
                                          unitTypes.custom.includes(unitType);
                        return (
                          <button
                            key={unitType}
                            type="button"
                            onClick={() => handleBuiltInTypeSelect(unitType)}
                            disabled={isSelected}
                            className={`text-left p-2 rounded-lg transition-colors text-xs sm:text-sm ${
                              isSelected 
                                ? 'bg-orange-200  cursor-not-allowed opacity-60' 
                                : 'hover:bg-orange-100 '
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span>{unitType}</span>
                              {isSelected && <span className="">✓</span>}
                            </div>
                          </button>
                        );
                      })}
                  </div>
                </div>
              </div>
            )}

            {/* Custom Unit Type Input */}
            {showCustomInput && (
              <div className="p-3 sm:p-4 bg-orange-100 rounded-lg border border-orange-200">
                <h4 className="text-sm font-semibold  mb-2">Add Custom Unit Type</h4>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    type="text"
                    placeholder="Enter custom unit type..."
                    value={customUnitType}
                    onChange={(e) => setCustomUnitType(e.target.value)}
                    className="flex-1 text-sm"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleCustomUnitTypeSubmit}
                      className="primary_button text-xs sm:text-sm"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCustomInput(false);
                        setCustomUnitType('');
                      }}
                      className="secondary_button text-xs sm:text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Selected Unit Types */}
          {(() => {
            const unitTypes = formData.unit_types || { database: [], inbuilt: [], custom: [] };
            return unitTypes.database.length > 0 || 
                   unitTypes.inbuilt.length > 0 || 
                   unitTypes.custom.length > 0;
          })() && (
            <div className="mt-4 p-3 bg-orange-100 rounded-lg">
              <h4 className="text-sm font-semibold  mb-2">Selected Unit Types:</h4>
              <div className="flex flex-wrap gap-2">
                {(() => {
                  const unitTypes = formData.unit_types || { database: [], inbuilt: [], custom: [] };
                  return (
                    <>
                      {/* Database unit types */}
                      {unitTypes.database.map(unitType => {
                        const unitTypeName = typeof unitType === 'object' ? unitType.name : unitType;
                        const unitTypeId = typeof unitType === 'object' ? unitType.id : unitType;
                        return (
                          <span
                            key={`db-${unitTypeId}`}
                            className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium bg-blue-200  border border-blue-300"
                          >
                            <span className="truncate max-w-[150px] sm:max-w-none">{unitTypeName}</span>
                            <button
                              type="button"
                              onClick={() => removeUnitType(unitType, 'database')}
                              className="ml-1 sm:ml-2 font-bold flex-shrink-0"
                            >
                              ×
                            </button>
                          </span>
                        );
                      })}
                      
                      {/* Inbuilt unit types */}
                      {unitTypes.inbuilt.map(unitType => (
                        <span
                          key={`inbuilt-${unitType}`}
                          className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium bg-green-200  border border-green-300"
                        >
                          <span className="truncate max-w-[150px] sm:max-w-none">{unitType}</span>
                          <button
                            type="button"
                            onClick={() => removeUnitType(unitType, 'inbuilt')}
                            className="ml-1 sm:ml-2 font-bold flex-shrink-0"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                      
                      {/* Custom unit types */}
                      {unitTypes.custom.map(unitType => (
                        <span
                          key={`custom-${unitType}`}
                          className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium bg-purple-200  border border-purple-300"
                        >
                          <span className="truncate max-w-[150px] sm:max-w-none">{unitType}</span>
                          <button
                            type="button"
                            onClick={() => removeUnitType(unitType, 'custom')}
                            className="ml-1 sm:ml-2 font-bold flex-shrink-0"
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
    </div>
  )
}

export default DevelopmentCategories
