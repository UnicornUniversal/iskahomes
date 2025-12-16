'use client'

import React, { useEffect, useMemo, useState, useCallback } from 'react'
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
  Calendar,
  Globe,
  Heart,
  TrendingUp
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
  Filler,
  ArcElement
} from 'chart.js'
import { Line, Doughnut } from 'react-chartjs-2'
import { DateRangePicker } from '@/app/components/ui/date-range-picker'
import { ExportDropdown } from '@/app/components/ui/export-dropdown'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
)

const rangeOptions = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'year', label: 'This Year' },
  { value: 'all', label: 'All' }
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

// Summary Cards Component
const SummaryCards = ({ developer }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <DataCard
        title="Profile Views"
        value={formatNumber(developer?.total_profile_views)}
        icon={Eye}
        subtitle="Total visits"
      />
      <DataCard
        title="Total Views"
        value={formatNumber(developer?.total_views)}
        icon={Eye}
        subtitle="All views"
      />
      <DataCard
        title="Impressions"
        value={formatNumber(developer?.total_impressions)}
        icon={Share2}
        subtitle="All channels"
      />
      <DataCard
        title="Appointments"
        value={formatNumber(developer?.total_appointments)}
        icon={Calendar}
        subtitle="Booked via listings"
      />
    </div>
  )
}

// Profile Views Chart Component
const ProfileViewsChart = ({ profileSeries, latest, dateRange, onDateRangeChange }) => {
  const [exporting, setExporting] = useState(false)
  
  const chartData = useMemo(
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

  const handleExport = async (format) => {
    if (!dateRange?.startDate || !dateRange?.endDate || exporting) return
    
    setExporting(true)
    try {
      const exportData = [
        ['Date', 'Profile Views', 'Unique Visitors'],
        ...profileSeries.map(entry => [
          new Date(entry.date).toLocaleDateString('en-US'),
          entry.total || 0,
          entry.unique || 0
        ])
      ]
      
      if (format === 'csv') {
        const csvContent = exportData.map(row => row.join(',')).join('\n')
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `profile-views-${dateRange.startDate}-to-${dateRange.endDate}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else if (format === 'excel') {
        const BOM = '\uFEFF'
        const excelContent = BOM + exportData.map(row => row.join('\t')).join('\n')
        const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `profile-views-${dateRange.startDate}-to-${dateRange.endDate}.xls`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    } catch (error) {
      console.error('Error exporting data:', error)
      alert('Failed to export data. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="secondary_bg p-6 border border-gray-200 rounded-2xl">
      <div className="flex items-center flex-wrap justify-between mb-4 gap-4">
        <div>
          <h3 className="text-lg font-semibold text-primary_color">Profile Views Trend</h3>
          <p className="text-sm text-gray-500">Daily views vs unique visitors</p>
        </div>
        <div className="flex items-center gap-2">
          <DateRangePicker
            startDate={dateRange?.startDate}
            endDate={dateRange?.endDate}
            onChange={onDateRangeChange}
            className="w-[280px]"
          />
          <ExportDropdown
            onExport={handleExport}
            disabled={exporting || !dateRange?.startDate || !dateRange?.endDate || profileSeries.length === 0}
          />
        </div>
      </div>
      {profileSeries.length > 0 ? (
        <div className="h-80">
          <Line data={chartData} options={chartOptions} />
        </div>
      ) : (
        <div className="h-80 flex items-center justify-center text-gray-500 text-sm">
          No profile activity recorded for this range.
        </div>
      )}
    </div>
  )
}

// Impressions Chart Component
const ImpressionsChart = ({ impressionsSeries, latest, dateRange, onDateRangeChange }) => {
  const [exporting, setExporting] = useState(false)
  
  const chartData = useMemo(
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
        },
        {
          label: 'Shares',
          data: impressionsSeries.map(entry => entry.share),
          borderColor: '#ec4899',
          backgroundColor: 'rgba(236, 72, 153, 0.15)',
          tension: 0.4,
          fill: true
        },
        {
          label: 'Saved',
          data: impressionsSeries.map(entry => entry.saved),
          borderColor: '#14b8a6',
          backgroundColor: 'rgba(20, 184, 166, 0.15)',
          tension: 0.4,
          fill: true
        }
      ]
    }),
    [impressionsSeries]
  )

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

  const handleExport = async (format) => {
    if (!dateRange?.startDate || !dateRange?.endDate || exporting) return
    
    setExporting(true)
    try {
      const exportData = [
        ['Date', 'Total Impressions', 'Social Media', 'Website Visits', 'Shares', 'Saved'],
        ...impressionsSeries.map(entry => [
          new Date(entry.date).toLocaleDateString('en-US'),
          entry.total || 0,
          entry.social || 0,
          entry.website || 0,
          entry.share || 0,
          entry.saved || 0
        ])
      ]
      
      if (format === 'csv') {
        const csvContent = exportData.map(row => row.join(',')).join('\n')
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `impressions-${dateRange.startDate}-to-${dateRange.endDate}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else if (format === 'excel') {
        const BOM = '\uFEFF'
        const excelContent = BOM + exportData.map(row => row.join('\t')).join('\n')
        const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `impressions-${dateRange.startDate}-to-${dateRange.endDate}.xls`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    } catch (error) {
      console.error('Error exporting data:', error)
      alert('Failed to export data. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="secondary_bg p-6 border border-gray-200 rounded-2xl">
      <div className="flex items-center flex-wrap justify-between mb-4 gap-4">
        <div>
          <h3 className="text-lg font-semibold text-primary_color">Impressions & Reach</h3>
          <p className="text-sm text-gray-500">Channel level breakdown over time</p>
        </div>
        <div className="flex items-center gap-2">
          <DateRangePicker
            startDate={dateRange?.startDate}
            endDate={dateRange?.endDate}
            onChange={onDateRangeChange}
            className="w-[280px]"
          />
          <ExportDropdown
            onExport={handleExport}
            disabled={exporting || !dateRange?.startDate || !dateRange?.endDate || impressionsSeries.length === 0}
          />
        </div>
      </div>
      {impressionsSeries.length > 0 ? (
        <div className="h-80">
          <Line data={chartData} options={chartOptions} />
        </div>
      ) : (
        <div className="h-80 flex items-center justify-center text-gray-500 text-sm">
          No impression data recorded for this range.
        </div>
      )}
    </div>
  )
}

// Impressions Breakdown Component
const ImpressionsBreakdown = ({ impressionsBreakdown, summary }) => {
  if (!impressionsBreakdown || Object.keys(impressionsBreakdown).length === 0) {
    // Fallback to summary data if breakdown not available
    const total = summary?.total_impressions || 0
    const social = summary?.impression_social_media || 0
    const website = summary?.impression_website || 0
    const share = summary?.impression_share || 0
    const saved = summary?.impression_saved || 0

    if (total === 0) {
      return (
        <div className="secondary_bg p-6 border border-gray-200 rounded-2xl">
          <h3 className="text-lg font-semibold text-primary_color mb-4">Impressions Breakdown</h3>
          <div className="text-center text-gray-500 py-8">No impressions data available</div>
        </div>
      )
    }

    const breakdownData = [
      { label: 'Social Media', value: social, color: '#8b5cf6', icon: Share2 },
      { label: 'Website Visits', value: website, color: '#0ea5e9', icon: Globe },
      { label: 'Shares', value: share, color: '#ec4899', icon: Share2 },
      { label: 'Saved', value: saved, color: '#14b8a6', icon: Heart }
    ].filter(item => item.value > 0)

    const chartData = {
      labels: breakdownData.map(item => item.label),
      datasets: [
        {
          data: breakdownData.map(item => item.value),
          backgroundColor: breakdownData.map(item => item.color),
          borderWidth: 0
        }
      ]
    }

    return (
      <div className="secondary_bg p-6 border border-gray-200 rounded-2xl">
        <h3 className="text-lg font-semibold text-primary_color mb-4">Impressions Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 flex items-center justify-center">
            <Doughnut
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom'
                  }
                }
              }}
            />
          </div>
          <div className="space-y-4">
            {breakdownData.map((item, idx) => {
              const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0
              const Icon = item.icon
              return (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" style={{ color: item.color }} />
                      <p className="text-sm font-medium text-primary_color">{item.label}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-primary_color">{formatNumber(item.value)}</p>
                      <p className="text-xs text-gray-500">{percentage}%</p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: item.color
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  const breakdownItems = [
    { key: 'social_media', label: 'Social Media', color: '#8b5cf6', icon: Share2 },
    { key: 'website_visit', label: 'Website Visits', color: '#0ea5e9', icon: Globe },
    { key: 'share', label: 'Shares', color: '#ec4899', icon: Share2 },
    { key: 'saved_listing', label: 'Saved', color: '#14b8a6', icon: Heart }
  ]

  const chartData = {
    labels: breakdownItems.map(item => item.label),
    datasets: [
      {
        data: breakdownItems.map(item => impressionsBreakdown[item.key]?.total || 0),
        backgroundColor: breakdownItems.map(item => item.color),
        borderWidth: 0
      }
    ]
  }

  const total = breakdownItems.reduce((sum, item) => {
    return sum + (impressionsBreakdown[item.key]?.total || 0)
  }, 0)

  return (
    <div className="secondary_bg p-6 border border-gray-200 rounded-2xl">
      <h3 className="text-lg font-semibold text-primary_color mb-4">Impressions Breakdown</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="h-64 flex items-center justify-center">
          <Doughnut
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'bottom'
                }
              }
            }}
          />
        </div>
        <div className="space-y-4">
          {breakdownItems.map((item, idx) => {
            const data = impressionsBreakdown[item.key] || { total: 0, percentage: 0 }
            const Icon = item.icon
            return (
              <div key={idx}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" style={{ color: item.color }} />
                    <p className="text-sm font-medium text-primary_color">{item.label}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-primary_color">{formatNumber(data.total)}</p>
                    <p className="text-xs text-gray-500">{data.percentage}%</p>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-2 rounded-full"
                    style={{
                      width: `${data.percentage}%`,
                      backgroundColor: item.color
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// Traffic Sources Component
const TrafficSources = ({ summary }) => {
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

  const total = summary?.profile_views || 0

  return (
    <div className="secondary_bg p-6 border border-gray-200 rounded-2xl">
      <h3 className="text-lg font-semibold text-primary_color mb-4">Profile Traffic Sources</h3>
      <div className="space-y-4">
        {sourceBreakdown.map(source => {
          const percentage = total > 0 ? ((source.value / total) * 100).toFixed(1) : 0
          return (
            <div key={source.label}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-primary_color">{source.label}</p>
                <p className="text-sm text-gray-500">{formatNumber(source.value)} ({percentage}%)</p>
              </div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className={`${source.color} h-2 rounded-full`}
                  style={{
                    width: `${Math.min(100, percentage)}%`
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Main Component
const ProfileAnalytics = () => {
  const params = useParams()
  const { developerToken, user } = useAuth()
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Get developer data from useAuth
  const developer = user?.profile || null

  // Initialize with current month as default
  const getDefaultDateRange = () => {
    const today = new Date()
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    return {
      startDate: startOfMonth.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0]
    }
  }

  const defaultRange = getDefaultDateRange()
  const [dateRange, setDateRange] = useState(defaultRange)

  const fetchAnalytics = async (startDate, endDate) => {
    if (!developerToken || !startDate || !endDate) return
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        date_from: startDate,
        date_to: endDate
      })
      const response = await fetch(`/api/developers/profile/analytics?${params.toString()}`, {
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
    if (dateRange.startDate && dateRange.endDate) {
      fetchAnalytics(dateRange.startDate, dateRange.endDate)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [developerToken, dateRange.startDate, dateRange.endDate])

  const profileSeries = analytics?.time_series?.profile_views || []
  const impressionsSeries = analytics?.time_series?.impressions || []
  const summary = analytics?.summary
  const latest = analytics?.latest
  // Use impressions_breakdown from developer data (useAuth) if available, otherwise from API
  const impressionsBreakdown = developer?.impressions_breakdown 
    ? (typeof developer.impressions_breakdown === 'string' 
        ? JSON.parse(developer.impressions_breakdown || '{}') 
        : developer.impressions_breakdown)
    : (analytics?.developer?.impressions_breakdown 
        ? (typeof analytics.developer.impressions_breakdown === 'string'
            ? JSON.parse(analytics.developer.impressions_breakdown || '{}')
            : analytics.developer.impressions_breakdown)
        : {})

  return (
    <div className="min-h-screen  p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* <div className="flex flex-col gap-4">
          <Link
            href={`/developer/${params.slug}/analytics`}
            className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-semibold"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Analytics
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-primary_color">Profile & Brand Analytics</h1>
            <p className="text-gray-600">Track profile views, impressions, and engagement in real time</p>
          </div>
        </div> */}

        {loading ? (
          <div className="grid gap-4">
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, idx) => (
                <div key={idx} className="h-28 secondary_bg rounded-xl border border-gray-200 animate-pulse" />
              ))}
            </div>
            <div className="h-80 secondary_bg rounded-2xl border border-gray-200 animate-pulse" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl">{error}</div>
        ) : analytics ? (
          <>
            <SummaryCards developer={developer} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <ProfileViewsChart 
                profileSeries={profileSeries} 
                latest={latest}
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
              />
              <ImpressionsChart 
                impressionsSeries={impressionsSeries} 
                latest={latest}
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
              />
            </div>

            <div className="mt-6">
              <ImpressionsBreakdown impressionsBreakdown={impressionsBreakdown} summary={summary} />
            </div>

            {/* <TrafficSources summary={summary} /> */}
          </>
        ) : (
          <div className="text-center text-gray-500 py-12">No analytics data available yet.</div>
        )}
      </div>
    </div>
  )
}

export default ProfileAnalytics
