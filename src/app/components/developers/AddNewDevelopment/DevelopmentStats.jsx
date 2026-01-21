'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Building2, Loader2, Eye, TrendingUp, BarChart3 } from 'lucide-react'

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
)

// Color palette for charts
const chartColors = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#F97316', // Orange
  '#6366F1', // Indigo
]

const DevelopmentStats = ({ developmentId, development }) => {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState('views')

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        setError(null)

        // Determine the development ID to use (for single development)
        const devId = developmentId || development?.id

        // Get developer_id from user profile - for team members, use organization_id
        const devIdFromUser = user?.user_type === 'team_member' 
          ? user?.profile?.organization_id 
          : user?.profile?.developer_id

        let url = ''
        if (devId) {
          // Fetch stats for a specific development
          url = `/api/developments/${devId}/stats`
        } else if (devIdFromUser) {
          // Fetch aggregated stats for all developments by developer_id
          url = `/api/developments/all/stats?developer_id=${devIdFromUser}`
        } else {
          setError('Developer ID is required')
          setLoading(false)
          return
        }

        // Always fetch from API to get enriched data with category names
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error('Failed to fetch development stats')
        }

        const result = await response.json()
        if (result.success) {
          setStats(result.data)
        } else {
          throw new Error(result.error || 'Failed to fetch stats')
        }
      } catch (err) {
        console.error('Error fetching development stats:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchStats()
    } else {
      setLoading(false)
    }
  }, [developmentId, development?.id, user?.profile?.developer_id])

  const parseDevelopmentStats = (dev) => {
    const parseJSON = (str) => {
      if (!str) return []
      try {
        return typeof str === 'string' ? JSON.parse(str) : str
      } catch {
        return []
      }
    }

    return {
      development: {
        id: dev.id,
        title: dev.title,
        total_units: dev.total_units || 0,
        units_sold: dev.units_sold || 0,
        units_left: dev.units_left || 0
      },
      stats: {
        purposes: parseJSON(dev.property_purposes_stats) || [],
        categories: parseJSON(dev.property_categories_stats) || [],
        types: parseJSON(dev.property_types_stats) || [],
        subtypes: parseJSON(dev.property_subtypes_stats) || [],
        unitTypes: (() => {
          try {
            const parsed = typeof dev.unit_types === 'string' ? JSON.parse(dev.unit_types) : dev.unit_types
            return parsed?.database || []
          } catch {
            return []
          }
        })()
      }
    }
  }

  // Create time series chart data
  const createTimeSeriesChartData = (timeSeries, category) => {
    if (!timeSeries || timeSeries.length === 0) return null

    const labels = timeSeries.map(item => {
      const date = new Date(item.date)
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    })

    let data = []
    let label = ''
    let color = '#3B82F6'

    if (category === 'views') {
      data = timeSeries.map(item => item.views || 0)
      label = 'Views'
      color = '#3B82F6' // Blue
    } else if (category === 'leads') {
      data = timeSeries.map(item => item.leads || 0)
      label = 'Leads'
      color = '#10B981' // Green
    } else if (category === 'engagement') {
      data = timeSeries.map(item => item.engagement || 0)
      label = 'Engagement'
      color = '#8B5CF6' // Purple
    }

    return {
      labels,
      datasets: [
        {
          label,
          data,
          borderColor: color,
          backgroundColor: `${color}20`,
          tension: 0.4,
          fill: true,
          pointRadius: 3,
          pointHoverRadius: 5,
          pointBackgroundColor: color,
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
        },
      ],
    }
  }

  const createChartOptions = (category) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const value = context.parsed.y || 0
            const unit = category === 'views' ? 'views' : category === 'leads' ? 'leads' : 'engagement'
            return `${value.toLocaleString()} ${unit}`
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          font: {
            size: 11,
          },
          color: '#6B7280',
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
          },
          color: '#6B7280',
        },
      },
    },
  })

  // Calculate chart data before early returns to maintain hook order
  const timeSeries = stats?.time_series || []
  const chartData = useMemo(() => 
    createTimeSeriesChartData(timeSeries, selectedCategory),
    [timeSeries, selectedCategory]
  )

  if (loading) {
    return (
      <div className="rounded-lg shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary_color mx-auto mb-2" />
            <p className="text-primary_color">Loading development statistics...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-500 font-medium">Error loading statistics</p>
            <p className="text-sm text-primary_color mt-1">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="rounded-lg shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-primary_color">No statistics available</p>
        </div>
      </div>
    )
  }

  const categories = [
    { id: 'views', label: 'Views', icon: Eye },
    { id: 'leads', label: 'Leads', icon: TrendingUp },
    { id: 'engagement', label: 'Engagement', icon: BarChart3 },
  ]

  const activeCategory = categories.find(c => c.id === selectedCategory)

  return (
    <div className="rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary_color" />
            <h5 className="text-lg font-semibold text-primary_color">Development Statistics</h5>
          </div>
          {stats.development && (
            <div className="text-sm text-primary_color">
              <span className="font-medium">{stats.development.total_views?.toLocaleString() || 0}</span> total views
            </div>
          )}
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto">
          {categories.map((category) => {
            const Icon = category.icon
            const hasTimeSeriesData = timeSeries && timeSeries.length > 0
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  selectedCategory === category.id
                    ? 'bg-primary_color text-white shadow-sm'
                    : hasTimeSeriesData
                    ? 'text-primary_color hover:bg-gray-100 border border-gray-200'
                    : 'text-primary_color opacity-60 hover:opacity-100 border border-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{category.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Chart Content */}
      <div className="p-6">
        {!chartData || !timeSeries || timeSeries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <BarChart3 className="w-12 h-12 text-primary_color opacity-30 mb-3" />
            <p className="text-primary_color font-medium">No {activeCategory?.label.toLowerCase()} time series data available</p>
            {stats.development && (
              <>
                {activeCategory?.id === 'views' && (
                  <div className="mt-4 text-center">
                    <p className="text-sm text-primary_color">
                      Total Views: <strong className="text-lg">{stats.development.total_views?.toLocaleString() || 0}</strong>
                    </p>
                    {stats.development.total_views > 0 && (
                      <p className="text-xs text-primary_color opacity-60 mt-1">Time series data will appear as views are tracked over time</p>
                    )}
                  </div>
                )}
                {activeCategory?.id === 'leads' && (
                  <div className="mt-4 text-center">
                    <p className="text-sm text-primary_color">
                      Total Leads: <strong className="text-lg">{stats.development.total_leads?.toLocaleString() || 0}</strong>
                    </p>
                    {stats.development.total_leads > 0 && (
                      <p className="text-xs text-primary_color opacity-60 mt-1">Time series data will appear as leads are tracked over time</p>
                    )}
                  </div>
                )}
                {activeCategory?.id === 'engagement' && (
                  <div className="mt-4 text-center">
                    <p className="text-sm text-primary_color">
                      Engagement metrics available in summary below
                    </p>
                  </div>
                )}
              </>
            )}
            {(!stats.development || 
              (activeCategory?.id === 'views' && (!stats.development.total_views || stats.development.total_views === 0)) ||
              (activeCategory?.id === 'leads' && (!stats.development.total_leads || stats.development.total_leads === 0))) && (
              <p className="text-sm text-primary_color opacity-60 mt-1">Analytics data will appear here as developments receive views and leads</p>
            )}
          </div>
        ) : (
          <div className="h-[400px]">
            <Line data={chartData} options={createChartOptions(selectedCategory)} />
          </div>
        )}
      </div>

      {/* Summary Footer - Always show when stats exist */}
      {stats.development && (
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-primary_color">Total Views: </span>
              <strong className="text-primary_color">{stats.development.total_views?.toLocaleString() || 0}</strong>
            </div>
            <div>
              <span className="text-primary_color">Total Leads: </span>
              <strong className="text-primary_color">{stats.development.total_leads?.toLocaleString() || 0}</strong>
            </div>
            <div>
              <span className="text-primary_color">Total Sales: </span>
              <strong className="text-primary_color">{stats.development.total_sales?.toLocaleString() || 0}</strong>
            </div>
            <div>
              <span className="text-primary_color">Conversion Rate: </span>
              <strong className="text-primary_color">{stats.development.conversion_rate?.toFixed(1) || 0}%</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DevelopmentStats
