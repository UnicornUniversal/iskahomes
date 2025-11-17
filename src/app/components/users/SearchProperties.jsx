"use client";

import React, { useState, useEffect } from "react";
import SecondaryListingCard from '../Listing/SecondaryListingCard';

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
        
        // Map filters from Filters component to API parameters
        // Handle purposeIds array - send all values
        if (filters.purposeIds && filters.purposeIds.length > 0) {
          filters.purposeIds.forEach(id => params.append('purpose_id', id));
        }
        
        if (filters.typeId) {
          params.append('property_type_id', filters.typeId);
        }
        
        // Handle subtypeIds array - send all values
        if (filters.subtypeIds && filters.subtypeIds.length > 0) {
          filters.subtypeIds.forEach(id => params.append('subtype_id', id));
        }
        
        if (filters.country) params.append('country', filters.country);
        if (filters.state) params.append('state', filters.state);
        if (filters.city) params.append('city', filters.city);
        if (filters.town) params.append('town', filters.town);
        if (filters.priceMin) params.append('price_min', filters.priceMin);
        if (filters.priceMax) params.append('price_max', filters.priceMax);
        if (filters.bedrooms) params.append('bedrooms', filters.bedrooms);
        if (filters.bathrooms) params.append('bathrooms', filters.bathrooms);
        
        // Send specifications object as JSON string
        if (filters.specifications && Object.keys(filters.specifications).length > 0) {
          params.append('specifications', JSON.stringify(filters.specifications));
        }
        
        params.append('limit', '15'); // Limit results for performance

        const response = await fetch(`/api/listings/search?${params.toString()}`);
        
        if (response.ok) {
          const result = await response.json();
          // Transform API response to match SecondaryListingCard format
          const transformedListings = (result.data || []).map(listing => ({
            id: listing.id,
            title: listing.propertyName || listing.title,
            description: listing.description || '',
            listing_type: listing.listingType || listing.listing_type || 'property',
            price: listing.price || 0,
            currency: listing.currency || 'GHS',
            price_type: listing.priceType || listing.price_type || 'rent',
            duration: listing.duration || 'monthly',
            media: {
              albums: listing.projectImages && listing.projectImages.length > 0 ? [{
                images: listing.projectImages.map(url => ({ url }))
              }] : [],
              mediaFiles: listing.projectImages ? listing.projectImages.map(url => ({ url })) : [],
              banner: listing.projectImages && listing.projectImages[0] ? { url: listing.projectImages[0] } : null
            },
            specifications: listing.specifications || {
              bedrooms: listing.details?.bedrooms || 0,
              bathrooms: listing.details?.washrooms || listing.details?.bathrooms || 0,
              property_size: listing.details?.areaSqFt || listing.details?.area || 0,
              size: listing.details?.areaSqFt || listing.details?.area || 0
            },
            types: listing.types || [],
            city: listing.address?.city || listing.city || '',
            state: listing.address?.state || listing.state || '',
            country: listing.address?.country || listing.country || '',
            slug: listing.slug || '',
            developers: null,
            available_from: listing.available_from || listing.createdAt || null,
            is_featured: listing.isFeatured || listing.is_featured || false,
            is_verified: listing.isVerified || listing.is_verified || false,
            is_premium: listing.isPremium || listing.is_premium || false,
            user_id: listing.userId || null,
            purpose_name: listing.purpose_name || null,
            purpose_names: listing.purpose_names || [],
            status: listing.status || 'Available'
          }));
          
          setListings(transformedListings);
        } else {
          const errorData = await response.json().catch(() => ({}));
          setError(errorData.error || 'Failed to fetch listings');
        }
      } catch (err) {
        console.error('Error fetching listings:', err);
        setError('Error loading properties');
      } finally {
        setLoading(false);
      }
    };

    // Only fetch if we have at least one filter or on initial load
    fetchListings();
  }, [filters]);

  return (
    <div className="w-full p-4 max-h-screen overflow-y-auto">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h6 className="text-primary_color font-semibold">
            {loading ? 'Loading...' : error ? 'Error loading properties' : `${listings.length} ${listings.length === 1 ? 'result' : 'results'}`}
          </h6>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary_color"></div>
            <span className="ml-2 text-primary_color">Loading properties...</span>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">
            <p className="mb-2">{error}</p>
            <button 
              onClick={() => {
                window.location.reload();
              }} 
              className="mt-2 px-4 py-2 bg-primary_color text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-2">No properties found</p>
            <p className="text-sm text-gray-400">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5">
            {listings.map((listing) => (
              <SecondaryListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchProperties;
