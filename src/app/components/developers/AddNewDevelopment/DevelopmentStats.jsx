'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { Building2, Loader2, Eye, TrendingUp, BarChart3 } from 'lucide-react'

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend)

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

        // Get developer_id from user profile
        const devIdFromUser = user?.profile?.developer_id

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

  const createChartData = (data, labelKey = 'name') => {
    if (!data || data.length === 0) return null

    return {
      labels: data.map(item => item[labelKey] || item.label || 'Unknown'),
      datasets: [
        {
          label: 'Count',
          data: data.map(item => item.value || item.total_amount || item.count || 0),
          backgroundColor: chartColors.slice(0, data.length),
          borderColor: '#ffffff',
          borderWidth: 2,
        },
      ],
    }
  }

  const createChartOptions = (title, category) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 15,
          font: {
            size: 11,
          },
          usePointStyle: true,
        },
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || ''
            const value = context.parsed || 0
            const total = context.dataset.data.reduce((a, b) => a + b, 0)
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0
            const unit = category === 'views' ? 'views' : category === 'leads' ? 'leads' : ''
            return `${label}: ${value.toLocaleString()} ${unit} (${percentage}%)`
          }
        }
      }
    },
  })

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">Loading development statistics...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-500 font-medium">Error loading statistics</p>
            <p className="text-sm text-gray-500 mt-1">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">No statistics available</p>
        </div>
      </div>
    )
  }

  const categories = [
    { id: 'views', label: 'Views', icon: Eye, data: stats.stats.views },
    { id: 'leads', label: 'Leads', icon: TrendingUp, data: stats.stats.leads },
    { id: 'engagement', label: 'Engagement', icon: BarChart3, data: stats.stats.engagement },
  ]

  const activeCategory = categories.find(c => c.id === selectedCategory)
  const chartData = createChartData(activeCategory?.data)

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            <h5 className="text-lg font-semibold text-gray-900">Development Statistics</h5>
          </div>
          {stats.development && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">{stats.development.total_views?.toLocaleString() || 0}</span> total views
            </div>
          )}
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto">
          {categories.map((category) => {
            const Icon = category.icon
            const hasData = category.data && category.data.length > 0
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  selectedCategory === category.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : hasData
                    ? 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
                disabled={!hasData}
              >
                <Icon className="w-4 h-4" />
                <span>{category.label}</span>
                {hasData && (
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    selectedCategory === category.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}>
                    {category.data.length}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Chart Content */}
      <div className="p-6">
        {!chartData ? (
          <div className="flex flex-col items-center justify-center py-12">
            <BarChart3 className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No {activeCategory?.label.toLowerCase()} data available</p>
            <p className="text-sm text-gray-400 mt-1">Analytics data will appear here as developments receive views and leads</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Chart */}
            <div className="h-[400px]">
              <Doughnut data={chartData} options={createChartOptions(activeCategory?.label, selectedCategory)} />
            </div>

            {/* Stats Table */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <h6 className="font-semibold text-gray-900">{activeCategory?.label} Breakdown</h6>
              </div>
              <div className="divide-y divide-gray-200">
                {activeCategory.data.map((item, index) => {
                  const itemValue = item.value || item.total_amount || item.count || 0
                  const total = activeCategory.data.reduce((sum, i) => sum + (i.value || i.total_amount || i.count || 0), 0)
                  const percentage = item.percentage || (total > 0 ? ((itemValue / total) * 100).toFixed(1) : 0)
                  const unit = selectedCategory === 'views' ? 'views' : selectedCategory === 'leads' ? 'leads' : ''
                  
  return (
                    <div key={index} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: chartColors[index % chartColors.length] }}
                          />
                          <span className="font-medium text-gray-900">
                            {item.name || item.label || 'Unknown'}
                          </span>
                        </div>
                        <div className="flex items-center gap-6">
                          <span className="text-sm text-gray-600">
                            {itemValue.toLocaleString()} {unit}
                          </span>
                          <span className="text-sm font-semibold text-blue-600 w-16 text-right">
                            {typeof percentage === 'number' ? percentage.toFixed(1) : percentage}%
                          </span>
                        </div>
                      </div>
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${typeof percentage === 'number' ? percentage : parseFloat(percentage)}%`,
                              backgroundColor: chartColors[index % chartColors.length]
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Summary Footer */}
      {stats.development && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Total Views: </span>
              <strong className="text-gray-900">{stats.development.total_views?.toLocaleString() || 0}</strong>
            </div>
            <div>
              <span className="text-gray-600">Total Leads: </span>
              <strong className="text-blue-600">{stats.development.total_leads?.toLocaleString() || 0}</strong>
            </div>
            <div>
              <span className="text-gray-600">Total Sales: </span>
              <strong className="text-green-600">{stats.development.total_sales?.toLocaleString() || 0}</strong>
            </div>
    <div>
              <span className="text-gray-600">Conversion Rate: </span>
              <strong className="text-purple-600">{stats.development.conversion_rate?.toFixed(1) || 0}%</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DevelopmentStats
