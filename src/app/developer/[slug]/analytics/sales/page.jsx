'use client'
import React, { useState, useEffect } from 'react'
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
import SalesTrendChart from '@/app/components/analytics/SalesTrendChart'
import SalesByLocation from '@/app/components/analytics/SalesByLocation'

const SalesAnalytics = () => {
  const params = useParams()
  const [overview, setOverview] = useState({
    totalRevenue: 0,
    totalUnitsSold: 0,
    expectedRevenue: 0,
    averageSalesTime: 0,
    leadsToSales: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const response = await fetch(`/api/sales/overview?slug=${params.slug}`)
        const result = await response.json()
        
        if (result.success && result.data?.overview) {
          setOverview(result.data.overview)
        }
      } catch (error) {
        console.error('Error fetching overview:', error)
      } finally {
        setLoading(false)
      }
    }

    if (params.slug) {
      fetchOverview()
    }
  }, [params.slug])

  return (
    <div className="min-h-screen default_bg p-6">
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
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-32"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <DataCard
              title="Total Revenue"
              value={`$${overview.totalRevenue.toLocaleString()}`}
              icon={DollarSign}
            />
            
            <DataCard
              title="Total Units Sold"
              value={overview.totalUnitsSold.toLocaleString()}
              icon={TrendingUp}
            />
            
            <DataCard
              title="Expected Revenue"
              value={`$${overview.expectedRevenue.toLocaleString()}`}
              icon={Target}
            />
            
            <DataCard
              title="Average Sales Time"
              value={`${overview.averageSalesTime} days`}
              icon={Clock}
            />
            
            <DataCard
              title="Leads to Sales"
              value={`${overview.leadsToSales.toFixed(1)}%`}
              icon={BarChart3}
            />
          </div>
        )}

        {/* Sales Trend Chart */}
        <div className="mb-8">
          <SalesTrendChart listerId={params.slug} />
        </div>
  {/* Sales by Location */}
  <div className="mb-8">
          <SalesByLocation listerId={params.slug} />
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