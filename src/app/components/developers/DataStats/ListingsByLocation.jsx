'use client'

import React, { useState, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { MapPin, Globe, Building2, Map, Home, TrendingUp, Loader2 } from 'lucide-react'

const ListingsByLocation = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('country')

  // Parse location stats from user profile or user object
  const locationStats = useMemo(() => {
    if (!user) return null

    // Check both user.profile and user directly (for developers, stats might be on user object)
    const dataSource = user.profile || user

    try {
      return {
        countries: dataSource.country_stats ? (typeof dataSource.country_stats === 'string' ? JSON.parse(dataSource.country_stats) : dataSource.country_stats) : [],
        states: dataSource.state_stats ? (typeof dataSource.state_stats === 'string' ? JSON.parse(dataSource.state_stats) : dataSource.state_stats) : [],
        cities: dataSource.city_stats ? (typeof dataSource.city_stats === 'string' ? JSON.parse(dataSource.city_stats) : dataSource.city_stats) : [],
        towns: dataSource.town_stats ? (typeof dataSource.town_stats === 'string' ? JSON.parse(dataSource.town_stats) : dataSource.town_stats) : []
      }
    } catch (error) {
      console.error('Error parsing location stats:', error)
      return {
        countries: [],
        states: [],
        cities: [],
        towns: []
      }
    }
  }, [user])

  if (!user) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">Loading location data...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!locationStats) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">No location data available</p>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'country', label: 'Country', icon: Globe, data: locationStats.countries },
    { id: 'state', label: 'State/Region', icon: Map, data: locationStats.states },
    { id: 'city', label: 'City', icon: Building2, data: locationStats.cities },
    { id: 'town', label: 'Town', icon: MapPin, data: locationStats.towns }
  ]

  const activeTabData = tabs.find(tab => tab.id === activeTab)

  const formatPercentage = (value) => {
    return `${Number(value).toFixed(1)}%`
  }

  const formatCurrency = (amount, currencyCode = 'GHS') => {
    if (amount === null || amount === undefined || amount === 0) return '0'
    return `${currencyCode} ${Number(amount).toLocaleString('en-US')}`
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-5 h-5 text-blue-600" />
          <h5 className="text-lg font-semibold text-gray-900">Listings by Location</h5>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const hasData = tab.data && tab.data.length > 0
  return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : hasData
                    ? 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
                disabled={!hasData}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {hasData && (
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    activeTab === tab.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}>
                    {tab.data.length}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {!activeTabData?.data || activeTabData.data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <MapPin className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No {activeTabData?.label.toLowerCase()} data available</p>
            <p className="text-sm text-gray-400 mt-1">Location statistics will appear here once you have listings</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeTabData.data.map((item, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {activeTab === 'country' && <Globe className="w-4 h-4 text-blue-600" />}
                      {activeTab === 'state' && <Map className="w-4 h-4 text-green-600" />}
                      {activeTab === 'city' && <Building2 className="w-4 h-4 text-purple-600" />}
                      {activeTab === 'town' && <MapPin className="w-4 h-4 text-orange-600" />}
                      <h6 className="font-semibold text-gray-900">{item.location}</h6>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                          Total Units
                        </span>
                        <div className="flex items-center gap-1">
                          <Home className="w-4 h-4 text-gray-400" />
                          <span className="text-lg font-bold text-gray-900">
                            {item.total_units || 0}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                          Percentage
                        </span>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-4 h-4 text-blue-500" />
                          <span className="text-lg font-bold text-blue-600">
                            {formatPercentage(item.percentage)}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                          Unit Sales
                        </span>
                        <span className="text-lg font-bold text-gray-900">
                          {item.unit_sales || 0}
                        </span>
                      </div>

                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                          Sales Amount
                        </span>
                        <span className="text-lg font-bold text-gray-900">
                          {formatCurrency(item.sales_amount)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>Distribution</span>
                    <span>{formatPercentage(item.percentage)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        activeTab === 'country'
                          ? 'bg-blue-600'
                          : activeTab === 'state'
                          ? 'bg-green-600'
                          : activeTab === 'city'
                          ? 'bg-purple-600'
                          : 'bg-orange-600'
                      }`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary Footer */}
      {activeTabData?.data && activeTabData.data.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              Total {activeTabData.label.toLowerCase()}s: <strong>{activeTabData.data.length}</strong>
            </span>
            <span className="text-gray-600">
              Total Units: <strong>
                {activeTabData.data.reduce((sum, item) => sum + (item.total_units || 0), 0)}
              </strong>
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default ListingsByLocation
