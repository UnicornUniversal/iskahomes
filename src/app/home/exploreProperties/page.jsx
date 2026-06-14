"use client";

import React, { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Filters from '@/app/components/users/Filters'
import SearchProperties from '@/app/components/users/SearchProperties'
import ExplorePropertiesToolbar from '@/app/components/users/ExplorePropertiesToolbar'
import dynamic from 'next/dynamic'

// Dynamically import UserMap to avoid SSR issues
const UserMap = dynamic(() => import('@/app/components/users/UserMap'), { 
  ssr: false,
  loading: () => (
    <div className='w-full h-[100vh] rounded-xl overflow-hidden border border-primary_color/10 flex items-center justify-center'>
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary_color mx-auto mb-2"></div>
        <span className="text-primary_color">Loading map...</span>
      </div>
    </div>
  )
})

// Component that uses useSearchParams - needs to be wrapped in Suspense
const ExplorePropertiesContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState({});
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [viewMode, setViewMode] = useState('map');

  // Track URL updates to prevent reset loops
  const isUpdatingUrlRef = useRef(false);
  const lastAppliedFiltersRef = useRef(null);
  
  // Read URL params ONLY when URL changes externally (browser back/forward, direct navigation)
  useEffect(() => {
    // Skip if we're the ones updating the URL
    if (isUpdatingUrlRef.current) {
      return;
    }
    
    const urlFilters = {};
    
    // Purpose
    const purposeName = searchParams.get('purpose');
    const purposeId = searchParams.get('purpose_id');
    const purposeIds = searchParams.getAll('purpose_id');
    
    if (purposeName) {
      urlFilters.purpose = purposeName;
    } else if (purposeIds.length > 0) {
      urlFilters.purposeIds = purposeIds;
    }
    
    // Property Type
    const propertyTypeName = searchParams.get('property_type');
    const typeId = searchParams.get('property_type_id');
    
    if (propertyTypeName) {
      urlFilters.property_type = propertyTypeName;
    } else if (typeId) {
      urlFilters.typeId = typeId;
    }
    
    // Subtype
    const subtypeName = searchParams.get('subtype');
    const subtypeIds = searchParams.getAll('subtype_id');
    
    if (subtypeName) {
      urlFilters.subtype = subtypeName;
    } else if (subtypeIds.length > 0) {
      urlFilters.subtypeIds = subtypeIds;
    }
    
    // Location
    const country = searchParams.get('country');
    const state = searchParams.get('state');
    const city = searchParams.get('city');
    const town = searchParams.get('town');
    if (country) urlFilters.country = country;
    if (state) urlFilters.state = state;
    if (city) urlFilters.city = city;
    if (town) urlFilters.town = town;
    
    // Price
    const priceMin = searchParams.get('price_min');
    const priceMax = searchParams.get('price_max');
    if (priceMin) urlFilters.priceMin = Number(priceMin);
    if (priceMax) urlFilters.priceMax = Number(priceMax);
    
    // Specifications
    const bedrooms = searchParams.get('bedrooms');
    const bathrooms = searchParams.get('bathrooms');
    if (bedrooms) urlFilters.bedrooms = Number(bedrooms);
    if (bathrooms) urlFilters.bathrooms = Number(bathrooms);
    
    // Parse specifications from URL
    const specifications = searchParams.get('specifications');
    if (specifications) {
      try {
        // URLSearchParams handles decoding automatically, so we just parse the JSON
        urlFilters.specifications = JSON.parse(specifications);
        console.log('📋 Parsed specifications from URL:', urlFilters.specifications);
      } catch (e) {
        console.error('Error parsing specifications from URL:', e);
      }
    }
    
    // Only update if filters actually changed from what we last applied
    const urlFiltersStr = JSON.stringify(urlFilters);
    const lastAppliedStr = lastAppliedFiltersRef.current ? JSON.stringify(lastAppliedFiltersRef.current) : null;
    
    // If this matches what we last applied, don't update (prevents loop)
    if (urlFiltersStr === lastAppliedStr) {
      return;
    }
    
    // Update filters from URL
    setFilters(urlFilters);
  }, [searchParams]);
  
  const handleFiltersChange = (newFilters) => {
    console.log('🔧 handleFiltersChange called with:', newFilters);
    
    // Store what we're applying to prevent reset loop
    lastAppliedFiltersRef.current = newFilters;
    
    // Update filters state immediately (no page reload)
    setFilters(newFilters);
    
    // Mark that we're updating URL to prevent reset loop
    isUpdatingUrlRef.current = true;
    
    // Build URL params from filters
    const params = new URLSearchParams();
    
    // Use names if available, otherwise fallback to IDs (or nothing)
    if (newFilters.purpose) {
      params.append('purpose', newFilters.purpose);
    } else if (newFilters.purposeIds && newFilters.purposeIds.length > 0) {
      newFilters.purposeIds.forEach(id => params.append('purpose_id', id));
    }
    
    if (newFilters.property_type) {
      params.append('property_type', newFilters.property_type);
    } else if (newFilters.typeId) {
      params.append('property_type_id', newFilters.typeId);
    }
    
    if (newFilters.subtype) {
      params.append('subtype', newFilters.subtype);
    } else if (newFilters.subtypeIds && newFilters.subtypeIds.length > 0) {
      newFilters.subtypeIds.forEach(id => params.append('subtype_id', id));
    }
    
    if (newFilters.country) params.append('country', newFilters.country);
    if (newFilters.state) params.append('state', newFilters.state);
    if (newFilters.city) params.append('city', newFilters.city);
    if (newFilters.town) params.append('town', newFilters.town);
    
    if (newFilters.priceMin !== undefined && newFilters.priceMin !== null) params.append('price_min', newFilters.priceMin.toString());
    if (newFilters.priceMax !== undefined && newFilters.priceMax !== null) params.append('price_max', newFilters.priceMax.toString());
    
    if (newFilters.bedrooms !== undefined && newFilters.bedrooms !== null) params.append('bedrooms', newFilters.bedrooms.toString());
    if (newFilters.bathrooms !== undefined && newFilters.bathrooms !== null) params.append('bathrooms', newFilters.bathrooms.toString());
    
    // Add specifications to URL - let URLSearchParams handle encoding
    if (newFilters.specifications && Object.keys(newFilters.specifications).length > 0) {
      const specsJson = JSON.stringify(newFilters.specifications);
      params.append('specifications', specsJson);
      console.log('✅ Adding specifications to URL:', specsJson);
    }
    
    // Update URL without page reload
    const newUrl = params.toString() 
      ? `/home/exploreProperties?${params.toString()}`
      : '/home/exploreProperties';
    
    console.log('🔗 Updating URL to:', newUrl);
    
    router.replace(newUrl, { scroll: false });
    
    // Reset flag after navigation completes
    setTimeout(() => {
      isUpdatingUrlRef.current = false;
    }, 300);
  };

  const overlayToolbar = (
    <div
      className={`flex absolute top-4 z-[1001] justify-center pointer-events-none pl-4 pr-14 md:px-4 ${
        viewMode === 'map'
          ? 'left-0 right-0 lg:left-[350px] lg:right-[500px]'
          : 'left-0 right-0 lg:left-[350px]'
      }`}
    >
      <div className="pointer-events-auto w-full flex justify-center">
        <div className="w-full max-w-2xl bg-white/95 backdrop-blur-md rounded-full shadow-lg border border-primary_color/10 px-2.5 py-1.5 md:px-3 md:py-2">
          <ExplorePropertiesToolbar
            onOpenFilters={() => setShowFiltersModal(true)}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            variant="overlay"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className='w-full h-full overflow-y-scroll max-md:mt-[4em]'>
      <div className='relative auto'>
        {/* Desktop - Left side - Filters (lg and above) */}
        <div className='hidden lg:block z-1000 absolute top-0 left-0 border border-primary_color/10 max-w-[350px] w-full h-[calc(100vh-6rem)]'>
          <Filters onChange={handleFiltersChange} initial={filters} />
        </div>

        {viewMode === 'map' ? (
          <>
            {overlayToolbar}

            {/* Center - Map */}
            <UserMap filters={filters} leadAttributionContext="explore" />

            {/* Desktop - Right side - Search Properties (lg and above) */}
            <div className='hidden lg:block absolute bg-white/20 backdrop-blur-sm z-1000 top-0 bottom-0 border border-primary_color/10 max-w-[500px] right-0 w-full h-screen overflow-hidden'>
              <SearchProperties
                filters={filters}
                leadAttributionContext="explore"
                variant="panel"
              />
            </div>

            {/* Mobile/Tablet - Bottom overlay Search Properties (50% height) */}
            <div className='lg:hidden absolute bottom-0 left-0 right-0 z-[999] bg-white/95 backdrop-blur-sm border-t border-primary_color/10' style={{ height: '50%' }}>
              <SearchProperties
                filters={filters}
                leadAttributionContext="explore"
                variant="panel"
              />
            </div>
          </>
        ) : (
          <>
            {/* List view - full-width property grid */}
            <div className='relative w-full lg:pl-[350px] h-[calc(100vh-6rem)] lg:h-screen bg-white/95 backdrop-blur-sm border border-primary_color/10 overflow-hidden'>
              {overlayToolbar}
              <div className="h-full pt-[4.5rem]">
                <SearchProperties
                  filters={filters}
                  leadAttributionContext="explore"
                  variant="full"
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Mobile/Tablet Filters Modal */}
      {showFiltersModal && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1002] lg:hidden"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowFiltersModal(false);
            }
          }}
        >
          <div className="absolute inset-y-0 left-0 w-full max-w-sm bg-white shadow-xl overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-primary_color/10 px-4 py-3 flex items-center justify-between z-10">
              <h2 className="text-lg font-semibold text-primary_color">Filters</h2>
              <button
                onClick={() => setShowFiltersModal(false)}
                className="text-primary_color hover:text-primary_color/70 p-2"
                aria-label="Close filters"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <Filters 
                onChange={(newFilters) => {
                  handleFiltersChange(newFilters);
                  setShowFiltersModal(false);
                }} 
                initial={filters} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Main page component with Suspense boundary
const page = () => {
  return (
    <Suspense fallback={
      <div className='w-full h-screen flex items-center justify-center'>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary_color mx-auto mb-2"></div>
          <span className="text-primary_color">Loading...</span>
        </div>
      </div>
    }>
      <ExplorePropertiesContent />
    </Suspense>
  )
}

export default page
