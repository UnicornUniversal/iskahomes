'use client'
import React, { useMemo } from 'react'
import DataCard from '@/app/components/developers/DataCard'
import StatisticsView from '@/app/components/developers/DataStats/StatisticsView'
import PropertiesByCategories from '@/app/components/developers/DataStats/PropertiesByCategories'
import PropertiesByType from '@/app/components/developers/DataStats/PropertiesByType'
import PropertiesBySubType from '@/app/components/developers/DataStats/PropertiesBySubType'
import LatestAppointments from '@/app/components/developers/LatestAppointments'
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
import SimpleServices from '@/app/components/general/SimpleServices'
import { getDeveloperDashboardPermissions } from '@/lib/dashboardPermissions'

const page = () => {
  const { user, loading: authLoading, hydrating } = useAuth()
  const { extendedProfile } = useExtendedAuthProfile()
  const { stats: propertyStats } = useDeveloperPropertyStats()

  const perms = useMemo(() => getDeveloperDashboardPermissions(user), [user])

  const formatNumber = (num) => {
    if (num === null || num === undefined) return '0'
    return Number(num).toLocaleString('en-US')
  }

  const currency = useMemo(() => {
    const profileData = extendedProfile || user?.profile
    if (!profileData?.company_locations) return 'GHS'

    let locations = profileData.company_locations
    if (typeof locations === 'string') {
      try {
        locations = JSON.parse(locations)
      } catch (e) {
        return 'GHS'
      }
    }

    if (Array.isArray(locations)) {
      const primaryLocation = locations.find((loc) => loc.primary_location === true)
      if (primaryLocation?.currency) {
        return primaryLocation.currency
      }
    }

    return 'GHS'
  }, [extendedProfile?.company_locations, user?.profile?.company_locations])

  const profileData = extendedProfile || user?.profile
  const slug =
    profileData?.slug ||
    profileData?.id ||
    user?.profile?.organization_slug ||
    user?.profile?.slug ||
    user?.profile?.id

  const totalUnits = profileData?.total_units ?? 0
  const totalDevelopments = profileData?.total_developments ?? 0
  const totalRevenue = profileData?.total_revenue ?? 0
  const totalViews = profileData?.total_views ?? 0
  const totalImpressions = profileData?.total_impressions ?? 0
  const propertyPurposesStats = propertyStats.purposes
  const propertyTypesStats = propertyStats.types
  const propertySubtypesStats = propertyStats.subtypes
  const propertyStatsTotalUnits = propertyStats.totalUnits || totalUnits

  const showTopCards =
    perms.units ||
    perms.analytics ||
    perms.sales ||
    perms.developments

  if (authLoading || hydrating) {
    return (
      <div className="w-full min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="w-full flex flex-col gap-4 h-full overflow-y-auto">
      <h1 className="text-primary_color mb-4">Dashboard Overview</h1>

      {showTopCards && (
        <div className="grid grid-cols-2 items-center justify-center lg:grid-cols-5 gap-4">
          {perms.units && (
            <DataCard
              title="Total Units"
              value={formatNumber(totalUnits)}
              link={`/developer/${slug}/units`}
              linkText="View All"
              icon={Home}
            />
          )}
          {perms.analytics && (
            <DataCard
              title="Total Views"
              value={formatNumber(totalViews)}
              link={`/developer/${slug}/analytics`}
              linkText="View Analytics"
              icon={Eye}
            />
          )}
          {perms.analytics && (
            <DataCard
              title="Total Impressions"
              value={formatNumber(totalImpressions)}
              link={`/developer/${slug}/analytics`}
              linkText="View Analytics"
              icon={BarChart3}
            />
          )}
          {perms.sales && (
            <DataCard
              title="Total Revenue"
              value={formatCurrency(totalRevenue, currency)}
              link={`/developer/${slug}/sales`}
              linkText="View Sales"
              icon={DollarSign}
            />
          )}
          {perms.developments && (
            <DataCard
              title="Total Developments"
              value={formatNumber(totalDevelopments)}
              link={`/developer/${slug}/developments`}
              linkText="View All"
              icon={Building2}
            />
          )}
        </div>
      )}

      <div className="w-full flex flex-col gap-4">
        <div className={`grid grid-cols-1 gap-4 ${perms.analytics ? 'lg:grid-cols-3' : ''}`}>
          {perms.analytics && (
            <div className="lg:col-span-2">
              <StatisticsView />
            </div>
          )}
          <SimpleServices />
        </div>

        {perms.sales && (
          <div className="secondary_bg p-4 rounded-2xl shadow-sm">
            <RecentSales />
          </div>
        )}

        {perms.leads && <LatestLeads />}

        {(perms.auditTrail || perms.clients) && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {perms.auditTrail && <RecentActivities limit={10} />}
            {perms.clients && <LatestServiceCharge currency={currency} />}
            {perms.clients && <LatestEngagements />}
          </div>
        )}

        {(perms.messages || perms.appointments || perms.leads) && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {perms.messages && (
              <div className="secondary_bg p-4 rounded-2xl shadow-sm">
                <RecentMessages />
              </div>
            )}
            {perms.appointments && (
              <div className="secondary_bg p-4 rounded-2xl shadow-sm">
                <LatestAppointments />
              </div>
            )}
            {perms.leads && (
              <div className="secondary_bg p-4 rounded-2xl shadow-sm">
                <LatestReminders limit={5} />
              </div>
            )}
          </div>
        )}

        {perms.units && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <PropertiesByCategories
              statsData={propertyPurposesStats}
              totalUnits={propertyStatsTotalUnits}
            />
            <PropertiesByType statsData={propertyTypesStats} totalUnits={propertyStatsTotalUnits} />
            <PropertiesBySubType
              statsData={propertySubtypesStats}
              totalUnits={propertyStatsTotalUnits}
            />
          </div>
        )}

        {perms.units && (
          <div className="secondary_bg rounded-2xl shadow-sm">
            <PopularListings limit={4} />
          </div>
        )}
      </div>
    </div>
  )
}

export default page
