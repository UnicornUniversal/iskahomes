"use client";

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Filters from '../components/users/Filters'
import SearchProperties from '../components/users/SearchProperties'
import dynamic from 'next/dynamic'

// Dynamically import UserMap to avoid SSR issues
const UserMap = dynamic(() => import('../components/users/UserMap'), { 
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

  // Read URL params on mount to restore filters
  useEffect(() => {
    const urlFilters = {};
    
    // Purpose IDs
    const purposeIds = searchParams.getAll('purpose_id');
    if (purposeIds.length > 0) {
      urlFilters.purposeIds = purposeIds;
    }
    
    // Property Type
    const typeId = searchParams.get('property_type_id');
    if (typeId) urlFilters.typeId = typeId;
    
    // Subtype IDs
    const subtypeIds = searchParams.getAll('subtype_id');
    if (subtypeIds.length > 0) {
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
    
    const specifications = searchParams.get('specifications');
    if (specifications) {
      try {
        urlFilters.specifications = JSON.parse(specifications);
      } catch (e) {
        console.error('Error parsing specifications from URL:', e);
      }
    }
    
    // Set filters - this will trigger Filters component to sync and SearchProperties to fetch
    if (Object.keys(urlFilters).length > 0) {
      setFilters(urlFilters);
    } else {
      // Even if empty, set empty object to ensure Filters component initializes correctly
      setFilters({});
    }
  }, [searchParams]);

  // Update URL when filters change
  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    
    // Build URL params from filters
    const params = new URLSearchParams();
    
    if (newFilters.purposeIds && newFilters.purposeIds.length > 0) {
      newFilters.purposeIds.forEach(id => params.append('purpose_id', id));
    }
    
    if (newFilters.typeId) {
      params.append('property_type_id', newFilters.typeId);
    }
    
    if (newFilters.subtypeIds && newFilters.subtypeIds.length > 0) {
      newFilters.subtypeIds.forEach(id => params.append('subtype_id', id));
    }
    
    if (newFilters.country) params.append('country', newFilters.country);
    if (newFilters.state) params.append('state', newFilters.state);
    if (newFilters.city) params.append('city', newFilters.city);
    if (newFilters.town) params.append('town', newFilters.town);
    
    if (newFilters.priceMin) params.append('price_min', newFilters.priceMin.toString());
    if (newFilters.priceMax) params.append('price_max', newFilters.priceMax.toString());
    
    if (newFilters.bedrooms) params.append('bedrooms', newFilters.bedrooms.toString());
    if (newFilters.bathrooms) params.append('bathrooms', newFilters.bathrooms.toString());
    
    if (newFilters.specifications && Object.keys(newFilters.specifications).length > 0) {
      params.append('specifications', JSON.stringify(newFilters.specifications));
    }
    
    // Update URL without page reload
    const newUrl = params.toString() 
      ? `/exploreProperties?${params.toString()}`
      : '/exploreProperties';
    
    router.replace(newUrl, { scroll: false });
  };

  return (
    <div className='w-full h-full overflow-y-scroll'>
      {/* Mobile/Tablet Filter Button */}
      <button
        onClick={() => setShowFiltersModal(true)}
        className="lg:hidden fixed top-4 left-4 z-[1001] bg-primary_color text-white p-3 rounded-full shadow-lg hover:bg-primary_color/90 transition-colors"
        aria-label="Open filters"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
      </button>

      <div className='relative auto'>
        {/* Desktop - Left side - Filters (lg and above) */}
        <div className='hidden lg:block z-1000 absolute top-0 left-0 border border-primary_color/10 max-w-[350px] w-full'>
          <Filters onChange={handleFiltersChange} initial={filters} />
        </div>

        {/* Center - Map */}
        <UserMap filters={filters} />

        {/* Desktop - Right side - Search Properties (lg and above) */}
        <div className='hidden lg:block absolute bg-white/20 backdrop-blur-sm z-1000 top-0 bottom-0 border border-primary_color/10 max-w-[500px] right-0 w-full h-screen overflow-hidden'>
          <SearchProperties filters={filters} />
        </div>

        {/* Mobile/Tablet - Bottom overlay Search Properties (50% height) */}
        <div className='lg:hidden absolute bottom-0 left-0 right-0 z-[999] bg-white/95 backdrop-blur-sm border-t border-primary_color/10' style={{ height: '50%' }}>
          <SearchProperties filters={filters} />
        </div>
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
