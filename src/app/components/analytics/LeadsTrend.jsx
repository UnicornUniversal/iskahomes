'use client'

import React, { useState } from 'react'
import { 
  Phone, 
  MessageCircle, 
  Mail, 
  Calendar, 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  CheckCircle
} from 'lucide-react'
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

  // Dummy lead analytics data based on listing_analytics schema
  const leadsData = {
    week: {
      overview: {
        totalLeads: 45,
        phoneLeads: 12,
        messageLeads: 8,
        emailLeads: 6,
        appointmentLeads: 4,
        websiteLeads: 2,
        uniqueLeads: 38,
        conversionRate: 5.2,
        leadsChange: 8.7,
        phoneChange: 12.3,
        messageChange: 6.2,
        emailChange: 15.8,
        appointmentChange: 22.1,
        websiteChange: 4.5
      },
      performance: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        phone: [2, 3, 1, 2, 2, 1, 1],
        message: [1, 2, 1, 2, 1, 1, 0],
        email: [1, 1, 1, 1, 1, 1, 0],
        appointment: [0, 1, 1, 1, 1, 0, 0],
        website: [0, 1, 0, 1, 0, 0, 0]
      }
    },
    month: {
      overview: {
        totalLeads: 156,
        phoneLeads: 45,
        messageLeads: 32,
        emailLeads: 28,
        appointmentLeads: 18,
        websiteLeads: 12,
        uniqueLeads: 134,
        conversionRate: 5.5,
        leadsChange: 8.7,
        phoneChange: 12.3,
        messageChange: 6.2,
        emailChange: 15.8,
        appointmentChange: 22.1,
        websiteChange: 4.5
      },
      performance: {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        phone: [12, 15, 11, 18],
        message: [8, 10, 7, 12],
        email: [6, 8, 9, 11],
        appointment: [4, 6, 5, 8],
        website: [2, 3, 2, 4]
      }
    },
    year: {
      overview: {
        totalLeads: 1847,
        phoneLeads: 542,
        messageLeads: 384,
        emailLeads: 336,
        appointmentLeads: 216,
        websiteLeads: 144,
        uniqueLeads: 1589,
        conversionRate: 5.8,
        leadsChange: 12.4,
        phoneChange: 15.2,
        messageChange: 8.7,
        emailChange: 18.3,
        appointmentChange: 25.6,
        websiteChange: 6.8
      },
      performance: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        phone: [42, 38, 45, 48, 52, 46, 44, 49, 51, 47, 43, 41],
        message: [28, 32, 35, 38, 34, 31, 29, 33, 36, 32, 30, 28],
        email: [24, 28, 31, 34, 30, 27, 25, 29, 32, 28, 26, 24],
        appointment: [16, 18, 21, 24, 20, 17, 15, 19, 22, 18, 16, 14],
        website: [12, 14, 16, 18, 15, 13, 11, 15, 17, 14, 12, 11]
      }
    }
  }

  // Get current data based on selected time range
  const currentData = leadsData[timeRange] || leadsData.month

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
      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Leads</p>
              <p className="text-2xl font-bold text-gray-900">{currentData?.overview?.totalLeads || 0}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-full">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="flex items-center mt-2">
            {(currentData?.overview?.leadsChange || 0) > 0 ? (
              <TrendingUp className="w-4 h-4 text-green-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-500" />
            )}
            <span className={`text-sm ml-1 ${(currentData?.overview?.leadsChange || 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {Math.abs(currentData?.overview?.leadsChange || 0)}%
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
              <p className="text-2xl font-bold text-gray-900">{currentData?.overview?.conversionRate || 0}%</p>
            </div>
            <div className="p-3 bg-green-50 rounded-full">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="text-sm text-gray-500 mt-2">
            View to lead conversion
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Phone Leads</p>
              <p className="text-2xl font-bold text-gray-900">{currentData?.overview?.phoneLeads || 0}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-full">
              <Phone className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="text-sm text-gray-500 mt-2">
            Phone interactions
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Message Leads</p>
              <p className="text-2xl font-bold text-gray-900">{currentData?.overview?.messageLeads || 0}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-full">
              <MessageCircle className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="text-sm text-gray-500 mt-2">
            Message interactions
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Appointments</p>
              <p className="text-2xl font-bold text-gray-900">{currentData?.overview?.appointmentLeads || 0}</p>
            </div>
            <div className="p-3 bg-orange-50 rounded-full">
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="text-sm text-gray-500 mt-2">
            Appointment bookings
          </div>
        </div>
      </div>

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

      {/* Bottom percentage share cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="p-3 bg-green-50 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
            <Phone className="w-6 h-6 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {currentData?.overview?.totalLeads > 0 
              ? Math.round((currentData?.overview?.phoneLeads / currentData?.overview?.totalLeads) * 100)
              : 0}%
          </div>
          <div className="text-sm text-gray-500">Phone Share</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="p-3 bg-blue-50 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {currentData?.overview?.totalLeads > 0 
              ? Math.round((currentData?.overview?.messageLeads / currentData?.overview?.totalLeads) * 100)
              : 0}%
          </div>
          <div className="text-sm text-gray-500">Message Share</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="p-3 bg-purple-50 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
            <Mail className="w-6 h-6 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {currentData?.overview?.totalLeads > 0 
              ? Math.round((currentData?.overview?.emailLeads / currentData?.overview?.totalLeads) * 100)
              : 0}%
          </div>
          <div className="text-sm text-gray-500">Email Share</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="p-3 bg-orange-50 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
            <Calendar className="w-6 h-6 text-orange-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {currentData?.overview?.totalLeads > 0 
              ? Math.round((currentData?.overview?.appointmentLeads / currentData?.overview?.totalLeads) * 100)
              : 0}%
          </div>
          <div className="text-sm text-gray-500">Appointment Share</div>
        </div>
      </div>
    </div>
  )
}
