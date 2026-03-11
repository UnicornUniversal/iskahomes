'use client'

import React from 'react'
import { useParams } from 'next/navigation'
import AuditTrail from '@/app/components/developers/AuditTrail'

const AuditTrailPage = () => {
  const params = useParams()
  const slug = params?.slug || ''

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="  text-primary_color mb-2">Audit Trail</h1>
          <p className="text-gray-600">
            Track changes and activity across your developments, units, leads, and team
          </p>
        </div>

        {/* Audit Trail Component */}
        {/* <br/>
        <br/>
        <p>Currently under development</p> */}
        <AuditTrail />
      </div>
    </div>
  )
}

export default AuditTrailPage
