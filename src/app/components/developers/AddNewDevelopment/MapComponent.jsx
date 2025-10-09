"use client"
import React, { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

const MapComponent = ({ center, zoom, onMapClick, coordinates }) => {
  const [position, setPosition] = useState(center)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    setPosition(center)
  }, [center])

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
        setPosition([lat, lng])
        onMapClick(lat, lng)
      },
    })
    return null
  }

  return (
    <MapContainer
      center={position}
      zoom={zoom}
      style={{ height: '100%', width: '100%' }}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      <MapEvents />
      
      {coordinates.latitude && coordinates.longitude && (
        <Marker position={[parseFloat(coordinates.latitude), parseFloat(coordinates.longitude)]}>
          <Popup>
            Development Location<br />
            Lat: {coordinates.latitude}<br />
            Lng: {coordinates.longitude}
          </Popup>
        </Marker>
      )}
    </MapContainer>
  )
}

export default MapComponent
