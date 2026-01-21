'use client'
import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Appointments from '@/app/components/developers/Appointments'

const page = () => {
  const { user } = useAuth()
  
  // Use developer_id from profile (already set in AuthContext for team members)
  const accountId = user?.profile?.developer_id || user?.id
  const accountType = 'developer'

  return (
    <div className='w-full'>
      <Appointments accountId={accountId} accountType={accountType} />
    </div>
  )
}

export default page
