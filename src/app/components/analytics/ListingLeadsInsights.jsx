'use client'

import React, { useEffect, useState } from 'react'
import DataCard from '@/app/components/developers/DataCard'
import { FiMessageCircle, FiPhone, FiMail, FiCalendar, FiTrendingUp } from 'react-icons/fi'
import { UserX } from 'lucide-react'
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
  const [listingData, setListingData] = useState(null)
  const [timeSeries, setTimeSeries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [dateRange, setDateRange] = useState('30')

  useEffect(() => {
    if (!listingId) return
    loadData()
  }, [listingId, dateRange])

  async function loadData() {
    if (!listingId) return
    setLoading(true)
    setError(null)
    try {
      // Fetch listing data for totals (listing_leads_breakdown)
      const listingResponse = await fetch(`/api/listings/${listingId}`)
      const listingResult = await listingResponse.json()

      if (!listingResponse.ok || !listingResult.success) {
        setError(listingResult.error || 'Failed to load listing data')
        setLoading(false)
        return
      }

      const listing = listingResult.data
      setListingData(listing)

      // Fetch time series data from analytics (only for chart)
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

      const analyticsResponse = await fetch(`/api/listings/${listingId}/analytics?${params.toString()}`)
      const analyticsResult = await analyticsResponse.json()

      if (analyticsResponse.ok && analyticsResult.success) {
        setTimeSeries(analyticsResult.data.time_series || [])
      }
    } catch (err) {
      console.error('Error loading leads insights:', err)
      setError('Failed to load leads insights')
    } finally {
      setLoading(false)
    }
  }

  const leadsData = timeSeries.map(item => {
    // Use unique_leads + anonymous_leads per time period (unique individuals per period)
    // This shows the trend of unique individuals who became leads, not total actions
    const uniqueLeadsPerPeriod = (item.unique_leads || 0) + (item.anonymous_leads || 0)
    const totalLeadsPerPeriod = uniqueLeadsPerPeriod > 0 ? uniqueLeadsPerPeriod : (item.total_leads || 0) // Fallback to total_leads if unique counts not available
    
    return {
      date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      total: totalLeadsPerPeriod, // Unique individuals per period (for trend chart)
      phone: item.phone_leads || 0,
      message: item.message_leads || 0,
      email: item.email_leads || 0,
      appointment: item.appointment_leads || 0
    }
  })

  if (!listingId) return null

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary_color"></div>
          <span className="ml-2 text-gray-600">Loading leads insights...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="border border-red-200 text-red-800 p-4 rounded-lg mb-6">
        <p className="font-medium">Error loading leads insights:</p>
        <p className="text-sm">{error}</p>
      </div>
    )
  }

  if (!listingData) return null

  // Extract data from listing_leads_breakdown
  const leadsBreakdown = listingData.listing_leads_breakdown || {}
  // Total Leads = unique_leads (logged-in users) + anonymous_leads (anonymous users)
  const uniqueLeads = listingData.unique_leads || 0
  const anonymousLeads = listingData.anonymous_leads || 0
  const totalLeads = uniqueLeads + anonymousLeads // Total unique individuals who became leads
  const totalLeadsActions = listingData.total_leads || 0 // Total lead actions (for reference)
  const totalViews = listingData.total_views || 0
  const conversionRate = totalViews > 0 ? ((totalLeads / totalViews) * 100) : 0

  // Extract lead counts from breakdown
  const phoneLeads = leadsBreakdown?.phone?.total || 0
  const emailLeads = leadsBreakdown?.email?.total || 0
  const websiteLeads = leadsBreakdown?.website?.total || 0
  const appointmentLeads = leadsBreakdown?.appointment?.total || 0
  const messageLeads = leadsBreakdown?.message_leads?.total || leadsBreakdown?.messaging?.total || 0

  return (
    <div className="rounded-lg border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-primary_color">Leads Insights</h2>
          <p className="text-sm text-gray-500">Comprehensive view of listing leads</p>
        </div>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary_color focus:border-primary_color"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="all">All time</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <DataCard
          title="Total Leads"
          value={totalLeads.toLocaleString()}
          icon={FiMessageCircle}
        />
        <DataCard
          title="Phone Leads"
          value={phoneLeads.toLocaleString()}
          icon={FiPhone}
        />
        <DataCard
          title="Message Leads"
          value={messageLeads.toLocaleString()}
          icon={FiMessageCircle}
        />
        <DataCard
          title="Email Leads"
          value={emailLeads.toLocaleString()}
          icon={FiMail}
        />
        <DataCard
          title="Appointment Leads"
          value={appointmentLeads.toLocaleString()}
          icon={FiCalendar}
        />
        <DataCard
          title="Anonymous Leads"
          value={anonymousLeads.toLocaleString()}
          icon={UserX}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <DataCard
          title="Conversion Rate"
          value={`${conversionRate.toFixed(2)}%`}
          icon={FiTrendingUp}
        />
        <DataCard
          title="Total Views"
          value={totalViews.toLocaleString()}
          icon={FiMessageCircle}
        />
      </div>

      {leadsData.length > 0 ? (
        <div>
          <h3 className="text-lg font-semibold text-primary_color mb-4">Leads Over Time</h3>
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

