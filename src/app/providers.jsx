'use client'

import { usePathname, useSearchParams } from "next/navigation"
import { useEffect } from "react"
import { usePostHog } from 'posthog-js/react'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'
import { initBatcher } from '@/lib/analyticsBatcher'

export function PostHogProvider({ children }) {
  useEffect(() => {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
      person_profiles: 'identified_only', // or 'always' to create profiles for anonymous users as well
      capture_pageviews: false, // We'll handle this manually for better control
      capture_pageleave: true,
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
      <PostHogPageView />
      {children}
    </PHProvider>
  )
}

// Component to track page views
function PostHogPageView() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const posthog = usePostHog()

  useEffect(() => {
    if (pathname && posthog) {
      let url = window.origin + pathname
      if (searchParams && searchParams.toString()) {
        url = url + `?${searchParams.toString()}`
      }
      
      posthog.capture('$pageview', {
        $current_url: url
      })
    }
  }, [pathname, searchParams, posthog])

  return null
}


