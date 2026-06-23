"use client"
import React, { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

const DEFAULT_CENTER = [7.9465, -1.0232]
const DEFAULT_ZOOM = 6

const getMarkerPosition = (coordinates) => {
  if (!coordinates) return null

  if (Array.isArray(coordinates)) {
    const lat = parseFloat(coordinates[0])
    const lng = parseFloat(coordinates[1])
    if (!isNaN(lat) && !isNaN(lng)) return [lat, lng]
    return null
  }

  const lat = parseFloat(coordinates.latitude)
  const lng = parseFloat(coordinates.longitude)
  if (!isNaN(lat) && !isNaN(lng)) return [lat, lng]
  return null
}

const MapComponent = ({ center, zoom, onMapClick, coordinates }) => {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markerRef = useRef(null)
  const onMapClickRef = useRef(onMapClick)

  onMapClickRef.current = onMapClick

  useEffect(() => {
    const container = containerRef.current
    if (!container || mapRef.current) return

    const map = L.map(container, {
      center: center || DEFAULT_CENTER,
      zoom: zoom || DEFAULT_ZOOM,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map)

    map.on('click', (event) => {
      onMapClickRef.current?.(event.latlng.lat, event.latlng.lng)
    })

    mapRef.current = map

    return () => {
      if (markerRef.current) {
        markerRef.current.remove()
        markerRef.current = null
      }
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const nextCenter = center || DEFAULT_CENTER
    const nextZoom = zoom || DEFAULT_ZOOM
    map.setView(nextCenter, nextZoom)
  }, [center, zoom])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const position = getMarkerPosition(coordinates)

    if (!position) {
      if (markerRef.current) {
        markerRef.current.remove()
        markerRef.current = null
      }
      return
    }

    if (markerRef.current) {
      markerRef.current.setLatLng(position)
      return
    }

    const marker = L.marker(position, { draggable: true }).addTo(map)
    marker.on('dragend', (event) => {
      const { lat, lng } = event.target.getLatLng()
      onMapClickRef.current?.(lat, lng)
    })
    markerRef.current = marker
  }, [coordinates])

  return (
    <div
      ref={containerRef}
      className="h-full w-full min-h-[200px] rounded-lg overflow-hidden"
    />
  )
}

export default MapComponent
