'use client'

import React from 'react'
import ProfileForm from '@/app/components/shared/ProfileForm'

export default function ProfilePage() {
  return (
    <div className='w-full flex flex-col gap-6'>
      <ProfileForm accountType="agency" />
    </div>
  )
}

