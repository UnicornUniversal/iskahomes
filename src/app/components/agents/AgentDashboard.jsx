'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useParams } from 'next/navigation'
import { MapPin, DollarSign, TrendingUp, Users, Eye } from 'lucide-react'
import DataCard from '@/app/components/developers/DataCard'
import LatestLeads from '@/app/components/developers/DataStats/LatestLeads'
import RecentMessages from '@/app/components/developers/DataStats/RecentMessages'
import Appointments from '@/app/components/developers/Appointments'
import { formatCurrency } from '@/lib/utils'

const formatNumber = (num) => {
  if (num === null || num === undefined) return '0'
  return Number(num).toLocaleString('en-US')
}

const AgentDashboard = () => {
  const { user, agentToken } = useAuth()
  const params = useParams()
  const slug = params.slug || ''
  
  const [agent, setAgent] = useState(null)
  const [loading, setLoading] = useState(true)

  // Get currency from agency profile
  const currency = useMemo(() => {
    if (!agent?.location_data?.currency) {
      // Try to get from agency
      if (user?.profile?.company_locations) {
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
      }
      return 'GHS'
    }
    return agent.location_data.currency
  }, [agent, user?.profile?.company_locations])

  useEffect(() => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    let isMounted = true

    const fetchAgentProfile = async () => {
      try {
        setLoading(true)
        const token = user?.token || agentToken
        
        if (!token) {
          setLoading(false)
          return
        }

        const response = await fetch('/api/agents/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const result = await response.json()
          if (isMounted && result.success) {
            setAgent(result.data)
          }
        }
      } catch (error) {
        console.error('Error fetching agent profile:', error)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchAgentProfile()

    return () => {
      isMounted = false
    }
  }, [user?.id, user?.token, agentToken])

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

      {/* Recent Messages | Latest Leads */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="secondary_bg p-4 rounded-2xl shadow-sm">
          <RecentMessages userId={listerId} accountType="agent" />
        </div>
        <div className="secondary_bg p-4 rounded-2xl shadow-sm">
          <LatestLeads listerId={listerId} listerType="agent" />
        </div>
      </div>

      {/* Appointments */}
      <div className="w-full">
        <Appointments accountId={listerId} accountType="agent" />
      </div>
    </div>
  )
}

export default AgentDashboard
