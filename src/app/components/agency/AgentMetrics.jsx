'use client'

import React from 'react'
import { MapPin, DollarSign, TrendingUp, Percent, Eye } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import DataCard from '@/app/components/developers/DataCard'
import StatisticsView from '@/app/components/developers/DataStats/StatisticsView'
import SalesTrendChart from '@/app/components/analytics/SalesTrendChart'

export default function AgentMetrics({ agent, loading, currency = 'GHS' }) {
  if (loading) {
    return (
      <div className="w-full flex flex-col gap-6">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="design1 relative border-[#E0B29A] p-6 shadow-sm w-full animate-pulse">
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!agent) {
    return (
      <div className="w-full">
        <p className="text-gray-600">Agent data not available</p>
      </div>
    )
  }

  // Calculate Leads To Sales ratio
  const totalLeads = agent.total_leads || 0
  const totalSales = agent.properties_sold || 0
  const leadsToSales = totalSales > 0 && totalLeads > 0 
    ? (totalLeads / totalSales).toFixed(2) 
    : totalLeads > 0 ? totalLeads.toFixed(2) : '0.00'

  // Calculate total commission (if commission_status is true, otherwise 0)
  const totalCommission = agent.commission_status 
    ? (agent.total_commission || 0) 
    : 0

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Data Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <DataCard 
          title="Total Properties" 
          value={(agent.total_listings || 0).toLocaleString()}
          icon={MapPin}
        />
        <DataCard 
          title="Total Sales" 
          value={(agent.properties_sold || 0).toLocaleString()}
          icon={TrendingUp}
        />
        <DataCard 
          title="Total Revenue" 
          value={formatCurrency(agent.total_revenue || 0, currency)}
          icon={DollarSign}
        />
        <DataCard 
          title="Total Commission" 
          value={formatCurrency(totalCommission, currency)}
          icon={DollarSign}
        />
        <DataCard 
          title="Total Leads" 
          value={totalLeads.toLocaleString()}
          icon={TrendingUp}
        />
        <DataCard 
          title="Leads To Sales" 
          value={leadsToSales}
          icon={Percent}
        />
        <DataCard 
          title="Total Profile Views" 
          value={(agent.total_profile_views || 0).toLocaleString()}
          icon={Eye}
        />
      </div>

      {/* Statistics View */}
      <div className="w-full">
        <StatisticsView userId={agent.agent_id} accountType="agent" />
      </div>

      {/* Sales Trend Chart */}
      {agent.agent_id && (
        <div className="w-full">
          <SalesTrendChart listerId={agent.agent_id} currency={currency} />
        </div>
      )}
    </div>
  )
}

