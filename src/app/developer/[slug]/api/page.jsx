'use client'

import React from 'react'
import { useParams } from 'next/navigation'
import ApiKeyManagementComponent from '@/app/components/api/ApiKeyManagementComponent'

export default function DeveloperApiPage() {
  const params = useParams()
  const slug = params?.slug || 'developer'

  return (
    <div className="py-4 md:py-6 space-y-6">
      <ApiKeyManagementComponent userType="developer" slug={slug} />
    </div>
  )
}
