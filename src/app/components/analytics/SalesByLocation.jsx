'use client'
import React, { useState, useEffect } from 'react'
import { MapPin, TrendingUp, Globe, Building2, Home } from 'lucide-react'
import dynamic from 'next/dynamic'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import { formatCurrency } from '@/lib/utils'

// Custom styles for Swiper navigation buttons
const swiperStyles = `
  .swiper-button-next,
  .swiper-button-prev {
    width: 32px !important;
    height: 32px !important;
    background: rgba(255, 255, 255, 0.9) !important;
    backdrop-filter: blur(8px);
    border-radius: 50% !important;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    color: #374151 !important;
    margin-top: 0 !important;
  }
  .swiper-button-next:after,
  .swiper-button-prev:after {
    font-size: 14px !important;
    font-weight: bold;
  }
  .swiper-button-next:hover,
  .swiper-button-prev:hover {
    background: rgba(255, 255, 255, 1) !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
  .swiper-button-disabled {
    opacity: 0.35 !important;
  }
`

// Dynamically import MapContainer to avoid SSR issues
const MapContainer = dynamic(
  () => {
    if (typeof window !== 'undefined') {
      // Fix Leaflet default icon issue with Next.js
      const L = require('leaflet')
      delete L.Icon.Default.prototype._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      })
    }
    return import('react-leaflet').then(mod => mod.MapContainer)
  },
  { ssr: false }
)

const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false })
const CircleMarker = dynamic(() => import('react-leaflet').then(mod => mod.CircleMarker), { ssr: false })

