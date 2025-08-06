import React from 'react'
import AgentNav from '@/app/components/agents/AgentNav'
import AgentDashboard from '@/app/components/agents/AgentDashboard'
import AgentHeader from '@/app/components/agents/AgentHeader'
import Leads from '@/app/components/agents/DataInfo/Leads'

const page = () => {
  return (
    <div className='w-full normal_div'>
      <AgentNav active={1} />
      <div className='w-full flex flex-col gap-4'>
      <AgentHeader />
      <AgentDashboard />
        
      </div>
    


    </div>
  )
}

export default page
