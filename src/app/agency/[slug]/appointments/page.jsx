'use client'

import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useParams } from 'next/navigation'
import Appointments from '@/app/components/developers/Appointments'

export default function AgencyAppointmentsPage() {
  const params = useParams()
  const { user } = useAuth()
  const slug = params.slug || ''
  
  // Get account ID from user profile
  const accountId = user?.profile?.agency_id || user?.id
  const accountType = 'agency'

  return (
    <div className="w-full">
      <Appointments 
        accountId={accountId} 
        accountType={accountType}
        readOnly={false} // Agency can manage their own appointments
      />
    </div>
  )
}
