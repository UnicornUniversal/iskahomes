'use client'

import React from 'react'
import { useParams } from 'next/navigation'
import ApiPermissionsDetail from '@/app/components/api/ApiPermissionsDetail'

export default function AgencyApiPermissionsPage() {
  const params = useParams()
  const slug = params?.slug || 'agency'
  const apiId = params?.apiId || ''

  return (
    <div className="py-4 md:py-6">
      <ApiPermissionsDetail userType="agency" slug={slug} apiId={apiId} />
    </div>
  )
}
