'use client'

import React from 'react'
import AgencyNav from '@/app/components/agency/AgencyNav'
import AgencyHeader from '@/app/components/agency/AgencyHeader'

export default function AgencySlugLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <AgencyNav />
      <main className="flex-1 lg:ml-0 p-4 lg:p-6 xl:p-8 flex flex-col min-h-0">
        <AgencyHeader />
        <div className="flex-1 min-h-0">
          {children}
        </div>
      </main>
    </div>
  )
}

