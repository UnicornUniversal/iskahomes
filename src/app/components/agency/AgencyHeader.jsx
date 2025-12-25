'use client'

import React from 'react'
import { FiSearch, FiBell } from 'react-icons/fi'
import { useAuth } from '@/contexts/AuthContext'

const AgencyHeader = () => {
  const { user, isAuthenticated } = useAuth()

  // Get agency name from user profile
  const agencyName = user?.profile?.name || 'Agency'
  const accountStatus = user?.profile?.account_status || 'Unknown'

  return (
    <div className='w-full flex flex-col md:flex-row gap-4 justify-between items-center bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-sm border border-gray-100 mb-6'>
      <div className='w-full flex flex-col gap-1'>
        <h6 className='text-sm text-gray-500 font-medium'>Welcome back</h6>
        <div className='flex items-center gap-3'>
          <h2 className='text-2xl md:text-3xl font-bold text-primary_color'>
            {!isAuthenticated || !user ? 'Loading...' : agencyName}
          </h2>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            accountStatus === 'active' 
              ? 'bg-green-100 text-green-800' 
              : accountStatus === 'suspended'
              ? 'bg-red-100 text-red-800'
              : accountStatus === 'pending'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
            {(!isAuthenticated || !user) ? 'Loading' : accountStatus.charAt(0).toUpperCase() + accountStatus.slice(1)}
          </span>
        </div>
        <p className='text-sm text-gray-600'>Manage your agents, properties, and business operations</p>
      </div>
      <div className='flex items-center gap-3'>
        <div className='relative hidden md:flex'>
          <FiSearch className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
          <input
            type='text'
            placeholder='Search...'
            className='pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary_color/20 focus:border-primary_color'
          />
        </div>
        <button className='p-2 hover:bg-gray-100 rounded-lg transition-colors'>
          <FiBell className='w-5 h-5 text-gray-600' />
        </button>
      </div>
    </div>
  )
}

export default AgencyHeader

