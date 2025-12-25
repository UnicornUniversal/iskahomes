'use client'

import React from 'react'
import AgentNav from '@/app/components/agents/AgentNav'
import AgentHeader from '@/app/components/agents/AgentHeader'

const PropertyAnalyticsPage = () => {
  return (
    <div className='w-full normal_div'>
      <AgentNav active={2} />
      <div className='w-full flex flex-col gap-[2em]'>
        <AgentHeader />
        <div className='w-full p-6'>
          <h1 className="text-2xl font-bold text-primary_color mb-4">Property Analytics</h1>
          <p className="text-gray-600">Analytics page coming soon...</p>
        </div>
      </div>
    </div>
  )
}

export default PropertyAnalyticsPage

