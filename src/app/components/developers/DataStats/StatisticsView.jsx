'use client'
import React, { useState, useEffect } from 'react'
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
  const [selectedPeriod, setSelectedPeriod] = useState('today')
  const [viewsData, setViewsData] = useState([])
  // const [impressionsData, setImpressionsData] = useState([]) // COMMENTED OUT: Impressions too slow
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState({ total: 0, average: 0 })

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
        
        // Fetch data for the selected metric
        // NOTE: Impressions disabled - query is too slow (fetches 5 event types from PostHog)
        // Only fetching views for now (property_view events)
        // TODO: Optimize impressions query or use cached data from user_analytics table
        if (selectedMetric === 'impressions') {
          console.warn('Impressions metric is currently disabled due to performance issues')
          if (isMounted) {
            setViewsData([])
            setSummary({ total: 0, average: 0 })
            setLoading(false)
          }
          return
        }

        const response = await fetch(
          `/api/analytics/statistics?user_id=${user.id}&user_type=${userType}&period=${selectedPeriod}&metric=${selectedMetric}`
        )

        if (response.ok) {
          const result = await response.json()
          
          if (isMounted) {
            setViewsData(result.data?.timeSeries || [])
            setSummary(result.data?.summary || { total: 0, average: 0 })
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
  }, [user?.id, user?.profile?.account_type, selectedPeriod, selectedMetric])

  // const currentData = selectedMetric === 'views' ? viewsData : impressionsData // COMMENTED OUT: Only views now
  const currentData = viewsData
  const total = summary.total || 0
  const average = summary.average || 0

  return (
    <div className="secondary_bg text-primary_color overflow-hidden">
      {/* Header with Toggle */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h5 className="text-lg font-semibold">Statistics</h5>
          
          <div className="flex gap-3 items-center">
            {/* Period Selector */}
            <div className="flex gap-2 rounded-full p-1 border border-gray-200 bg-white/40">
              <button
                onClick={() => setSelectedPeriod('today')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  selectedPeriod === 'today'
                    ? 'bg-white shadow-sm'
                    : 'hover:bg-gray-100'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setSelectedPeriod('week')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  selectedPeriod === 'week'
                    ? 'bg-white shadow-sm'
                    : 'hover:bg-gray-100'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setSelectedPeriod('month')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  selectedPeriod === 'month'
                    ? 'bg-white shadow-sm'
                    : 'hover:bg-gray-100'
                }`}
              >
                Month
              </button>
              <button
                onClick={() => setSelectedPeriod('year')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  selectedPeriod === 'year'
                    ? 'bg-white shadow-sm'
                    : 'hover:bg-gray-100'
                }`}
              >
                Year
              </button>
            </div>

            {/* Metric Toggle Buttons */}
            {/* COMMENTED OUT: Impressions button - query is too slow */}
            {/* TODO: Re-enable when impressions query is optimized or using cached data */}
            {/*
            <div className="flex gap-2 bg-white rounded-lg p-1 border border-gray-200">
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
      <div className="px-6 py-4 grid grid-cols-4 gap-4 border-b border-gray-100">
        {/* Total Views */}
        <div className="flex flex-col">
          <span className="text-xs font-medium uppercase tracking-wide mb-1">
            Total Views
            {/* Total {selectedMetric === 'views' ? 'Views' : 'Impressions'} */}
          </span>
          <h3 className="md:text-[3em]  ">
            {loading ? '...' : total.toLocaleString()}
          </h3>
        </div>

     {/* Lisitngs Views */}
     <div className="flex flex-col">
          <span className="text-xs font-medium uppercase tracking-wide mb-1">
            Listing Views {selectedPeriod === 'today' ? 'Hourly' : selectedPeriod === 'year' ? 'Monthly' : 'Daily'}
          </span>
          <h3 className="md:text-[3em]  ">
            {loading ? '...' : average.toLocaleString()}
          </h3>
        </div>

     {/* Average Views */}
     <div className="flex flex-col">
          <span className="text-xs font-medium uppercase tracking-wide mb-1">
            Profile Views {selectedPeriod === 'today' ? 'Hourly' : selectedPeriod === 'year' ? 'Monthly' : 'Daily'}
          </span>
          <h3 className="md:text-[3em]  ">
            {loading ? '...' : average.toLocaleString()}
          </h3>
        </div>

        {/* Average Views */}
        <div className="flex flex-col">
          <span className="text-xs font-medium uppercase tracking-wide mb-1">
            Average {selectedPeriod === 'today' ? 'Hourly' : selectedPeriod === 'year' ? 'Monthly' : 'Daily'}
          </span>
          <h3 className="md:text-[3em]  ">
            {loading ? '...' : average.toLocaleString()}
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
