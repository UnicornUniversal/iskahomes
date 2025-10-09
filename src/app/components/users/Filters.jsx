"use client";

import React, { useMemo, useState, useEffect } from 'react';
import DynamicSpecifications from './DynamicSpecifications';

const Filters = ({ onChange, initial = {} }) => {
  console.log('🔄 Filters component rendering...');
  
  const [selectedPurposeIds, setSelectedPurposeIds] = useState(initial.purposeIds || []);
  const [selectedTypeId, setSelectedTypeId] = useState(initial.typeId || "");
  const [selectedSubtypeIds, setSelectedSubtypeIds] = useState(initial.subtypeIds || []);
  const [country, setCountry] = useState(initial.country || "");
  const [state, setState] = useState(initial.state || "");
  const [city, setCity] = useState(initial.city || "");
  const [town, setTown] = useState(initial.town || "");
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
  }, [selectedTypeId]);


  // Reset location hierarchy
  useEffect(() => {
    setState("");
    setCity("");
    setTown("");
  }, [country]);

  useEffect(() => {
    setCity("");
    setTown("");
  }, [state]);

  useEffect(() => {
    setTown("");
  }, [city]);

  // Get location options from taxonomy data
  const countryOptions = useMemo(() => taxonomyData.locations.countries || [], [taxonomyData.locations.countries]);
  const stateOptions = useMemo(() => taxonomyData.locations.states || [], [taxonomyData.locations.states]);
  const cityOptions = useMemo(() => taxonomyData.locations.cities || [], [taxonomyData.locations.cities]);
  const townOptions = useMemo(() => taxonomyData.locations.towns || [], [taxonomyData.locations.towns]);

  const handleClear = () => {
    setSelectedPurposeIds([]);
    setSelectedTypeId("");
    setSelectedSubtypeIds([]);
    setCountry("");
    setState("");
    setCity("");
    setTown("");
    setPriceMin("");
    setPriceMax("");
    setBedrooms("");
    setBathrooms("");
    setSpecifications({});
  };

  const Select = ({ label, value, onChange, options, placeholder, disabled }) => (
    <div className="flex-1 min-w-[220px] text-sm ">
      <label className="block mb-1 text-primary_color font-medium text-xs text-left">{label}</label>
      <select
        className={`w-full px-3 py-2 rounded-xl border text-primary_color bg-white outline-none border-primary_color/20 focus:border-primary_color focus:ring-2 focus:ring-secondary_color/30 disabled:opacity-60 text-sm`}
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
      >
        <option value="">{placeholder}</option>
        {options.map(opt => (
          <option key={opt.id} value={opt.id}>{opt.name}</option>
        ))}
      </select>
    </div>
  );

  const SimpleSelect = ({ label, value, onChange, options, placeholder, disabled }) => (
    <div className="flex-1 min-w-[220px] text-sm">
      <label className="block mb-1 text-primary_color font-medium text-sm">{label}</label>
      <select
        className={`w-full px-3 py-2 rounded-xl border text-primary_color bg-white outline-none border-primary_color/20 focus:border-primary_color focus:ring-2 focus:ring-secondary_color/30 disabled:opacity-60 text-sm`}
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
      >
        <option value="">{placeholder}</option>
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );

  const NumberInput = ({ label, value, onChange, placeholder, min = 0, step = 1 }) => (
    <div className="flex-1 min-w-[120px] text-sm">
      <label className="block mb-1 text-primary_color font-medium text-sm">{label}</label>
      <input
        type="number"
        min={min}
        step={step}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-xl border text-primary_color bg-white outline-none border-primary_color/20 focus:border-primary_color focus:ring-2 focus:ring-secondary_color/30 text-sm"
      />
    </div>
  );

  const SectionCard = ({ title, children, defaultOpen = false }) => {
    const [open, setOpen] = useState(defaultOpen);
    return (
      <div className="w-full rounded-xl border border-primary_color/15 overflow-hidden mb-3">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
          className="bg-primary_color text-white px-3 py-2 text-xs font-semibold uppercase tracking-wide w-full flex items-center justify-between"
        >
          <span>{title}</span>
          <span className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>⌃</span>
        </button>
        <div className={`${open ? 'block' : 'hidden'} p-3 bg-white`}>{children}</div>
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
    <div className="w-full max-h-screen overflow-y-auto rounded-2xl bg-white shadow-sm p-4 md:p-6 border border-primary_color/10">
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
                        if (e.target.checked) {
                          setSelectedPurposeIds([...selectedPurposeIds, purpose.id]);
                        } else {
                          setSelectedPurposeIds(selectedPurposeIds.filter(id => id !== purpose.id));
                        }
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
                        if (e.target.checked) {
                          setSelectedSubtypeIds([...selectedSubtypeIds, subtype.id]);
                        } else {
                          setSelectedSubtypeIds(selectedSubtypeIds.filter(id => id !== subtype.id));
                        }
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

        <SectionCard title="Location">
          <div className="flex flex-col gap-3">
            <SimpleSelect
              label="Country"
              value={country}
              onChange={setCountry}
              options={countryOptions}
              placeholder="Select country"
            />
            <SimpleSelect
              label="State"
              value={state}
              onChange={setState}
              options={stateOptions}
              placeholder="Select state"
            />
            <SimpleSelect
              label="City"
              value={city}
              onChange={setCity}
              options={cityOptions}
              placeholder="Select city"
            />
            <SimpleSelect
              label="Town"
              value={town}
              onChange={setTown}
              options={townOptions}
              placeholder="Select town (optional)"
            />
          </div>
        </SectionCard>

        <SectionCard title="Price (GHS)">
          <div className="flex w-full items-center gap-3">
            <NumberInput label="Min" value={priceMin} onChange={setPriceMin} placeholder="0" min={0} />
            <NumberInput label="Max" value={priceMax} onChange={setPriceMax} placeholder="Any" min={0} />
          </div>
        </SectionCard>

        <SectionCard title="Specifications">
            <div className="flex w-full items-center gap-3">
              <NumberInput label="Bedrooms" value={bedrooms} onChange={setBedrooms} placeholder="Any" min={0} />
              <NumberInput label="Bathrooms" value={bathrooms} onChange={setBathrooms} placeholder="Any" min={0} />
            </div>
        </SectionCard>

        {selectedTypeId && (
          <SectionCard title="Advanced Specifications">
            <DynamicSpecifications
              propertyTypeId={selectedTypeId}
              purposeIds={selectedPurposeIds}
              onSpecificationsChange={setSpecifications}
            />
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
        {country && (<span className="px-3 py-1 rounded-full bg-primary_color/10 text-primary_color">{country}</span>)}
        {state && (<span className="px-3 py-1 rounded-full bg-primary_color/10 text-primary_color">{state}</span>)}
        {city && (<span className="px-3 py-1 rounded-full bg-primary_color/10 text-primary_color">{city}</span>)}
        {town && (<span className="px-3 py-1 rounded-full bg-primary_color/10 text-primary_color">{town}</span>)}
        {(priceMin !== "" || priceMax !== "") && (
          <span className="px-3 py-1 rounded-full bg-secondary_color/10 text-secondary_color">GHS {priceMin || 0} - {priceMax || 'Any'}</span>
        )}
        {(bedrooms || bathrooms) && (
          <span className="px-3 py-1 rounded-full bg-primary_color/10 text-primary_color">{bedrooms ? `${bedrooms} BR` : ''} {bathrooms ? `${bathrooms} BA` : ''}</span>
        )}
      </div>
    </div>
  );
};

export default Filters;
