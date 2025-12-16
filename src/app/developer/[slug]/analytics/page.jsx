'use client'
import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { 
  BarChart3, 
  Eye, 
  Phone, 
  MessageCircle, 
  Calendar, 
  Share2, 
  Heart, 
  TrendingUp,
  Users,
  Building2,
  Mail,
  Globe,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { DateRangePicker } from '@/app/components/ui/date-range-picker'
import { ExportDropdown } from '@/app/components/ui/export-dropdown'
import { useAuth } from '@/contexts/AuthContext'
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

const AnalyticsOverview = () => {
  const params = useParams()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  
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

  // Get real data from user profile - use unique_leads + anonymous_leads instead of total_leads
  const totalViews = user?.profile?.total_views || 0
  const totalUniqueLeads = user?.profile?.total_unique_leads || 0 // Aggregate across all contexts
  const totalAnonymousLeads = user?.profile?.total_anonymous_leads || 0 // Aggregate across all contexts
  const totalLeads = totalUniqueLeads + totalAnonymousLeads // Total unique individuals
  // Fallback to profile-specific if aggregate not available
  const profileUniqueLeads = user?.profile?.unique_leads || 0
  const profileAnonymousLeads = user?.profile?.anonymous_leads || 0
  const profileTotalLeads = profileUniqueLeads + profileAnonymousLeads
  const finalTotalLeads = totalLeads > 0 ? totalLeads : (profileTotalLeads > 0 ? profileTotalLeads : (user?.profile?.total_leads || 0))
  const totalImpressions = user?.profile?.total_impressions || 0
  const conversionRate = totalViews > 0 ? ((finalTotalLeads / totalViews) * 100) : 0

  // Dummy analytics data based on development_analytics schema (for charts and other metrics)
  const analyticsData = {
    overview: {
      totalViews: totalViews,
      totalLeads: finalTotalLeads,
      totalImpressions: totalImpressions,
      conversionRate: parseFloat(conversionRate.toFixed(2)),
      viewsChange: 12.3, // TODO: Calculate from previous period
      leadsChange: 8.7, // TODO: Calculate from previous period
      impressionsChange: 15.2, // TODO: Calculate from previous period
      conversionChange: -2.1 // TODO: Calculate from previous period
    },
    performance: {
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      views: [650, 720, 680, 797],
      leads: [32, 38, 35, 51],
      impressions: [180, 220, 195, 297]
    },
    topProperties: [
      { name: 'Premium Apartments East Legon', views: 1247, leads: 68, conversion: 5.5 },
      { name: 'Karl\'s Manet Ville', views: 892, leads: 45, conversion: 5.0 },
      { name: 'Jojo Jones', views: 456, leads: 23, conversion: 5.0 },
      { name: 'Peter\'s Apartments', views: 234, leads: 12, conversion: 5.1 },
      { name: 'Karls Homes', views: 18, leads: 8, conversion: 44.4 }
    ],
    recentActivity: [
      { type: 'view', property: 'Premium Apartments East Legon', time: '2 minutes ago' },
      { type: 'lead', property: 'Karl\'s Manet Ville', time: '5 minutes ago' },
      { type: 'impression', property: 'Jojo Jones', time: '8 minutes ago' },
      { type: 'view', property: 'Peter\'s Apartments', time: '12 minutes ago' },
      { type: 'lead', property: 'Karls Homes', time: '15 minutes ago' }
    ]
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

  // Chart data for overview metrics - use real API data (current month via 30d window)
  const performanceLabels = analyticsData?.performance?.labels || []
  const performanceViews = analyticsData?.performance?.views || []
  const performanceLeads = analyticsData?.performance?.leads || []

  const overviewChartData = {
    labels: performanceLabels,
    datasets: [
      {
        label: 'Views',
        data: performanceViews,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Leads',
        data: performanceLeads,
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const analyticsPages = [
    {
      title: 'Overview',
      description: 'Overall performance metrics and trends',
      icon: BarChart3,
      href: `/developer/${params.slug}/analytics`,
      color: 'indigo',
      metrics: { total: analyticsData?.overview?.totalViews || 0, change: analyticsData?.overview?.viewsChange || 0 }
    },
    {
      title: 'Property Performance',
      description: 'Views, engagement, and performance metrics for your listings',
      icon: Building2,
      href: `/developer/${params.slug}/analytics/properties`,
      color: 'blue',
      metrics: { total: analyticsData?.topProperties?.length || 0, change: 0 }
    },
    {
      title: 'Lead Analytics',
      description: 'Phone calls, messages, emails, and appointment bookings',
      icon: Phone,
      href: `/developer/${params.slug}/analytics/leads`,
      color: 'green',
      metrics: { total: analyticsData?.overview?.totalLeads || 0, change: analyticsData?.overview?.leadsChange || 0 }
    },
    {
      title: 'Profile & Brand',
      description: 'Profile views, social media engagement, and brand awareness',
      icon: Users,
      href: `/developer/${params.slug}/analytics/profile`,
      color: 'purple',
      metrics: { total: analyticsData?.overview?.totalViews || 0, change: analyticsData?.overview?.viewsChange || 0 }
    },
    {
      title: 'Sales Analytics',
      description: 'Property sales, revenue, and conversion tracking',
      icon: TrendingUp,
      href: `/developer/${params.slug}/analytics/sales`,
      color: 'orange',
      metrics: { total: 47, change: 15.2 }
    }
  ]

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-50 text-blue-600 border-blue-200',
      green: 'bg-green-50 text-green-600 border-green-200',
      purple: 'bg-purple-50 text-purple-600 border-purple-200',
      orange: 'bg-orange-50 text-orange-600 border-orange-200',
      indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200',
      red: 'bg-red-50 text-red-600 border-red-200'
    }
    return colors[color] || colors.blue
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
          <p className="text-gray-600">Track your performance and optimize your listings</p>
        </div>

        {/* Key Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Views</p>
                <p className="text-2xl font-bold text-gray-900">{analyticsData?.overview?.totalViews?.toLocaleString() || 0}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-full">
                <Eye className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="flex items-center mt-2">
              {(analyticsData?.overview?.viewsChange || 0) > 0 ? (
                <ArrowUpRight className="w-4 h-4 text-green-500" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-red-500" />
              )}
              <span className={`text-sm ml-1 ${(analyticsData?.overview?.viewsChange || 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(analyticsData?.overview?.viewsChange || 0)}%
              </span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Leads</p>
                <p className="text-2xl font-bold text-gray-900">{analyticsData?.overview?.totalLeads || 0}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-full">
                <Phone className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="flex items-center mt-2">
              {(analyticsData?.overview?.leadsChange || 0) > 0 ? (
                <ArrowUpRight className="w-4 h-4 text-green-500" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-red-500" />
              )}
              <span className={`text-sm ml-1 ${(analyticsData?.overview?.leadsChange || 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(analyticsData?.overview?.leadsChange || 0)}%
              </span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Impressions</p>
                <p className="text-2xl font-bold text-gray-900">{analyticsData?.overview?.totalImpressions?.toLocaleString() || 0}</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-full">
                <Share2 className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="flex items-center mt-2">
              {(analyticsData?.overview?.impressionsChange || 0) > 0 ? (
                <ArrowUpRight className="w-4 h-4 text-green-500" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-red-500" />
              )}
              <span className={`text-sm ml-1 ${(analyticsData?.overview?.impressionsChange || 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(analyticsData?.overview?.impressionsChange || 0)}%
              </span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold text-gray-900">{analyticsData?.overview?.conversionRate || 0}%</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-full">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <div className="flex items-center mt-2">
              {(analyticsData?.overview?.conversionChange || 0) > 0 ? (
                <ArrowUpRight className="w-4 h-4 text-green-500" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-red-500" />
              )}
              <span className={`text-sm ml-1 ${(analyticsData?.overview?.conversionChange || 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(analyticsData?.overview?.conversionChange || 0)}%
              </span>
            </div>
          </div>
        </div>

        {/* Overview Chart */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center flex-wrap justify-between mb-4 gap-4">
            <h3 className="text-lg font-semibold text-gray-900">Performance Overview</h3>
            <div className="flex items-center gap-2">
              <DateRangePicker
                startDate={dateRange.startDate}
                endDate={dateRange.endDate}
                onChange={setDateRange}
                className="w-[280px]"
              />
              <ExportDropdown
                onExport={async (format) => {
                  if (!dateRange.startDate || !dateRange.endDate || exporting) return
                  
                  setExporting(true)
                  try {
                    const exportData = [
                      ['Period', 'Views', 'Leads'],
                      ...performanceLabels.map((label, index) => [
                        label,
                        performanceViews[index] || 0,
                        performanceLeads[index] || 0
                      ])
                    ]
                    
                    if (format === 'csv') {
                      const csvContent = exportData.map(row => row.join(',')).join('\n')
                      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
                      const link = document.createElement('a')
                      const url = URL.createObjectURL(blob)
                      link.setAttribute('href', url)
                      link.setAttribute('download', `performance-overview-${dateRange.startDate}-to-${dateRange.endDate}.csv`)
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
                      link.setAttribute('download', `performance-overview-${dateRange.startDate}-to-${dateRange.endDate}.xls`)
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
                }}
                disabled={exporting || !dateRange.startDate || !dateRange.endDate}
              />
            </div>
          </div>
          <div className="h-80">
            <Line data={overviewChartData} options={chartOptions} />
          </div>
        </div>

        {/* Analytics Pages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {analyticsPages.map((page, index) => {
            const IconComponent = page.icon
            return (
              <Link key={index} href={page.href}>
                <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 cursor-pointer">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-lg ${getColorClasses(page.color)}`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">{page.metrics.total}</div>
                      <div className={`text-sm ${page.metrics.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {page.metrics.change > 0 ? '+' : ''}{page.metrics.change}%
                      </div>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{page.title}</h3>
                  <p className="text-gray-600 text-sm">{page.description}</p>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Recent Activity & Top Properties */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {analyticsData?.recentActivity?.length > 0 ? (
                analyticsData.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full ${
                        activity.type === 'property_view' || activity.type === 'development_view' ? 'bg-blue-100' :
                        activity.type === 'phone_interaction' || activity.type === 'message_click' ? 'bg-green-100' :
                        activity.type === 'share' ? 'bg-purple-100' :
                        'bg-orange-100'
                      }`}>
                        {activity.type === 'property_view' || activity.type === 'development_view' ? <Eye className="w-4 h-4 text-blue-600" /> :
                         activity.type === 'phone_interaction' || activity.type === 'message_click' ? <Phone className="w-4 h-4 text-green-600" /> :
                         activity.type === 'share' ? <Share2 className="w-4 h-4 text-purple-600" /> :
                         <Calendar className="w-4 h-4 text-orange-600" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{activity.property}</p>
                        <p className="text-xs text-gray-500">{activity.time}</p>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{activity.count}</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No recent activity</p>
                </div>
              )}
            </div>
          </div>

          {/* Top Properties */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Properties</h3>
            <div className="space-y-4">
              {analyticsData?.topProperties?.length > 0 ? (
                analyticsData.topProperties.map((property, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{property.name}</p>
                      <p className="text-xs text-gray-500">{property.views} views • {property.status}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">{property.views}</div>
                      <div className="text-xs text-gray-500">views</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No properties found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AnalyticsOverview
