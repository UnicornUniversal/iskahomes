'use client'

import React, { useEffect, useState } from 'react'
import DataCard from '@/app/components/developers/DataCard'
import { FiMessageCircle, FiPhone, FiMail, FiCalendar, FiTrendingUp } from 'react-icons/fi'
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

const ListingLeadsInsights = ({ listingId }) => {
  const [analytics, setAnalytics] = useState(null)
  const [timeSeries, setTimeSeries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [dateRange, setDateRange] = useState('30')

  useEffect(() => {
    if (!listingId) return
    loadAnalytics()
  }, [listingId, dateRange])

  async function loadAnalytics() {
    if (!listingId) return
    setLoading(true)
    setError(null)
    try {
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
          startDate = null
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
      } else {
        setError(result.error || 'Failed to load leads analytics')
      }
    } catch (err) {
      console.error('Error loading leads analytics:', err)
      setError('Failed to load leads analytics')
    } finally {
      setLoading(false)
    }
  }

  const leadsData = timeSeries.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    total: item.total_leads || 0,
    phone: item.phone_leads || 0,
    message: item.message_leads || 0,
    email: item.email_leads || 0,
    appointment: item.appointment_leads || 0
  }))

  if (!listingId) return null

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading leads insights...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg mb-6">
        <p className="font-medium">Error loading leads insights:</p>
        <p className="text-sm">{error}</p>
      </div>
    )
  }

  if (!analytics) return null

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Leads Insights</h2>
          <p className="text-sm text-gray-500">Comprehensive view of listing leads</p>
        </div>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="all">All time</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <DataCard
          title="Total Leads"
          value={(analytics.total_leads || 0).toLocaleString()}
          icon={FiMessageCircle}
        />
        <DataCard
          title="Phone Leads"
          value={(analytics.phone_leads || 0).toLocaleString()}
          icon={FiPhone}
        />
        <DataCard
          title="Message Leads"
          value={(analytics.message_leads || 0).toLocaleString()}
          icon={FiMessageCircle}
        />
        <DataCard
          title="Email Leads"
          value={(analytics.email_leads || 0).toLocaleString()}
          icon={FiMail}
        />
        <DataCard
          title="Appointment Leads"
          value={(analytics.appointment_leads || 0).toLocaleString()}
          icon={FiCalendar}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <DataCard
          title="Conversion Rate"
          value={`${(analytics.conversion_rate || 0).toFixed(2)}%`}
          icon={FiTrendingUp}
        />
        <DataCard
          title="Unique Leads"
          value={(analytics.unique_leads || 0).toLocaleString()}
          icon={FiMessageCircle}
        />
      </div>

      {leadsData.length > 0 ? (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Leads Over Time</h3>
          <div style={{ height: '320px' }}>
            <Bar
              data={{
                labels: leadsData.map(d => d.date),
                datasets: [
                  {
                    label: 'Total Leads',
                    data: leadsData.map(d => d.total),
                    backgroundColor: '#3b82f6'
                  },
                  {
                    label: 'Phone',
                    data: leadsData.map(d => d.phone),
                    backgroundColor: '#10b981'
                  },
                  {
                    label: 'Messages',
                    data: leadsData.map(d => d.message),
                    backgroundColor: '#f59e0b'
                  },
                  {
                    label: 'Email',
                    data: leadsData.map(d => d.email),
                    backgroundColor: '#8b5cf6'
                  },
                  {
                    label: 'Appointment',
                    data: leadsData.map(d => d.appointment),
                    backgroundColor: '#ef4444'
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
      ) : (
        <p className="text-center text-gray-500">No lead activity for the selected period.</p>
      )}
    </div>
  )
}

export default ListingLeadsInsights

