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
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        tension: 0.1,
        fill: false,
      },
    ],
  }

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Property Views Over Time',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Views',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Date',
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
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        tension: 0.1,
        fill: false,
      },
    ],
  }

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Property Impressions Over Time',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Impressions',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Date',
        },
      },
    },
  }

  return <Line data={chartData} options={options} />
}

const StatisticsView = () => {
  const [selectedMetric, setSelectedMetric] = useState('views')

  return (
    <>
      <h5 className=" mb-6 ">Statistics</h5>
    
    
   
    <div className="p-6 bg-white rounded-lg shadow-md">
    
      
      {/* Toggle Buttons */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setSelectedMetric('views')}
          className={`px-6 py-2 rounded-lg text-[0.8em] font-medium transition-colors ${
            selectedMetric === 'views'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Views
        </button>
        <button
          onClick={() => setSelectedMetric('impressions')}
          className={`px-6 py-2 rounded-lg text-[0.8em] font-medium transition-colors ${
            selectedMetric === 'impressions'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Impressions
        </button>
      </div>

   {/* Summary Stats */}
   <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-blue-600 uppercase tracking-wide">
            Total {selectedMetric === 'views' ? 'Views' : 'Impressions'}
          </h4>
          <p className="text-2xl font-bold text-blue-900">
            {selectedMetric === 'views' 
              ? viewsData.reduce((sum, item) => sum + item.viewCount, 0).toLocaleString()
              : impressionsData.reduce((sum, item) => sum + item.impressionCount, 0).toLocaleString()
            }
          </p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-green-600 uppercase tracking-wide">
            Average Daily {selectedMetric === 'views' ? 'Views' : 'Impressions'}
          </h4>
          <p className="text-2xl font-bold text-green-900">
            {selectedMetric === 'views'
              ? Math.round(viewsData.reduce((sum, item) => sum + item.viewCount, 0) / viewsData.length).toLocaleString()
              : Math.round(impressionsData.reduce((sum, item) => sum + item.impressionCount, 0) / impressionsData.length).toLocaleString()
            }
          </p>
        </div>
      </div>
      <br/>
      {/* Chart Container */}
      <div className="bg-gray-50 p-4 rounded-lg">
        {selectedMetric === 'views' ? (
          <ViewsChart data={viewsData} />
        ) : (
          <ImpressionsChart data={impressionsData} />
        )}
      </div>

   
    </div>
    </>
  )
}

export default StatisticsView
