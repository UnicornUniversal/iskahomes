'use client'

import React from 'react'
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

const ViewsTimeSeries = ({ timeSeries }) => {
  if (!timeSeries || timeSeries.length === 0) {
    return (
      <div className="p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-primary_color mb-4">Views Over Time</h3>
        <div className="text-center py-12 text-gray-500">
          No views data available
        </div>
      </div>
    )
  }

  const viewsData = timeSeries.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    totalViews: item.total_views || 0,
    uniqueViews: item.unique_views || 0,
    loggedInViews: item.logged_in_views || 0,
    anonymousViews: item.anonymous_views || 0
  }))

  const chartData = {
    labels: viewsData.map(d => d.date),
    datasets: [
      {
        label: 'Total Views',
        data: viewsData.map(d => d.totalViews),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Unique Views',
        data: viewsData.map(d => d.uniqueViews),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Logged In Views',
        data: viewsData.map(d => d.loggedInViews),
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Anonymous Views',
        data: viewsData.map(d => d.anonymousViews),
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#374151'
        }
      },
      title: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: '#6b7280'
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        ticks: {
          color: '#6b7280'
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      }
    }
  }

  return (
    <div className="p-6 rounded-lg">
      <h3 className="text-lg font-semibold text-primary_color mb-4">Views Over Time</h3>
      <div style={{ height: '400px' }}>
        <Line data={chartData} options={chartOptions} />
      </div>
    </div>
  )
}

export default ViewsTimeSeries

