'use client'

import React from 'react'
import SearchBar from './SearchBar'
import { useAuth } from '@/contexts/AuthContext'

const DeveloperHeader = () => {
  const { user, isAuthenticated } = useAuth()

  // Always render the same structure to prevent hydration mismatches
  const companyName = user?.profile?.company_name || user?.profile?.name || 'Developer'
  const accountStatus = user?.profile?.account_status || 'Unknown'

  return (
    <>
      <div className='shadow w-full border border-white/40 p-[1em] md:p-[2em] rounded-lg flex flex-col relative justify-between items-start'>
        <div className='w-full flex items-center gap-2 flex-wrap  '>
        <div>
            <h5 className='text-sm md:text-base'>Welcome,</h5>
            <h2 className=' text-[2em] md:text-[4em] w-full'>
              {!isAuthenticated || !user ? 'Loading...' : companyName}
            </h2>
        </div>
          <div className='flex items-start   space-x-2 mt-2'>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              accountStatus === 'active' 
                ? 'bg-green-100 text-green-800' 
                : accountStatus === 'suspended'
                ? 'bg-red-100 text-red-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {(!isAuthenticated || !user) ? 'Loading' : accountStatus.charAt(0).toUpperCase() + accountStatus.slice(1)}
            </span>
          </div>
        </div>
        <SearchBar />
      </div>
    </>
  )
}

export default DeveloperHeader