const SalesByLocation = ({ listerId }) => {
  const [data, setData] = useState({
    locations: [],
    byCountry: [],
    byState: [],
    byCity: [],
    byTown: []
  })
  const [currency, setCurrency] = useState('USD')
  const [loading, setLoading] = useState(true)
  const [selectedView, setSelectedView] = useState('map') // 'map' or 'rankings'
  const [selectedCategory, setSelectedCategory] = useState('country') // 'country', 'state', 'city', 'town'
  const [mapLoaded, setMapLoaded] = useState(false)

  // Load Leaflet CSS only on client side via link tag
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check if link already exists
      const existingLink = document.getElementById('leaflet-css')
      if (!existingLink) {
        const link = document.createElement('link')
        link.id = 'leaflet-css'
        link.rel = 'stylesheet'
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY='
        link.crossOrigin = ''
        document.head.appendChild(link)
        link.onload = () => setMapLoaded(true)
      } else {
        setMapLoaded(true)
      }

      // Add Swiper navigation button styles
      const existingStyle = document.getElementById('swiper-nav-styles')
      if (!existingStyle) {
        const style = document.createElement('style')
        style.id = 'swiper-nav-styles'
        style.textContent = swiperStyles
        document.head.appendChild(style)
      }
    }
  }, [])

  useEffect(() => {
    let isMounted = true
    
    const fetchData = async () => {
      if (!listerId) return
      
      try {
        setLoading(true)
        const response = await fetch(`/api/sales/by-location?slug=${listerId}`)
        const result = await response.json()
        
        if (!isMounted) return
        
        if (result.success && result.data) {
          setData(result.data)
          if (result.data.currency) {
            setCurrency(result.data.currency)
          }
        } else {
          setData({ locations: [], totalRevenue: 0, totalSales: 0 })
        }
      } catch (error) {
        console.error('Error fetching sales by location:', error)
        if (isMounted) {
          setData({ locations: [], totalRevenue: 0, totalSales: 0 })
        }
      } finally {
        if (isMounted) {
        setLoading(false)
        }
      }
    }

      fetchData()
    
    return () => {
      isMounted = false
    }
  }, [listerId])

  if (loading) {
    return (
      <div className="default_bg rounded-lg shadow p-6">
        <div className="text-center text-gray-500">Loading location data...</div>
      </div>
    )
  }

  if (data.locations.length === 0 && data.byCountry.length === 0) {
    return (
      <div className="default_bg rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Sales by Location</h3>
        <p className="text-sm text-gray-600 mb-4">Geographic distribution of sales</p>
        <div className="text-center text-gray-500 py-8">No sales location data available</div>
      </div>
    )
  }

  // Calculate totals for each category
  const countryTotal = {
    sales_count: data.byCountry.reduce((sum, c) => sum + c.sales_count, 0),
    revenue: data.byCountry.reduce((sum, c) => sum + c.revenue, 0)
  }
  const stateTotal = {
    sales_count: data.byState.reduce((sum, s) => sum + s.sales_count, 0),
    revenue: data.byState.reduce((sum, s) => sum + s.revenue, 0)
  }
  const cityTotal = {
    sales_count: data.byCity.reduce((sum, c) => sum + c.sales_count, 0),
    revenue: data.byCity.reduce((sum, c) => sum + c.revenue, 0)
  }
  const townTotal = {
    sales_count: data.byTown.reduce((sum, t) => sum + t.sales_count, 0),
    revenue: data.byTown.reduce((sum, t) => sum + t.revenue, 0)
  }

  const getRankingData = () => {
    switch (selectedCategory) {
      case 'country':
        return data.byCountry
      case 'state':
        return data.byState
      case 'city':
        return data.byCity
      case 'town':
        return data.byTown
      default:
        return []
    }
  }

  const rankingData = getRankingData()

  // Default map center and zoom for global view
  const centerLat = 20 // Center of world map
  const centerLng = 0 // Prime meridian
  const defaultZoom = 2 // Zoomed out to show entire globe

  return (
    <div className="default_bg rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
    <div>
            <h3 className="text-lg font-semibold text-gray-900">Sales by Location</h3>
            <p className="text-sm text-gray-600">Geographic distribution of sales</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setSelectedView('map')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                selectedView === 'map'
                  ? 'bg-primary_color text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Map
            </button>
            <button
              onClick={() => setSelectedView('rankings')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                selectedView === 'rankings'
                  ? 'bg-primary_color text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Rankings
            </button>
          </div>
        </div>
      </div>

      {selectedView === 'map' && (
        <div className="p-3 sm:p-6 relative">
          {/* Full-width Map */}
          <div className="h-[400px] sm:h-[500px] lg:h-[600px] w-full rounded-lg overflow-hidden border border-gray-200 relative">
            {typeof window !== 'undefined' && mapLoaded && (
              <MapContainer
                center={[centerLat, centerLng]}
                zoom={defaultZoom}
                style={{ height: '100%', width: '100%' }}
                className="z-0"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {data.locations.map((location, index) => (
                  <CircleMarker
                    key={index}
                    center={[location.latitude, location.longitude]}
                    radius={Math.max(5, Math.min(20, location.sales_count * 2))}
                    fillColor="#3B82F6"
                    fillOpacity={0.6}
                    color="#1E40AF"
                    weight={2}
                  >
                    <Popup>
                      <div className="p-2">
                        <h4 className="font-medium text-xs mb-1 break-words">
                          {location.city}, {location.state}
                        </h4>
                        <p className="text-xs text-gray-600 mb-2 break-words">{location.country}</p>
                        <div className="space-y-1">
                          <div className="flex items-center text-xs">
                            <TrendingUp className="w-3 h-3 text-blue-500 mr-1" />
                            <span>{location.sales_count} sales</span>
                          </div>
                          <div className="flex items-center text-xs">
                            <span>{formatCurrency(location.revenue, currency)}</span>
                          </div>
                        </div>
                      </div>
                    </Popup>
                  </CircleMarker>
                ))}
              </MapContainer>
            )}
          </div>

          {/* Left Sidebar - Absolutely Positioned (Desktop Only) */}
          <div className="absolute left-6 top-6 w-80 z-10 hidden lg:block">
            <div className="default_bg backdrop-blur-md rounded-lg shadow-xl p-6 border border-white/20">
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedCategory('country')}
                  className={`w-full p-4 rounded-lg text-left transition-colors ${
                    selectedCategory === 'country'
                      ? 'bg-primary_color text-white'
                      : 'bg-gray-50/80 hover:bg-gray-100/80 text-gray-900'
                  }`}
                >
                  <div className="flex items-center mb-2">
                    <Globe className={`w-5 h-5 mr-2 ${selectedCategory === 'country' ? 'text-white' : 'text-gray-600'}`} />
                    <span className="font-semibold text-[1em]">Countries</span>
                  </div>
                  <div className="text-sm opacity-90">
                    <div>{countryTotal.sales_count} sales</div>
                    <div className="font-medium">{formatCurrency(countryTotal.revenue, currency)}</div>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedCategory('state')}
                  className={`w-full p-4 rounded-lg text-left transition-colors ${
                    selectedCategory === 'state'
                      ? 'bg-primary_color text-white'
                      : 'bg-gray-50/80 hover:bg-gray-100/80 text-gray-900'
                  }`}
                >
                  <div className="flex items-center mb-2">
                    <Building2 className={`w-5 h-5 mr-2 ${selectedCategory === 'state' ? 'text-white' : 'text-gray-600'}`} />
                    <span className="font-semibold text-[1em]">States</span>
                  </div>
                  <div className="text-sm opacity-90">
                    <div>{stateTotal.sales_count} sales</div>
                    <div className="font-medium">{formatCurrency(stateTotal.revenue, currency)}</div>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedCategory('city')}
                  className={`w-full p-4 rounded-lg text-left transition-colors ${
                    selectedCategory === 'city'
                      ? 'bg-primary_color text-white'
                      : 'bg-gray-50/80 hover:bg-gray-100/80 text-gray-900'
                  }`}
                >
                  <div className="flex items-center mb-2">
                    <MapPin className={`w-5 h-5 mr-2 ${selectedCategory === 'city' ? 'text-white' : 'text-gray-600'}`} />
                    <span className="font-semibold text-[1em]">Cities</span>
                  </div>
                  <div className="text-sm opacity-90">
                    <div>{cityTotal.sales_count} sales</div>
                    <div className="font-medium">{formatCurrency(cityTotal.revenue, currency)}</div>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedCategory('town')}
                  className={`w-full p-4 rounded-lg text-left transition-colors ${
                    selectedCategory === 'town'
                      ? 'bg-primary_color text-white'
                      : 'bg-gray-50/80 hover:bg-gray-100/80 text-gray-900'
                  }`}
                >
                  <div className="flex items-center mb-2">
                    <Home className={`w-5 h-5 mr-2 ${selectedCategory === 'town' ? 'text-white' : 'text-gray-600'}`} />
                    <span className="font-semibold text-[1em]">Towns</span>
                  </div>
                  <div className="text-sm opacity-90">
                    <div>{townTotal.sales_count} sales</div>
                    <div className="font-medium">{formatCurrency(townTotal.revenue, currency)}</div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Right Side - Breakdown List (Absolutely Positioned) */}
          <div className="absolute right-6 top-6 w-96 max-w-[calc(100%-20rem)] z-10 hidden lg:block">
            <div className="default_bg backdrop-blur-md rounded-lg shadow-xl p-6 border border-white/20 max-h-[550px] overflow-hidden flex flex-col">
              <div className="mb-4 flex-shrink-0">
                <h4 className="text-lg font-semibold text-gray-900 capitalize">
                  {selectedCategory === 'country' ? 'Countries' : selectedCategory === 'state' ? 'States' : selectedCategory === 'city' ? 'Cities' : 'Towns'}
                </h4>
                <p className="text-sm text-gray-600">Sales breakdown by {selectedCategory}</p>
              </div>

              <div className="space-y-2 overflow-y-auto flex-1 pr-2">
                {rankingData.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">No data available for this category</div>
                ) : (
                  rankingData.map((item, index) => {
                    const locationName = selectedCategory === 'country'
                      ? item.name
                      : selectedCategory === 'state'
                      ? `${item.state}, ${item.country}`
                      : selectedCategory === 'city'
                      ? `${item.city}, ${item.state}, ${item.country}`
                      : `${item.town}, ${item.city}, ${item.state}`

                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-gray-50/80 rounded-lg hover:bg-gray-100/80 transition-colors"
                      >
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary_color text-white flex items-center justify-center font-bold text-sm">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="text-[1em] text-gray-900 break-words mb-2">{locationName}</h5>
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center text-xs text-gray-600">
                                <TrendingUp className="w-3 h-3 text-blue-500 mr-1" />
                                <span>{item.sales_count} sales</span>
                              </div>
                              <div className="text-lg font-bold text-gray-900">
                                {formatCurrency(item.revenue, currency)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>

          {/* Mobile: Categories Swiper at Top */}
          <div className="lg:hidden absolute top-6 left-6 right-6 z-10">
            <div className="default_bg backdrop-blur-md rounded-lg shadow-xl p-4 border border-white/20">
              <Swiper
                modules={[Navigation]}
                spaceBetween={12}
                slidesPerView="auto"
                navigation
                className="categories-swiper"
              >
                <SwiperSlide style={{ width: 'auto' }}>
                  <button
                    onClick={() => setSelectedCategory('country')}
                    className={`px-4 py-3 rounded-lg text-left transition-colors whitespace-nowrap ${
                      selectedCategory === 'country'
                        ? 'bg-primary_color text-white'
                        : 'bg-gray-50/80 hover:bg-gray-100/80 text-gray-900'
                    }`}
                  >
                    <div className="flex items-center mb-1">
                      <Globe className={`w-4 h-4 mr-2 ${selectedCategory === 'country' ? 'text-white' : 'text-gray-600'}`} />
                      <span className="font-semibold text-[1em]">Countries</span>
                    </div>
                    <div className="text-xs opacity-90">
                      <div>{countryTotal.sales_count} sales</div>
                      <div className="font-medium">{formatCurrency(countryTotal.revenue, currency)}</div>
                    </div>
                  </button>
                </SwiperSlide>
                <SwiperSlide style={{ width: 'auto' }}>
                  <button
                    onClick={() => setSelectedCategory('state')}
                    className={`px-4 py-3 rounded-lg text-left transition-colors whitespace-nowrap ${
                      selectedCategory === 'state'
                        ? 'bg-primary_color text-white'
                        : 'bg-gray-50/80 hover:bg-gray-100/80 text-gray-900'
                    }`}
                  >
                    <div className="flex items-center mb-1">
                      <Building2 className={`w-4 h-4 mr-2 ${selectedCategory === 'state' ? 'text-white' : 'text-gray-600'}`} />
                      <span className="font-semibold text-[1em]">States</span>
                    </div>
                    <div className="text-xs opacity-90">
                      <div>{stateTotal.sales_count} sales</div>
                      <div className="font-medium">{formatCurrency(stateTotal.revenue, currency)}</div>
                    </div>
                  </button>
                </SwiperSlide>
                <SwiperSlide style={{ width: 'auto' }}>
                  <button
                    onClick={() => setSelectedCategory('city')}
                    className={`px-4 py-3 rounded-lg text-left transition-colors whitespace-nowrap ${
                      selectedCategory === 'city'
                        ? 'bg-primary_color text-white'
                        : 'bg-gray-50/80 hover:bg-gray-100/80 text-gray-900'
                    }`}
                  >
                    <div className="flex items-center mb-1">
                      <MapPin className={`w-4 h-4 mr-2 ${selectedCategory === 'city' ? 'text-white' : 'text-gray-600'}`} />
                      <span className="font-semibold text-[1em]">Cities</span>
                    </div>
                    <div className="text-xs opacity-90">
                      <div>{cityTotal.sales_count} sales</div>
                      <div className="font-medium">{formatCurrency(cityTotal.revenue, currency)}</div>
                    </div>
                  </button>
                </SwiperSlide>
                <SwiperSlide style={{ width: 'auto' }}>
                  <button
                    onClick={() => setSelectedCategory('town')}
                    className={`px-4 py-3 rounded-lg text-left transition-colors whitespace-nowrap ${
                      selectedCategory === 'town'
                        ? 'bg-primary_color text-white'
                        : 'bg-gray-50/80 hover:bg-gray-100/80 text-gray-900'
                    }`}
                  >
                    <div className="flex items-center mb-1">
                      <Home className={`w-4 h-4 mr-2 ${selectedCategory === 'town' ? 'text-white' : 'text-gray-600'}`} />
                      <span className="font-semibold text-[1em]">Towns</span>
                    </div>
                    <div className="text-xs opacity-90">
                      <div>{townTotal.sales_count} sales</div>
                      <div className="font-medium">{formatCurrency(townTotal.revenue, currency)}</div>
                    </div>
                  </button>
                </SwiperSlide>
              </Swiper>
            </div>
          </div>

          {/* Mobile: Breakdown Swiper at Bottom */}
          <div className="lg:hidden absolute bottom-6 left-6 right-6 z-10">
            <div className="default_bg backdrop-blur-md rounded-lg shadow-xl p-4 border border-white/20">
              <div className="mb-3">
                <h4 className="text-base font-semibold text-gray-900 capitalize">
                  {selectedCategory === 'country' ? 'Countries' : selectedCategory === 'state' ? 'States' : selectedCategory === 'city' ? 'Cities' : 'Towns'}
                </h4>
                <p className="text-xs text-gray-600">Sales breakdown by {selectedCategory}</p>
              </div>
              {rankingData.length === 0 ? (
                <div className="text-center text-gray-500 py-4 text-sm">No data available</div>
              ) : (
                <Swiper
                  modules={[Navigation]}
                  spaceBetween={12}
                  slidesPerView="auto"
                  navigation
                  className="breakdown-swiper"
                >
                  {rankingData.map((item, index) => {
                    const locationName = selectedCategory === 'country'
                      ? item.name
                      : selectedCategory === 'state'
                      ? `${item.state}, ${item.country}`
                      : selectedCategory === 'city'
                      ? `${item.city}, ${item.state}, ${item.country}`
                      : `${item.town}, ${item.city}, ${item.state}`

                    return (
                      <SwiperSlide key={index} style={{ width: '280px' }}>
                        <div className="p-4 bg-gray-50/80 rounded-lg h-full">
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary_color text-white flex items-center justify-center font-bold text-sm">
                              {index + 1}
                            </div>
                            <h5 className="text-[1em] text-gray-900 break-words flex-1 mb-2">{locationName}</h5>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center text-xs text-gray-600">
                              <TrendingUp className="w-3 h-3 text-blue-500 mr-1" />
                              <span>{item.sales_count} sales</span>
                            </div>
                            <div className="text-lg font-bold text-gray-900">
                              {currency}{item.revenue.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </SwiperSlide>
                    )
                  })}
                </Swiper>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedView === 'rankings' && (
        <div className="p-3 sm:p-6">
          {/* Mobile: Categories Swiper */}
          <div className="lg:hidden mb-4">
            <Swiper
              modules={[Navigation]}
              spaceBetween={12}
              slidesPerView="auto"
              navigation
              pagination={{ clickable: true }}
              className="categories-swiper"
            >
              <SwiperSlide style={{ width: 'auto' }}>
                <button
                  onClick={() => setSelectedCategory('country')}
                  className={`px-4 py-3 rounded-lg text-left transition-colors whitespace-nowrap ${
                    selectedCategory === 'country'
                      ? 'bg-primary_color text-white'
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="flex items-center mb-1">
                    <Globe className={`w-4 h-4 mr-2 ${selectedCategory === 'country' ? 'text-white' : 'text-gray-600'}`} />
                    <span className="font-semibold text-sm">Countries</span>
                  </div>
                  <div className="text-xs">
                    <div>{countryTotal.sales_count} sales</div>
                    <div className="font-medium">{formatCurrency(countryTotal.revenue, currency)}</div>
                  </div>
                </button>
              </SwiperSlide>
              <SwiperSlide style={{ width: 'auto' }}>
                <button
                  onClick={() => setSelectedCategory('state')}
                  className={`px-4 py-3 rounded-lg text-left transition-colors whitespace-nowrap ${
                    selectedCategory === 'state'
                      ? 'bg-primary_color text-white'
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="flex items-center mb-1">
                    <Building2 className={`w-4 h-4 mr-2 ${selectedCategory === 'state' ? 'text-white' : 'text-gray-600'}`} />
                    <span className="font-semibold text-sm">States</span>
                  </div>
                  <div className="text-xs">
                    <div>{stateTotal.sales_count} sales</div>
                    <div className="font-medium">{formatCurrency(stateTotal.revenue, currency)}</div>
                  </div>
                </button>
              </SwiperSlide>
              <SwiperSlide style={{ width: 'auto' }}>
                <button
                  onClick={() => setSelectedCategory('city')}
                  className={`px-4 py-3 rounded-lg text-left transition-colors whitespace-nowrap ${
                    selectedCategory === 'city'
                      ? 'bg-primary_color text-white'
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="flex items-center mb-1">
                    <MapPin className={`w-4 h-4 mr-2 ${selectedCategory === 'city' ? 'text-white' : 'text-gray-600'}`} />
                    <span className="font-semibold text-sm">Cities</span>
                  </div>
                  <div className="text-xs">
                    <div>{cityTotal.sales_count} sales</div>
                    <div className="font-medium">{formatCurrency(cityTotal.revenue, currency)}</div>
                  </div>
                </button>
              </SwiperSlide>
              <SwiperSlide style={{ width: 'auto' }}>
                <button
                  onClick={() => setSelectedCategory('town')}
                  className={`px-4 py-3 rounded-lg text-left transition-colors whitespace-nowrap ${
                    selectedCategory === 'town'
                      ? 'bg-primary_color text-white'
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="flex items-center mb-1">
                    <Home className={`w-4 h-4 mr-2 ${selectedCategory === 'town' ? 'text-white' : 'text-gray-600'}`} />
                    <span className="font-semibold text-sm">Towns</span>
                  </div>
                  <div className="text-xs">
                    <div>{townTotal.sales_count} sales</div>
                    <div className="font-medium">{formatCurrency(townTotal.revenue, currency)}</div>
                  </div>
                </button>
              </SwiperSlide>
            </Swiper>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Sidebar - Categories (Desktop) */}
            <div className="hidden lg:block lg:w-80 flex-shrink-0">
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedCategory('country')}
                  className={`w-full p-4 rounded-lg text-left transition-colors ${
                    selectedCategory === 'country'
                      ? 'bg-primary_color text-white'
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="flex items-center mb-2">
                    <Globe className={`w-5 h-5 mr-2 ${selectedCategory === 'country' ? 'text-white' : 'text-gray-600'}`} />
                    <span className="font-semibold text-[1em]">Countries</span>
                  </div>
                  <div className="text-sm opacity-90">
                    <div>{countryTotal.sales_count} sales</div>
                    <div className="font-medium">{formatCurrency(countryTotal.revenue, currency)}</div>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedCategory('state')}
                  className={`w-full p-4 rounded-lg text-left transition-colors ${
                    selectedCategory === 'state'
                      ? 'bg-primary_color text-white'
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="flex items-center mb-2">
                    <Building2 className={`w-5 h-5 mr-2 ${selectedCategory === 'state' ? 'text-white' : 'text-gray-600'}`} />
                    <span className="font-semibold text-[1em]">States</span>
                  </div>
                  <div className="text-sm opacity-90">
                    <div>{stateTotal.sales_count} sales</div>
                    <div className="font-medium">{formatCurrency(stateTotal.revenue, currency)}</div>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedCategory('city')}
                  className={`w-full p-4 rounded-lg text-left transition-colors ${
                    selectedCategory === 'city'
                      ? 'bg-primary_color text-white'
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="flex items-center mb-2">
                    <MapPin className={`w-5 h-5 mr-2 ${selectedCategory === 'city' ? 'text-white' : 'text-gray-600'}`} />
                    <span className="font-semibold text-[1em]">Cities</span>
                  </div>
                  <div className="text-sm opacity-90">
                    <div>{cityTotal.sales_count} sales</div>
                    <div className="font-medium">{formatCurrency(cityTotal.revenue, currency)}</div>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedCategory('town')}
                  className={`w-full p-4 rounded-lg text-left transition-colors ${
                    selectedCategory === 'town'
                      ? 'bg-primary_color text-white'
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="flex items-center mb-2">
                    <Home className={`w-5 h-5 mr-2 ${selectedCategory === 'town' ? 'text-white' : 'text-gray-600'}`} />
                    <span className="font-semibold text-[1em]">Towns</span>
                  </div>
                  <div className="text-sm opacity-90">
                    <div>{townTotal.sales_count} sales</div>
                    <div className="font-medium">{formatCurrency(townTotal.revenue, currency)}</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Right Side - Breakdown List */}
            <div className="flex-1">
              {/* Desktop: Vertical List */}
              <div className="hidden lg:block">
                <div className="mb-4">
                  <h4 className="text-lg font-semibold text-gray-900 capitalize">
                    {selectedCategory === 'country' ? 'Countries' : selectedCategory === 'state' ? 'States' : selectedCategory === 'city' ? 'Cities' : 'Towns'}
                  </h4>
                  <p className="text-sm text-gray-600">Sales breakdown by {selectedCategory}</p>
                </div>

                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {rankingData.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">No data available for this category</div>
                  ) : (
                    rankingData.map((item, index) => {
                      const locationName = selectedCategory === 'country'
                        ? item.name
                        : selectedCategory === 'state'
                        ? `${item.state}, ${item.country}`
                        : selectedCategory === 'city'
                        ? `${item.city}, ${item.state}, ${item.country}`
                        : `${item.town}, ${item.city}, ${item.state}`

                      return (
                        <div
                          key={index}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center space-x-4 flex-1">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary_color text-white flex items-center justify-center font-bold text-sm">
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5 className="text-[1em] text-gray-900 break-words mb-2">{locationName}</h5>
                              <div className="flex items-center space-x-4">
                                <div className="flex items-center text-xs text-gray-600">
                                  <TrendingUp className="w-3 h-3 text-blue-500 mr-1" />
                                  <span>{item.sales_count} sales</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex-shrink-0 ml-4">
                            <div className="text-right">
                              <div className="text-lg font-bold text-gray-900">
                                {formatCurrency(item.revenue, currency)}
                              </div>
                              <div className="text-xs text-gray-500">
                                {item.sales_count} {item.sales_count === 1 ? 'sale' : 'sales'}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              {/* Mobile: Horizontal Swiper */}
              <div className="lg:hidden">
                <div className="mb-4">
                  <h4 className="text-base font-semibold text-gray-900 capitalize">
                    {selectedCategory === 'country' ? 'Countries' : selectedCategory === 'state' ? 'States' : selectedCategory === 'city' ? 'Cities' : 'Towns'}
                  </h4>
                  <p className="text-xs text-gray-600">Sales breakdown by {selectedCategory}</p>
                </div>
                {rankingData.length === 0 ? (
                  <div className="text-center text-gray-500 py-8 text-sm">No data available for this category</div>
                ) : (
                  <Swiper
                    modules={[Navigation]}
                    spaceBetween={12}
                    slidesPerView="auto"
                    navigation
                    pagination={{ clickable: true }}
                    className="breakdown-swiper"
                  >
                    {rankingData.map((item, index) => {
                      const locationName = selectedCategory === 'country'
                        ? item.name
                        : selectedCategory === 'state'
                        ? `${item.state}, ${item.country}`
                        : selectedCategory === 'city'
                        ? `${item.city}, ${item.state}, ${item.country}`
                        : `${item.town}, ${item.city}, ${item.state}`

                      return (
                        <SwiperSlide key={index} style={{ width: '280px' }}>
                          <div className="p-4 bg-gray-50 rounded-lg h-full">
                            <div className="flex items-center space-x-3 mb-3">
                              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary_color text-white flex items-center justify-center font-bold text-sm">
                                {index + 1}
                              </div>
                              <h5 className="text-[1em] text-gray-900 break-words flex-1 mb-2">{locationName}</h5>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center text-xs text-gray-600">
                                <TrendingUp className="w-3 h-3 text-blue-500 mr-1" />
                                <span>{item.sales_count} sales</span>
                              </div>
                              <div className="text-lg font-bold text-gray-900">
                                {formatCurrency(item.revenue, currency)}
                              </div>
                            </div>
                          </div>
                        </SwiperSlide>
                      )
                    })}
                  </Swiper>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SalesByLocation
