'use client'

import React, { useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useParams } from 'next/navigation'
import { MapPin, Users, TrendingUp, Eye, DollarSign, BarChart3 } from 'lucide-react'
import DataCard from '@/app/components/developers/DataCard'
import StatisticsView from '@/app/components/developers/DataStats/StatisticsView'
import { formatCurrency } from '@/lib/utils'

export default function AnalyticsOverviewPage() {
  const params = useParams()
  const { user } = useAuth()
  const slug = params.slug || ''
  
  // Get account ID from user profile
  const accountId = user?.profile?.agency_id || user?.id

  // Get currency from company_locations primary_location
  const currency = useMemo(() => {
    if (!user?.profile?.company_locations) return 'GHS'
    
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

  // Get values from user profile
  const totalProperties = user?.profile?.total_listings ?? 0
  const totalAgents = user?.profile?.total_agents ?? 0
  const totalLeads = user?.profile?.total_leads ?? 0
  const totalImpressions = user?.profile?.total_impressions ?? 0
  const totalPropertiesSold = user?.profile?.total_sales ?? 0
  const totalRevenue = user?.profile?.total_revenue ?? 0
  const expectedRevenue = user?.profile?.estimated_revenue ?? 0

  return (
    <div className="w-full flex flex-col gap-6">
      <div>
        <h1 className="text-primary_color mb-4">Analytics Overview</h1>
      </div>

      {/* Data Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <DataCard 
          title="Total Properties" 
          value={totalProperties.toLocaleString()}
          icon={MapPin}
        />
        <DataCard 
          title="Total Agents" 
          value={totalAgents.toLocaleString()}
          icon={Users}
        />
        <DataCard 
          title="Total Leads" 
          value={totalLeads.toLocaleString()}
          icon={TrendingUp}
        />
        <DataCard 
          title="Total Impressions" 
          value={totalImpressions.toLocaleString()}
          icon={Eye}
        />
        <DataCard 
          title="Total Properties Sold" 
          value={totalPropertiesSold.toLocaleString()}
          icon={MapPin}
        />
        <DataCard 
          title="Total Revenue" 
          value={formatCurrency(totalRevenue, currency)}
          icon={DollarSign}
        />
        <DataCard 
          title="Expected Revenue" 
          value={formatCurrency(expectedRevenue, currency)}
          icon={DollarSign}
        />
      </div>

      {/* Statistics View */}
      <div className="w-full">
        <StatisticsView userId={accountId} accountType="agency" />
      </div>
    </div>
  )
}
