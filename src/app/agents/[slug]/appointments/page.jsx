import React from 'react'
import AgentNav from '@/app/components/agents/AgentNav'
import AgentHeader from '@/app/components/agents/AgentHeader'
import Appointments from '@/app/components/agents/Appointments'
const page = () => {
  return (
    <div className='w-full normal_div'>
      <AgentNav active={4} />
      <div className='w-full flex flex-col gap-[2em]'>
        <AgentHeader />
        <Appointments />
      </div>
    </div>
  )
}

export default page
