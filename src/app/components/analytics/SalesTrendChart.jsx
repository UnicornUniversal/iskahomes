'use client'
import React, { useState, useEffect } from 'react'
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

const SalesTrendChart = ({ listerId, currency: propCurrency = 'USD' }) => {
  const [timeRange, setTimeRange] = useState('month')
  const [chartData, setChartData] = useState({
    labels: [],
    sales: [],
    revenue: []
  })
  const [loading, setLoading] = useState(true)
  const [currency, setCurrency] = useState(propCurrency)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/sales/time-series?slug=${listerId}&range=${timeRange}`)
        const result = await response.json()
        
        if (result.success && result.data) {
          setChartData(result.data)
        } else {
          setChartData({ labels: [], sales: [], revenue: [] })
        }
      } catch (error) {
        console.error('Error fetching sales time series:', error)
        setChartData({ labels: [], sales: [], revenue: [] })
      } finally {
        setLoading(false)
      }
    }

    if (listerId) {
      fetchData()
    }
  }, [listerId, timeRange])
  
  // Update currency when prop changes
  useEffect(() => {
    if (propCurrency) {
      setCurrency(propCurrency)
    }
  }, [propCurrency])

  const chartDataConfig = {
    labels: chartData.labels.length > 0 ? chartData.labels : ['No data'],
    datasets: [
      {
        label: 'Sales Count',
        data: chartData.sales.length > 0 ? chartData.sales : [0],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        yAxisID: 'y',
      },
      {
        label: `Revenue (${currency})`,
        data: chartData.revenue.length > 0 ? chartData.revenue : [0],
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.4,
        yAxisID: 'y1',
      }
    ]
  }

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
        type: 'linear',
        display: true,
        position: 'left',
        beginAtZero: true,
        grid: {
          color: 'rgba(0,0,0,0.1)'
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        beginAtZero: true,
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center flex-wrap justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Sales Trend</h3>
          <div className="flex space-x-2">
            {['week', 'month', 'year'].map((range) => (
              <div
                key={range}
                className="px-3 py-1.5 rounded-lg bg-gray-100 animate-pulse"
                style={{ width: '100px', height: '32px' }}
              />
            ))}
          </div>
        </div>
        <div className="h-80 flex items-center justify-center">
          <div className="text-gray-500">Loading chart data...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="default_bg rounded-lg shadow p-6">
      <div className="flex items-center flex-wrap justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Sales Trend</h3>
        <div className="flex space-x-2">
          {['week', 'month', 'year'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={` primary_button ${
                timeRange === range
                  ? 'bg-primary_color text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {range === 'week' ? 'This Week' : range === 'month' ? 'This Month' : 'This Year'}
            </button>
          ))}
        </div>
      </div>
      <div className="h-80">
        <Line data={chartDataConfig} options={chartOptions} />
      </div>
    </div>
  )
}

export default SalesTrendChart

