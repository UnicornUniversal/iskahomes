import React from 'react'
import AgentHomeOwners from '@/app/components/agents/AgentHomeOwners'
import AgentHeader from '@/app/components/agents/AgentHeader'

import AgentNav from '@/app/components/agents/AgentNav'
const page = () => {
  return (
    <div className='normal_div'>
      <AgentNav active={3} />

      <div className='flex flex-col w-full gap-4'>
        <AgentHeader />
        <AgentHomeOwners />
      </div>
    </div>
  )
}

export default page
