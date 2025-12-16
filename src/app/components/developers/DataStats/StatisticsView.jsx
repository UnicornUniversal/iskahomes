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

// Views Chart Component
const ViewsChart = ({ data }) => {
  const chartData = {
    labels: data.map(item => item.label),
    datasets: [
      {
        label: 'Views',
        data: data.map(item => item.value),
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 3,
        pointHoverRadius: 5,
        pointBackgroundColor: '#3B82F6',
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

const StatisticsView = () => {
  const { user } = useAuth()
  const [selectedMetric, setSelectedMetric] = useState('views')
  const [exporting, setExporting] = useState(false)
  const [viewsData, setViewsData] = useState([])
  // const [impressionsData, setImpressionsData] = useState([]) // COMMENTED OUT: Impressions too slow
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState({ 
    totalViews: 0, 
    totalListingViews: 0, 
    totalProfileViews: 0 
  })

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
    if (!user?.id) {
      setLoading(false)
      return
    }

    let isMounted = true

    const fetchStatistics = async () => {
      try {
        setLoading(true)
        const userType = user?.profile?.account_type || 'developer'
        
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
          user_id: user.id,
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
            setViewsData(result.data?.timeSeries || [])
            setSummary(result.data?.summary || { 
              totalViews: 0, 
              totalListingViews: 0, 
              totalProfileViews: 0 
            })
            // if (selectedMetric === 'views') {
            //   setViewsData(result.data?.timeSeries || [])
            //   setSummary(result.data?.summary || { total: 0, average: 0 })
            // } else {
            //   setImpressionsData(result.data?.timeSeries || [])
            //   setSummary(result.data?.summary || { total: 0, average: 0 })
            // }
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
  }, [user?.id, user?.profile?.account_type, selectedPeriod, selectedMetric, dateRange.startDate, dateRange.endDate])

  // const currentData = selectedMetric === 'views' ? viewsData : impressionsData // COMMENTED OUT: Only views now
  const currentData = viewsData
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
                    ['Date', 'Views'],
                    ...currentData.map(item => [
                      item.label || '',
                      item.value || 0
                    ])
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
              disabled={exporting || !dateRange.startDate || !dateRange.endDate || currentData.length === 0}
            />

            {/* Metric Toggle Buttons */}
            {/* COMMENTED OUT: Impressions button - query is too slow */}
            {/* TODO: Re-enable when impressions query is optimized or using cached data */}
            {/*
            <div className="flex gap-2 rounded-lg p-1 border border-gray-200">
              <button
                onClick={() => setSelectedMetric('views')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  selectedMetric === 'views'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                suppressHydrationWarning
              >
                Views
              </button>
              <button
                onClick={() => setSelectedMetric('impressions')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  selectedMetric === 'impressions'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                suppressHydrationWarning
              >
                Impressions
              </button>
            </div>
            */}
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

      {/* Chart Container */}
      <div className="px-6 py-4">
        <div className="h-[300px]">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span>Loading statistics...</span>
            </div>
          ) : currentData.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <span>No data available for this period</span>
            </div>
          ) : (
            <ViewsChart data={currentData} />
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
