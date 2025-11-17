"use client";

import React, { useMemo, useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import the map components to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false })

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

const UserMap = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

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

  // Fetch listings for map markers
  useEffect(() => {
    if (!isClient) return;
    
    const fetchListings = async () => {
      try {
        const response = await fetch('/api/listings/search?limit=100');
        if (response.ok) {
          const result = await response.json();
          setListings(result.data || []);
        }
      } catch (error) {
        console.error('Error fetching listings for map:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, [isClient]);

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

  const accra = ghanaCityCoordinates['Accra'];

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

  if (loading) {
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
    <div className='w-full h-[100vh] rounded-xl overflow-hidden border border-primary_color/10'>
      <MapContainer center={[accra.lat, accra.lng]} zoom={7} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markers.map(m => (
          <Marker key={m.key} position={[m.position.lat, m.position.lng]}>
            <Popup>
              <div className='text-sm min-w-[200px]'>
                <p className='font-semibold text-primary_color mb-1'>{m.title}</p>
                <p className='text-primary_color/70 mb-2'>{m.subtitle}</p>
                <div className='flex gap-2'>
                  <a
                    href={`/property/${m.listing.listingType}/${m.listing.slug}/${m.listing.id}`}
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
  )
}

export default UserMap
