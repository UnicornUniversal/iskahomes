'use client'
import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Loader2 } from 'lucide-react'
import { DateRangePicker } from '@/app/components/ui/date-range-picker'
import { ExportDropdown } from '@/app/components/ui/export-dropdown'

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

// Views Chart Component - Shows both listing views and profile views
const ViewsChart = ({ listingData, profileData, showListing, showProfile }) => {
  // Get all unique dates from both datasets
  const allDates = new Set()
  listingData.forEach(item => {
    if (item.date) allDates.add(item.date)
  })
  profileData.forEach(item => {
    if (item.date) allDates.add(item.date)
  })
  
  // Sort dates chronologically
  const sortedDates = Array.from(allDates).sort()
  
  // Create maps for quick lookup by date
  const listingMap = new Map(listingData.map(item => [item.date || '', item]))
  const profileMap = new Map(profileData.map(item => [item.date || '', item]))
  
  // Build labels array - use the label from whichever dataset has it, or format the date
  const labels = sortedDates.map(date => {
    const listingItem = listingMap.get(date)
    const profileItem = profileMap.get(date)
    // Prefer label from listing data, fallback to profile data, or format date
    return listingItem?.label || profileItem?.label || date
  })
  
  // Build datasets array
  const datasets = []
  
  // Primary color for listing views (blue)
  if (showListing) {
    datasets.push({
      label: 'Listing Views',
      data: sortedDates.map(date => {
        const item = listingMap.get(date)
        return item ? (item.value || 0) : 0
      }),
      borderColor: '#3B82F6', // Primary blue
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.4,
      fill: showProfile ? false : true, // Only fill if showing one dataset
      pointRadius: 3,
      pointHoverRadius: 5,
      pointBackgroundColor: '#3B82F6',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
    })
  }
  
  // Secondary color for profile views (purple/indigo)
  if (showProfile) {
    datasets.push({
      label: 'Profile Views',
      data: sortedDates.map(date => {
        const item = profileMap.get(date)
        return item ? (item.value || 0) : 0
      }),
      borderColor: '#8B5CF6', // Secondary purple
      backgroundColor: 'rgba(139, 92, 246, 0.1)',
      tension: 0.4,
      fill: showListing ? false : true, // Only fill if showing one dataset
      pointRadius: 3,
      pointHoverRadius: 5,
      pointBackgroundColor: '#8B5CF6',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
    })
  }

  const chartData = {
    labels,
    datasets,
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12,
          },
          color: '#374151',
        },
      },
      title: {
        display: false,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
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
    interaction: {
      mode: 'index',
      intersect: false,
    },
  }

  return <Line data={chartData} options={options} />
}

// Impressions Chart Component
// COMMENTED OUT: Impressions query is too slow (fetches 5 event types from PostHog)
// TODO: Optimize impressions query or use cached data from user_analytics table
/*
const ImpressionsChart = ({ data }) => {
  const chartData = {
    labels: data.map(item => item.label),
    datasets: [
      {
        label: 'Impressions',
        data: data.map(item => item.value),
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 3,
        pointHoverRadius: 5,
        pointBackgroundColor: '#10B981',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
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
  }

  return <Line data={chartData} options={options} />
}
*/

