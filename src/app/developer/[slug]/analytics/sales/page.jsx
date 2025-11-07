'use client'
import React, { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  Target,
  BarChart3,
  Calendar
} from 'lucide-react'
import DataCard from '@/app/components/developers/DataCard'
import SalesByPurpose from '@/app/components/analytics/SalesByPurpose'
import SalesByType from '@/app/components/analytics/SalesByType'
import SalesByCategories from '@/app/components/analytics/SalesByCategories'
import SalesBySubtype from '@/app/components/analytics/SalesBySubtype'
import TopSoldProperties from '@/app/components/analytics/TopSoldProperties'
import DevelopmentsBySale from '@/app/components/analytics/DevelopmentsBySale'
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

const SalesAnalytics = () => {
  const params = useParams()
  const [timeRange, setTimeRange] = useState('month')

  // Dummy sales data
  const salesData = {
    overview: {
      totalRevenue: 2847500,
      totalUnitsSold: 47,
      expectedRevenue: 3500000,
      averageSalesTime: 45, // days
      conversionRate: 12.5
    },
    chart: {
      week: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        sales: [2, 3, 1, 4, 2, 3, 1],
        revenue: [120000, 180000, 60000, 240000, 120000, 180000, 60000]
      },
      month: {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        sales: [8, 12, 15, 12],
        revenue: [480000, 720000, 900000, 720000]
      },
      year: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        sales: [3, 4, 5, 6, 4, 3, 5, 4, 6, 5, 4, 2],
        revenue: [180000, 240000, 300000, 360000, 240000, 180000, 300000, 240000, 360000, 300000, 240000, 120000]
      }
    }
  }

  const currentChartData = salesData.chart[timeRange] || salesData.chart.month

  const chartData = {
    labels: currentChartData.labels,
    datasets: [
      {
        label: 'Sales Count',
        data: currentChartData.sales,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        yAxisID: 'y',
      },
      {
        label: 'Revenue ($)',
        data: currentChartData.revenue,
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href={`/developer/${params.slug}/analytics`}
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Analytics
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Sales Analytics</h1>
          <p className="text-gray-600">Track sales performance, revenue, and conversion metrics</p>
        </div>

        {/* Time Range Selector */}
        {/* <div className="mb-6">
          <div className="flex space-x-2">
            {['week', 'month', 'year'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${
                  timeRange === range
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {range === 'week' ? 'This Week' : range === 'month' ? 'This Month' : 'This Year'}
              </button>
            ))}
          </div>
        </div> */}

        {/* Overview Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <DataCard
            title="Total Revenue"
            value={`$${salesData.overview.totalRevenue.toLocaleString()}`}
            icon={DollarSign}
          />
          
          <DataCard
            title="Total Units Sold"
            value={salesData.overview.totalUnitsSold.toLocaleString()}
            icon={TrendingUp}
          />
          
          <DataCard
            title="Expected Revenue"
            value={`$${salesData.overview.expectedRevenue.toLocaleString()}`}
            icon={Target}
          />
          
          <DataCard
            title="Average Sales Time"
            value={`${salesData.overview.averageSalesTime} days`}
            icon={Clock}
          />
          
          <DataCard
            title="Conversion Rate"
            value={`${salesData.overview.conversionRate}%`}
            icon={BarChart3}
          />
        </div>

        {/* Sales Trend Chart */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center flex-wrap justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Sales Trend</h3>
            <div className="flex space-x-2 ">
              {['week', 'month', 'year'].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1.5 rounded-lg  !text-sm font-medium capitalize ${
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
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* Sales Breakdown Components */}
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8'>
          <SalesByPurpose listerId={params.slug} />
          <SalesByType listerId={params.slug} />
          <SalesByCategories listerId={params.slug} />
          <SalesBySubtype listerId={params.slug} />
        </div>

        {/* Top Sold Properties */}
        <div className="mb-8">
          <TopSoldProperties listerId={params.slug} />
        </div>

        {/* Developments by Sale */}
        <div className="mb-8">
          <DevelopmentsBySale developerId={params.slug} />
        </div>
      </div>
    </div>
  )
}

export default SalesAnalytics