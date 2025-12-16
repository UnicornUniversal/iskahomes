'use client'

import React, { useEffect, useState } from 'react'
import { FiEye, FiUsers, FiTrendingUp, FiShare2, FiCalendar, FiBookmark, FiGlobe } from 'react-icons/fi'
import DataCard from '@/app/components/developers/DataCard'
import ViewsTimeSeries from './ViewsTimeSeries'
import LeadsTimeSeries from './LeadsTimeSeries'
import ImpressionsTimeSeries from './ImpressionsTimeSeries'
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
import { Bar } from 'react-chartjs-2'

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
  const [listingData, setListingData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [dateRange, setDateRange] = useState('all') // 7, 30, 90, all

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
      // Fetch listing data first (for data cards - all time totals)
      const listingResponse = await fetch(`/api/listings/${listingId}`)
      const listingResult = await listingResponse.json()

      if (!listingResponse.ok || !listingResult.success) {
        setError(listingResult.error || 'Failed to load listing data')
        setLoading(false)
        return
      }

      setListingData(listingResult.data)

      // Calculate date range for time series only
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

      // Fetch time series data only (for charts)
      const response = await fetch(`/api/listings/${listingId}/analytics?${params.toString()}`)
      const result = await response.json()

      if (response.ok && result.success) {
        setTimeSeries(result.data.time_series || [])
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


  // Views source breakdown - would need to be calculated from time series if needed
  const viewsSourceData = []

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary_color"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="border border-red-200 text-red-800 p-4 rounded-lg">
        <p className="font-medium">Error loading analytics:</p>
        <p className="text-sm">{error}</p>
      </div>
    )
  }

  if (!listingData) {
    return (
      <div className="text-center py-12 text-gray-500">
        No listing data available
      </div>
    )
  }

  // Use listing data directly for data cards (all time totals)
  const totalViews = listingData.total_views || 0
  // Total Leads = unique_leads (logged-in users) + anonymous_leads (anonymous users)
  const uniqueLeads = listingData.unique_leads || 0
  const anonymousLeads = listingData.anonymous_leads || 0
  const totalLeads = uniqueLeads + anonymousLeads // Total unique individuals who became leads
  const totalImpressions = listingData.listing_impressions_breakdown ? 
    Object.values(listingData.listing_impressions_breakdown).reduce((sum, item) => sum + (item.total || 0), 0) : 0
  const conversionRate = totalViews > 0 ? ((totalLeads / totalViews) * 100) : 0
  const totalAppointments = listingData.total_appointments || 0
  const totalSaved = listingData.total_saved || 0

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-primary_color">Listing Analytics</h2>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-primary_color"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="all">All time</option>
        </select>
      </div>

      {/* Summary Cards - Using listing data directly (all time) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DataCard
          title="Total Views"
          value={totalViews.toLocaleString()}
          icon={FiEye}
        />
        <DataCard
          title="Total Impressions"
          value={totalImpressions.toLocaleString()}
          icon={FiTrendingUp}
        />
        <DataCard
          title="Conversion Rate"
          value={`${conversionRate.toFixed(2)}%`}
          icon={FiTrendingUp}
        />
        <DataCard
          title="Total Appointments"
          value={totalAppointments.toLocaleString()}
          icon={FiCalendar}
        />
        <DataCard
          title="Total Saved"
          value={totalSaved.toLocaleString()}
          icon={FiBookmark}
        />
      </div>

      {/* Time Series Charts */}
      <ViewsTimeSeries timeSeries={timeSeries} />
      {/* <LeadsTimeSeries timeSeries={timeSeries} /> */}
      <ImpressionsTimeSeries timeSeries={timeSeries} listingId={listingId} />

      {/* Views Source Breakdown */}
      {viewsSourceData.length > 0 && (
        <div className="p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-primary_color mb-4">Views by Source</h3>
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
                    beginAtZero: true,
                    ticks: {
                      color: '#6b7280'
                    },
                    grid: {
                      color: 'rgba(0, 0, 0, 0.05)'
                    }
                  },
                  x: {
                    ticks: {
                      color: '#6b7280'
                    },
                    grid: {
                      color: 'rgba(0, 0, 0, 0.05)'
                    }
                  }
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default ListingAnalytics

