'use client'

import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import AgentNav from '@/app/components/agents/AgentNav'
import AgentHeader from '@/app/components/agents/AgentHeader'
import Appointments from '@/app/components/developers/Appointments'

const page = () => {
  const { user } = useAuth()
  
  // Get account ID from user profile
  const accountId = user?.profile?.agent_id || user?.id
  const accountType = 'agent'

  return (
    <div className='w-full normal_div'>
      <AgentNav active={3} />
      <div className='w-full flex flex-col gap-[2em]'>
        <AgentHeader />
        <Appointments accountId={accountId} accountType={accountType} />
      </div>
    </div>
  )
}

export default page
