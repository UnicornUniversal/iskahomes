'use client'

import React, { useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import useAgentProfile from '@/hooks/useAgentProfile'
import { getUserDisplayName } from '@/lib/dashboardRoutes'
// import AgentSearch from './AgentSearch'

const AgentHeader = () => {
  const { user, isAuthenticated } = useAuth()
  const { agent, loading } = useAgentProfile()

  const { agentName, agencyName, accountStatus } = useMemo(() => {
    const name = agent?.name || getUserDisplayName(user) || 'Agent'
    const agency = agent?.agency_name || 'Agency'
    const status =
      agent?.account_status ||
      agent?.agent_status ||
      user?.profile?.account_status ||
      'active'

    return { agentName: name, agencyName: agency, accountStatus: status }
  }, [agent, user])

  const statusLabel =
    accountStatus.charAt(0).toUpperCase() + accountStatus.slice(1)

  const isLoading = !isAuthenticated || loading

  return (
    <div className="w-full bg-white/90 backdrop-blur-sm p-6  shadow-sm border border-gray-100 mb-6 flex-shrink-0">
      <div className="flex flex-col gap-2 min-w-0">
        <p className="text-sm text-gray-500 font-medium">Welcome back    <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary_color/10 text-primary_color">
            Agent
          </span></p>
        <h2 className="text-2xl md:text-5xl text-primary_color truncate">
          {isLoading ? 'Loading...' : agentName}
        </h2>
        {!isLoading && agencyName && (
          <p className="text-base font-medium text-gray-700">{agencyName}</p>
        )}
        <div className="flex flex-wrap items-center gap-2 mt-1">
       
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              accountStatus === 'active' || accountStatus === 'approved'
                ? 'bg-green-100 text-green-800'
                : accountStatus === 'suspended'
                  ? 'bg-red-100 text-red-800'
                  : accountStatus === 'pending'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
            }`}
          >
            {isLoading ? 'Loading' : statusLabel}
          </span>
        </div>
        {/* <p className="text-sm text-gray-600 mt-1">
          {isLoading
            ? 'Loading your dashboard...'
            : `Managing listings and leads for ${agencyName}`}
        </p> */}
      </div>
      {/* <AgentSearch /> */}
    </div>
  )
}

export default AgentHeader
