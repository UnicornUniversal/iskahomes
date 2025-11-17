'use client'
import React, { useMemo } from 'react'
import DeveloperHeader from '@/app/components/developers/DeveloperHeader'
import DataCard from '@/app/components/developers/DataCard'
import StatisticsView from '@/app/components/developers/DataStats/StatisticsView'
import PropertiesByCategories from '@/app/components/developers/DataStats/PropertiesByCategories'
import BestProperties from '@/app/components/developers/DataStats/BestProperties'
import PropertiesByType from '@/app/components/developers/DataStats/PropertiesByType'
import PropertiesByStatus from '@/app/components/developers/DataStats/PropertiesByStatus'
import LatestAppointments from '@/app/components/developers/LatestAppointments'
import PropertiesBySubType from '@/app/components/developers/DataStats/PropertiesBySubType'
import { useAuth } from '@/contexts/AuthContext'
import { Building2, Eye, BarChart3, Home, DollarSign } from 'lucide-react'
import LatestLeads from '@/app/components/developers/DataStats/LatestLeads'
import RecentMessages from '@/app/components/developers/DataStats/RecentMessages'
import RecentSales from '@/app/components/developers/DataStats/RecentSales'
import PopularListings from '@/app/components/developers/DataStats/PopularListings'


const page = () => {
  const { user } = useAuth()

  // Format number with commas
  const formatNumber = (num) => {
    if (num === null || num === undefined) return '0'
    return Number(num).toLocaleString('en-US')
  }

  // Format currency value
  const formatCurrency = (amount, currencyCode = 'GHS') => {
    if (amount === null || amount === undefined || amount === 0) return '0'
    const formatted = formatNumber(amount)
    return `${currencyCode} ${formatted}`
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
  const totalUnits = user?.profile?.total_units ?? 0
  const totalDevelopments = user?.profile?.total_developments ?? 0
  const totalRevenue = user?.profile?.total_revenue ?? 0
  const totalViews = user?.profile?.total_views ?? 0
  const totalImpressions = user?.profile?.total_impressions ?? 0

  return (
    <div className='w-full flex flex-col gap-4 px-[1rem] h-full overflow-y-auto'>
      <DeveloperHeader />

      <div className='grid grid-cols-2 items-center justify-center lg:grid-cols-5 gap-4'>
        <DataCard 
          title='Total Units' 
          value={formatNumber(totalUnits)}
          link={`/developer/${user?.profile?.slug || user?.profile?.id}/units`}
          linkText='View All' 
          icon={Home}
        />
        <DataCard 
          title='Total Views' 
          value={formatNumber(totalViews)}
          link={`/developer/${user?.profile?.slug || user?.profile?.id}/analytics`}
          linkText='View Analytics' 
          icon={Eye}
        />
        <DataCard 
          title='Total Impressions' 
          value={formatNumber(totalImpressions)}
          link={`/developer/${user?.profile?.slug || user?.profile?.id}/analytics`}
          linkText='View Analytics' 
          icon={BarChart3}
        />
        <DataCard 
          title='Total Revenue' 
          value={formatCurrency(totalRevenue, currency)}
          link={`/developer/${user?.profile?.slug || user?.profile?.id}/analytics`}
          linkText='View Analytics' 
          icon={DollarSign}
        />
        <DataCard 
          title='Total Developments' 
          value={formatNumber(totalDevelopments)}
          link={`/developer/${user?.profile?.slug || user?.profile?.id}/developments`}
          linkText='View All' 
          icon={Building2}
        />
      </div>

      <div className='w-full flex flex-col gap-4'>
        <StatisticsView />

        <div className='w-full flex justify-between gap-4'>
          <PropertiesByCategories />
          <PropertiesBySubType />
          {/* <PropertiesByStatus /> */}
          <PropertiesByType />
        </div>

        <div className='w-full flex justify-between gap-4'>
       
       
          <RecentMessages />  <RecentSales />   <LatestAppointments />
        </div>
        <PopularListings limit={4} />
       {/* <div className='w-full justify-between flex gap-4'> */}
       <LatestLeads />   
       {/* </div> */}

 
    
      </div>
    </div>
  )
}

export default page