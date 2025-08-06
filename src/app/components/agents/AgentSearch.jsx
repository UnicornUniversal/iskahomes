import React from 'react'
import { FiSearch } from 'react-icons/fi'   

const AgentSearch = () => {
  return (
    <div className='flex items-center w-full max-w-[500px] gap-2 bg-primary_color px-4 rounded-full p-2'>
      <input 
        type="text" 
        placeholder='Search Clients, Properties, or Leads'  
        className='w-full focus:outline-none text-white text-[0.7em] placeholder-white/80' 
      />
      <button className='bg-primary_color rounded-full p-2 hover:bg-primary_color/90 transition-colors duration-200'>
        <FiSearch className="text-white" />
      </button>
    </div>
  )
}

export default AgentSearch
