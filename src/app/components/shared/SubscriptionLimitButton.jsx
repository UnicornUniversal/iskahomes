'use client'

import React from 'react'
import { getSubscriptionLimitTooltip } from '@/lib/subscriptionLimits'

/**
 * Button disabled when subscription limit reached, with hover tooltip.
 */
export default function SubscriptionLimitButton({
  children,
  enabled = true,
  limitKey = 'default',
  tooltip,
  onClick,
  className = '',
  disabledClassName = 'opacity-50 cursor-not-allowed',
  ...props
}) {
  const isDisabled = !enabled
  const title = isDisabled ? (tooltip || getSubscriptionLimitTooltip(limitKey)) : undefined

  return (
    <button
      type="button"
      onClick={isDisabled ? undefined : onClick}
      disabled={isDisabled}
      title={title}
      className={`${className} ${isDisabled ? disabledClassName : ''}`.trim()}
      {...props}
    >
      {children}
    </button>
  )
}
