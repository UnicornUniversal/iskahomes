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

        {/* Right side - Search Properties - Temporarily Disabled */}
        <div className='absolute z-1000 top-0 border border-primary_color/10 max-w-[500px] right-0 w-full'>
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-primary_color/10">
            <h3 className="text-lg font-semibold text-primary_color mb-4">Search Results</h3>
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">Property search is temporarily disabled</p>
              <p className="text-sm text-gray-400">Filters are working - check the console for filter data</p>
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600 mb-2">Current filters:</p>
                <pre className="text-xs text-gray-500 overflow-auto max-h-32">
                  {JSON.stringify(filters, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default page
