'use client'

import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useParams } from 'next/navigation'
import AgentNav from '@/app/components/agents/AgentNav'
import AgentHeader from '@/app/components/agents/AgentHeader'
import LeadsManagement from '@/app/components/analytics/LeadsManagement'

export default function AgentLeadsPage() {
  const params = useParams()
  const { user } = useAuth()
  const slug = params.slug || ''
  
  // Get lister ID from user profile
  const listerId = user?.profile?.agent_id || user?.id
  const listerType = 'agent'

  return (
    <div className='w-full normal_div'>
      <AgentNav active={5} />
      <div className='w-full flex flex-col gap-[2em]'>
        <AgentHeader />
        <div className="min-h-screen p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-primary_color">Leads Management</h1>
              <p className="text-gray-600">Manage and track all your property leads</p>
            </div>

            {/* Leads Management Component */}
            <LeadsManagement 
              listerId={listerId} 
              listerType={listerType} 
            />
          </div>
        </div>
      </div>
    </div>
  )
}

