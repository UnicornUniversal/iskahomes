'use client'
import React, { useState, useEffect } from 'react'
import LeadsManagement from '@/app/components/analytics/LeadsManagement'
import LeadsTrend from '@/app/components/analytics/LeadsTrend'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const LeadAnalytics = () => {
  const params = useParams()
  const [loading, setLoading] = useState(false)

  // Using dummy data - no API calls needed
  const listerId = params.slug

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href={`/developer/${params.slug}/analytics`}
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Analytics
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Lead Analytics</h1>
          <p className="text-gray-600">Track phone calls, messages, emails, and appointment bookings</p>
        </div>

        {/* Leads Trend Component */}
        <LeadsTrend listerId={listerId} listerType="developer" />

        {/* Leads Management */}
        <div className="mt-10">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Manage Leads</h3>
          <LeadsManagement listerId={listerId} listerType="developer" />
        </div>
      </div>
    </div>
  )
}

export default LeadAnalytics
