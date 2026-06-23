'use client'

import React from 'react'
import AgentNav from '@/app/components/agents/AgentNav'
import AgentHeader from '@/app/components/agents/AgentHeader'

export default function AgentSlugLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-white">
      <AgentNav />
      <main className="flex-1 min-w-0 flex flex-col min-h-0 p-4 lg:p-6 xl:p-8 pt-16 lg:pt-6">
        <AgentHeader />
        <div className="flex-1 min-w-0 min-h-0 mt-6">{children}</div>
      </main>
    </div>
  )
}
