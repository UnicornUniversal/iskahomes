"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import SecondaryListingCard from '../Listing/SecondaryListingCard';
import ExplorePropertyCard from './ExplorePropertyCard';

const SearchProperties = ({ filters = {} }) => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const loadingRef = useRef(false);

  // Helper function to build API params - use useCallback to memoize
  const buildParams = useCallback((offset = 0, limit = 15) => {
    const params = new URLSearchParams();
    
    // Map filters from Filters component to API parameters
    if (filters.purposeIds && filters.purposeIds.length > 0) {
      filters.purposeIds.forEach(id => params.append('purpose_id', id));
    }
    
    if (filters.typeId) {
      params.append('property_type_id', filters.typeId);
    }
    
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
    
    if (filters.specifications && Object.keys(filters.specifications).length > 0) {
      params.append('specifications', JSON.stringify(filters.specifications));
    }
    
    params.append('offset', offset.toString());
    params.append('limit', limit.toString());
    
    return params;
  }, [filters]);

  // Helper function to transform listings
  const transformListings = (listings) => {
    return (listings || []).map(listing => ({
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
  };

  // Fetch initial listings and total count
  useEffect(() => {
    const fetchInitialListings = async () => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      
      setLoading(true);
      setError(null);
      setListings([]);
      setTotalCount(0);
      setHasMore(false);
      
      try {
        const params = buildParams(0, 15);
        const response = await fetch(`/api/listings/search?${params.toString()}`);
        
        if (response.ok) {
          const result = await response.json();
          const transformedListings = transformListings(result.data || []);
          
          setListings(transformedListings);
          setTotalCount(result.pagination?.total || 0);
          setHasMore(result.pagination?.hasMore || false);
        } else {
          const errorData = await response.json().catch(() => ({}));
          setError(errorData.error || 'Failed to fetch listings');
        }
      } catch (err) {
        console.error('Error fetching listings:', err);
        setError('Error loading properties');
      } finally {
        setLoading(false);
        loadingRef.current = false;
      }
    };

    fetchInitialListings();
  }, [filters]);

  // Incrementally load more listings
  useEffect(() => {
    const loadMore = async () => {
      if (!hasMore || loadingMore || loadingRef.current || listings.length >= totalCount) {
        return;
      }

      setLoadingMore(true);
      loadingRef.current = true;

      try {
        const params = buildParams(listings.length, 15);
        const response = await fetch(`/api/listings/search?${params.toString()}`);
        
        if (response.ok) {
          const result = await response.json();
          const transformedListings = transformListings(result.data || []);
          
          setListings(prev => [...prev, ...transformedListings]);
          setHasMore(result.pagination?.hasMore || false);
        }
      } catch (err) {
        console.error('Error loading more listings:', err);
      } finally {
        setLoadingMore(false);
        loadingRef.current = false;
      }
    };

    // Auto-load more when user scrolls near bottom
    const handleScroll = () => {
      // Find the scrollable container (the parent div with overflow-y-auto)
      const scrollContainer = document.querySelector('.max-h-screen.overflow-y-auto');
      if (!scrollContainer) return;

      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);

      // Load more when within 200px of bottom
      if (distanceFromBottom < 200 && hasMore && !loadingMore && !loadingRef.current) {
        loadMore();
      }
    };

    const scrollContainer = document.querySelector('.max-h-screen.overflow-y-auto');
    
    if (scrollContainer && hasMore) {
      scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
      // Also check on mount if already scrolled
      setTimeout(handleScroll, 100);
      
      return () => {
        scrollContainer.removeEventListener('scroll', handleScroll);
      };
    }
  }, [hasMore, loadingMore, listings.length, totalCount]);

  return (
    <div className="w-full h-full flex flex-col overflow-hidden max-h-full">
      {/* Total count header with blur */}
      <div className="flex-shrink-0 bg-white/80 backdrop-blur-md border-b border-primary_color/10 px-4 py-3">
        <div className="flex items-center justify-between">
          <h6 className="text-primary_color font-semibold text-lg">
            {loading ? (
              'Loading...'
            ) : error ? (
              'Error loading properties'
            ) : totalCount > 0 ? (
              <>
                <span className="text-2xl font-bold">{totalCount}</span>
                <span className="ml-2 text-base font-normal">
                  {totalCount === 1 ? 'property found' : 'properties found'}
                </span>
                {listings.length < totalCount && (
                  <span className="ml-2 text-sm text-gray-500 font-normal">
                    (showing {listings.length})
                  </span>
                )}
              </>
            ) : (
              'No properties found'
            )}
          </h6>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 min-h-0">

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
          <>
            {/* Desktop - Vertical Cards (lg and above) */}
            <div className="hidden lg:grid grid-cols-1 gap-5">
              {listings.map((listing) => (
                <SecondaryListingCard key={listing.id} listing={listing} />
              ))}
            </div>

            {/* Mobile/Tablet - Horizontal Cards (below lg) */}
            <div className="lg:hidden flex flex-col gap-3">
              {listings.map((listing) => (
                <ExplorePropertyCard key={listing.id} listing={listing} />
              ))}
            </div>
            
            {/* Loading more indicator */}
            {loadingMore && (
              <div className="flex items-center justify-center py-6">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary_color"></div>
                <span className="ml-2 text-primary_color text-sm">Loading more properties...</span>
              </div>
            )}
            
            {/* End of results indicator */}
            {!hasMore && listings.length > 0 && listings.length >= totalCount && (
              <div className="text-center py-6 text-gray-500 text-sm">
                All properties loaded
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SearchProperties;
