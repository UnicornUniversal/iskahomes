'use client'

import React from 'react'
import AgentNav from '@/app/components/agents/AgentNav'
import AgentHeader from '@/app/components/agents/AgentHeader'
import AccountStatusGuard from '@/app/components/shared/AccountStatusGuard'

export default function AgentSlugLayout({ children }) {
  return (
    <div className='w-full normal_div'>
      <AgentNav />
      <div className='w-full flex flex-col gap-[2em]'>
        <AgentHeader />
        <div className='flex-1 px-4'>
          <AccountStatusGuard entityType="agent">
            {children}
          </AccountStatusGuard>
        </div>
      </div>
    </div>
  )
}

