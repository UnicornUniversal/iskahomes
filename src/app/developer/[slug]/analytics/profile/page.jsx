'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import DataCard from '@/app/components/developers/DataCard'
import {
  ArrowLeft,
  Eye,
  Users,
  Share2,
  Bookmark,
  Calendar
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

const formatNumber = (value) => {
  const num = Number(value || 0)
  if (Number.isNaN(num)) return '0'
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`
  return num.toLocaleString()
}

const ChangeBadge = ({ change }) => {
  if (!change || change.change_percentage === undefined) return null
  const value = Number(change.change_percentage)
  if (Number.isNaN(value)) return null
  const up = value >= 0
  return (
    <span
      className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${
        up ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
      }`}
    >
      {up ? '+' : ''}
      {value.toFixed(1)}%
    </span>
  )
}

const chartOptions = {
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
}

const ProfileAnalytics = () => {
  const params = useParams()
  const { developerToken } = useAuth()
  const [range, setRange] = useState('30')
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchAnalytics = async (value) => {
    if (!developerToken) return
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/developers/profile/analytics?range=${value}`, {
        headers: {
          Authorization: `Bearer ${developerToken}`
        },
        cache: 'no-store'
      })
      const result = await response.json()
      if (response.ok && result.success) {
        setAnalytics(result.data)
      } else {
        setAnalytics(null)
        setError(result.error || 'Failed to load analytics')
      }
    } catch (err) {
      console.error('Profile analytics error:', err)
      setAnalytics(null)
      setError('Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics(range)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [developerToken, range])

  const profileSeries = analytics?.time_series?.profile_views || []
  const impressionsSeries = analytics?.time_series?.impressions || []

  const profileChartData = useMemo(
    () => ({
      labels: profileSeries.map(entry =>
        new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      ),
      datasets: [
        {
          label: 'Profile Views',
          data: profileSeries.map(entry => entry.total),
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37, 99, 235, 0.15)',
          tension: 0.4,
          fill: true
        },
        {
          label: 'Unique Visitors',
          data: profileSeries.map(entry => entry.unique),
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
      labels: impressionsSeries.map(entry =>
        new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      ),
      datasets: [
        {
          label: 'Total Impressions',
          data: impressionsSeries.map(entry => entry.total),
          borderColor: '#f97316',
          backgroundColor: 'rgba(249, 115, 22, 0.15)',
          tension: 0.4,
          fill: true
        },
        {
          label: 'Social Media',
          data: impressionsSeries.map(entry => entry.social),
          borderColor: '#8b5cf6',
          backgroundColor: 'rgba(139, 92, 246, 0.15)',
          tension: 0.4,
          fill: true
        },
        {
          label: 'Website Visits',
          data: impressionsSeries.map(entry => entry.website),
          borderColor: '#0ea5e9',
          backgroundColor: 'rgba(14, 165, 233, 0.15)',
          tension: 0.4,
          fill: true
        }
      ]
    }),
    [impressionsSeries]
  )

  const summary = analytics?.summary
  const latest = analytics?.latest
  const sourceBreakdown = [
    {
      label: 'From Listings',
      value: summary?.profile_views_from_listings || 0,
      color: 'bg-blue-500'
    },
    {
      label: 'From Search',
      value: summary?.profile_views_from_search || 0,
      color: 'bg-indigo-500'
    },
    {
      label: 'From Home',
      value: summary?.profile_views_from_home || 0,
      color: 'bg-teal-500'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col gap-4">
          <Link
            href={`/developer/${params.slug}/analytics`}
            className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-semibold"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Analytics
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Profile & Brand Analytics</h1>
            <p className="text-gray-600">Track profile views, impressions, and engagement in real time</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {rangeOptions.map(option => (
            <button
              key={option.value}
              onClick={() => setRange(option.value)}
              className={`px-4 py-2 text-sm font-medium rounded-xl border ${
                range === option.value ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}
          <button
            onClick={() => fetchAnalytics(range)}
            className="text-sm text-blue-600 hover:text-blue-800 font-semibold"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="grid gap-4">
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, idx) => (
                <div key={idx} className="h-28 bg-white rounded-xl border border-gray-100 animate-pulse" />
              ))}
            </div>
            <div className="h-80 bg-white rounded-2xl border border-gray-100 animate-pulse" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl">{error}</div>
        ) : analytics ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <DataCard
                title="Profile Views"
                value={formatNumber(summary?.profile_views)}
                icon={Eye}
                subtitle="Total visits"
                extra={<ChangeBadge change={latest?.profile_views_change} />}
              />
              <DataCard
                title="Unique Visitors"
                value={formatNumber(summary?.unique_profile_viewers)}
                icon={Users}
                subtitle="Distinct viewers"
              />
              <DataCard
                title="Impressions"
                value={formatNumber(summary?.total_impressions)}
                icon={Share2}
                subtitle="All channels"
                extra={<ChangeBadge change={latest?.impressions_change} />}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <DataCard
                title="Appointments"
                value={formatNumber(summary?.appointments_booked)}
                icon={Calendar}
                subtitle="Booked via listings"
              />
              <DataCard
                title="Saved Properties"
                value={formatNumber(summary?.properties_saved)}
                icon={Bookmark}
                subtitle="Added to favourites"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-6 bg-white border border-gray-100 rounded-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Profile Views Trend</h3>
                    <p className="text-sm text-gray-500">Daily views vs unique visitors</p>
                  </div>
                  <ChangeBadge change={latest?.profile_views_change} />
                </div>
                {profileSeries.length > 0 ? (
                  <div className="h-80">
                    <Line data={profileChartData} options={chartOptions} />
                  </div>
                ) : (
                  <div className="h-80 flex items-center justify-center text-gray-500 text-sm">
                    No profile activity recorded for this range.
                  </div>
                )}
              </div>

              <div className="p-6 bg-white border border-gray-100 rounded-2xl">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Impressions & Reach</h3>
                  <p className="text-sm text-gray-500">Channel level breakdown</p>
                </div>
                {impressionsSeries.length > 0 ? (
                  <div className="h-80">
                    <Line data={impressionsChartData} options={chartOptions} />
                  </div>
                ) : (
                  <div className="h-80 flex items-center justify-center text-gray-500 text-sm">
                    No impression data recorded for this range.
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 bg-white border border-gray-100 rounded-2xl">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Traffic Sources</h3>
              <div className="space-y-4">
                {sourceBreakdown.map(source => (
                  <div key={source.label}>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-800">{source.label}</p>
                      <p className="text-sm text-gray-500">{formatNumber(source.value)}</p>
                    </div>
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`${source.color} h-2`}
                        style={{
                          width: summary?.profile_views
                            ? `${Math.min(100, (source.value / summary.profile_views) * 100)}%`
                            : '0%'
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center text-gray-500 py-12">No analytics data available yet.</div>
        )}
      </div>
    </div>
  )
}

export default ProfileAnalytics
