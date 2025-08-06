import React from 'react'
import AgentSearch from './AgentSearch'

const AgentHeader = () => {
  return (
  <div className='w-full flex flex-col md:flex-row gap-4 justify-between items-center bg-primary_color/5 p-[2em] rounded-lg'>
      <div className='w-full flex flex-col gap-2'>
        <h6>Welcome  </h6>
        <h2 className='text-primary_color '>Agent Kwame Asante</h2>
      
    </div>
    <AgentSearch />
  </div>
  )
}

export default AgentHeader
