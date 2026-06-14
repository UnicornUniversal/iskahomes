'use client'

import React, { useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import useAgentProfile from '@/hooks/useAgentProfile'
import { MapPin, DollarSign, TrendingUp, Users, Eye } from 'lucide-react'
import DataCard from '@/app/components/developers/DataCard'
import LatestLeads from '@/app/components/developers/DataStats/LatestLeads'
import RecentMessages from '@/app/components/developers/DataStats/RecentMessages'
import PopularListings from '@/app/components/developers/DataStats/PopularListings'
import LatestAppointments from '@/app/components/developers/LatestAppointments'
import LatestReminders from '@/app/components/developers/DataStats/LatestReminders'
import StatisticsView from '@/app/components/developers/DataStats/StatisticsView'
import RecentTransactions from './RecentTransactions'
import { formatCurrency } from '@/lib/utils'

const formatNumber = (num) => {
  if (num === null || num === undefined) return '0'
  return Number(num).toLocaleString('en-US')
}

const AgentDashboard = () => {
  const { user } = useAuth()
  const { agent, loading } = useAgentProfile()

  const currency = useMemo(() => {
    return agent?.location_data?.currency || 'GHS'
  }, [agent?.location_data?.currency])

  // Get values from agent profile
  const totalProperties = agent?.total_listings ?? 0
  const totalLeads = agent?.total_leads ?? 0
  const totalSales = agent?.properties_sold ?? 0
  const totalRevenue = agent?.total_revenue ?? 0
  const totalProfileViews = agent?.total_profile_views ?? 0

  const listerId = agent?.agent_id || user?.id

  if (loading) {
    return (
      <div className="w-full flex flex-col gap-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="design1 relative border-[#E0B29A] p-6 shadow-sm w-full animate-pulse">
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Data Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <DataCard 
          title="Total Properties" 
          value={formatNumber(totalProperties)}
          icon={MapPin}
        />
        <DataCard 
          title="Total Leads" 
          value={formatNumber(totalLeads)}
          icon={TrendingUp}
        />
        <DataCard 
          title="Properties Sold" 
          value={formatNumber(totalSales)}
          icon={DollarSign}
        />
        <DataCard 
          title="Total Revenue" 
          value={formatCurrency(totalRevenue, currency)}
          icon={DollarSign}
        />
        <DataCard 
          title="Profile Views" 
          value={formatNumber(totalProfileViews)}
          icon={Eye}
        />
      </div>

      {/* Analytics - Statistics View */}
      <div className="w-full">
        <StatisticsView userId={listerId} accountType="agent" />
      </div>

      {/* Recent Messages | Latest Leads | Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="secondary_bg p-4 rounded-2xl shadow-sm">
          <RecentMessages userId={listerId} accountType="agent" />
        </div>
        <div className="secondary_bg p-4 rounded-2xl shadow-sm">
          <LatestLeads listerId={listerId} listerType="agent" />
        </div>
        <div className="secondary_bg p-4 rounded-2xl shadow-sm">
          <RecentTransactions agentId={agent?.id} limit={5} />
        </div>
      </div>

      {/* Latest Appointments | Latest Reminders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="secondary_bg p-4 rounded-2xl shadow-sm">
          <LatestAppointments />
        </div>
        <div className="secondary_bg p-4 rounded-2xl shadow-sm">
          <LatestReminders />
        </div>
      </div>

      {/* Popular Listings */}
      <div className="w-full">
        <PopularListings limit={4} userId={listerId} accountType="agent" />
      </div>
    </div>
  )
}

export default AgentDashboard
