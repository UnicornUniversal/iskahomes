'use client'

import { usePathname, useSearchParams } from "next/navigation"
import { useEffect, Suspense } from "react"
import { usePostHog } from 'posthog-js/react'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'
import { initBatcher } from '@/lib/analyticsBatcher'

export function PostHogProvider({ children }) {
  useEffect(() => {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
      person_profiles: 'identified_only', // or 'always' to create profiles for anonymous users as well
      capture_pageviews: false, // Disabled - we only track custom events
      capture_pageleave: false, // Disabled - we only track custom events
      autocapture: false, // CRITICAL: Disable auto-capture completely (no $autocapture, $pageview, etc.)
      disable_session_recording: true, // Disable session recording to reduce noise
      loaded: (posthog) => {
        if (process.env.NODE_ENV === 'development') {
          // Optional: disable in development
          // posthog.opt_out_capturing()
        }
      }
    })

    // COMMENTED OUT: Redis batcher (migrated to PostHog-only approach)
    // Initialize our dual-write batcher once on app boot
    // const dispose = initBatcher()
    // return () => { dispose && dispose() }
  }, [])

  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      {children}
    </PHProvider>
  )
}

// Component to track page views
// DISABLED: We're not tracking $pageview anymore - only custom events
// This prevents auto-capture events from cluttering our analytics
function PostHogPageView() {
  // DISABLED: Manual pageview tracking removed
  // We only track custom events (property_view, profile_view, etc.)
  // If you need pageview tracking, use a custom event instead
  return null
}


