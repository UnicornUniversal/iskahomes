'use client'

import React from 'react'
import SearchBar from './SearchBar'
import { useAuth } from '@/contexts/AuthContext'

const DeveloperHeader = () => {
  const { user, isAuthenticated } = useAuth()

  if (!isAuthenticated || !user) {
    return (
      <div className='w-full flex justify-between items-end'>
        <div className='w-full md:w-2/3'>
          <h5>Welcome,</h5>
          <h1 className='text-[4em]'>Loading...</h1>
        </div>
        <SearchBar />
      </div>
    )
  }

  const companyName = user.profile?.company_name || user.profile?.name || 'Developer'
  const accountStatus = user.profile?.account_status || 'Unknown'

  return (
    <>
      <div className='w-full flex justify-between items-end'>
        <div className='w-full '>
          <h5>Welcome,</h5>
          <h2 className='text-[4em] w-full'>{companyName}</h2>
          <div className='flex items-center space-x-2 mt-2'>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              accountStatus === 'active' 
                ? 'bg-green-100 text-green-800' 
                : accountStatus === 'suspended'
                ? 'bg-red-100 text-red-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {accountStatus.charAt(0).toUpperCase() + accountStatus.slice(1)}
            </span>
          </div>
        </div>
        <SearchBar />
      </div>
    </>
  )
}

export default DeveloperHeader
