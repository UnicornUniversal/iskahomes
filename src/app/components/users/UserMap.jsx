"use client";

import React, { useMemo, useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import the map components to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false })
const ZoomControl = dynamic(() => import('react-leaflet').then(mod => mod.ZoomControl), { ssr: false })

// Helper to resolve coordinates from a listing
const resolveCoords = (listing) => {
  // Prefer explicit coordinates if present
  if (listing.latitude && listing.longitude) {
    return { lat: parseFloat(listing.latitude), lng: parseFloat(listing.longitude) };
  }
  
  // Fallback to location object
  if (listing.location?.latitude && listing.location?.longitude) {
    return { lat: parseFloat(listing.location.latitude), lng: parseFloat(listing.location.longitude) };
  }
  
  return null;
};

// Ghana city coordinates for fallback
const ghanaCityCoordinates = {
  'Accra': { lat: 5.6037, lng: -0.1870 },
  'Kumasi': { lat: 6.6885, lng: -1.6244 },
  'Tamale': { lat: 9.4008, lng: -0.8393 },
  'Sekondi-Takoradi': { lat: 4.9267, lng: -1.7576 },
  'Sunyani': { lat: 7.3399, lng: -2.3268 },
  'Cape Coast': { lat: 5.1053, lng: -1.2466 },
  'Koforidua': { lat: 6.0946, lng: -0.2591 },
  'Ho': { lat: 6.6008, lng: 0.4703 },
  'Techiman': { lat: 7.5908, lng: -1.9398 },
  'Tema': { lat: 5.7089, lng: -0.0057 }
};

