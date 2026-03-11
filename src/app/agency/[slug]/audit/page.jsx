'use client'

import React from 'react'
import AuditTrail from '@/app/components/developers/AuditTrail'

export default function AgencyAuditPage() {
  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary_color mb-2">Audit Trail</h1>
          <p className="text-gray-600">
            Track changes and activity across your properties, leads, agents, and team
          </p>
        </div>
        <AuditTrail />
      </div>
    </div>
  )
}
