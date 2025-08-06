import React from 'react'
import AgentNav from '@/app/components/agents/AgentNav'
import AgentHeader from '@/app/components/agents/AgentHeader'
import AgentReviews from '@/app/components/agents/AgentReviews'

const page = () => {
  return (
    <div className='w-full normal_div'>
      <AgentNav active={7} />
      <div className='w-full flex flex-col gap-[2em]'>
        <AgentHeader />
        <AgentReviews />
      </div>
    </div>
  )
}

export default page
