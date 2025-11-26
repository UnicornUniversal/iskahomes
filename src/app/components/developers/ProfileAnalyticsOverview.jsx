'use client'

import React, { useEffect, useMemo, useState } from 'react'
import DataCard from '@/app/components/developers/DataCard'
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
import {
  FiBarChart2,
  FiEye,
  FiUsers,
  FiTrendingUp,
  FiShare2,
  FiCalendar,
  FiBookmark
} from 'react-icons/fi'

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

const rangeOptions = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: '120', label: 'Last 120 days' }
]

function formatNumber(value) {
  const num = Number(value || 0)
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`
  return num.toLocaleString()
}

function ChangeBadge({ change }) {
  if (!change || change.change_percentage === undefined) return null
  const percent = Number(change.change_percentage)
  if (Number.isNaN(percent)) return null
  const isPositive = percent >= 0
  return (
    <span
      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
        isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
      }`}
    >
      {isPositive ? '+' : ''}
      {percent.toFixed(1)}%
    </span>
  )
}

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
      labels: {
        font: {
          family: 'Inter, sans-serif'
        }
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true
    }
  }
}

const ProfileAnalyticsOverview = ({ token }) => {
  const [range, setRange] = useState('30')
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchAnalytics = async (rangeValue) => {
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/developers/profile/analytics?range=${rangeValue}`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        cache: 'no-store'
      })
      const result = await response.json()
      if (response.ok && result.success) {
        setAnalytics(result.data)
        setError(null)
      } else {
        setAnalytics(null)
        setError(result.error || 'Failed to load analytics')
      }
    } catch (err) {
      console.error('Error loading profile analytics:', err)
      setError('Failed to load analytics')
      setAnalytics(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics(range)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, range])

  const profileSeries = analytics?.time_series?.profile_views || []
  const impressionsSeries = analytics?.time_series?.impressions || []

  const profileChartData = useMemo(
    () => ({
      labels: profileSeries.map(item =>
        new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      ),
      datasets: [
        {
          label: 'Profile Views',
          data: profileSeries.map(item => item.total),
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37, 99, 235, 0.15)',
          tension: 0.4,
          fill: true
        },
        {
          label: 'Unique Visitors',
          data: profileSeries.map(item => item.unique),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.15)',
          tension: 0.4,
          fill: true
        }
      ]
    }),
    [profileSeries]
  )

  const impressionsChartData = useMemo(
    () => ({
      labels: impressionsSeries.map(item =>
        new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      ),
      datasets: [
        {
          label: 'Total Impressions',
          data: impressionsSeries.map(item => item.total),
          borderColor: '#f97316',
          backgroundColor: 'rgba(249, 115, 22, 0.15)',
          tension: 0.4,
          fill: true
        },
        {
          label: 'Social Media',
          data: impressionsSeries.map(item => item.social),
          borderColor: '#8b5cf6',
          backgroundColor: 'rgba(139, 92, 246, 0.15)',
          tension: 0.4,
          fill: true
        },
        {
          label: 'Website Visits',
          data: impressionsSeries.map(item => item.website),
          borderColor: '#06b6d4',
          backgroundColor: 'rgba(6, 182, 212, 0.15)',
          tension: 0.4,
          fill: true
        }
      ]
    }),
    [impressionsSeries]
  )

  if (!token) {
    return null
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FiBarChart2 className="w-6 h-6 text-primary_color" />
            Performance Overview
          </h2>
          <p className="text-sm text-gray-500">Live snapshot of your audience and engagement</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary_color focus:border-transparent"
          >
            {rangeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            onClick={() => fetchAnalytics(range)}
          >
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-12 flex flex-col gap-4">
          <div className="h-4 bg-gray-100 rounded animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, idx) => (
              <div key={idx} className="h-24 bg-gray-50 border border-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
          <div className="h-64 bg-gray-50 border border-gray-100 rounded-xl animate-pulse" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl">
          {error}
        </div>
      ) : analytics ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <DataCard
              title="Profile Views"
              value={formatNumber(analytics.summary.profile_views)}
              icon={FiEye}
              subtitle="Total profile visits"
              extra={<ChangeBadge change={analytics.latest?.profile_views_change} />}
            />
            <DataCard
              title="Unique Visitors"
              value={formatNumber(analytics.summary.unique_profile_viewers)}
              icon={FiUsers}
              subtitle="Distinct visitors"
            />
            <DataCard
              title="Impressions"
              value={formatNumber(analytics.summary.total_impressions)}
              icon={FiShare2}
              subtitle="All channels"
              extra={<ChangeBadge change={analytics.latest?.impressions_change} />}
            />
            <DataCard
              title="Total Leads"
              value={formatNumber(analytics.summary.total_leads)}
              icon={FiTrendingUp}
              subtitle="Profile + listings"
              extra={<ChangeBadge change={analytics.latest?.leads_change} />}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <DataCard
              title="Conversion Rate"
              value={`${(analytics.summary.conversion_rate || 0).toFixed(2)}%`}
              icon={FiTrendingUp}
              subtitle="Views → Leads"
              extra={<ChangeBadge change={analytics.latest?.conversion_change} />}
            />
            <DataCard
              title="Appointments Booked"
              value={formatNumber(analytics.summary.appointments_booked)}
              icon={FiCalendar}
              subtitle="Across listings"
            />
            <DataCard
              title="Properties Saved"
              value={formatNumber(analytics.summary.properties_saved)}
              icon={FiBookmark}
              subtitle="Saved to favourites"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-4 border border-gray-100 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">Profile Views Trend</h4>
                  <p className="text-sm text-gray-500">Daily profile activity</p>
                </div>
                <ChangeBadge change={analytics.latest?.views_change} />
              </div>
              {profileSeries.length > 0 ? (
                <div className="h-72">
                  <Line data={profileChartData} options={chartOptions} />
                </div>
              ) : (
                <div className="h-72 flex items-center justify-center text-gray-500 text-sm bg-gray-50 rounded-xl">
                  No profile activity recorded for this range.
                </div>
              )}
            </div>

            <div className="p-4 border border-gray-100 rounded-2xl">
              <div className="mb-4">
                <h4 className="text-lg font-semibold text-gray-900">Impressions Trend</h4>
                <p className="text-sm text-gray-500">Channel level breakdown</p>
              </div>
              {impressionsSeries.length > 0 ? (
                <div className="h-72">
                  <Line data={impressionsChartData} options={chartOptions} />
                </div>
              ) : (
                <div className="h-72 flex items-center justify-center text-gray-500 text-sm bg-gray-50 rounded-xl">
                  No impression data for this range.
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12 text-gray-500">No analytics data available yet.</div>
      )}
    </div>
  )
}

export default ProfileAnalyticsOverview

