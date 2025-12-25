'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Users, TrendingUp, DollarSign, Loader2, MapPin } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'

const TopAgents = ({ limit = 7, agencyId = null }) => {
  const { user } = useAuth()
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)

  // Use provided agencyId or fall back to auth user
  const accountId = agencyId || user?.profile?.agency_id || user?.id

  useEffect(() => {
    if (!accountId) {
      setLoading(false)
      return
    }

    let isMounted = true

    const fetchTopAgents = async () => {
      try {
        const token = localStorage.getItem('agency_token')
        if (!token) {
          setLoading(false)
          return
        }

        const response = await fetch(`/api/agencies/agents?status=active&limit=${limit}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const result = await response.json()
          if (isMounted && result.success) {
            // Sort by total_revenue or total_sales
            const sorted = (result.data || []).sort((a, b) => {
              const revenueA = a.total_revenue || 0
              const revenueB = b.total_revenue || 0
              return revenueB - revenueA
            })
            setAgents(sorted.slice(0, limit))
          }
        }
      } catch (error) {
        console.error('Error fetching top agents:', error)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchTopAgents()

    return () => {
      isMounted = false
    }
  }, [accountId, limit])

  const getInitials = (name) => {
    if (!name) return 'AG'
    const parts = name.trim().split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  const getCurrency = () => {
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
  }

  const currency = getCurrency()

  if (loading) {
    return (
      <div className="secondary_bg rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-primary_color">Top Agents</h3>
          <p className="text-sm text-gray-600">Best performing agents by revenue</p>
        </div>
        <div className="p-6 text-center text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin mx-auto" />
        </div>
      </div>
    )
  }

  if (agents.length === 0) {
    return (
      <div className="secondary_bg rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-primary_color">Top Agents</h3>
          <p className="text-sm text-gray-600">Best performing agents by revenue</p>
        </div>
        <div className="p-6 text-center text-gray-500">No agents found</div>
      </div>
    )
  }

  return (
    <div className="secondary_bg rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-primary_color">Top Agents</h3>
        <p className="text-sm text-gray-600">Best performing agents by revenue</p>
      </div>
      <div className="divide-y divide-gray-200">
        {agents.map((agent, index) => (
          <Link
            key={agent.id}
            href={`/agency/${user?.profile?.slug || ''}/agents/${agent.slug || agent.id}/profile`}
            className="block p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-primary_color/10 flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary_color">
                      {getInitials(agent.name)}
                    </span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{agent.name}</p>
                  <div className="flex items-center gap-4 mt-1">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <MapPin className="w-3 h-3" />
                      <span>{agent.total_listings || 0} properties</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <TrendingUp className="w-3 h-3" />
                      <span>{agent.properties_sold || 0} sold</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0 ml-4 text-right">
                <p className="text-sm font-semibold text-primary_color">
                  {formatCurrency(agent.total_revenue || 0, currency)}
                </p>
                <p className="text-xs text-gray-500">Revenue</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default TopAgents

