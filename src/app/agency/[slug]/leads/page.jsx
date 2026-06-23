'use client'

import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useParams } from 'next/navigation'
import LeadsManagement from '@/app/components/analytics/LeadsManagement'
import { getAgencyAccountId } from '@/lib/dashboardRoutes'

export default function AgencyLeadsPage() {
  const params = useParams()
  const { user } = useAuth()
  const slug = params.slug || ''

  const listerId = getAgencyAccountId(user)
  const listerType = 'agency'

  if (!listerId) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-7xl mx-auto">
          <p className="text-sm text-gray-500">Loading agency leads...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-primary_color">Lead Management</h1>
          <p className="text-sm text-primary_color/70">
            Manage and track all leads for your agency — including agent listings
          </p>
        </div>

        <LeadsManagement listerId={listerId} listerType={listerType} />
      </div>
    </div>
  )
}
