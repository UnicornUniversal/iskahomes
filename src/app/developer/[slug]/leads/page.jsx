'use client'

import React from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useParams } from 'next/navigation'
import LeadsManagement from '@/app/components/analytics/LeadsManagement'

const LeadsPage = () => {
  const params = useParams()
  const { user } = useAuth()
  const slug = params.slug || ''
  
  // Get lister ID from user profile or use slug as fallback
  const listerId = user?.profile?.developer_id || user?.id || slug
  const listerType = 'developer'

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="">Leads Management</h1>
            <p className="">Manage and track all your property leads</p>
          </div>
          <Link
            href={`/developer/${slug}/leads/leadsPipeline`}
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium border border-primary_color text-primary_color rounded-lg hover:bg-primary_color/5"
          >
            Configure pipeline
          </Link>
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

export default LeadsPage
