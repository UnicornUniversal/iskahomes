'use client'

import React, { useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useParams } from 'next/navigation'
import { MapPin, DollarSign, TrendingUp } from 'lucide-react'
import DataCard from '@/app/components/developers/DataCard'
import SalesTrendChart from '@/app/components/analytics/SalesTrendChart'
import { formatCurrency } from '@/lib/utils'

export default function AgencySalesPage() {
  const params = useParams()
  const { user } = useAuth()
  
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
  const totalPropertiesSold = user?.profile?.total_sales ?? 0
  const totalRevenue = user?.profile?.total_revenue ?? 0
  const expectedRevenue = user?.profile?.estimated_revenue ?? 0
  const incomingRevenue = expectedRevenue - totalRevenue // Estimated remaining revenue

  return (
    <>
      <div className="mb-6">
        <h1 className="text-primary_color mb-2">Sales Overview</h1>
      </div>

      {/* Data Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
          title="Total Expected Revenue" 
          value={formatCurrency(expectedRevenue, currency)}
          icon={TrendingUp}
        />
        <DataCard 
          title="Incoming Revenue" 
          value={formatCurrency(incomingRevenue > 0 ? incomingRevenue : 0, currency)}
          icon={DollarSign}
        />
      </div>

      {/* Sales Time Series */}
      <div className="w-full">
        <SalesTrendChart listerId={accountId} currency={currency} />
      </div>
    </>
  )
}
