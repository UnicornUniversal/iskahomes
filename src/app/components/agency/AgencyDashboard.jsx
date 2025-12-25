'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { 
  FiUsers, 
  FiMapPin, 
  FiDollarSign,
  FiTrendingUp
} from 'react-icons/fi'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import ViewsTimeSeries from '@/app/components/analytics/ViewsTimeSeries'
import ImpressionsTimeSeries from '@/app/components/analytics/ImpressionsTimeSeries'
import DataCard from '@/app/components/developers/DataCard'
import PopularListings from '@/app/components/developers/DataStats/PopularListings'
import StatisticsView from '@/app/components/developers/DataStats/StatisticsView'
import SimpleServices from '@/app/components/general/SimpleServices'
import TopAgents from '@/app/components/agency/TopAgents'
import RecentMessages from '@/app/components/developers/DataStats/RecentMessages'
import LatestLeads from '@/app/components/developers/DataStats/LatestLeads'
import { formatCurrency } from '@/lib/utils'
import { usePathname } from 'next/navigation'

const AgencyDashboard = () => {
  const { user } = useAuth()
  const pathname = usePathname()
  const slug = pathname?.split('/')[2] || ''
  
  const [viewsTimeSeries, setViewsTimeSeries] = useState([])
  const [impressionsTimeSeries, setImpressionsTimeSeries] = useState([])
  const [loading, setLoading] = useState(true)

  // Format number with commas
  const formatNumber = (num) => {
    if (num === null || num === undefined) return '0'
    return Number(num).toLocaleString('en-US')
  }

  // Get currency from company_locations primary_location
  const currency = useMemo(() => {
    if (!user?.profile?.company_locations) return 'GHS'
    
    // Parse company_locations if it's a string
    let locations = user.profile.company_locations
    if (typeof locations === 'string') {
      try {
        locations = JSON.parse(locations)
      } catch (e) {
        return 'GHS'
      }
    }
    
    if (Array.isArray(locations)) {
      const primaryLocation = locations.find(loc => loc.primary_location === true)
      if (primaryLocation?.currency) {
        return primaryLocation.currency
      }
    }
    
    return 'GHS'
  }, [user?.profile?.company_locations])

  // Get values directly from user profile
  const totalAgents = user?.profile?.total_agents ?? 0
  const totalListings = user?.profile?.total_listings ?? 0
  const totalLeads = user?.profile?.total_leads ?? 0
  const totalRevenue = user?.profile?.total_revenue ?? 0

  // Fetch analytics data
  useEffect(() => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    let isMounted = true

    const fetchAnalytics = async () => {
      try {
        setLoading(true)
        
        // Fetch views data
        const viewsParams = new URLSearchParams({
          user_id: user.id,
          user_type: 'agency',
          period: 'week',
          metric: 'views'
        })
        
        const viewsResponse = await fetch(`/api/analytics/statistics-db?${viewsParams.toString()}`)
        if (viewsResponse.ok) {
          const viewsResult = await viewsResponse.json()
          if (isMounted && viewsResult.data?.timeSeries) {
            // Transform data to match ViewsTimeSeries format
            const transformed = viewsResult.data.timeSeries.map(item => ({
              date: item.date,
              total_views: item.value,
              unique_views: item.value, // Use same value for now
              logged_in_views: Math.floor(item.value * 0.6), // Estimate
              anonymous_views: Math.floor(item.value * 0.4) // Estimate
            }))
            setViewsTimeSeries(transformed)
          }
        }

        // Fetch impressions data
        const impressionsParams = new URLSearchParams({
          user_id: user.id,
          user_type: 'agency',
          period: 'week',
          metric: 'impressions'
        })
        
        const impressionsResponse = await fetch(`/api/analytics/statistics-db?${impressionsParams.toString()}`)
        if (impressionsResponse.ok) {
          const impressionsResult = await impressionsResponse.json()
          if (isMounted && impressionsResult.data?.timeSeries) {
            // Transform data to match ImpressionsTimeSeries format
            const transformed = impressionsResult.data.timeSeries.map(item => ({
              date: item.date,
              total_impressions: item.value,
              impression_social_media: Math.floor(item.value * 0.3), // Estimate
              impression_website_visit: Math.floor(item.value * 0.4), // Estimate
              impression_share: Math.floor(item.value * 0.15), // Estimate
              impression_saved_listing: Math.floor(item.value * 0.15) // Estimate
            }))
            setImpressionsTimeSeries(transformed)
          }
        }
      } catch (error) {
        console.error('Error fetching analytics:', error)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchAnalytics()

    return () => {
      isMounted = false
    }
  }, [user?.id])

  const stats = [
    {
      title: 'Total Agents',
      value: formatNumber(totalAgents),
      icon: FiUsers,
      link: `/agency/${slug}/agents`
    },
    {
      title: 'Total Properties',
      value: formatNumber(totalListings),
      icon: FiMapPin,
      link: `/agency/${slug}/properties`
    },
    {
      title: 'Total Leads',
      value: formatNumber(totalLeads),
      icon: FiTrendingUp,
      link: `/agency/${slug}/analytics/leads`
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(totalRevenue, currency),
      icon: FiDollarSign,
      link: `/agency/${slug}/sales`
    }
  ]

  return (
    <div className='w-full flex flex-col gap-6'>
      {/* Stats Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        {stats.map((stat, index) => (
          <DataCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            link={stat.link}
            linkText='View Details'
          />
        ))}
      </div>

      {/* Views and Impressions Time Series */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <div className='bg-white rounded-xl shadow-sm border border-gray-100 p-6'>
          {loading ? (
            <div className='flex items-center justify-center py-12'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary_color'></div>
            </div>
          ) : (
            <ViewsTimeSeries timeSeries={viewsTimeSeries} />
          )}
        </div>
        <div className='bg-white rounded-xl shadow-sm border border-gray-100 p-6'>
          {loading ? (
            <div className='flex items-center justify-center py-12'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary_color'></div>
            </div>
          ) : (
            <ImpressionsTimeSeries timeSeries={impressionsTimeSeries} />
          )}
        </div>
      </div>

      {/* Statistics View | Simple Services */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-4'>
        <div className='lg:col-span-2'>
          <StatisticsView userId={user?.id} accountType="agency" />
        </div>
        <div>
          <SimpleServices />
        </div>
      </div>

      {/* Popular Listings | Top Agents */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
        <div className='bg-white rounded-xl shadow-sm border border-gray-100'>
          <PopularListings limit={4} userId={user?.id} accountType="agency" />
        </div>
        <div>
          <TopAgents limit={4} agencyId={user?.id} />
        </div>
      </div>

      {/* Recent Messages | Latest Leads */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
        <div className='secondary_bg p-4 rounded-2xl shadow-sm'>
          <RecentMessages userId={user?.id} accountType="agency" />
        </div>
        <div className='secondary_bg p-4 rounded-2xl shadow-sm'>
          <LatestLeads listerId={user?.id} listerType="agency" />
        </div>
      </div>
    </div>
  )
}

export default AgencyDashboard

