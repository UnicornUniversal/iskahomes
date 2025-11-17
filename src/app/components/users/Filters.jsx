"use client";

import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { getSpecificationDataByTypeId } from '../Data/StaticData';

const Filters = ({ onChange, initial = {} }) => {
  console.log('🔄 Filters component rendering...');
  
  const [selectedPurposeIds, setSelectedPurposeIds] = useState(initial.purposeIds || []);
  const [selectedTypeId, setSelectedTypeId] = useState(initial.typeId || "");
  const [selectedSubtypeIds, setSelectedSubtypeIds] = useState(initial.subtypeIds || []);
  const [country, setCountry] = useState(initial.country || "");
  const [state, setState] = useState(initial.state || "");
  const [city, setCity] = useState(initial.city || "");
  const [town, setTown] = useState(initial.town || "");
  // Initialize location search from initial props (prioritize town > city > state > country)
  const [locationSearch, setLocationSearch] = useState(
    initial.town || initial.city || initial.state || initial.country || ""
  );
  const [locationSearchResults, setLocationSearchResults] = useState([]);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [priceMin, setPriceMin] = useState(initial.priceMin || "");
  const [priceMax, setPriceMax] = useState(initial.priceMax || "");
  const [bedrooms, setBedrooms] = useState(initial.bedrooms || "");
  const [bathrooms, setBathrooms] = useState(initial.bathrooms || "");
  const [specifications, setSpecifications] = useState(initial.specifications || {});
  
  // State for taxonomy data
  const [taxonomyData, setTaxonomyData] = useState({
    purposes: [],
    propertyTypes: [],
    subtypes: [],
    locations: { countries: [], states: [], cities: [], towns: [] }
  });
  const [loading, setLoading] = useState(true);

  // Fetch taxonomy data on component mount
  useEffect(() => {
    const fetchTaxonomyData = async () => {
      try {
        const response = await fetch('/api/property-taxonomy?include_subtypes=true');
        if (response.ok) {
          const result = await response.json();
          setTaxonomyData(result.data);
        } else {
          console.error('Failed to fetch taxonomy data');
        }
      } catch (error) {
        console.error('Error fetching taxonomy data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTaxonomyData();
  }, []);

  // Compute dependent option lists based on real data
  const filteredPropertyTypes = useMemo(() => {
    return taxonomyData.propertyTypes || [];
  }, [taxonomyData.propertyTypes]);

  const filteredSubtypes = useMemo(() => {
    if (!selectedTypeId) return taxonomyData.subtypes || [];
    return (taxonomyData.subtypes || []).filter(subtype => subtype.property_type === selectedTypeId);
  }, [taxonomyData.subtypes, selectedTypeId]);


  // Bubble up changes
  useEffect(() => {
    if (typeof onChange === "function") {
      const filterData = {
        purposeIds: selectedPurposeIds,
        typeId: selectedTypeId,
        subtypeIds: selectedSubtypeIds,
        country,
        state,
        city,
        town,
        priceMin: priceMin === "" ? undefined : Number(priceMin),
        priceMax: priceMax === "" ? undefined : Number(priceMax),
        bedrooms: bedrooms === "" ? undefined : Number(bedrooms),
        bathrooms: bathrooms === "" ? undefined : Number(bathrooms),
        specifications
      };
      console.log('📤 Filters onChange called with:', filterData);
      onChange(filterData);
    }
  }, [selectedPurposeIds, selectedTypeId, selectedSubtypeIds, country, state, city, town, priceMin, priceMax, bedrooms, bathrooms, specifications, onChange]);

  // Reset children when parent changes
  useEffect(() => {
    setSelectedTypeId("");
    setSelectedSubtypeIds([]);
  }, [selectedPurposeIds]);

  useEffect(() => {
    setSelectedSubtypeIds([]);
    // Reset specifications when property type changes
    setSpecifications({});
  }, [selectedTypeId]);

  // Keep location section open when typing
  const [locationSectionOpen, setLocationSectionOpen] = useState(true);


  // Sync location search display when location fields change externally
  // This handles initial props but doesn't interfere with user typing
  useEffect(() => {
    const currentDisplay = town || city || state || country || "";
    // Only update if we have a location value and search is empty or different
    // This prevents overwriting user input while they're typing
    if (currentDisplay) {
      if (!locationSearch || locationSearch !== currentDisplay) {
        // Check if current search matches any result - if not, user might be typing
        const matchesCurrent = locationSearchResults.some(r => r.value === currentDisplay);
        if (!locationSearch || matchesCurrent) {
          setLocationSearch(currentDisplay);
        }
      }
    } else if (!currentDisplay && locationSearch && !showLocationDropdown) {
      // Clear search only if dropdown is closed (user finished searching)
      setLocationSearch("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country, state, city, town]);

  // Get location options from taxonomy data
  const countryOptions = useMemo(() => taxonomyData.locations.countries || [], [taxonomyData.locations.countries]);
  const stateOptions = useMemo(() => taxonomyData.locations.states || [], [taxonomyData.locations.states]);
  const cityOptions = useMemo(() => taxonomyData.locations.cities || [], [taxonomyData.locations.cities]);
  const townOptions = useMemo(() => taxonomyData.locations.towns || [], [taxonomyData.locations.towns]);

  // Search locations using API
  useEffect(() => {
    if (!locationSearch.trim() || locationSearch.trim().length < 1) {
      setLocationSearchResults([]);
      if (locationSearch.trim().length === 0) {
        setShowLocationDropdown(false);
      }
      return;
    }

    // Debounce the search
    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch(`/api/locations/search?q=${encodeURIComponent(locationSearch.trim())}&limit=10`);
        if (response.ok) {
          const result = await response.json();
          setLocationSearchResults(result.data || []);
          setShowLocationDropdown((result.data || []).length > 0);
        } else {
          setLocationSearchResults([]);
          setShowLocationDropdown(false);
        }
      } catch (error) {
        console.error('Error searching locations:', error);
        setLocationSearchResults([]);
        setShowLocationDropdown(false);
      }
    }, 200); // 200ms debounce

    return () => clearTimeout(timeoutId);
  }, [locationSearch]);

  // Handle location selection
  const handleLocationSelect = (location) => {
    // Clear all location fields first
    setCountry("");
    setState("");
    setCity("");
    setTown("");

    // Set the appropriate field based on location type
    switch (location.type) {
      case 'country':
        setCountry(location.value);
        break;
      case 'state':
        setState(location.value);
        break;
      case 'city':
        setCity(location.value);
        break;
      case 'town':
        setTown(location.value);
        break;
    }

    setLocationSearch(location.label);
    setShowLocationDropdown(false);
  };

  const handleClear = () => {
    setSelectedPurposeIds([]);
    setSelectedTypeId("");
    setSelectedSubtypeIds([]);
    setLocationSearch("");
    setCountry("");
    setState("");
    setCity("");
    setTown("");
    setPriceMin("");
    setPriceMax("");
    setBedrooms("");
    setBathrooms("");
    setSpecifications({});
    setShowLocationDropdown(false);
  };

  const Select = ({ label, value, onChange, options, placeholder, disabled }) => {
    const handleChange = (e) => {
      // Prevent scroll to top when selecting
      const scrollContainer = e.target.closest('.overflow-y-auto');
      const scrollTop = scrollContainer?.scrollTop || 0;
      onChange(e.target.value);
      // Restore scroll position after state update
      requestAnimationFrame(() => {
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollTop;
        }
      });
    };

    return (
      <div className="flex-1 min-w-[220px] text-sm ">
        <label className="block mb-1 text-primary_color font-medium text-xs text-left">{label}</label>
        <select
          className={`w-full px-3 py-2 rounded-xl border text-primary_color bg-white outline-none border-primary_color/20 focus:border-primary_color focus:ring-2 focus:ring-secondary_color/30 disabled:opacity-60 text-sm`}
          value={value}
          onChange={handleChange}
          disabled={disabled}
        >
          <option value="">{placeholder}</option>
          {options.map(opt => (
            <option key={opt.id} value={opt.id}>{opt.name}</option>
          ))}
        </select>
      </div>
    );
  };

  const SimpleSelect = ({ label, value, onChange, options, placeholder, disabled }) => {
    const handleChange = (e) => {
      // Prevent scroll to top when selecting
      const scrollContainer = e.target.closest('.overflow-y-auto');
      const scrollTop = scrollContainer?.scrollTop || 0;
      onChange(e.target.value);
      // Restore scroll position after state update
      requestAnimationFrame(() => {
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollTop;
        }
      });
    };

    return (
      <div className="flex-1 min-w-[220px] text-sm">
        <label className="block mb-1 text-primary_color font-medium text-sm">{label}</label>
        <select
          className={`w-full px-3 py-2 rounded-xl border text-primary_color bg-white outline-none border-primary_color/20 focus:border-primary_color focus:ring-2 focus:ring-secondary_color/30 disabled:opacity-60 text-sm`}
          value={value}
          onChange={handleChange}
          disabled={disabled}
        >
          <option value="">{placeholder}</option>
          {options.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
    );
  };

  const NumberInput = ({ label, value, onChange, placeholder, min = 0, step = 1, icon: Icon }) => {
    const handleChange = (e) => {
      // Prevent scroll to top when typing
      const scrollContainer = e.target.closest('.overflow-y-auto');
      const scrollTop = scrollContainer?.scrollTop || 0;
      onChange(e.target.value);
      // Restore scroll position after state update
      requestAnimationFrame(() => {
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollTop;
        }
      });
    };

    return (
      <div className="w-full text-sm">
        <label className="block mb-1 text-primary_color font-medium text-sm flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4" />}
          {label}
        </label>
        <input
          type="number"
          min={min}
          step={step}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          className="w-full px-3 py-2 rounded-xl border text-primary_color bg-white outline-none border-primary_color/20 focus:border-primary_color focus:ring-2 focus:ring-secondary_color/30 text-sm"
        />
      </div>
    );
  };

  const SpecificationSelect = ({ label, value, onChange, options, placeholder, icon: Icon }) => {
    const handleChange = (e) => {
      // Prevent scroll to top when selecting
      const scrollContainer = e.target.closest('.overflow-y-auto');
      const scrollTop = scrollContainer?.scrollTop || 0;
      onChange(e.target.value);
      // Restore scroll position after state update
      requestAnimationFrame(() => {
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollTop;
        }
      });
    };

    return (
      <div className="w-full text-sm">
        <label className="block mb-1 text-primary_color font-medium text-sm flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4" />}
          {label}
        </label>
        <select
          className="w-full px-3 py-2 rounded-xl border text-primary_color bg-white outline-none border-primary_color/20 focus:border-primary_color focus:ring-2 focus:ring-secondary_color/30 text-sm"
          value={value || ""}
          onChange={handleChange}
        >
          <option value="">{placeholder}</option>
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    );
  };

  const SpecificationTextInput = ({ label, value, onChange, placeholder, icon: Icon }) => {
    const handleChange = (e) => {
      // Prevent scroll to top when typing
      const scrollContainer = e.target.closest('.overflow-y-auto');
      const scrollTop = scrollContainer?.scrollTop || 0;
      onChange(e.target.value);
      // Restore scroll position after state update
      requestAnimationFrame(() => {
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollTop;
        }
      });
    };

    return (
      <div className="w-full text-sm">
        <label className="block mb-1 text-primary_color font-medium text-sm flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4" />}
          {label}
        </label>
        <input
          type="text"
          value={value || ""}
          onChange={handleChange}
          placeholder={placeholder}
          className="w-full px-3 py-2 rounded-xl border text-primary_color bg-white outline-none border-primary_color/20 focus:border-primary_color focus:ring-2 focus:ring-secondary_color/30 text-sm"
        />
      </div>
    );
  };

  const LocationSearch = React.memo(({ onKeepSectionOpen }) => {
    const inputRef = useRef(null);
    const dropdownRef = useRef(null);
    const isTypingRef = useRef(false);

    const handleChange = useCallback((e) => {
      const newValue = e.target.value;
      isTypingRef.current = true;
      setLocationSearch(newValue);
      // Ensure location section stays open
      if (onKeepSectionOpen) {
        onKeepSectionOpen(true);
      }
      // Keep focus on input - use requestAnimationFrame for better reliability
      requestAnimationFrame(() => {
        if (inputRef.current && document.activeElement !== inputRef.current) {
          inputRef.current.focus();
          // Set cursor to end of input
          const len = inputRef.current.value.length;
          inputRef.current.setSelectionRange(len, len);
        }
        setTimeout(() => {
          isTypingRef.current = false;
        }, 100);
      });
    }, [onKeepSectionOpen]);

    const handleFocus = useCallback(() => {
      if (locationSearchResults.length > 0) {
        setShowLocationDropdown(true);
      }
    }, [locationSearchResults.length]);

    const handleBlur = useCallback((e) => {
      // Don't close if user is clicking dropdown
      if (isTypingRef.current) {
        return;
      }
      setTimeout(() => {
        // Check if focus moved to dropdown or if still typing
        if (dropdownRef.current?.contains(document.activeElement) || isTypingRef.current) {
          return; // Keep dropdown open
        }
        setShowLocationDropdown(false);
      }, 250);
    }, []);

    const handleLocationClick = useCallback((result) => {
      handleLocationSelect(result);
      setShowLocationDropdown(false);
      if (inputRef.current) {
        inputRef.current.blur();
      }
    }, []);

    return (
      <div className="flex-1 min-w-[220px] text-sm relative">
        <label className="block mb-1 text-primary_color font-medium text-sm">Location</label>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={locationSearch}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder="Search by country, state, city, or town"
            className="w-full px-3 py-2 pr-10 rounded-xl border text-primary_color bg-white outline-none border-primary_color/20 focus:border-primary_color focus:ring-2 focus:ring-secondary_color/30 text-sm"
            autoComplete="off"
            onKeyDown={(e) => {
              // Prevent form submission or other default behaviors
              if (e.key === 'Enter') {
                e.preventDefault();
              }
            }}
          />
          <svg
            className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-primary_color/50 pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {showLocationDropdown && locationSearchResults.length > 0 && (
            <div 
              ref={dropdownRef}
              className="location-dropdown absolute z-[100] w-full mt-1 bg-white border border-primary_color/20 rounded-xl shadow-lg max-h-60 overflow-y-auto"
              onMouseDown={(e) => {
                e.preventDefault(); // Prevent blur when clicking dropdown
                e.stopPropagation();
              }}
            >
              {locationSearchResults.map((result, index) => (
                <button
                  key={`${result.type}-${result.value}-${index}`}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={() => handleLocationClick(result)}
                  className="w-full text-left px-4 py-2 hover:bg-primary_color/10 transition-colors flex items-center gap-2"
                >
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    result.type === 'country' ? 'bg-blue-100 text-blue-700' :
                    result.type === 'state' ? 'bg-green-100 text-green-700' :
                    result.type === 'city' ? 'bg-purple-100 text-purple-700' :
                    'bg-orange-100 text-orange-700'
                  }`}>
                    {result.type}
                  </span>
                  <span className="text-sm text-primary_color">{result.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  });

  const SectionCard = ({ title, children, defaultOpen = false, controlledOpen, onToggle }) => {
    const [internalOpen, setInternalOpen] = useState(defaultOpen);
    const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
    
    const handleToggle = (e) => {
      e.preventDefault();
      e.stopPropagation();
      // Prevent scroll to top when clicking section header
      const scrollContainer = e.target.closest('.overflow-y-auto');
      const scrollTop = scrollContainer?.scrollTop || 0;
      
      if (onToggle) {
        onToggle(!open);
      } else {
        setInternalOpen(!open);
      }
      
      // Restore scroll position
      if (scrollContainer) {
        requestAnimationFrame(() => {
          scrollContainer.scrollTop = scrollTop;
        });
      }
    };
    
    return (
      <div className="w-full rounded-xl border border-primary_color/15 overflow-visible mb-3">
        <button
          type="button"
          aria-expanded={open}
          onClick={handleToggle}
          className="bg-primary_color text-white px-3 py-2 text-xs font-semibold uppercase tracking-wide w-full flex items-center justify-between"
        >
          <span>{title}</span>
          <span className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>⌃</span>
        </button>
        <div className={`${open ? 'block' : 'hidden'} p-3 bg-white`}>{children}</div>
      </div>
    );
  };

  // Component to render dynamic specification fields based on property type
  const SpecificationFields = ({ propertyTypeId, specifications, bedrooms, bathrooms, onSpecificationsChange, onBedroomsChange, onBathroomsChange }) => {
    const specData = getSpecificationDataByTypeId(propertyTypeId);
    
    if (!specData) {
      return (
        <div className="text-center py-4 text-gray-500">
          <p className="text-sm">Specifications for this property type are not available</p>
        </div>
      );
    }

    const handleSpecificationChange = (fieldKey, value) => {
      onSpecificationsChange({
        ...specifications,
        [fieldKey]: value
      });
    };

    // Filter fields - show only relevant ones for filtering
    // For houses/apartments, show bedrooms/bathrooms separately, then other specs
    const isHousesApartments = propertyTypeId === '16f02534-40e4-445f-94f2-2a01531b8503';
    
    // Get fields that are useful for filtering (exclude some internal fields)
    const filterableFields = specData.fields.filter(field => {
      // For houses/apartments, exclude bedrooms/bathrooms as they're shown separately
      if (isHousesApartments && (field.key === 'bedrooms' || field.key === 'bathrooms')) {
        return false;
      }
      return true;
    });

    return (
      <div className="flex flex-col gap-3">
        {/* Show bedrooms/bathrooms for houses/apartments */}
        {isHousesApartments && (
          <div className="flex flex-col w-full gap-3">
            {specData.fields.find(f => f.key === 'bedrooms') && (
              <NumberInput
                label="Bedrooms"
                value={bedrooms}
                onChange={onBedroomsChange}
                placeholder="Any"
                min={0}
                icon={specData.fields.find(f => f.key === 'bedrooms')?.icon}
              />
            )}
            {specData.fields.find(f => f.key === 'bathrooms') && (
              <NumberInput
                label="Bathrooms"
                value={bathrooms}
                onChange={onBathroomsChange}
                placeholder="Any"
                min={0}
                step={0.5}
                icon={specData.fields.find(f => f.key === 'bathrooms')?.icon}
              />
            )}
          </div>
        )}

        {/* Render other specification fields */}
        {filterableFields.length > 0 && (
          <div className="flex flex-col gap-3">
            {filterableFields.map(field => {
              const fieldValue = specifications[field.key] || "";

              if (field.type === 'number') {
                return (
                  <NumberInput
                    key={field.key}
                    label={field.label}
                    value={fieldValue}
                    onChange={(value) => handleSpecificationChange(field.key, value === "" ? undefined : Number(value))}
                    placeholder={field.placeholder || "Any"}
                    min={field.min || 0}
                    step={field.step || 1}
                    icon={field.icon}
                  />
                );
              } else if (field.type === 'select') {
                return (
                  <SpecificationSelect
                    key={field.key}
                    label={field.label}
                    value={fieldValue}
                    onChange={(value) => handleSpecificationChange(field.key, value || undefined)}
                    options={field.options || []}
                    placeholder={field.placeholder || `Select ${field.label.toLowerCase()}`}
                    icon={field.icon}
                  />
                );
              } else if (field.type === 'text') {
                return (
                  <SpecificationTextInput
                    key={field.key}
                    label={field.label}
                    value={fieldValue}
                    onChange={(value) => handleSpecificationChange(field.key, value || undefined)}
                    placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                    icon={field.icon}
                  />
                );
              }
              return null;
            })}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="w-full max-h-screen overflow-y-auto rounded-2xl bg-white shadow-sm p-4 md:p-6 border border-primary_color/10">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary_color"></div>
          <span className="ml-2 text-primary_color">Loading filters...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen overflow-y-auto rounded-2xl bg-white shadow-sm p-4 md:p-6 border border-primary_color/10">
      <div className="flex items-center justify-between mb-4">
        <h6 className="text-primary_color font-semibold">Filters</h6>
        <button type="button" onClick={handleClear} className="bg-white text-secondary_color border border-secondary_color hover:bg-secondary_color hover:text-white px-4 py-2 rounded-full">
          Clear
        </button>
      </div>

      <div className="flex flex-col items-start gap-2 text-sm">
        <SectionCard title="Property" defaultOpen>
          <div className="flex flex-col gap-3">
            {/* Purpose - Radio Buttons (Multiple Selection) */}
            <div className="flex-1 min-w-[220px] text-sm">
              <label className="block mb-2 text-primary_color font-medium text-xs text-left">Purpose</label>
              <div className="space-y-2">
                {taxonomyData.purposes.map(purpose => (
                  <label key={purpose.id} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedPurposeIds.includes(purpose.id)}
                      onChange={(e) => {
                        // Prevent scroll to top when checking
                        const scrollContainer = e.target.closest('.overflow-y-auto');
                        const scrollTop = scrollContainer?.scrollTop || 0;
                        if (e.target.checked) {
                          setSelectedPurposeIds([...selectedPurposeIds, purpose.id]);
                        } else {
                          setSelectedPurposeIds(selectedPurposeIds.filter(id => id !== purpose.id));
                        }
                        // Restore scroll position after state update
                        requestAnimationFrame(() => {
                          if (scrollContainer) {
                            scrollContainer.scrollTop = scrollTop;
                          }
                        });
                      }}
                      className="w-4 h-4 text-primary_color border-primary_color/20 rounded focus:ring-primary_color focus:ring-2"
                    />
                    <span className="text-sm text-primary_color">{purpose.name}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <Select
              label="Property Type"
              value={selectedTypeId}
              onChange={setSelectedTypeId}
              options={filteredPropertyTypes}
              placeholder="Select property type"
            />
            {/* Property Subtypes - Checkboxes (Multiple Selection) */}
            <div className="flex-1 min-w-[220px] text-sm">
              <label className="block mb-2 text-primary_color font-medium text-xs text-left">Property Subtypes</label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {filteredSubtypes.map(subtype => (
                  <label key={subtype.id} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedSubtypeIds.includes(subtype.id)}
                      onChange={(e) => {
                        // Prevent scroll to top when checking
                        const scrollContainer = e.target.closest('.overflow-y-auto');
                        const scrollTop = scrollContainer?.scrollTop || 0;
                        if (e.target.checked) {
                          setSelectedSubtypeIds([...selectedSubtypeIds, subtype.id]);
                        } else {
                          setSelectedSubtypeIds(selectedSubtypeIds.filter(id => id !== subtype.id));
                        }
                        // Restore scroll position after state update
                        requestAnimationFrame(() => {
                          if (scrollContainer) {
                            scrollContainer.scrollTop = scrollTop;
                          }
                        });
                      }}
                      className="w-4 h-4 text-primary_color border-primary_color/20 rounded focus:ring-primary_color focus:ring-2"
                    />
                    <span className="text-sm text-primary_color">{subtype.name}</span>
                  </label>
                ))}
                {filteredSubtypes.length === 0 && (
                  <p className="text-xs text-gray-500 italic">Select a property type first</p>
                )}
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard 
          title="Location" 
          defaultOpen={true}
          controlledOpen={locationSectionOpen}
          onToggle={setLocationSectionOpen}
        >
          <div className="flex flex-col gap-3">
            <LocationSearch onKeepSectionOpen={setLocationSectionOpen} />
          </div>
        </SectionCard>

        <SectionCard title="Price (GHS)">
          <div className="flex w-full items-center gap-3">
            <NumberInput label="Min" value={priceMin} onChange={setPriceMin} placeholder="0" min={0} />
            <NumberInput label="Max" value={priceMax} onChange={setPriceMax} placeholder="Any" min={0} />
          </div>
        </SectionCard>

        {/* Dynamic Specifications based on Property Type */}
        {selectedTypeId ? (
          <SectionCard title="Specifications" defaultOpen>
            <SpecificationFields
              propertyTypeId={selectedTypeId}
              specifications={specifications}
              bedrooms={bedrooms}
              bathrooms={bathrooms}
              onSpecificationsChange={setSpecifications}
              onBedroomsChange={setBedrooms}
              onBathroomsChange={setBathrooms}
            />
          </SectionCard>
        ) : (
          <SectionCard title="Specifications">
            <div className="flex w-full items-center gap-3">
              <NumberInput label="Bedrooms" value={bedrooms} onChange={setBedrooms} placeholder="Any" min={0} />
              <NumberInput label="Bathrooms" value={bathrooms} onChange={setBathrooms} placeholder="Any" min={0} />
            </div>
            <p className="text-xs text-gray-500 mt-2 italic">Select a property type to see more specifications</p>
          </SectionCard>
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        {selectedPurposeIds.map(purposeId => (
          <span key={purposeId} className="px-3 py-1 rounded-full bg-primary_color/10 text-primary_color">
            {taxonomyData.purposes.find(p => p.id === purposeId)?.name}
          </span>
        ))}
        {selectedTypeId && (
          <span className="px-3 py-1 rounded-full bg-primary_color/10 text-primary_color">
            {taxonomyData.propertyTypes.find(t => t.id === selectedTypeId)?.name}
          </span>
        )}
        {selectedSubtypeIds.map(subtypeId => (
          <span key={subtypeId} className="px-3 py-1 rounded-full bg-primary_color/10 text-primary_color">
            {taxonomyData.subtypes.find(s => s.id === subtypeId)?.name}
          </span>
        ))}
        {(country || state || city || town) && (
          <span className="px-3 py-1 rounded-full bg-primary_color/10 text-primary_color">
            {town || city || state || country}
          </span>
        )}
        {(priceMin !== "" || priceMax !== "") && (
          <span className="px-3 py-1 rounded-full bg-secondary_color/10 text-secondary_color">GHS {priceMin || 0} - {priceMax || 'Any'}</span>
        )}
        {(bedrooms || bathrooms) && (
          <span className="px-3 py-1 rounded-full bg-primary_color/10 text-primary_color">{bedrooms ? `${bedrooms} BR` : ''} {bathrooms ? `${bathrooms} BA` : ''}</span>
        )}
        {Object.keys(specifications).length > 0 && Object.entries(specifications).map(([key, value]) => {
          if (value === undefined || value === null || value === "") return null;
          const specData = selectedTypeId ? getSpecificationDataByTypeId(selectedTypeId) : null;
          const field = specData?.fields.find(f => f.key === key);
          if (!field) return null;
          
          let displayValue = value;
          if (field.type === 'select' && field.options) {
            const option = field.options.find(opt => opt.value === value);
            displayValue = option ? option.label : value;
          }
          
          return (
            <span key={key} className="px-3 py-1 rounded-full bg-primary_color/10 text-primary_color text-xs">
              {field.label}: {displayValue}
            </span>
          );
        })}
      </div>
    </div>
  );
};

export default Filters;
