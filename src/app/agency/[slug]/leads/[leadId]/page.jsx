'use client'

import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import LeadsManagement from '@/app/components/analytics/LeadsManagement'
import { getAgencyAccountId } from '@/lib/dashboardRoutes'

export default function AgencyLeadDetailsPage() {
  const params = useParams()
  const { user } = useAuth()
  const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug || ''
  const leadId = Array.isArray(params?.leadId) ? params.leadId[0] : params?.leadId || ''

  const listerId = getAgencyAccountId(user)

  if (!listerId) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-7xl mx-auto">
          <p className="text-sm text-gray-500">Loading lead...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Link
            href={`/agency/${slug}/leads`}
            className="inline-flex items-center text-sm text-primary_color hover:text-secondary_color mb-3"
          >
            Back to Leads
          </Link>
          <h1>Lead Details</h1>
          <p>View and manage this lead in full detail.</p>
        </div>

        <LeadsManagement
          listerId={listerId}
          listerType="agency"
          initialLeadId={leadId}
          singleLeadMode
        />
      </div>
    </div>
  )
}
