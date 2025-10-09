"use client"
import React, { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Component to handle map center updates
const MapCenter = ({ center, zoom }) => {
  const map = useMap()
  
  useEffect(() => {
    if (center && center[0] && center[1]) {
      console.log('🗺️ MapCenter: Setting map view to:', center, 'zoom:', zoom)
      map.setView(center, zoom)
    }
  }, [center, zoom, map])
  
  return null
}

const MapComponent = ({ center, zoom, onMapClick, coordinates }) => {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Don't render on server side
  if (!isClient) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-gray-500">Loading map...</div>
      </div>
    )
  }

  const MapEvents = () => {
    useMapEvents({
      click: (e) => {
        const { lat, lng } = e.latlng
        onMapClick(lat, lng)
      },
    })
    return null
  }

  return (
    <MapContainer
      center={center || [7.9465, -1.0232]}
      zoom={zoom || 6}
      style={{ height: '100%', width: '100%' }}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      <MapCenter center={center} zoom={zoom} />
      <MapEvents />
      
      {coordinates && coordinates.length === 2 && coordinates[0] && coordinates[1] && (
        <Marker position={[parseFloat(coordinates[0]), parseFloat(coordinates[1])]}>
          <Popup>
            Property Location<br />
            Lat: {coordinates[0]}<br />
            Lng: {coordinates[1]}
          </Popup>
        </Marker>
      )}
    </MapContainer>
  )
}

export default MapComponent
