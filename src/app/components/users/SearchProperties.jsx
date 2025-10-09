"use client";

import React, { useMemo, useState, useEffect } from "react";


const formatPrice = (n) => {
  if (n === undefined || n === null || isNaN(Number(n))) return "-";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Number(n));
};

const SearchProperties = ({ filters = {} }) => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch listings based on filters
  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const params = new URLSearchParams();
        
        // Add filter parameters
        if (filters.purposeId) params.append('purpose_id', filters.purposeId);
        if (filters.typeId) params.append('property_type_id', filters.typeId);
        if (filters.categoryId) params.append('category_id', filters.categoryId);
        if (filters.subtypeId) params.append('subtype_id', filters.subtypeId);
        if (filters.country) params.append('country', filters.country);
        if (filters.state) params.append('state', filters.state);
        if (filters.city) params.append('city', filters.city);
        if (filters.town) params.append('town', filters.town);
        if (filters.priceMin) params.append('price_min', filters.priceMin);
        if (filters.priceMax) params.append('price_max', filters.priceMax);
        if (filters.bedrooms) params.append('bedrooms', filters.bedrooms);
        if (filters.bathrooms) params.append('bathrooms', filters.bathrooms);
        
        params.append('limit', '50'); // Limit results for performance

        const response = await fetch(`/api/listings/search?${params.toString()}`);
        
        if (response.ok) {
          const result = await response.json();
          setListings(result.data || []);
        } else {
          setError('Failed to fetch listings');
        }
      } catch (err) {
        console.error('Error fetching listings:', err);
        setError('Error loading properties');
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, [filters]);

  return (
    <div className="w-full p-4 bg_blur max-h-screen overflow-y-auto gap-5">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h6 className="text-primary_color font-semibold">
            {loading ? 'Loading...' : error ? 'Error loading properties' : `${listings.length} results`}
          </h6>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary_color"></div>
            <span className="ml-2 text-primary_color">Loading properties...</span>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">
            <p>{error}</p>
            <button 
              onClick={() => {
                // Simple reload without window reference
                location.reload();
              }} 
              className="mt-2 px-4 py-2 bg-primary_color text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        ) : (
        <div className="grid grid-cols-1 gap-5">
            {listings.map((listing) => {
              const price = formatPrice(listing.price);
              const img = (listing.projectImages && listing.projectImages[0]) || "";
              const state = listing.address?.state || '';
              const city = listing.address?.city || '';
              const beds = listing.details?.bedrooms;
              const baths = listing.details?.washrooms;
              const area = listing.details?.areaSqFt || listing.details?.areaSqm || listing.details?.area || listing.details?.floorArea;
              const purpose = listing.categorization?.purpose;

            return (
                <div key={listing.id} className="rounded-2xl overflow-hidden bg-white border border-primary_color/10 shadow-sm w-full">
                <div className="relative h-44 w-full bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={img} 
                      alt={listing.propertyName} 
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.target.src = '/placeholder-property.jpg';
                      }}
                    />
                  <div className="absolute top-3 left-3 bg-white text-primary_color rounded-full px-3 py-1 text-xs font-semibold shadow">
                      {listing.currency} {price}{purpose === 'Rent' ? " / mo" : ""}
                    </div>
                    {listing.isFeatured && (
                      <div className="absolute top-3 right-3 bg-yellow-500 text-white rounded-full px-2 py-1 text-xs font-semibold">
                        Featured
                      </div>
                    )}
                </div>
                <div className="p-4">
                    <p className="text-primary_color font-semibold mb-1">{listing.propertyName}</p>
                    <p className="text-primary_color/70 text-xs mb-3">
                      {city}{city && state ? ", " : ""}{state}
                    </p>
                  <div className="flex items-center gap-5 text-xs text-primary_color/80 mb-3">
                    {typeof beds === 'number' && <span>🛏 {beds} bed</span>}
                    {typeof baths === 'number' && <span>🛁 {baths} bath</span>}
                    {area && <span>📐 {area} sqft</span>}
                  </div>
                  <div className="pt-3 border-t border-primary_color/10 text-xs text-primary_color/70">
                    {purpose === 'Rent' ? 'For Rent' : purpose === 'Buy' ? 'For Sale' : purpose}
                    </div>
                    <div className="mt-2 flex gap-2">
                      <a
                        href={`/property/${listing.listingType}/${listing.slug}/${listing.id}`}
                        className="flex-1 bg-primary_color text-white text-center py-2 px-3 rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors"
                      >
                        View Details
                      </a>
                    </div>
                </div>
              </div>
            );
          })}
        </div>
        )}
      </div>
    </div>
  );
};

export default SearchProperties;
