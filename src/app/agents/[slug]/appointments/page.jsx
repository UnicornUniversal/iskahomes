'use client'

import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Appointments from '@/app/components/developers/Appointments'

const page = () => {
  const { user } = useAuth()
  
  // Get account ID from user profile
  const accountId = user?.profile?.agent_id || user?.id
  const accountType = 'agent'

  return (
    <Appointments accountId={accountId} accountType={accountType} />
  )
}

export default page
