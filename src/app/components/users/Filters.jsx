"use client";

import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { getSpecificationDataByTypeId } from '../Data/StaticData';

// --- Extracted Components ---

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

const NumberInput = React.memo(({ label, valueRef, value, onChange, placeholder, min = 0, step = 1, icon: Icon }) => {
  const inputRef = useRef(null);
  // Use local state for display - completely isolated from parent
  // Initialize from valueRef or value prop
  const [localValue, setLocalValue] = useState(valueRef?.current || value || "");

  // Sync with ref value only when component mounts or ref changes externally
  useEffect(() => {
    if (valueRef && valueRef.current !== localValue && document.activeElement !== inputRef.current) {
      setLocalValue(valueRef.current || "");
    }
  }, [valueRef?.current]);

  // Sync with value prop if provided (for controlled mode)
  useEffect(() => {
    if (value !== undefined && value !== localValue && document.activeElement !== inputRef.current) {
      setLocalValue(value || "");
    }
  }, [value]);

  const handleChange = useCallback((e) => {
    const newValue = e.target.value;
    
    // Update ref immediately (no re-render, no API calls)
    if (valueRef) {
      valueRef.current = newValue;
    }

    // Call onChange if provided (for controlled mode)
    if (onChange) {
      onChange(newValue);
    }
    
    // Update local display state (completely isolated - doesn't trigger parent re-render)
    setLocalValue(newValue);
    
    // For number inputs, we can't use setSelectionRange, so just ensure focus
    // The browser handles cursor position automatically for number inputs
    requestAnimationFrame(() => {
      if (inputRef.current && document.activeElement !== inputRef.current) {
        inputRef.current.focus();
      }
    });
  }, [valueRef, onChange]);

  return (
    <div className="w-full text-sm">
      <label className="block mb-1 text-primary_color font-medium text-sm flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4" />}
        {label}
      </label>
      <input
        ref={inputRef}
        type="number"
        min={min}
        step={step}
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-xl border text-primary_color bg-white outline-none border-primary_color/20 focus:border-primary_color focus:ring-2 focus:ring-secondary_color/30 text-sm"
      />
    </div>
  );
});

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

const SpecificationTextInput = React.memo(({ label, value, onChange, placeholder, icon: Icon }) => {
  const inputRef = useRef(null);
  // Use local state for display - completely isolated from parent
  const [localValue, setLocalValue] = useState(value || "");

  // Sync with prop value only when component mounts or value changes externally
  useEffect(() => {
    if (value !== localValue && document.activeElement !== inputRef.current) {
      setLocalValue(value || "");
    }
  }, [value]);

  const handleChange = useCallback((e) => {
    const newValue = e.target.value;
    const cursorPosition = e.target.selectionStart;
    
    // Update local display state immediately (completely isolated - doesn't trigger parent re-render)
    setLocalValue(newValue);
    
    // Update parent via onChange (but parent won't re-render Filters component)
    if (onChange) {
      onChange(newValue);
    }
    
    // Restore cursor position for text inputs
    requestAnimationFrame(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        const newPosition = Math.min(cursorPosition, newValue.length);
        // Only use setSelectionRange for text inputs
        if (inputRef.current.type === 'text') {
          inputRef.current.setSelectionRange(newPosition, newPosition);
        }
      }
    });
  }, [onChange]);

  return (
    <div className="w-full text-sm">
      <label className="block mb-1 text-primary_color font-medium text-sm flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4" />}
        {label}
      </label>
      <input
        ref={inputRef}
        type="text"
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-xl border text-primary_color bg-white outline-none border-primary_color/20 focus:border-primary_color focus:ring-2 focus:ring-secondary_color/30 text-sm"
      />
    </div>
  );
});

