"use client";

import React, { useState } from 'react'
import Filters from '../components/users/Filters'
import SearchProperties from '../components/users/SearchProperties'
import dynamic from 'next/dynamic'

// Dynamically import UserMap to avoid SSR issues
const UserMap = dynamic(() => import('../components/users/UserMap'), { 
  ssr: false,
  loading: () => (
    <div className='w-full h-[100vh] rounded-xl overflow-hidden border border-primary_color/10 flex items-center justify-center'>
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary_color mx-auto mb-2"></div>
        <span className="text-primary_color">Loading map...</span>
      </div>
    </div>
  )
})


const page = () => {
  const [filters, setFilters] = useState({});

  return (
    <div className='w-full h-full'>
      <div className='relative'>
        {/* Left side - Filters */}
        <div className='z-1000 absolute top-0 left-0 border border-primary_color/10 max-w-[350px] w-full'>
          <Filters onChange={setFilters} />
        </div>

        {/* Center - Map */}
        <UserMap />

        {/* Right side - Search Properties */}
        <div className='absolute bg-white/20 backdrop-blur-sm z-1000 top-0 border border-primary_color/10 max-w-[500px] right-0 w-full'>
          <SearchProperties filters={filters} />
        </div>
      </div>
    </div>
  )
}

export default page