const StatisticsView = ({ userId: propUserId = null, accountType: propAccountType = 'developer' }) => {
  const { user } = useAuth()
  const [selectedMetric, setSelectedMetric] = useState('views')
  const [exporting, setExporting] = useState(false)
  const [viewsData, setViewsData] = useState([])
  const [listingViewsData, setListingViewsData] = useState([])
  const [profileViewsData, setProfileViewsData] = useState([])
  // const [impressionsData, setImpressionsData] = useState([]) // COMMENTED OUT: Impressions too slow
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState({ 
    totalViews: 0, 
    totalListingViews: 0, 
    totalProfileViews: 0 
  })
  // Toggle states for showing/hiding datasets
  const [showListingViews, setShowListingViews] = useState(true)
  const [showProfileViews, setShowProfileViews] = useState(true)

  // Use provided userId/accountType or fall back to auth user
  // Use developer_id from profile (already set in AuthContext for team members)
  const accountType = propAccountType || user?.profile?.account_type || 'developer'
  const userId = propUserId || (user?.profile?.developer_id || user?.id)

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
  
  // Convert date range to period for API compatibility
  const getPeriodFromDateRange = useCallback(() => {
    if (!dateRange.startDate || !dateRange.endDate) return 'month'
    
    const start = new Date(dateRange.startDate)
    const end = new Date(dateRange.endDate)
    const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24))
    
    if (daysDiff <= 1) return 'today'
    if (daysDiff <= 7) return 'week'
    if (daysDiff <= 30) return 'month'
    return 'year'
  }, [dateRange])
  
  const selectedPeriod = getPeriodFromDateRange()

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    let isMounted = true

    const fetchStatistics = async () => {
      try {
        setLoading(true)
        const userType = accountType
        
        // COMMENTED OUT: PostHog implementation (too slow, replaced with Supabase user_analytics table)
        // NOTE: Now using Supabase user_analytics table instead of PostHog API
        // The new route /api/analytics/statistics-db queries user_analytics table directly
        // This is much faster and uses pre-aggregated data from the cron job
        
        // Old PostHog code (commented out):
        // NOTE: Impressions disabled - query is too slow (fetches 5 event types from PostHog)
        // Only fetching views for now (property_view events)
        // TODO: Optimize impressions query or use cached data from user_analytics table
        // if (selectedMetric === 'impressions') {
        //   console.warn('Impressions metric is currently disabled due to performance issues')
        //   if (isMounted) {
        //     setViewsData([])
        //     setSummary({ total: 0, average: 0 })
        //     setLoading(false)
        //   }
        //   return
        // }

        // COMMENTED OUT: PostHog implementation (too slow)
        // const response = await fetch(
        //   `/api/analytics/statistics?user_id=${user.id}&user_type=${userType}&period=${selectedPeriod}&metric=${selectedMetric}`
        // )
        
        // NEW: Use Supabase user_analytics table with date range
        const params = new URLSearchParams({
          user_id: userId,
          user_type: userType,
          period: selectedPeriod,
          metric: selectedMetric
        })
        
        if (dateRange.startDate && dateRange.endDate) {
          params.append('date_from', dateRange.startDate)
          params.append('date_to', dateRange.endDate)
        }
        
        const response = await fetch(`/api/analytics/statistics-db?${params.toString()}`)

        if (response.ok) {
          const result = await response.json()
          
          if (isMounted) {
            // Get all time series data
            const timeSeries = result.data?.timeSeries || []
            const timeSeriesListing = result.data?.timeSeriesListing || []
            const timeSeriesProfile = result.data?.timeSeriesProfile || []
            const groupBy = result.data?.groupBy || 'date'
            
            // Calculate date range to determine formatting
            let daysDiff = 0
            if (dateRange.startDate && dateRange.endDate) {
              const start = new Date(dateRange.startDate)
              const end = new Date(dateRange.endDate)
              daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24))
            }
            
            // Helper function to process time series data
            const processTimeSeries = (timeSeriesData) => {
              return timeSeriesData.map((item, index) => {
                // Always create label from date if available
                if (item.date) {
                  try {
                    const date = new Date(item.date)
                    
                    if (groupBy === 'hour') {
                      // For hourly data, show time
                      item.label = `${String(item.hour || 0).padStart(2, '0')}:00`
                    } else if (groupBy === 'date') {
                      // For daily data, format based on range length
                      if (daysDiff <= 7) {
                        // Show day name and date for week view
                        item.label = date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })
                      } else if (daysDiff <= 30) {
                        // Show month and day for month view
                        item.label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                      } else {
                        // Show abbreviated format for longer ranges
                        item.label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                      }
                    } else if (groupBy === 'week') {
                      // For weekly data, show week range or week number
                      const weekStart = new Date(date)
                      weekStart.setDate(date.getDate() - date.getDay())
                      const weekEnd = new Date(weekStart)
                      weekEnd.setDate(weekStart.getDate() + 6)
                      item.label = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { day: 'numeric' })}`
                    } else if (groupBy === 'month') {
                      // For monthly data, show month and year
                      item.label = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                    } else {
                      // Fallback to date format
                      item.label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    }
                  } catch (e) {
                    // If date parsing fails, use the date string as-is
                    item.label = item.date
                  }
                } else if (item.label) {
                  // Use existing label if present
                  // No change needed
                } else {
                  // Last resort: create label from index
                  item.label = `Point ${index + 1}`
                }
                return item
              })
            }
            
            setViewsData(processTimeSeries(timeSeries))
            setListingViewsData(processTimeSeries(timeSeriesListing))
            setProfileViewsData(processTimeSeries(timeSeriesProfile))
            setSummary(result.data?.summary || { 
              totalViews: 0, 
              totalListingViews: 0, 
              totalProfileViews: 0 
            })
          }
        }
      } catch (error) {
        console.error('Error fetching statistics:', error)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchStatistics()

    return () => {
      isMounted = false
    }
  }, [userId, accountType, selectedPeriod, selectedMetric, dateRange.startDate, dateRange.endDate])

  const totalViews = summary.totalViews || 0
  const totalListingViews = summary.totalListingViews || 0
  const totalProfileViews = summary.totalProfileViews || 0

  // Get period label for headings
  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case 'today':
        return 'Today'
      case 'week':
        return 'This Week'
      case 'month':
        return 'This Month'
      case 'year':
        return 'This Year'
      default:
        return 'Today'
    }
  }

  return (
    <div className="secondary_bg max-h- text-primary_color overflow-hidden">
      {/* Header with Toggle */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h5 className="text-lg font-semibold">Statistics</h5>
          
          <div className="flex gap-3 items-center">
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
                    ['Date', 'Listing Views', 'Profile Views', 'Total Views'],
                    ...viewsData.map((item, index) => {
                      const listingItem = listingViewsData[index] || { value: 0 }
                      const profileItem = profileViewsData[index] || { value: 0 }
                      return [
                        item.label || '',
                        listingItem.value || 0,
                        profileItem.value || 0,
                        item.value || 0
                      ]
                    })
                  ]
                  
                  if (format === 'csv') {
                    const csvContent = exportData.map(row => row.join(',')).join('\n')
                    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
                    const link = document.createElement('a')
                    const url = URL.createObjectURL(blob)
                    link.setAttribute('href', url)
                    link.setAttribute('download', `statistics-${dateRange.startDate}-to-${dateRange.endDate}.csv`)
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
                    link.setAttribute('download', `statistics-${dateRange.startDate}-to-${dateRange.endDate}.xls`)
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
              disabled={exporting || !dateRange.startDate || !dateRange.endDate || (listingViewsData.length === 0 && profileViewsData.length === 0)}
            />
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="px-6 py-4 grid grid-cols-3 gap-4 border-b border-gray-100">
        {/* Total Views */}
        <div className="flex flex-col">
          <span className="text-[10px] font-medium uppercase tracking-wide mb-1">
            Total Views
          </span>
          <h3 className="md:text-[2em]  ">
            {loading ? '...' : totalViews.toLocaleString()}
          </h3>
        </div>

        {/* Total Listing Views */}
        <div className="flex flex-col">
          <span className="text-[10px] font-medium uppercase tracking-wide mb-1">
            Total Listing Views
          </span>
          <h3 className="md:text-[2em]  ">
            {loading ? '...' : totalListingViews.toLocaleString()}
          </h3>
        </div>

        {/* Total Profile Views */}
        <div className="flex flex-col">
          <span className="text-[10px] font-medium uppercase tracking-wide mb-1">
            Total Profile Views
          </span>
          <h3 className="md:text-[2em]  ">
            {loading ? '...' : totalProfileViews.toLocaleString()}
          </h3>
        </div>
      </div>

      {/* View Type Toggle Buttons */}
      {/* <div className="px-6 py-3 border-b border-gray-100">
        <div className="flex gap-2 rounded-lg p-1 border border-gray-200 bg-white w-fit">
          <button
            onClick={() => {
              setShowListingViews(true)
              setShowProfileViews(true)
            }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              showListingViews && showProfileViews
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            suppressHydrationWarning
          >
            Both
          </button>
          <button
            onClick={() => {
              setShowListingViews(true)
              setShowProfileViews(false)
            }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              showListingViews && !showProfileViews
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            suppressHydrationWarning
          >
            Listing Views
          </button>
          <button
            onClick={() => {
              setShowListingViews(false)
              setShowProfileViews(true)
            }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              !showListingViews && showProfileViews
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            suppressHydrationWarning
          >
            Profile Views
          </button>
        </div>
      </div> */}

      {/* Chart Container */}
      <div className="px-6 py-4">
        <div className="h-[300px]">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span>Loading statistics...</span>
            </div>
          ) : (listingViewsData.length === 0 && profileViewsData.length === 0) ? (
            <div className="flex items-center justify-center h-full">
              <span>No data available for this period</span>
            </div>
          ) : (
            <ViewsChart 
              listingData={listingViewsData} 
              profileData={profileViewsData}
              showListing={showListingViews}
              showProfile={showProfileViews}
            />
          )}
          {/* COMMENTED OUT: Impressions chart - query too slow */}
          {/* : selectedMetric === 'views' ? (
            <ViewsChart data={currentData} />
          ) : (
            <ImpressionsChart data={currentData} />
          )} */}
        </div>
      </div>
    </div>
  )
}

export default StatisticsView
