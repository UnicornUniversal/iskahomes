'use client'

import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { FiUser } from 'react-icons/fi'

const HomeSeekerHeader = () => {
  const { user } = useAuth()
  
  // Get account status from profile
  const accountStatus = user?.profile?.status || user?.profile?.is_verified ? 'Verified' : 'Pending Verification'
  const isActive = user?.profile?.is_active !== false
  
  return (
    <div className='w-full default_bg p-4 sm:p-6 lg:p-8 rounded-2xl border border-primary_color/10 shadow-lg mb-6'>
      <div className='flex items-center gap-3'>
        <div className='w-12 h-12 rounded-xl bg-gradient-to-br from-primary_color to-primary_color/80 flex items-center justify-center shadow-lg'>
          <FiUser className='w-6 h-6 text-white' />
        </div>
        <div>
          <h5 className='text-primary_color/70 font-medium text-xs sm:text-sm uppercase tracking-wider mb-1'>Welcome back,</h5>
          <h1 className='text-xl sm:text-2xl lg:text-3xl text-primary_color font-bold mb-1'>
            {user?.profile?.name || user?.email?.split('@')[0] || 'Property Seeker'}
          </h1>
          <p className={`text-sm font-medium ${
            isActive && user?.profile?.is_verified 
              ? 'text-primary_color' 
              : 'text-secondary_color'
          }`}>
            {accountStatus}
          </p>
        </div>
      </div>
    </div>
  )
}

export default HomeSeekerHeader 