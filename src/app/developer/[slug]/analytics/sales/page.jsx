'use client'
import React, { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
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
import { formatCurrency } from '@/lib/utils'

const SalesAnalytics = () => {
  const params = useParams()
  const { user } = useAuth()
  const [overview, setOverview] = useState({
    totalRevenue: 0,
    totalUnitsSold: 0,
    expectedRevenue: 0,
    averageSalesTime: 0,
    leadsToSales: 0,
    currency: 'USD'
  })
  const [loading, setLoading] = useState(true)

  // Get currency from user profile if not in overview
  const currency = useMemo(() => {
    if (overview.currency && overview.currency !== 'USD') {
      return overview.currency
    }
    
    if (!user?.profile?.company_locations) return 'USD'
    
    // Parse company_locations if it's a string
    let locations = user.profile.company_locations
    if (typeof locations === 'string') {
      try {
        locations = JSON.parse(locations)
      } catch (e) {
        return 'USD'
      }
    }
    
    if (Array.isArray(locations)) {
      const primaryLocation = locations.find(loc => loc.primary_location === true)
      if (primaryLocation?.currency) {
        return primaryLocation.currency
      }
    }
    
    // Fallback to default_currency
    if (user?.profile?.default_currency) {
      let defaultCurrency = user.profile.default_currency
      if (typeof defaultCurrency === 'string') {
        try {
          defaultCurrency = JSON.parse(defaultCurrency)
        } catch (e) {
          return 'USD'
        }
      }
      if (defaultCurrency?.code) {
        return defaultCurrency.code
      }
    }
    
    return 'USD'
  }, [overview.currency, user?.profile?.company_locations, user?.profile?.default_currency])

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
    <div className="min-h-screen  p-6">
      <div className="max-w-7xl  mx-auto">
        {/* Header */}
        <div className="mb-8">
          {/* <Link 
            href={`/developer/${params.slug}/analytics`}
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Analytics
          </Link> */}
          <h1 className=" mb-2">Sales Analytics</h1>
          <p className="">Track sales performance, revenue, and conversion metrics</p>
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
              value={formatCurrency(overview.totalRevenue, currency)}
              icon={DollarSign}
            />
            
            <DataCard
              title="Total Units Sold"
              value={overview.totalUnitsSold.toLocaleString()}
              icon={TrendingUp}
            />
            
            <DataCard
              title="Expected Revenue"
              value={formatCurrency(overview.expectedRevenue, currency)}
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
          <SalesTrendChart listerId={params.slug} currency={currency} />
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
          <TopSoldProperties listerId={params.slug} currency={currency} />
        </div>

        {/* Developments by Sale */}
        <div className="mb-8">
          <DevelopmentsBySale developerId={params.slug} currency={currency} />
        </div>

      
      </div>
    </div>
  )
}

export default SalesAnalytics