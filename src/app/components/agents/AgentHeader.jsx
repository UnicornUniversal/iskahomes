'use client'

import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getUserDisplayName } from '@/lib/dashboardRoutes'
import AgentSearch from './AgentSearch'

const AgentHeader = () => {
  const { user } = useAuth()
  const agentName = getUserDisplayName(user) || 'Agent'

  return (
    <div className="w-full flex flex-col lg:flex-row gap-4 lg:gap-6 justify-between lg:items-center bg-primary_color/5 p-4 lg:p-6 rounded-lg flex-shrink-0">
      <div className="min-w-0 flex flex-col gap-1">
        <h6 className="text-sm text-gray-600">Welcome</h6>
        <h2 className="text-primary_color text-xl lg:text-2xl font-bold truncate">{agentName}</h2>
      </div>
      <div className="w-full lg:w-auto lg:min-w-[280px] lg:max-w-md flex-shrink-0">
        <AgentSearch />
      </div>
    </div>
  )
}

export default AgentHeader
