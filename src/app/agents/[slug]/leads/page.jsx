'use client'

import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useParams } from 'next/navigation'
import LeadsManagement from '@/app/components/analytics/LeadsManagement'

export default function AgentLeadsPage() {
  const params = useParams()
  const { user, loading } = useAuth()
  const slug = params.slug || ''
  
  const listerId = user?.profile?.agent_id || user?.id
  const listerType = 'agent'

  if (loading || !listerId) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary_color" />
      </div>
    )
  }

  return (
    <div className="w-full min-w-0">
      <div className="mb-6">
        <h1 className="text-primary_color">Leads Management</h1>
        <p className="text-gray-600">Manage and track all your property leads</p>
      </div>
      <LeadsManagement listerId={listerId} listerType={listerType} />
    </div>
  )
}

