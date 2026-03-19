'use client'

import React from 'react'
import { useParams } from 'next/navigation'
import { SubscriptionGate } from '@/app/components/shared/SubscriptionGate'
import TotalServiceCharge from '@/app/components/developers/DataStats/TotalServiceCharge'

const ServiceChargePage = () => {
  const params = useParams()
  const slug = params?.slug || ''
  const subscriptionPath = slug ? `/developer/${slug}/subscriptions` : undefined

  return (
    <SubscriptionGate subscriptionPath={subscriptionPath}>
      <div className="w-full flex flex-col gap-4 h-full overflow-y-auto">
        <TotalServiceCharge />
      </div>
    </SubscriptionGate>
  )
}

export default ServiceChargePage
