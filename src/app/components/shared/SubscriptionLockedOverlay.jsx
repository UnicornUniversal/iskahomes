'use client'

import React from 'react'
import { SUBSCRIPTION_LOCKED_CARD_CLASS } from '@/lib/subscriptionLimits'

export default function SubscriptionLockedOverlay({ locked, message, children, className = '' }) {
  if (!locked) {
    return <>{children}</>
  }

  return (
    <div className={`relative ${className}`}>
      <div className={SUBSCRIPTION_LOCKED_CARD_CLASS}>{children}</div>
      {message && (
        <div
          className="absolute inset-0 flex items-center justify-center p-3 pointer-events-none"
          title={message}
        >
          <span className="text-xs text-center font-medium text-gray-600 bg-white/90 px-2 py-1 rounded shadow-sm max-w-[90%]">
            {message}
          </span>
        </div>
      )}
    </div>
  )
}
