import React from 'react'
import AgentHomeOwners from '@/app/components/agents/AgentHomeOwners'
import HomeOwnerProperties from '@/app/components/homeOwner/HomeOwnerProperties'
  import AgentNav from '@/app/components/agents/AgentNav'
import AgentHeader from '@/app/components/agents/AgentHeader'
  const page = () => {
  return (

    <div className='normal_div'>
      <AgentNav active={3} />
      <div className='flex flex-col w-full gap-4'>
        <AgentHeader />
        <HomeOwnerProperties />
      </div>
    </div>
  )
}

export default page
