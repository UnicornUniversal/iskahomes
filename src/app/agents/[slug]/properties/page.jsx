'use client'

import React from 'react'
import AgentNav from '@/app/components/agents/AgentNav'
import AgentHeader from '@/app/components/agents/AgentHeader'
import AllUnits from '@/app/components/developers/units/AllUnits'

const page = () => {
  return (
    <div className='w-full normal_div'>
      <AgentNav active={2} />
      <div className='w-full flex flex-col gap-[2em]'>
        <AgentHeader />
        <AllUnits accountType="agent" />
      </div>
    </div>
  )
}

export default page
