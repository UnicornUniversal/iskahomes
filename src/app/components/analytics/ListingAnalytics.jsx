'use client'

import React, { useEffect, useState } from 'react'
import { FiEye, FiUsers, FiTrendingUp, FiShare2, FiCalendar, FiBookmark, FiGlobe } from 'react-icons/fi'
import DataCard from '@/app/components/developers/DataCard'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line, Bar } from 'react-chartjs-2'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const ListingAnalytics = ({ listingId }) => {
  const [analytics, setAnalytics] = useState(null)
  const [timeSeries, setTimeSeries] = useState([])
  const [listingMeta, setListingMeta] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [dateRange, setDateRange] = useState('30') // 7, 30, 90, all

  useEffect(() => {
    if (!listingId) {
      setLoading(false)
      return
    }
    loadAnalytics()
  }, [listingId, dateRange])

  async function loadAnalytics() {
    if (!listingId) return

    setLoading(true)
    setError(null)

    try {
      // Calculate date range
      const endDate = new Date()
      let startDate = new Date()
      
      switch (dateRange) {
        case '7':
          startDate.setDate(endDate.getDate() - 7)
          break
        case '30':
          startDate.setDate(endDate.getDate() - 30)
          break
        case '90':
          startDate.setDate(endDate.getDate() - 90)
          break
        default:
          startDate = null // All time
      }

      const params = new URLSearchParams()
      if (startDate) {
        params.append('start_date', startDate.toISOString().split('T')[0])
      }
      params.append('end_date', endDate.toISOString().split('T')[0])

      const response = await fetch(`/api/listings/${listingId}/analytics?${params.toString()}`)
      const result = await response.json()

      if (response.ok && result.success) {
        setAnalytics(result.data.totals)
        setTimeSeries(result.data.time_series || [])
        setListingMeta(result.data.meta || null)
      } else {
        setError(result.error || 'Failed to load analytics')
      }
    } catch (err) {
      console.error('Error loading analytics:', err)
      setError('Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  // Format time series data for charts
  const viewsData = timeSeries.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    views: item.total_views || 0,
    unique: item.unique_views || 0,
    impressions: item.total_impressions || 0
  }))

  const impressionsData = timeSeries.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    total: item.total_impressions || 0,
    social: item.impression_social_media || 0,
    website: item.impression_website_visit || 0,
    share: item.impression_share || 0,
    saved: item.impression_saved_listing || 0
  }))

  const viewsSourceData = analytics ? [
    { name: 'Home', value: analytics.views_from_home || 0 },
    { name: 'Explore', value: analytics.views_from_explore || 0 },
    { name: 'Search', value: analytics.views_from_search || 0 },
    { name: 'Direct', value: analytics.views_from_direct || 0 }
  ].filter(item => item.value > 0) : []

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg">
        <p className="font-medium">Error loading analytics:</p>
        <p className="text-sm">{error}</p>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="text-center py-12 text-gray-500">
        No analytics data available
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Listing Analytics</h2>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="all">All time</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DataCard
          title="Total Views"
          value={(analytics.total_views || 0).toLocaleString()}
          icon={FiEye}
        />
        <DataCard
          title="Unique Views"
          value={(analytics.unique_views || 0).toLocaleString()}
          icon={FiUsers}
        />
        <DataCard
          title="Total Impressions"
          value={(analytics.total_impressions || 0).toLocaleString()}
          icon={FiTrendingUp}
        />
        <DataCard
          title="Conversion Rate"
          value={`${(analytics.conversion_rate || 0).toFixed(2)}%`}
          icon={FiTrendingUp}
        />
        <DataCard
          title="Total Appointments"
          value={(listingMeta?.total_appointments || 0).toLocaleString()}
          icon={FiCalendar}
        />
        <DataCard
          title="Total Saved"
          value={(listingMeta?.total_saved || 0).toLocaleString()}
          icon={FiBookmark}
        />
      </div>

      {/* Views Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DataCard
          title="Logged In Views"
          value={(analytics.logged_in_views || 0).toLocaleString()}
          icon={FiUsers}
        />
        <DataCard
          title="Anonymous Views"
          value={(analytics.anonymous_views || 0).toLocaleString()}
          icon={FiUsers}
        />
      </div>

      {/* Views Over Time Chart */}
      {viewsData.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Views Over Time</h3>
          <div style={{ height: '300px' }}>
            <Line
              data={{
                labels: viewsData.map(d => d.date),
                datasets: [
                  {
                    label: 'Total Views',
                    data: viewsData.map(d => d.views),
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: true
                  },
                  {
                    label: 'Unique Views',
                    data: viewsData.map(d => d.unique),
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    fill: true
                  },
                  {
                    label: 'Impressions',
                    data: viewsData.map(d => d.impressions),
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    tension: 0.4,
                    fill: true
                  }
                ]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top'
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true
                  }
                }
              }}
            />
          </div>
        </div>
      )}

      {/* Impressions Over Time */}
      {impressionsData.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Impressions Over Time</h3>
          <div style={{ height: '300px' }}>
            <Line
              data={{
                labels: impressionsData.map(d => d.date),
                datasets: [
                  {
                    label: 'Total Impressions',
                    data: impressionsData.map(d => d.total),
                    borderColor: '#f97316',
                    backgroundColor: 'rgba(249, 115, 22, 0.1)',
                    tension: 0.4,
                    fill: true
                  },
                  {
                    label: 'Social Media',
                    data: impressionsData.map(d => d.social),
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    tension: 0.4,
                    fill: true
                  },
                  {
                    label: 'Website Visits',
                    data: impressionsData.map(d => d.website),
                    borderColor: '#0ea5e9',
                    backgroundColor: 'rgba(14, 165, 233, 0.1)',
                    tension: 0.4,
                    fill: true
                  },
                  {
                    label: 'Shares',
                    data: impressionsData.map(d => d.share),
                    borderColor: '#22c55e',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    tension: 0.4,
                    fill: true
                  },
                  {
                    label: 'Saved Listings',
                    data: impressionsData.map(d => d.saved),
                    borderColor: '#f43f5e',
                    backgroundColor: 'rgba(244, 63, 94, 0.1)',
                    tension: 0.4,
                    fill: true
                  }
                ]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top'
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true
                  }
                }
              }}
            />
          </div>
        </div>
      )}

      {/* Views Source Breakdown */}
      {viewsSourceData.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Views by Source</h3>
          <div style={{ height: '300px' }}>
            <Bar
              data={{
                labels: viewsSourceData.map(d => d.name),
                datasets: [
                  {
                    label: 'Views',
                    data: viewsSourceData.map(d => d.value),
                    backgroundColor: '#3b82f6'
                  }
                ]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true
                  }
                }
              }}
            />
          </div>
        </div>
      )}

      {/* Impressions Breakdown */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Impressions Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <DataCard
            title="Social Media"
            value={(analytics.impression_social_media || 0).toLocaleString()}
            icon={FiShare2}
          />
          <DataCard
            title="Website Visit"
            value={(analytics.impression_website_visit || 0).toLocaleString()}
            icon={FiGlobe}
          />
          <DataCard
            title="Shares"
            value={(analytics.impression_share || 0).toLocaleString()}
            icon={FiShare2}
          />
          <DataCard
            title="Saved Listings"
            value={(analytics.impression_saved_listing || 0).toLocaleString()}
            icon={FiShare2}
          />
        </div>
      </div>
    </div>
  )
}

export default ListingAnalytics

