'use client'

import React, { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line } from 'react-chartjs-2'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

export default function LeadsTrend({ listerId, listerType = 'developer', listingId = null }) {
  const [timeRange, setTimeRange] = useState('week')
  const [leadsData, setLeadsData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchLeadsTrend() {
      if (!listerId) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams({
          lister_id: listerId,
          lister_type: listerType,
          period: timeRange
        })

        if (listingId) {
          params.append('listing_id', listingId)
        }

        const response = await fetch(`/api/leads/trends?${params.toString()}`)
        const result = await response.json()

        if (response.ok && result.success) {
          setLeadsData(result.data)
        } else {
          setError(result.error || 'Failed to load leads data')
        }
      } catch (err) {
        console.error('Error fetching leads trend:', err)
        setError('Failed to load leads data')
      } finally {
        setLoading(false)
      }
    }

    fetchLeadsTrend()
  }, [listerId, listerType, listingId, timeRange])

  // Default empty data structure
  const defaultData = {
    overview: {
      totalLeads: 0,
      phoneLeads: 0,
      messageLeads: 0,
      emailLeads: 0,
      appointmentLeads: 0,
      websiteLeads: 0,
      uniqueLeads: 0,
      conversionRate: 0,
      leadsChange: 0,
      phoneChange: 0,
      messageChange: 0,
      emailChange: 0,
      appointmentChange: 0,
      websiteChange: 0
    },
    performance: {
      labels: [],
      phone: [],
      message: [],
      email: [],
      appointment: [],
      website: []
    }
  }

  // Get current data from API response
  const currentData = leadsData || defaultData

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
            <span className="text-gray-600">Loading leads trend data...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-center py-12">
            <span className="text-red-600">{error}</span>
          </div>
        </div>
      </div>
    )
  }

  // Chart configuration
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
    },
    elements: {
      line: {
        tension: 0.4, // Smooth curves
      },
    },
  }

  // Deterministic chart data (no new Date / Math.random in render)
  const chartLabels = currentData?.performance?.labels || []
  const phoneSeries = currentData?.performance?.phone || []
  const messageSeries = currentData?.performance?.message || []
  const emailSeries = currentData?.performance?.email || []
  const appointmentSeries = currentData?.performance?.appointment || []
  const totalSeries = chartLabels.map((_, i) =>
    (phoneSeries[i] || 0) + (messageSeries[i] || 0) + (emailSeries[i] || 0) + (appointmentSeries[i] || 0)
  )

  return (
    <div className="space-y-6">
      {/* Leads chart with per-type series */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Leads Trend</h3>
          <div className="flex space-x-2">
            {['week', 'month', 'year'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize ${
                  timeRange === range
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {range === 'week' ? 'This Week' : range === 'month' ? 'This Month' : 'This Year'}
              </button>
            ))}
          </div>
        </div>
        <div className="h-80">
          <Line
            data={{
              labels: chartLabels,
              datasets: [
                {
                  label: 'Total',
                  data: totalSeries,
                  borderColor: 'rgb(59, 130, 246)',
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  fill: true,
                  tension: 0.4,
                },
                {
                  label: 'Phone',
                  data: phoneSeries,
                  borderColor: 'rgb(16, 185, 129)',
                  backgroundColor: 'rgba(16, 185, 129, 0.08)',
                  fill: true,
                  tension: 0.4,
                },
                {
                  label: 'Message',
                  data: messageSeries,
                  borderColor: 'rgb(168, 85, 247)',
                  backgroundColor: 'rgba(168, 85, 247, 0.08)',
                  fill: true,
                  tension: 0.4,
                },
                {
                  label: 'Email',
                  data: emailSeries,
                  borderColor: 'rgb(99, 102, 241)',
                  backgroundColor: 'rgba(99, 102, 241, 0.08)',
                  fill: true,
                  tension: 0.4,
                },
                {
                  label: 'Appointment',
                  data: appointmentSeries,
                  borderColor: 'rgb(245, 158, 11)',
                  backgroundColor: 'rgba(245, 158, 11, 0.08)',
                  fill: true,
                  tension: 0.4,
                }
              ]
            }}
            options={chartOptions}
          />
        </div>
      </div>

    </div>
  )
}
