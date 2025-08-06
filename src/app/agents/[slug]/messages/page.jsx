import React from 'react'
import AgentNav from '@/app/components/agents/AgentNav'
import AgentHeader from '@/app/components/agents/AgentHeader'
import Conversation from '@/app/components/messages/Conversation'
import Chats from '@/app/components/messages/Chats'




const page = () => {
  return (
    <div className='w-full normal_div'>
      <AgentNav active={5} />
      <div className='w-full flex flex-col gap-[2em]'>
        <AgentHeader />
     <div className='flex gap-[2em]'>   
     <Chats />
      <Conversation />
  
        </div>
      </div>
      
    </div>
  )
}

export default page
