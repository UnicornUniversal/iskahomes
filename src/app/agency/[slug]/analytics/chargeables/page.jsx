'use client'

import React from 'react'
import { useParams } from 'next/navigation'
import ChargeablesAnalytics from '@/app/components/analytics/ChargeablesAnalytics'

export default function AgencyChargeablesAnalyticsPage() {
  const params = useParams()
  const slug = params.slug || ''

  return <ChargeablesAnalytics chargesHref={`/agency/${slug}/chargeables/charges`} />
}
