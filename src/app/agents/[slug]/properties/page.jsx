import React from 'react'
import AgentNav from '@/app/components/agents/AgentNav'
import AgentHeader from '@/app/components/agents/AgentHeader'
import AgentDashboard from '@/app/components/agents/AgentDashboard'
import AgentProperties from '@/app/components/agents/AgentProperties'
const page = () => {
  return (
    <div className='w-full normal_div'>
      <AgentNav active={2} />
      <div className='w-full flex flex-col gap-[2em]'>
      <AgentHeader />
      <AgentProperties />

      </div>
      
    </div>
  )
}

export default page
