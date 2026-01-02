import React from 'react'
import AgentDashboard from '@/app/components/agents/AgentDashboard'
import Leads from '@/app/components/agents/DataInfo/Leads'

const page = () => {
  return (
    <div className='w-full flex flex-col gap-4'>
      <AgentDashboard />
    </div>
  )
}

export default page
