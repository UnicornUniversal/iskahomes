'use client'

import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useParams } from 'next/navigation'
import LeadsManagement from '@/app/components/analytics/LeadsManagement'

export default function AgencyLeadsPage() {
  const params = useParams()
  const { user } = useAuth()
  const slug = params.slug || ''
  
  // Get lister ID from user profile
  const listerId = user?.profile?.agency_id || user?.id
  const listerType = 'agency'

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="">Leads Management</h1>
          <p className="">Manage and track all your property leads</p>
        </div>

        {/* Leads Management Component */}
        <LeadsManagement 
          listerId={listerId} 
          listerType={listerType} 
        />
      </div>
    </div>
  )
}