const LocationInput = React.memo(({ locationInputRef, setCountry, setState, setCity, setTown, setLocationDisplayKey, locationDisplayKey }) => {
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  // Use local state for display - completely isolated from parent
  // Start empty - don't show default country in input
  const [localDisplay, setLocalDisplay] = useState("");
  // Move search results state here to prevent parent re-renders
  const [locationSearchResults, setLocationSearchResults] = useState([]);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);

  // Location search function
  const triggerLocationSearch = useCallback(async (searchValue) => {
    if (!searchValue || searchValue.trim().length < 1) {
      return [];
    }

    try {
      const response = await fetch(`/api/locations/search?q=${encodeURIComponent(searchValue.trim())}&limit=10`);
      if (response.ok) {
        const result = await response.json();
        return result.data || [];
      } else {
        return [];
      }
    } catch (error) {
      console.error('Error searching locations:', error);
      return [];
    }
  }, []);

  // Handle location selection
  const handleLocationSelect = useCallback((location) => {
    // Clear all location fields first
    setCountry("");
    setState("");
    setCity("");
    setTown("");

    // Set the appropriate field based on location type
    switch (location.type) {
      case 'country':
        setCountry(location.value);
        locationInputRef.current = location.label;
        break;
      case 'state':
        setState(location.value);
        locationInputRef.current = location.label;
        break;
      case 'city':
        setCity(location.value);
        locationInputRef.current = location.label;
        break;
      case 'town':
        setTown(location.value);
        locationInputRef.current = location.label;
        break;
    }

    // Trigger LocationInput to sync with ref (minimal re-render)
    setLocationDisplayKey(prev => prev + 1);
  }, [setCountry, setState, setCity, setTown, setLocationDisplayKey, locationInputRef]);

  // Sync with ref value when locationDisplayKey changes (when location is selected or cleared)
  // Only update if input is not focused (to prevent focus loss while typing)
  useEffect(() => {
    if (document.activeElement !== inputRef.current) {
      const refValue = locationInputRef.current || "";
      if (refValue !== localDisplay) {
        setLocalDisplay(refValue);
      }
    }
  }, [locationDisplayKey]); // Sync when key changes (location selected or cleared)
  
  const handleChange = useCallback((e) => {
    const newValue = e.target.value;
    const cursorPosition = e.target.selectionStart;
    
    // Update local display state immediately (completely isolated - doesn't trigger parent re-render)
    setLocalDisplay(newValue);
    
    // Update ref immediately (no re-render, no API calls)
    locationInputRef.current = newValue;
    
    // Debounce location search - only if there's a value
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    if (newValue.trim().length > 0) {
      searchTimeoutRef.current = setTimeout(async () => {
        // Search and update results without causing parent re-render
        const results = await triggerLocationSearch(newValue);
        setLocationSearchResults(results);
        setShowLocationDropdown(results.length > 0);
        // Ensure input maintains focus after search completes
        if (inputRef.current && document.activeElement !== inputRef.current) {
          inputRef.current.focus();
        }
      }, 300);
    } else {
      // Clear results if input is empty
      setLocationSearchResults([]);
      setShowLocationDropdown(false);
    }
    
    // Restore cursor position immediately for text inputs
    requestAnimationFrame(() => {
      if (inputRef.current && document.activeElement === inputRef.current) {
        const newPosition = Math.min(cursorPosition, newValue.length);
        // Only use setSelectionRange for text inputs
        if (inputRef.current.type === 'text') {
          try {
            inputRef.current.setSelectionRange(newPosition, newPosition);
          } catch (e) {
            // Ignore errors if input is not focused
          }
        }
      }
    });
  }, [triggerLocationSearch, locationInputRef]);

  const handleFocus = useCallback(() => {
    // Don't trigger search on focus - only when typing
    // This prevents unnecessary API calls
  }, []);

  const handleBlur = useCallback((e) => {
    setTimeout(() => {
      if (dropdownRef.current?.contains(document.activeElement)) {
        return; // Keep dropdown open
      }
      setShowLocationDropdown(false);
    }, 250);
  }, []);

  const handleLocationClick = useCallback((result) => {
    handleLocationSelect(result);
    if (inputRef.current) {
      inputRef.current.blur();
    }
  }, [handleLocationSelect]);

  return (
    <div className="flex-1 min-w-[220px] text-sm relative">
      <label className="block mb-1 text-primary_color font-medium text-sm">Location</label>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={localDisplay}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder="Enter country, state, city, or town"
          className="w-full px-3 py-2 pr-10 rounded-xl border text-primary_color bg-white outline-none border-primary_color/20 focus:border-primary_color focus:ring-2 focus:ring-secondary_color/30 text-sm"
          autoComplete="off"
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
              e.preventDefault();
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

const SectionCard = React.memo(({ title, children, defaultOpen = false, controlledOpen, onToggle, onClear }) => {
  // Use ref to persist state across re-renders
  const internalOpenRef = useRef(defaultOpen);
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  
  // Sync ref when defaultOpen changes (but only on mount, not on every render)
  useEffect(() => {
    internalOpenRef.current = defaultOpen;
    setInternalOpen(defaultOpen);
  }, []); // Empty deps - only set on mount
  
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  
  const handleToggle = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    // Prevent scroll to top when clicking section header
    const scrollContainer = e.target.closest('.overflow-y-auto');
    const scrollTop = scrollContainer?.scrollTop || 0;
    
    if (onToggle) {
      onToggle(!open);
    } else {
      const newOpen = !internalOpenRef.current;
      internalOpenRef.current = newOpen;
      setInternalOpen(newOpen);
    }
    
    // Restore scroll position
    if (scrollContainer) {
      requestAnimationFrame(() => {
        scrollContainer.scrollTop = scrollTop;
      });
    }
  }, [open, onToggle]);

  const handleClear = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onClear) {
      onClear();
    }
  }, [onClear]);
  
  return (
    <div className="w-full rounded-xl border border-primary_color/15 overflow-visible mb-3">
      <div className="bg-primary_color text-white px-3 py-2 text-xs font-semibold uppercase tracking-wide w-full flex items-center justify-between">
        <button
          type="button"
          aria-expanded={open}
          onClick={handleToggle}
          className="flex-1 flex items-center justify-between"
        >
          <span>{title}</span>
          <span className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>⌃</span>
        </button>
        {onClear && (
          <button
            type="button"
            onClick={handleClear}
            className="text-xs hover:underline ml-2"
            title="Clear this section"
          >
            Clear
          </button>
        )}
      </div>
      <div className={`${open ? 'block' : 'hidden'} p-3 bg-white`}>{children}</div>
    </div>
  );
});

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

