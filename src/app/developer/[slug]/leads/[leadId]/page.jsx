'use client'

import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import LeadsManagement from '@/app/components/analytics/LeadsManagement'

export default function LeadDetailsPage() {
  const params = useParams()
  const { user } = useAuth()
  const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug || ''
  const leadId = Array.isArray(params?.leadId) ? params.leadId[0] : params?.leadId || ''

  const listerId = user?.profile?.developer_id || user?.id || slug

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Link
            href={`/developer/${slug}/leads`}
            className="inline-flex items-center text-sm text-primary_color hover:text-secondary_color mb-3"
          >
            Back to Leads
          </Link>
          <h1>Lead Details</h1>
          <p>View and manage this lead in full detail.</p>
        </div>

        <LeadsManagement
          listerId={listerId}
          listerType="developer"
          initialLeadId={leadId}
          singleLeadMode
        />
      </div>
    </div>
  )
}