const UserMap = ({ filters = {} }) => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [mapCenter, setMapCenter] = useState([5.6037, -0.1870]); // Default to Accra
  const [mapZoom, setMapZoom] = useState(7);
  const mapRef = useRef(null);

  // Check if we're on the client side and load Leaflet CSS
  useEffect(() => {
    setIsClient(true);
    
    // Load Leaflet CSS only on client side via link tag to avoid HMR issues
    if (typeof window !== 'undefined') {
      const existingLink = document.getElementById('leaflet-css');
      if (!existingLink) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
        link.crossOrigin = '';
        document.head.appendChild(link);
      }
    }
  }, []);

  // Known country/state bounds for better zoom
  const locationBounds = {
    'United Kingdom': { center: [54.7024, -3.2766], zoom: 6 },
    'England': { center: [52.3555, -1.1743], zoom: 6 },
    'Scotland': { center: [56.4907, -4.2026], zoom: 6 },
    'Wales': { center: [52.1307, -3.7837], zoom: 7 },
    'Northern Ireland': { center: [54.5973, -6.1881], zoom: 7 },
    'Ghana': { center: [7.9465, -1.0232], zoom: 7 },
    'Greater Accra Region': { center: [5.6037, -0.1870], zoom: 9 },
    'Ashanti Region': { center: [6.6885, -1.6244], zoom: 9 },
  };

  // Function to geocode location and get coordinates
  const geocodeLocation = async (location) => {
    try {
      const locationName = location.town || location.city || location.state || location.country || '';
      if (!locationName) return null;

      // Check if we have predefined bounds for this location
      const boundsKey = location.country || location.state || '';
      if (locationBounds[boundsKey]) {
        return {
          lat: locationBounds[boundsKey].center[0],
          lng: locationBounds[boundsKey].center[1],
          zoom: locationBounds[boundsKey].zoom
        };
      }

      // Use Nominatim (OpenStreetMap geocoding) for coordinates
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationName)}&limit=1&addressdetails=1`
      );
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          const result = data[0];
          const lat = parseFloat(result.lat);
          const lng = parseFloat(result.lon);
          
          // Determine zoom level based on location type and bounding box if available
          let zoom = 7;
          if (location.town) {
            zoom = 13;
          } else if (location.city) {
            zoom = 11;
          } else if (location.state) {
            // If we have a bounding box, calculate appropriate zoom
            if (result.boundingbox) {
              const [south, north, west, east] = result.boundingbox.map(parseFloat);
              const latDiff = north - south;
              const lngDiff = east - west;
              // Adjust zoom based on area size
              if (latDiff > 5 || lngDiff > 5) {
                zoom = 5; // Very large area (country)
              } else if (latDiff > 2 || lngDiff > 2) {
                zoom = 6; // Large area (large state/country)
              } else {
                zoom = 7; // Medium area (state)
              }
            } else {
              zoom = 7;
            }
          } else if (location.country) {
            // For countries, use wider zoom
            if (result.boundingbox) {
              const [south, north, west, east] = result.boundingbox.map(parseFloat);
              const latDiff = north - south;
              const lngDiff = east - west;
              if (latDiff > 10 || lngDiff > 10) {
                zoom = 4; // Very large country
              } else if (latDiff > 5 || lngDiff > 5) {
                zoom = 5; // Large country
              } else {
                zoom = 6; // Medium country
              }
            } else {
              zoom = 6;
            }
          }
          
          return { lat, lng, zoom };
        }
      }
    } catch (error) {
      console.error('Error geocoding location:', error);
    }
    return null;
  };

  // Update map center when location filter changes
  useEffect(() => {
    if (!isClient) return;
    
    const updateMapLocation = async () => {
      const location = {
        town: filters.town,
        city: filters.city,
        state: filters.state,
        country: filters.country
      };
      
      const hasLocation = location.town || location.city || location.state || location.country;
      if (hasLocation) {
        const coords = await geocodeLocation(location);
        if (coords) {
          setMapCenter([coords.lat, coords.lng]);
          setMapZoom(coords.zoom);
          // Update map view if map instance exists
          if (mapRef.current) {
            mapRef.current.setView([coords.lat, coords.lng], coords.zoom);
          }
        }
      } else {
        // Reset to default (Accra) if no location filter
        setMapCenter([5.6037, -0.1870]);
        setMapZoom(7);
        if (mapRef.current) {
          mapRef.current.setView([5.6037, -0.1870], 7);
        }
      }
    };

    updateMapLocation();
  }, [isClient, filters.town, filters.city, filters.state, filters.country]);

  // Fetch listings for map markers based on filters (debounced)
  useEffect(() => {
    if (!isClient) return;
    
    // Debounce the fetch to avoid too many requests
    const timeoutId = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        
        // Apply the same filters as SearchProperties
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
        
        params.append('limit', '100'); // Get more results for map
        
        const response = await fetch(`/api/listings/search?${params.toString()}`);
        if (response.ok) {
          const result = await response.json();
          setListings(result.data || []);
        }
      } catch (error) {
        console.error('Error fetching listings for map:', error);
      } finally {
        setLoading(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [isClient, filters]);

  const markers = useMemo(() => {
    const list = [];
    
    listings.forEach(listing => {
      const coords = resolveCoords(listing);
      if (coords) {
        list.push({
          key: `listing-${listing.id}`,
          position: coords,
          title: listing.propertyName,
          subtitle: `${listing.address?.city || ''}${listing.address?.city && listing.address?.state ? ', ' : ''}${listing.address?.state || ''}`,
          listing: listing
        });
      }
    });
    
    return list;
  }, [listings]);

  // Component to update map view when center/zoom changes
  // This must be a child of MapContainer to use useMap hook
  const MapUpdater = ({ center, zoom }) => {
    const { useMap } = require('react-leaflet');
    const map = useMap();
    
    useEffect(() => {
      mapRef.current = map;
      if (center && zoom) {
        map.setView(center, zoom);
      }
    }, [map, center, zoom]);
    
    return null;
  };

  // Don't render anything on server side
  if (!isClient) {
    return (
      <div className='w-full h-[100vh] rounded-xl overflow-hidden border border-primary_color/10 flex items-center justify-center'>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary_color mx-auto mb-2"></div>
          <span className="text-primary_color">Loading map...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Custom CSS to position zoom controls away from filter panel */}
      <style jsx global>{`
        .leaflet-top.leaflet-right {
          top: 20px !important;
          right: 20px !important;
        }
        .leaflet-control-zoom {
          margin-top: 0 !important;
          margin-right: 0 !important;
          border: 2px solid rgba(0,0,0,0.2) !important;
          border-radius: 4px !important;
        }
        /* On desktop, ensure zoom controls don't overlap with filter panel */
        @media (min-width: 1024px) {
          .leaflet-top.leaflet-right {
            right: 20px !important;
          }
        }
      `}</style>
      <div className='w-full h-[100vh] rounded-xl overflow-hidden border border-primary_color/10 relative'>
        {loading && (
          <div className='absolute top-4 left-4 z-[1000] bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg'>
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary_color"></div>
              <span className="text-sm text-primary_color">Updating map...</span>
            </div>
          </div>
        )}
        <MapContainer 
          center={mapCenter} 
          zoom={mapZoom} 
          style={{ height: '100%', width: '100%' }} 
          scrollWheelZoom
          zoomControl={false}
          key={`${mapCenter[0]}-${mapCenter[1]}-${mapZoom}`}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapUpdater center={mapCenter} zoom={mapZoom} />
          
          {/* Custom zoom controls positioned to avoid filter overlay - moved to top right, away from left filter panel */}
          <ZoomControl position="topright" />
        {markers.map(m => (
          <Marker key={m.key} position={[m.position.lat, m.position.lng]}>
            <Popup>
              <div className='text-sm min-w-[200px]'>
                <p className='font-semibold text-primary_color mb-1'>{m.title}</p>
                <p className='text-primary_color/70 mb-2'>{m.subtitle}</p>
                <div className='flex gap-2'>
                  <a
                    href={`/home/property/${m.listing.listingType}/${m.listing.slug}/${m.listing.id}`}
                    className='bg-primary_color text-white px-3 py-1 rounded text-xs hover:bg-blue-700 transition-colors'
                    target='_blank'
                    rel='noopener noreferrer'
                  >
                    View Details
                  </a>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
        </MapContainer>
      </div>
    </>
  )
}

export default UserMap
