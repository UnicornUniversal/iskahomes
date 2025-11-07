'use client'

import React, { useState, useEffect } from 'react'
import { usePostHog } from 'posthog-js/react'
import { useAnalytics } from '@/hooks/useAnalytics'

const PostHogDebug = () => {
  const posthog = usePostHog()
  const { trackPropertyView, trackListingImpression } = useAnalytics()
  const [events, setEvents] = useState([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    if (posthog) {
      setIsLoaded(true)
      console.log('PostHog loaded:', posthog)
      console.log('PostHog config:', {
        api_host: posthog.config?.api_host,
        project_api_key: posthog.config?.token ? 'Set' : 'Not set'
      })
    }
  }, [posthog])

  const testEvent = () => {
    if (posthog) {
      posthog.capture('test_event', {
        test_property: 'test_value',
        timestamp: new Date().toISOString()
      })
      
      setEvents(prev => [...prev, {
        event: 'test_event',
        timestamp: new Date().toLocaleTimeString()
      }])
      
      console.log('Test event sent to PostHog')
    }
  }

  const testAnalytics = () => {
    trackPropertyView('test-listing-id', {
      viewedFrom: 'debug',
      listingType: 'unit',
      developerId: 'test-developer-id'
    })
    
    trackListingImpression('test-listing-id', {
      viewedFrom: 'debug',
      listingType: 'unit',
      developerId: 'test-developer-id'
    })
    
    setEvents(prev => [...prev, {
      event: 'property_view + listing_impression',
      timestamp: new Date().toLocaleTimeString()
    }])
    
    console.log('Analytics events sent')
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg border max-w-sm">
      <h3 className="font-bold text-sm mb-2">PostHog Debug</h3>
      
      <div className="text-xs space-y-1 mb-3">
        <div>Status: {isLoaded ? '✅ Loaded' : '❌ Not loaded'}</div>
        <div>API Host: {posthog?.config?.api_host || 'Unknown'}</div>
        <div>Project Key: {posthog?.config?.token ? '✅ Set' : '❌ Not set'}</div>
      </div>
      
      <div className="space-y-2">
        <button
          onClick={testEvent}
          className="w-full bg-blue-500 text-white px-3 py-1 rounded text-xs"
        >
          Test PostHog Event
        </button>
        
        <button
          onClick={testAnalytics}
          className="w-full bg-green-500 text-white px-3 py-1 rounded text-xs"
        >
          Test Analytics
        </button>
      </div>
      
      <div className="mt-3">
        <div className="text-xs font-medium mb-1">Recent Events:</div>
        <div className="max-h-20 overflow-y-auto text-xs">
          {events.length === 0 ? (
            <div className="text-gray-500">No events yet</div>
          ) : (
            events.slice(-5).map((event, index) => (
              <div key={index} className="text-green-600">
                {event.timestamp}: {event.event}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default PostHogDebug
