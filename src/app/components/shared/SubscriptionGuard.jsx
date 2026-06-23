'use client'

import React, { useMemo } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { usePathname } from 'next/navigation'
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits'
import { FiLock } from 'react-icons/fi'

export default function SubscriptionGuard({ children, entityType }) {
  const { user, loading, hydrating } = useAuth()
  const pathname = usePathname()
  const { hasActiveSubscription, loading: limitsLoading, actorType } = useSubscriptionLimits()

  const isAllowedRoute = useMemo(() => {
    const path = String(pathname || '').toLowerCase()
    return path.includes('/subscriptions')
  }, [pathname])

  const subscriptionsHref = useMemo(() => {
    const parts = String(pathname || '').split('/').filter(Boolean)
    if (parts[0] === 'agency' && parts[1]) {
      return `/agency/${parts[1]}/subscriptions`
    }
    if (parts[0] === 'developer' && parts[1]) {
      return `/developer/${parts[1]}/subscriptions`
    }
    return '/home/signin'
  }, [pathname])

  const isAgent = entityType === 'agent' || actorType === 'agent'

  if (loading || hydrating || limitsLoading) {
    return (
      <div className="w-full min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    )
  }

  if (!user || hasActiveSubscription || isAllowedRoute) {
    return children
  }

  const isAgencySide =
    entityType === 'agency' ||
    actorType === 'agency' ||
    actorType === 'team_member'

  return (
    <div className="w-full min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-lg w-full rounded-xl border border-amber-200 bg-amber-50/90 p-8 text-center shadow-sm">
        <div className="flex justify-center mb-4">
          <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-100 text-amber-600">
            <FiLock className="w-7 h-7" />
          </span>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Subscription required</h2>
        {isAgent ? (
          <p className="text-sm text-gray-600 mb-6">
            Your agency does not have an active plan. Please contact your agency administrator
            and ask them to subscribe to the <strong>Basic</strong> plan
            so you can use the platform.
          </p>
        ) : isAgencySide ? (
          <>
            <p className="text-sm text-gray-600 mb-6">
              Subscribe to the <strong>Basic</strong> plan (or a paid plan) to start using your agency
              dashboard. You can upgrade anytime as your team grows.
            </p>
            <Link
              href={subscriptionsHref}
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-primary_color text-white text-sm font-medium hover:opacity-90 transition"
            >
              Go to Subscriptions
            </Link>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-600 mb-6">
              Subscribe to the <strong>Basic</strong> plan (or a paid plan) to use the developer
              dashboard.
            </p>
            <Link
              href={subscriptionsHref}
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-primary_color text-white text-sm font-medium hover:opacity-90 transition"
            >
              Go to Subscriptions
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
