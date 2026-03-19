'use client'

import React from 'react'
import Link from 'next/link'
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits'
import { FiLock } from 'react-icons/fi'

/**
 * Gates addon-only features (e.g. Clients, Service Charges).
 * If user doesn't have the addon subscription, shows a CTA to subscribe.
 */
export function SubscriptionGate({ children, fallback = null, subscriptionPath }) {
  const { hasClientManagementAddon, loading } = useSubscriptionLimits()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    )
  }

  if (hasClientManagementAddon) {
    return <>{children}</>
  }

  if (fallback) return <>{fallback}</>

  const href = subscriptionPath || (typeof window !== 'undefined' ? `${window.location.pathname.split('/').slice(0, 4).join('/')}/subscriptions` : '/developer/developer/subscriptions')

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50/80 dark:bg-amber-950/20 dark:border-amber-800 p-6 md:p-8 text-center max-w-lg mx-auto">
      <div className="flex justify-center mb-4">
        <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400">
          <FiLock className="w-7 h-7" />
        </span>
      </div>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        Subscribe to access this feature
      </h2>
      <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
        Client management and service charges are available with the Additional Addons subscription. Select your plan and add the addon to unlock this feature.
      </p>
      <Link
        href={href}
        className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-primary_color text-white hover:opacity-90 transition"
      >
        Go to Subscriptions
      </Link>
    </div>
  )
}

/**
 * For limit-based gating (e.g. max developments, max units).
 * Renders children if under limit; otherwise optional fallback or upgrade message.
 */
export function LimitGate({ limitKey, currentUsage, children, fallback = null }) {
  const { isWithinLimit, getLimitValue, loading } = useSubscriptionLimits()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[120px]">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    )
  }

  const allowed = isWithinLimit(limitKey, currentUsage)
  const limit = getLimitValue(limitKey)

  if (allowed) return <>{children}</>
  if (fallback) return <>{fallback}</>

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-4 text-center">
      <p className="text-sm text-gray-700">
        You have reached your plan limit ({limit == null ? 'limit' : limit}).
        <br />
        Upgrade your subscription to add more.
      </p>
    </div>
  )
}
