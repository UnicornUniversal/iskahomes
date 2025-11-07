'use client'
import React, { useState } from 'react'
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
import { viewsData, impressionsData } from '../../Data/Data'

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
    labels: data.map(item => {
      const date = new Date(item.date)
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }),
    datasets: [
      {
        label: 'Views',
        data: data.map(item => item.viewCount),
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
const ImpressionsChart = ({ data }) => {
  const chartData = {
    labels: data.map(item => {
      const date = new Date(item.date)
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }),
    datasets: [
      {
        label: 'Impressions',
        data: data.map(item => item.impressionCount),
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

const StatisticsView = () => {
  const [selectedMetric, setSelectedMetric] = useState('views')

  const totalViews = viewsData.reduce((sum, item) => sum + item.viewCount, 0)
  const totalImpressions = impressionsData.reduce((sum, item) => sum + item.impressionCount, 0)
  const avgViews = Math.round(totalViews / viewsData.length)
  const avgImpressions = Math.round(totalImpressions / impressionsData.length)

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      {/* Header with Toggle */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <h5 className="text-lg font-semibold text-gray-900">Statistics</h5>
          
          {/* Toggle Buttons */}
          <div className="flex gap-2 bg-white rounded-lg p-1 border border-gray-200">
            <button
              onClick={() => setSelectedMetric('views')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
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
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                selectedMetric === 'impressions'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              suppressHydrationWarning
            >
              Impressions
            </button>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="px-6 py-4 grid grid-cols-2 gap-4 border-b border-gray-100">
        <div className="flex flex-col">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            Total {selectedMetric === 'views' ? 'Views' : 'Impressions'}
          </span>
          <span className="text-2xl font-bold text-gray-900">
            {selectedMetric === 'views' 
              ? totalViews.toLocaleString()
              : totalImpressions.toLocaleString()
            }
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            Average Daily
          </span>
          <span className="text-2xl font-bold text-gray-900">
            {selectedMetric === 'views'
              ? avgViews.toLocaleString()
              : avgImpressions.toLocaleString()
            }
          </span>
        </div>
      </div>

      {/* Chart Container */}
      <div className="px-6 py-4">
        <div className="h-[300px]">
          {selectedMetric === 'views' ? (
            <ViewsChart data={viewsData} />
          ) : (
            <ImpressionsChart data={impressionsData} />
          )}
        </div>
      </div>
    </div>
  )
}

export default StatisticsView