// --- Main Filters Component ---

const Filters = ({ onChange, initial = {} }) => {
  console.log('🔄 Filters component rendering...');
  
  const [selectedPurposeIds, setSelectedPurposeIds] = useState(initial.purposeIds || []);
  const [selectedTypeId, setSelectedTypeId] = useState(initial.typeId || "");
  const [selectedSubtypeIds, setSelectedSubtypeIds] = useState(initial.subtypeIds || []);
  // Default to Ghana only if no initial country provided
  const [country, setCountry] = useState(initial.country !== undefined ? initial.country : "Ghana");
  const [state, setState] = useState(initial.state || "");
  const [city, setCity] = useState(initial.city || "");
  const [town, setTown] = useState(initial.town || "");
  // Location input - local state for typing, debounced to parent
  const [locationInput, setLocationInput] = useState(
    initial.town || initial.city || initial.state || initial.country || "Ghana"
  );
  // Use refs to store values without causing re-renders
  const priceMinRef = useRef(initial.priceMin || "");
  const priceMaxRef = useRef(initial.priceMax || "");
  // Location input should be empty by default, even though country defaults to Ghana
  const locationInputRef = useRef(initial.town || initial.city || initial.state || initial.country || "");
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

  // Track if we've synced from initial props to avoid loops
  const lastInitialRef = useRef('');
  const isApplyingFiltersRef = useRef(false);
  const mountedRef = useRef(false);

  // Sync with initial prop changes (when URL params load) - but only if we're not applying filters
  useEffect(() => {
    // Skip sync if we're in the middle of applying filters
    if (isApplyingFiltersRef.current) {
      console.log('⏸️ Skipping sync - applying filters in progress');
      return;
    }
    
    const currentInitialStr = JSON.stringify(initial || {});
    
    // Only sync if initial has actually changed
    if (currentInitialStr !== lastInitialRef.current) {
      // Update ref immediately to prevent duplicate syncs
      const previousRef = lastInitialRef.current;
      lastInitialRef.current = currentInitialStr;
      
      // On first mount, always sync
      if (!mountedRef.current) {
        if (Array.isArray(initial.purposeIds)) setSelectedPurposeIds(initial.purposeIds);
        if (initial.typeId !== undefined) setSelectedTypeId(initial.typeId || "");
        if (Array.isArray(initial.subtypeIds)) setSelectedSubtypeIds(initial.subtypeIds);
        if (initial.country !== undefined) setCountry(initial.country || "Ghana");
        if (initial.state !== undefined) setState(initial.state || "");
        if (initial.city !== undefined) setCity(initial.city || "");
        if (initial.town !== undefined) setTown(initial.town || "");
        if (initial.bedrooms !== undefined) setBedrooms(initial.bedrooms || "");
        if (initial.bathrooms !== undefined) setBathrooms(initial.bathrooms || "");
        if (initial.specifications !== undefined) setSpecifications(initial.specifications || {});
        if (initial.priceMin !== undefined) priceMinRef.current = initial.priceMin?.toString() || "";
        if (initial.priceMax !== undefined) priceMaxRef.current = initial.priceMax?.toString() || "";
        mountedRef.current = true;
        return;
      }
      
      // After mount, compare FULL objects to see if it's really different
      // This prevents resetting when we apply our own filters
      let prevInitial = {};
      try {
        prevInitial = JSON.parse(lastInitialRef.current || '{}');
      } catch (e) {
        prevInitial = {};
      }
      
      const currentInitial = initial || {};
      
      // Normalize both objects for comparison (sort arrays, handle undefined, remove empty)
      const normalizeForCompare = (obj) => {
        if (!obj || typeof obj !== 'object') return '{}';
        
        const normalized = {};
        
        // Copy all properties, handling arrays and objects
        Object.keys(obj).forEach(key => {
          const value = obj[key];
          // Skip undefined values
          if (value === undefined) return;
          
          if (key === 'purposeIds' && Array.isArray(value)) {
            normalized[key] = [...value].sort();
          } else if (key === 'subtypeIds' && Array.isArray(value)) {
            normalized[key] = [...value].sort();
          } else if (key === 'specifications' && value && typeof value === 'object') {
            // Sort specification keys for consistent comparison
            const sortedSpecs = {};
            Object.keys(value).sort().forEach(specKey => {
              if (value[specKey] !== undefined && value[specKey] !== null && value[specKey] !== '') {
                sortedSpecs[specKey] = value[specKey];
              }
            });
            // Only include if not empty
            if (Object.keys(sortedSpecs).length > 0) {
              normalized[key] = sortedSpecs;
            }
          } else {
            // For other values, include if not empty
            if (value !== null && value !== '' && value !== undefined) {
              normalized[key] = value;
            }
          }
        });
        
        return JSON.stringify(normalized);
      };
      
      const prevNormalized = normalizeForCompare(prevInitial);
      const currNormalized = normalizeForCompare(currentInitial);
      
      // If they're the same, it's our own update - skip sync to prevent reset
      if (prevNormalized === currNormalized) {
        console.log('🔄 Skipping sync - filters unchanged (our own update)');
        console.log('Normalized comparison:', prevNormalized);
        return;
      }
      
      console.log('🔄 Syncing filters from external change');
      console.log('Previous normalized:', prevNormalized);
      console.log('Current normalized:', currNormalized);
      
      // It's a real external change - sync everything
      if (Array.isArray(initial.purposeIds)) setSelectedPurposeIds(initial.purposeIds);
      if (initial.typeId !== undefined) setSelectedTypeId(initial.typeId || "");
      if (Array.isArray(initial.subtypeIds)) setSelectedSubtypeIds(initial.subtypeIds);
      if (initial.country !== undefined) setCountry(initial.country || "Ghana");
      if (initial.state !== undefined) setState(initial.state || "");
      if (initial.city !== undefined) setCity(initial.city || "");
      if (initial.town !== undefined) setTown(initial.town || "");
      if (initial.bedrooms !== undefined) setBedrooms(initial.bedrooms || "");
      if (initial.bathrooms !== undefined) setBathrooms(initial.bathrooms || "");
      if (initial.specifications !== undefined) setSpecifications(initial.specifications || {});
      if (initial.priceMin !== undefined) priceMinRef.current = initial.priceMin?.toString() || "";
      if (initial.priceMax !== undefined) priceMaxRef.current = initial.priceMax?.toString() || "";
    }
  }, [initial]);

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


  // State for detected currency from listings
  const [detectedCurrency, setDetectedCurrency] = useState("GHS"); // Default to GHS for Ghana

  // Fetch currency from listings based on location
  useEffect(() => {
    const fetchCurrency = async () => {
      // Default to GHS for Ghana
      if (!country || (!city && !state && !town)) {
        setDetectedCurrency("GHS");
        return;
      }

      // Only fetch if we have a specific location (not just default country)
      if (country === "Ghana" && !state && !city && !town) {
        setDetectedCurrency("GHS");
        return;
      }

      try {
        const params = new URLSearchParams();
        if (country) params.append('country', country);
        if (state) params.append('state', state);
        if (city) params.append('city', city);
        if (town) params.append('town', town);
        params.append('limit', '1'); // Just need one listing to get currency

        const response = await fetch(`/api/listings/search?${params.toString()}`);
        if (response.ok) {
          const result = await response.json();
          if (result.data && result.data.length > 0) {
            // Get currency from first listing - check both currency and currencyCode fields
            const listing = result.data[0];
            const currency = listing.currency || listing.currencyCode || "GHS";
            setDetectedCurrency(currency);
          } else {
            // No listings found, default based on country
            setDetectedCurrency(country === "Ghana" ? "GHS" : "GHS");
          }
        }
      } catch (error) {
        console.error('Error fetching currency:', error);
        setDetectedCurrency("GHS");
      }
    };

    const timeoutId = setTimeout(fetchCurrency, 500);
    return () => clearTimeout(timeoutId);
  }, [country, state, city, town]);

  // Apply filters function - only called when user clicks "Apply Filters"
  const applyFilters = () => {
    if (typeof onChange === "function") {
      // Mark that we're applying filters to prevent sync reset
      isApplyingFiltersRef.current = true;
      
      // Get values from refs (for price) and state (for everything else)
      // Clean specifications - remove empty values
      const cleanedSpecifications = {};
      if (specifications && typeof specifications === 'object') {
        Object.entries(specifications).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            cleanedSpecifications[key] = value;
          }
        });
      }
      
      const filterData = {
        purposeIds: selectedPurposeIds,
        typeId: selectedTypeId,
        subtypeIds: selectedSubtypeIds,
        country,
        state,
        city,
        town,
        priceMin: priceMinRef.current === "" ? undefined : Number(priceMinRef.current),
        priceMax: priceMaxRef.current === "" ? undefined : Number(priceMaxRef.current),
        bedrooms: bedrooms === "" ? undefined : Number(bedrooms),
        bathrooms: bathrooms === "" ? undefined : Number(bathrooms),
        specifications: Object.keys(cleanedSpecifications).length > 0 ? cleanedSpecifications : undefined
      };
      
      // Normalize filterData for consistent comparison (same logic as in useEffect)
      const normalizeForCompare = (obj) => {
        if (!obj || typeof obj !== 'object') return '{}';
        const normalized = {};
        Object.keys(obj).forEach(key => {
          const value = obj[key];
          if (value === undefined) return;
          if (key === 'purposeIds' && Array.isArray(value)) {
            normalized[key] = [...value].sort();
          } else if (key === 'subtypeIds' && Array.isArray(value)) {
            normalized[key] = [...value].sort();
          } else if (key === 'specifications' && value && typeof value === 'object') {
            const sortedSpecs = {};
            Object.keys(value).sort().forEach(specKey => {
              if (value[specKey] !== undefined && value[specKey] !== null && value[specKey] !== '') {
                sortedSpecs[specKey] = value[specKey];
              }
            });
            if (Object.keys(sortedSpecs).length > 0) {
              normalized[key] = sortedSpecs;
            }
          } else if (value !== null && value !== '' && value !== undefined) {
            normalized[key] = value;
          }
        });
        return JSON.stringify(normalized);
      };
      
      // Update lastInitialRef with normalized version to match what will come back
      lastInitialRef.current = normalizeForCompare(filterData);
      
      console.log('📤 Filters applied:', filterData);
      console.log('📋 Specifications being sent:', cleanedSpecifications);
      
      // Call onChange
      onChange(filterData);
      
      // Reset flag after a longer delay to ensure URL update completes
      setTimeout(() => {
        isApplyingFiltersRef.current = false;
      }, 1000);
    }
  };

  // Reset children when parent changes
  useEffect(() => {
    setSelectedTypeId("");
    setSelectedSubtypeIds([]);
  }, [selectedPurposeIds]);

  useEffect(() => {
    setSelectedSubtypeIds([]);
    // Don't reset specifications when property type changes - allow users to keep their filters
    // Only reset if user explicitly wants to change property type
    // setSpecifications({});
  }, [selectedTypeId]);

  // Sync location input ref when location fields change externally
  useEffect(() => {
    const currentDisplay = town || city || state || country || "Ghana";
    // Only update if location input ref is empty or matches the current location
    if (!locationInputRef.current || locationInputRef.current === currentDisplay) {
      locationInputRef.current = currentDisplay;
    }
  }, [country, state, city, town]);

  // State to trigger LocationInput update when location is selected
  const [locationDisplayKey, setLocationDisplayKey] = useState(0);

  const handleClear = () => {
    setSelectedPurposeIds([]);
    setSelectedTypeId("");
    setSelectedSubtypeIds([]);
    locationInputRef.current = "Ghana";
    setCountry("Ghana");
    setState("");
    setCity("");
    setTown("");
    priceMinRef.current = "";
    priceMaxRef.current = "";
    setBedrooms("");
    setBathrooms("");
    setSpecifications({});
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
    <div className="w-full h-screen rounded-2xl bg-white shadow-sm border border-primary_color/10 flex flex-col relative">
      <div className="flex-shrink-0 px-4 md:px-6 pt-4 md:pt-6">
        <div className="flex items-center justify-between mb-4">
          <h6 className="text-primary_color font-semibold">Filters</h6>
          <button type="button" onClick={handleClear} className="bg-white text-secondary_color border border-secondary_color hover:bg-secondary_color hover:text-white px-4 py-2 rounded-full">
            Clear
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 md:px-6 pb-20">
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
          onClear={() => {
            locationInputRef.current = "";
            setCountry("Ghana"); // Keep default for filtering, but don't show in input
            setState("");
            setCity("");
            setTown("");
            // Trigger LocationInput to clear display
            setLocationDisplayKey(prev => prev + 1);
          }}
        >
          <div className="flex flex-col gap-3">
            <LocationInput 
              locationInputRef={locationInputRef}
              setCountry={setCountry}
              setState={setState}
              setCity={setCity}
              setTown={setTown}
              setLocationDisplayKey={setLocationDisplayKey}
              locationDisplayKey={locationDisplayKey}
            />
          </div>
        </SectionCard>

        <SectionCard 
          title={`Price (${detectedCurrency})`}
          onClear={() => {
            priceMinRef.current = "";
            priceMaxRef.current = "";
          }}
        >
          <div className="flex w-full items-center gap-3">
            <NumberInput 
              label="Min" 
              valueRef={priceMinRef} 
              placeholder="0" 
              min={0} 
            />
            <NumberInput 
              label="Max" 
              valueRef={priceMaxRef} 
              placeholder="Any" 
              min={0} 
            />
          </div>
        </SectionCard>

        {/* Dynamic Specifications based on Property Type */}
        {selectedTypeId ? (
          <SectionCard 
            title="Specifications" 
            defaultOpen
            onClear={() => {
              setSpecifications({});
              setBedrooms("");
              setBathrooms("");
            }}
          >
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
            <div className="text-center py-4">
              <p className="text-sm text-gray-500 italic">Choose property type to select specifications</p>
            </div>
          </SectionCard>
        )}
        </div>
      </div>

      {/* Apply Filters Button - Absolute at bottom overlaying content */}
      <div className="absolute bottom-0 left-0 right-0 bg-white pt-4 pb-4 md:pb-6 px-4 md:px-6 border-t border-primary_color/10 shadow-lg z-10">
        <button
          type="button"
          onClick={applyFilters}
          className="w-full bg-primary_color text-white px-4 py-3 rounded-lg font-semibold hover:bg-primary_color/90 transition-colors"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
};

export default Filters;
