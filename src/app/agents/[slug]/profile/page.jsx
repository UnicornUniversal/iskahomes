import React from 'react'
import AgentProfile from '@/app/components/agents/AgentProfile'
import AgentNav from '@/app/components/agents/AgentNav'
import AgentHeader from '@/app/components/agents/AgentHeader'
const page = () => {
  return (
    <div className='w-full normal_div'>
      <AgentNav active={8} />
      <div className='w-full flex flex-col gap-[2em]'>
        <AgentHeader />
        <AgentProfile />
      </div>
    </div>
  )
}

export default page
