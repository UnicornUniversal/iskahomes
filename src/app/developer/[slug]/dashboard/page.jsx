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
import LatestEngagements from '@/app/components/developers/DataStats/LatestEngagements'
import LatestServiceCharge from '@/app/components/developers/DataStats/LatestServiceCharge'
import { useAuth } from '@/contexts/AuthContext'
import useExtendedAuthProfile from '@/hooks/useExtendedAuthProfile'
import useDeveloperPropertyStats from '@/hooks/useDeveloperPropertyStats'
import { Building2, Eye, BarChart3, Home, DollarSign } from 'lucide-react'
import LatestLeads from '@/app/components/developers/DataStats/LatestLeads'
import RecentMessages from '@/app/components/developers/DataStats/RecentMessages'
import RecentSales from '@/app/components/developers/DataStats/RecentSales'
import PopularListings from '@/app/components/developers/DataStats/PopularListings'
import LatestReminders from '@/app/components/developers/DataStats/LatestReminders'
import RecentActivities from '@/app/components/developers/DataStats/RecentActivities'
import { formatCurrency } from '@/lib/utils'
import Notifications from '@/app/components/general/Notifications'    
import SimpleServices from '@/app/components/general/SimpleServices'
import ReportGenerator from '@/app/components/developers/ReportGenerator'
const page = () => {
  const { user, loading: authLoading } = useAuth()
  const { extendedProfile } = useExtendedAuthProfile()
  const { stats: propertyStats } = useDeveloperPropertyStats()

  // Format number with commas
  const formatNumber = (num) => {
    if (num === null || num === undefined) return '0'
    return Number(num).toLocaleString('en-US')
  }

  // Get currency from company_locations primary_location
  const currency = useMemo(() => {
    const profileData = extendedProfile || user?.profile
    if (!profileData?.company_locations) return 'GHS'
    
    // Parse company_locations if it's a string
    let locations = profileData.company_locations
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
  }, [extendedProfile?.company_locations, user?.profile?.company_locations])

  // Use independently fetched data when available
  const profileData = extendedProfile || user?.profile

  // Get values directly from user profile (for other metrics)
  const totalUnits = profileData?.total_units ?? 0
  const totalDevelopments = profileData?.total_developments ?? 0
  const totalRevenue = profileData?.total_revenue ?? 0
  const totalViews = profileData?.total_views ?? 0
  const totalImpressions = profileData?.total_impressions ?? 0
  const propertyPurposesStats = propertyStats.purposes
  const propertyTypesStats = propertyStats.types
  const propertySubtypesStats = propertyStats.subtypes
  const propertyStatsTotalUnits = propertyStats.totalUnits || totalUnits

  if (authLoading) {
    return (
      <div className="w-full min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className=' w-full flex flex-col gap-4  h-full overflow-y-auto'>
      {/* <DeveloperHeader /> */}

        <h1 className=' text-primary_color mb-4'>Dashboard Overview</h1>
        <div className='grid grid-cols-2 items-center justify-center lg:grid-cols-5 gap-4'>
        <DataCard 
          title='Total Units' 
          value={formatNumber(totalUnits)}
          link={`/developer/${profileData?.slug || profileData?.id || user?.profile?.organization_slug || user?.profile?.slug || user?.profile?.id}/units`}
          linkText='View All' 
          icon={Home}
        />
        <DataCard 
          title='Total Views' 
          value={formatNumber(totalViews)}
          link={`/developer/${profileData?.slug || profileData?.id || user?.profile?.slug || user?.profile?.id}/analytics`}
          linkText='View Analytics' 
          icon={Eye}
        />
        <DataCard 
          title='Total Impressions' 
          value={formatNumber(totalImpressions)}
          link={`/developer/${profileData?.slug || profileData?.id || user?.profile?.slug || user?.profile?.id}/analytics`}
          linkText='View Analytics' 
          icon={BarChart3}
        />
        <DataCard 
          title='Total Revenue' 
          value={formatCurrency(totalRevenue, currency)}
          link={`/developer/${profileData?.slug || profileData?.id || user?.profile?.slug || user?.profile?.id}/analytics`}
          linkText='View Analytics' 
          icon={DollarSign}
        />
        <DataCard 
          title='Total Developments' 
          value={formatNumber(totalDevelopments)}
          link={`/developer/${profileData?.slug || profileData?.id || user?.profile?.slug || user?.profile?.id}/developments`}
          linkText='View All' 
          icon={Building2}
        />
        </div>
   
{/*    
        <ReportGenerator /> */}

<div className='w-full flex items-start   gap-4'>
{/* Generate monthyl report card */}



{/* this si the main content of the dashboard */}
      <div className='w-full flex flex-col gap-4'>
        {/* Analytics - Statistics View | Simple Services */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-4'>
          <div className='lg:col-span-2'>
            <StatisticsView />
          </div>
          <div>
            <SimpleServices />
          </div>
        </div>


     

        <div className='secondary_bg p-4 rounded-2xl shadow-sm flex-1'>
            <RecentSales />
          </div>
          <LatestLeads />  

          <div className='grid grid-cols-1 lg:grid-cols-3 gap-4'>
          <RecentActivities limit={10} />
          <LatestServiceCharge currency={currency} />
            <LatestEngagements />
      
           
          </div>

        <div className='w-full flex justify-between gap-4 flex-col md:grid lg:grid-cols-3 gap-4'>
       
          <div className='secondary_bg p-4 rounded-2xl shadow-sm flex-1'>
            <RecentMessages />
          </div>
         
          <div className='secondary_bg p-4 rounded-2xl shadow-sm flex-1'>
            <LatestAppointments />
          </div>

          <div className='secondary_bg p-4 rounded-2xl shadow-sm flex-1'>
            <LatestReminders limit={5} />
          </div>
        </div>
     


        <div className='w-full grid grid-cols-1 lg:grid-cols-3 gap-4'>
         
         <PropertiesByCategories statsData={propertyPurposesStats} totalUnits={propertyStatsTotalUnits} />
    
    
 

     
  
         <PropertiesByType statsData={propertyTypesStats} totalUnits={propertyStatsTotalUnits} />
         <PropertiesBySubType statsData={propertySubtypesStats} totalUnits={propertyStatsTotalUnits} />
   
   
     </div>


        <div className='secondary_bg   rounded-2xl shadow-sm'>
          <PopularListings limit={4} />
        </div>
     
   
       {/* <div className='w-full justify-between flex flex-col md:grid md:grid-cols-3 gap-4'>

       <div className='w-full md:col-span-2 secondary_bg p-4 rounded-2xl shadow-sm'>
    
       </div>
       
       <div className='w-full md:col-span-1 secondary_bg p-4 rounded-2xl shadow-sm'>
    
       </div>
       </div> */}

 
    
      </div>




         {/* notification and services  */}
         {/* <div className='flex flex-col lg:w-[30%] scale-90 max-w-[500px] items-center justify-center  gap-4'>
         <SimpleServices />
          <Notifications />
        </div> */}


        </div>
    </div>
  )
}

export default page