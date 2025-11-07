'use client'
import React, { useState, useCallback, memo } from 'react'
import AlbumGallery from '@/app/components/propertyManagement/modules/AlbumGallery'

const TestPage = memo(() => {
  const [posthogLoading, setPosthogLoading] = useState(false)
  const [posthogResult, setPosthogResult] = useState(null)
  
  const [albums, setAlbums] = useState([])
  
  const [redisLoading, setRedisLoading] = useState(false)
  const [redisResult, setRedisResult] = useState(null)
  const [redisKey, setRedisKey] = useState('test-key')
  const [redisValue, setRedisValue] = useState('test-value')
  const [redisOperation, setRedisOperation] = useState('set') // Track which operation was performed

  const [cronLoading, setCronLoading] = useState(false)
  const [cronResult, setCronResult] = useState(null)

  const [posthogEventsLoading, setPosthogEventsLoading] = useState(false)
  const [posthogEventsResult, setPosthogEventsResult] = useState(null)

  const [listingAnalyticsLoading, setListingAnalyticsLoading] = useState(false)
  const [listingAnalyticsResult, setListingAnalyticsResult] = useState(null)
  const [listingIdFilter, setListingIdFilter] = useState('')

  const [leadsSummaryLoading, setLeadsSummaryLoading] = useState(false)
  const [leadsSummaryResult, setLeadsSummaryResult] = useState(null)
  const [leadsListingIdFilter, setLeadsListingIdFilter] = useState('')


  const handleTestPostHog = async () => {
    setPosthogLoading(true)
    setPosthogResult(null)

    try {
      const response = await fetch('/api/test/posthog', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const data = await response.json()

      if (response.ok) {
        setPosthogResult({
          success: true,
          message: 'PostHog API test successful!',
          data: data
        })
      } else {
        setPosthogResult({
          success: false,
          message: data.error || 'PostHog API test failed',
          data: data
        })
      }
    } catch (error) {
      setPosthogResult({
        success: false,
        message: `Error: ${error.message}`,
        data: null
      })
    } finally {
      setPosthogLoading(false)
    }
  }

  const handleTestRedisSet = async () => {
    setRedisLoading(true)
    setRedisResult(null)
    setRedisOperation('set')

    try {
      const response = await fetch('/api/test/redis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: redisKey,
          value: redisValue,
          operation: 'set'
        })
      })

      const data = await response.json()

      if (response.ok) {
        setRedisResult({
          success: true,
          message: 'Redis SET operation successful!',
          data: data
        })
      } else {
        setRedisResult({
          success: false,
          message: data.error || 'Redis SET operation failed',
          data: data
        })
      }
    } catch (error) {
      setRedisResult({
        success: false,
        message: `Error: ${error.message}`,
        data: null
      })
    } finally {
      setRedisLoading(false)
    }
  }

  const handleTestRedisGet = async () => {
    setRedisLoading(true)
    setRedisResult(null)
    setRedisOperation('get')

    try {
      const response = await fetch('/api/test/redis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: redisKey,
          operation: 'get'
        })
      })

      const data = await response.json()

      if (response.ok) {
        setRedisResult({
          success: true,
          message: 'Redis GET operation successful!',
          data: data
        })
      } else {
        setRedisResult({
          success: false,
          message: data.error || 'Redis GET operation failed',
          data: data
        })
      }
    } catch (error) {
      setRedisResult({
        success: false,
        message: `Error: ${error.message}`,
        data: null
      })
    } finally {
      setRedisLoading(false)
    }
  }

  const handleTestCron = async () => {
    setCronLoading(true)
    setCronResult(null)

    try {
      // Use testMode=true and ignoreLastRun=true to fetch last 24 hours and ignore previous runs
      const response = await fetch('/api/cron/analytics?testMode=true&ignoreLastRun=true', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      })

      const data = await response.json()

      if (response.ok) {
        setCronResult({
          success: true,
          message: 'Analytics cron job executed successfully!',
          data: data
        })
      } else {
        setCronResult({
          success: false,
          message: data.error || 'Analytics cron job failed',
          data: data
        })
      }
    } catch (error) {
      setCronResult({
        success: false,
        message: `Error: ${error.message}`,
        data: null
      })
    } finally {
      setCronLoading(false)
    }
  }

  const handleTestPostHogEvents = async () => {
    // Prevent multiple simultaneous calls
    if (posthogEventsLoading) {
      return
    }

    setPosthogEventsLoading(true)
    setPosthogEventsResult(null)

    try {
      const response = await fetch('/api/test/posthog-events?limit=50&hours=24', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()

      setPosthogEventsResult({
        success: true,
        message: `Found ${data.summary?.totalEvents || data.totalEvents} total events, ${data.summary?.customEventsFound || data.customEventsFound} custom events`,
        data: data
      })
    } catch (error) {
      setPosthogEventsResult({
        success: false,
        message: `Error: ${error.message}`,
        data: null
      })
    } finally {
      setPosthogEventsLoading(false)
    }
  }

  const handleTestListingAnalytics = async () => {
    if (listingAnalyticsLoading) {
      return
    }

    setListingAnalyticsLoading(true)
    setListingAnalyticsResult(null)

    try {
      const url = listingIdFilter 
        ? `/api/test/listing-analytics?listing_id=${listingIdFilter}&limit=100`
        : '/api/test/listing-analytics?limit=100'
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()

      setListingAnalyticsResult({
        success: true,
        message: `Found ${data.summary?.total_records || 0} records across ${data.summary?.unique_listings || 0} listings`,
        data: data
      })
    } catch (error) {
      setListingAnalyticsResult({
        success: false,
        message: `Error: ${error.message}`,
        data: null
      })
    } finally {
      setListingAnalyticsLoading(false)
    }
  }

  const handleTestLeadsSummary = async () => {
    if (leadsSummaryLoading) {
      return
    }

    setLeadsSummaryLoading(true)
    setLeadsSummaryResult(null)

    try {
      const url = leadsListingIdFilter 
        ? `/api/test/leads-summary?listing_id=${leadsListingIdFilter}&limit=100`
        : '/api/test/leads-summary?limit=100'
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()

      setLeadsSummaryResult({
        success: true,
        message: `Found ${data.summary?.total_lead_records || 0} lead records across ${data.summary?.unique_listings || 0} listings and ${data.summary?.unique_seekers || 0} seekers`,
        data: data
      })
    } catch (error) {
      setLeadsSummaryResult({
        success: false,
        message: `Error: ${error.message}`,
        data: null
      })
    } finally {
      setLeadsSummaryLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className=" mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">API Testing Dashboard</h1>
          <p className="text-gray-600 mb-6">Test your PostHog and Redis configurations</p>

          {/* PostHog Test Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">PostHog Analytics Test</h2>
            <button
              onClick={handleTestPostHog}
              disabled={posthogLoading}
              className="w-full bg-purple-600 text-white py-3 px-4 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors mb-4"
            >
              {posthogLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Testing PostHog...
                </span>
              ) : (
                'Test PostHog API'
              )}
            </button>

            {/* PostHog Result Display */}
            {posthogResult && (
              <div className={`p-4 rounded-lg ${posthogResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    {posthogResult.success ? (
                      <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </div>
                  <div className="ml-3 flex-1">
                    <h3 className={`text-sm font-medium ${posthogResult.success ? 'text-green-800' : 'text-red-800'}`}>
                      {posthogResult.success ? 'PostHog Success!' : 'PostHog Error'}
                    </h3>
                    <p className={`mt-1 text-sm ${posthogResult.success ? 'text-green-700' : 'text-red-700'}`}>
                      {posthogResult.message}
                    </p>
                    {posthogResult.data && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-600 font-medium">Response Data:</p>
                        <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto max-h-32">
                          {JSON.stringify(posthogResult.data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Cache Test Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Static Data Cache Test</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <button
                onClick={() => window.open('/cache-management', '_blank')}
                className="w-full bg-purple-600 text-white py-3 px-4 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium transition-colors"
              >
                Open Cache Management
              </button>
              
              <button
                onClick={async () => {
                  try {
                    const response = await fetch('/api/cache/static-data?action=stats')
                    const data = await response.json()
                    alert(`Cache Stats:\n${JSON.stringify(data.data, null, 2)}`)
                  } catch (error) {
                    alert(`Error: ${error.message}`)
                  }
                }}
                className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium transition-colors"
              >
                Check Cache Stats
              </button>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-800 mb-2">Cache Features</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• <strong>Infinite TTL:</strong> Static data cached indefinitely</li>
                <li>• <strong>Fast Access:</strong> Sub-millisecond response times</li>
                <li>• <strong>Auto-populate:</strong> Fresh data from database</li>
                <li>• <strong>Types:</strong> Categories, Purposes, Types, Subtypes, Amenities</li>
              </ul>
            </div>
          </div>

          {/* Analytics Cron Test Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Analytics Cron Job Test</h2>
            <button
              onClick={handleTestCron}
              disabled={cronLoading}
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors mb-4"
            >
              {cronLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Running Cron Job...
                </span>
              ) : (
                'Test Analytics Cron Job'
              )}
            </button>

            {/* Cron Result Display */}
            {cronResult && (
              <div className={`p-4 rounded-lg ${cronResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    {cronResult.success ? (
                      <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </div>
                  <div className="ml-3 flex-1">
                    <h3 className={`text-sm font-medium ${cronResult.success ? 'text-green-800' : 'text-red-800'}`}>
                      {cronResult.success ? 'Cron Job Success!' : 'Cron Job Error'}
                    </h3>
                    <p className={`mt-1 text-sm ${cronResult.success ? 'text-green-700' : 'text-red-700'}`}>
                      {cronResult.message}
                    </p>
                    {cronResult.data && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-600 font-medium">Response Data:</p>
                        <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto max-h-64">
                          {JSON.stringify(cronResult.data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* PostHog Events Test Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">PostHog Events Analysis</h2>
            <p className="text-sm text-gray-600 mb-4">
              Fetch and analyze all events from PostHog (last 24 hours, shows detailed breakdown)
            </p>
            <button
              onClick={handleTestPostHogEvents}
              disabled={posthogEventsLoading}
              className="w-full bg-teal-600 text-white py-3 px-4 rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors mb-4"
            >
              {posthogEventsLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analyzing Events...
                </span>
              ) : (
                'Analyze PostHog Events'
              )}
            </button>

            {/* PostHog Events Result Display */}
            {posthogEventsResult && posthogEventsResult.data && (
              <div className={`p-4 rounded-lg ${posthogEventsResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="space-y-4">
                  <div>
                    <h3 className={`text-sm font-medium ${posthogEventsResult.success ? 'text-green-800' : 'text-red-800'}`}>
                      {posthogEventsResult.success ? '✅ Events Analysis Complete' : '❌ Error'}
                    </h3>
                    <p className={`mt-1 text-sm ${posthogEventsResult.success ? 'text-green-700' : 'text-red-700'}`}>
                      {posthogEventsResult.message}
                    </p>
                  </div>

                  {posthogEventsResult.success && (
                    <>
                      {/* Summary */}
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <h4 className="font-semibold text-gray-900 mb-3">Summary</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <div className="text-gray-600">Total Events</div>
                            <div className="text-2xl font-bold text-blue-600">{posthogEventsResult.data.summary?.totalEvents || posthogEventsResult.data.totalEvents || 0}</div>
                          </div>
                          <div>
                            <div className="text-gray-600">Custom Events</div>
                            <div className="text-2xl font-bold text-green-600">{posthogEventsResult.data.summary?.customEventsFound || posthogEventsResult.data.customEventsFound || 0}</div>
                          </div>
                          <div>
                            <div className="text-gray-600">Unique Listings</div>
                            <div className="text-2xl font-bold text-purple-600">{posthogEventsResult.data.summary?.uniqueListingIds || 0}</div>
                          </div>
                          <div>
                            <div className="text-gray-600">Unique Users</div>
                            <div className="text-2xl font-bold text-orange-600">{posthogEventsResult.data.summary?.uniqueSeekerIds || 0}</div>
                          </div>
                        </div>
                      </div>

                      {/* Events by Table */}
                      {posthogEventsResult.data.eventsByTable && (
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                          <h4 className="font-semibold text-gray-900 mb-3">Events by Database Table</h4>
                          <div className="space-y-3">
                            {Object.entries(posthogEventsResult.data.eventsByTable).map(([table, data]) => (
                              <div key={table} className="border-l-4 border-blue-500 pl-3">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="font-medium text-gray-900">{table}</div>
                                    <div className="text-sm text-gray-600">{data.count} events found</div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-xs text-gray-500">Expected Events:</div>
                                    <div className="text-xs text-gray-700">{data.events.join(', ')}</div>
                                  </div>
                                </div>
                                {Object.keys(data.breakdown).length > 0 && (
                                  <div className="mt-2 space-y-1">
                                    {Object.entries(data.breakdown).map(([event, stats]) => (
                                      <div key={event} className="text-xs bg-gray-50 p-2 rounded">
                                        <span className="font-medium">{event}:</span> {stats.count} events
                                        {stats.with_listing_id > 0 && <span className="ml-2 text-green-600">✓ {stats.with_listing_id} with listing_id</span>}
                                        {stats.with_lister_id > 0 && <span className="ml-2 text-blue-600">✓ {stats.with_lister_id} with lister_id</span>}
                                        {stats.with_seeker_id > 0 && <span className="ml-2 text-purple-600">✓ {stats.with_seeker_id} with seeker_id</span>}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Events by Type - 5 Examples Each */}
                      {posthogEventsResult.data.eventsByType && (
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                          <h4 className="font-semibold text-gray-900 mb-3">5 Examples of Each Event Type</h4>
                          <div className="space-y-4 max-h-96 overflow-y-auto">
                            {Object.entries(posthogEventsResult.data.eventsByType).map(([eventName, eventList]) => (
                              <div key={eventName} className="border border-gray-200 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="font-semibold text-gray-900">{eventName}</div>
                                  <div className="text-sm text-gray-600">{eventList.length} examples</div>
                                </div>
                                <div className="space-y-2">
                                  {eventList.map((event, idx) => (
                                    <div key={idx} className="bg-gray-50 rounded p-2 text-xs">
                                      <div className="grid grid-cols-2 gap-2 mb-1">
                                        <div>
                                          <span className="font-medium">Timestamp:</span> {new Date(event.timestamp).toLocaleString()}
                                        </div>
                                        <div>
                                          <span className="font-medium">User:</span> {event.distinct_id?.substring(0, 8)}...
                                        </div>
                                      </div>
                                      <div className="grid grid-cols-3 gap-2 text-xs">
                                        <div>
                                          <span className="font-medium text-green-600">Listing:</span> {event.properties?.listing_id ? event.properties.listing_id.substring(0, 8) + '...' : 'N/A'}
                                        </div>
                                        <div>
                                          <span className="font-medium text-blue-600">Lister:</span> {event.properties?.lister_id ? event.properties.lister_id.substring(0, 8) + '...' : 'N/A'}
                                        </div>
                                        <div>
                                          <span className="font-medium text-purple-600">Seeker:</span> {event.properties?.seeker_id ? event.properties.seeker_id.substring(0, 8) + '...' : 'N/A'}
                                        </div>
                                      </div>
                                      {event.properties?.viewed_from && (
                                        <div className="mt-1 text-xs text-gray-500">
                                          Viewed from: {event.properties.viewed_from}
                                        </div>
                                      )}
                                      {event.properties?.platform && (
                                        <div className="mt-1 text-xs text-gray-500">
                                          Platform: {event.properties.platform}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Event Breakdown */}
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <h4 className="font-semibold text-gray-900 mb-3">All Events Breakdown</h4>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {posthogEventsResult.data.eventBreakdown?.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between text-sm border-b border-gray-100 pb-2">
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">{item.event}</div>
                                <div className="text-xs text-gray-600">
                                  Count: {item.count} | 
                                  Listing ID: {item.has_listing_id}/{item.count} | 
                                  Lister ID: {item.has_lister_id}/{item.count} | 
                                  Seeker ID: {item.has_seeker_id}/{item.count}
                                </div>
                                {item.sample_properties && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    Sample: listing_id={item.sample_properties.listing_id?.substring(0, 8) || 'N/A'}, 
                                    lister_id={item.sample_properties.lister_id?.substring(0, 8) || 'N/A'}
                                  </div>
                                )}
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold text-blue-600">{item.count}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Full Data (Collapsible) */}
                      <details className="bg-white rounded-lg p-4 border border-gray-200">
                        <summary className="cursor-pointer font-semibold text-gray-900">View Full Response Data</summary>
                        <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-auto max-h-96">
                          {JSON.stringify(posthogEventsResult.data, null, 2)}
                        </pre>
                      </details>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Listing Analytics Summary Test Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Listing Analytics Summary</h2>
            <p className="text-sm text-gray-600 mb-4">
              View aggregated listing analytics data from the database, grouped by listing ID
            </p>
            
            <div className="mb-4">
              <label htmlFor="listingIdFilter" className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Listing ID (optional)
              </label>
              <input
                type="text"
                id="listingIdFilter"
                value={listingIdFilter}
                onChange={(e) => setListingIdFilter(e.target.value)}
                placeholder="Enter listing ID to filter..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-2"
              />
            </div>

            <button
              onClick={handleTestListingAnalytics}
              disabled={listingAnalyticsLoading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors mb-4"
            >
              {listingAnalyticsLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading Analytics...
                </span>
              ) : (
                'Fetch Listing Analytics Summary'
              )}
            </button>

            {/* Listing Analytics Result Display */}
            {listingAnalyticsResult && listingAnalyticsResult.data && (
              <div className={`p-4 rounded-lg ${listingAnalyticsResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="space-y-4">
                  <div>
                    <h3 className={`text-sm font-medium ${listingAnalyticsResult.success ? 'text-green-800' : 'text-red-800'}`}>
                      {listingAnalyticsResult.success ? '✅ Listing Analytics Summary' : '❌ Error'}
                    </h3>
                    <p className={`mt-1 text-sm ${listingAnalyticsResult.success ? 'text-green-700' : 'text-red-700'}`}>
                      {listingAnalyticsResult.message}
                    </p>
                  </div>

                  {listingAnalyticsResult.success && (
                    <>
                      {/* Summary Stats */}
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <h4 className="font-semibold text-gray-900 mb-3">Summary</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <div className="text-gray-600">Total Records</div>
                            <div className="text-2xl font-bold text-blue-600">{listingAnalyticsResult.data.summary?.total_records || 0}</div>
                          </div>
                          <div>
                            <div className="text-gray-600">Unique Listings</div>
                            <div className="text-2xl font-bold text-green-600">{listingAnalyticsResult.data.summary?.unique_listings || 0}</div>
                          </div>
                          {listingAnalyticsResult.data.summary?.filtered_by_listing_id && (
                            <div>
                              <div className="text-gray-600">Filtered By</div>
                              <div className="text-xs font-mono text-purple-600 break-all">{listingAnalyticsResult.data.summary.filtered_by_listing_id}</div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* By Listing */}
                      {listingAnalyticsResult.data.by_listing && listingAnalyticsResult.data.by_listing.length > 0 && (
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                          <h4 className="font-semibold text-gray-900 mb-3">Analytics by Listing</h4>
                          <div className="space-y-4 max-h-96 overflow-y-auto">
                            {listingAnalyticsResult.data.by_listing.map((listing, idx) => (
                              <div key={idx} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <div>
                                    <div className="font-semibold text-gray-900">Listing ID</div>
                                    <div className="text-xs font-mono text-gray-600 break-all">{listing.listing_id}</div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-sm text-gray-600">Records</div>
                                    <div className="text-lg font-bold text-blue-600">{listing.total_records}</div>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
                                  <div>
                                    <div className="text-gray-600">Total Views</div>
                                    <div className="font-bold text-blue-600">{listing.totals.total_views}</div>
                                  </div>
                                  <div>
                                    <div className="text-gray-600">Unique Views</div>
                                    <div className="font-bold text-green-600">{listing.totals.unique_views}</div>
                                  </div>
                                  <div>
                                    <div className="text-gray-600">Total Impressions</div>
                                    <div className="font-bold text-purple-600">{listing.totals.total_impressions}</div>
                                  </div>
                                  <div>
                                    <div className="text-gray-600">Total Leads</div>
                                    <div className="font-bold text-orange-600">{listing.totals.total_leads}</div>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs mb-3">
                                  <div>
                                    <div className="text-gray-600">Phone Leads</div>
                                    <div className="font-medium">{listing.totals.phone_leads}</div>
                                  </div>
                                  <div>
                                    <div className="text-gray-600">Message Leads</div>
                                    <div className="font-medium">{listing.totals.message_leads}</div>
                                  </div>
                                  <div>
                                    <div className="text-gray-600">Email Leads</div>
                                    <div className="font-medium">{listing.totals.email_leads}</div>
                                  </div>
                                  <div>
                                    <div className="text-gray-600">Appointment Leads</div>
                                    <div className="font-medium">{listing.totals.appointment_leads}</div>
                                  </div>
                                </div>

                                <div className="text-xs text-gray-500">
                                  Date Range: {listing.date_range.earliest} to {listing.date_range.latest}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  Conversion Rate: {listing.averages.conversion_rate}% | 
                                  Lead to Sale: {listing.averages.lead_to_sale_rate}%
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Leads Summary Test Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Leads Summary</h2>
            <p className="text-sm text-gray-600 mb-4">
              View aggregated leads data from the database, grouped by listing ID and seeker ID
            </p>
            
            <div className="mb-4">
              <label htmlFor="leadsListingIdFilter" className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Listing ID (optional)
              </label>
              <input
                type="text"
                id="leadsListingIdFilter"
                value={leadsListingIdFilter}
                onChange={(e) => setLeadsListingIdFilter(e.target.value)}
                placeholder="Enter listing ID to filter..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-2"
              />
            </div>

            <button
              onClick={handleTestLeadsSummary}
              disabled={leadsSummaryLoading}
              className="w-full bg-orange-600 text-white py-3 px-4 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors mb-4"
            >
              {leadsSummaryLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading Leads...
                </span>
              ) : (
                'Fetch Leads Summary'
              )}
            </button>

            {/* Leads Summary Result Display */}
            {leadsSummaryResult && leadsSummaryResult.data && (
              <div className={`p-4 rounded-lg ${leadsSummaryResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="space-y-4">
                  <div>
                    <h3 className={`text-sm font-medium ${leadsSummaryResult.success ? 'text-green-800' : 'text-red-800'}`}>
                      {leadsSummaryResult.success ? '✅ Leads Summary' : '❌ Error'}
                    </h3>
                    <p className={`mt-1 text-sm ${leadsSummaryResult.success ? 'text-green-700' : 'text-red-700'}`}>
                      {leadsSummaryResult.message}
                    </p>
                  </div>

                  {leadsSummaryResult.success && (
                    <>
                      {/* Summary Stats */}
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <h4 className="font-semibold text-gray-900 mb-3">Summary</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <div className="text-gray-600">Total Lead Records</div>
                            <div className="text-2xl font-bold text-blue-600">{leadsSummaryResult.data.summary?.total_lead_records || 0}</div>
                          </div>
                          <div>
                            <div className="text-gray-600">Unique Listings</div>
                            <div className="text-2xl font-bold text-green-600">{leadsSummaryResult.data.summary?.unique_listings || 0}</div>
                          </div>
                          <div>
                            <div className="text-gray-600">Unique Seekers</div>
                            <div className="text-2xl font-bold text-purple-600">{leadsSummaryResult.data.summary?.unique_seekers || 0}</div>
                          </div>
                          <div>
                            <div className="text-gray-600">Total Actions</div>
                            <div className="text-2xl font-bold text-orange-600">{leadsSummaryResult.data.summary?.total_actions || 0}</div>
                          </div>
                        </div>
                      </div>

                      {/* By Listing */}
                      {leadsSummaryResult.data.by_listing && leadsSummaryResult.data.by_listing.length > 0 && (
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                          <h4 className="font-semibold text-gray-900 mb-3">Leads by Listing</h4>
                          <div className="space-y-4 max-h-96 overflow-y-auto">
                            {leadsSummaryResult.data.by_listing.map((listing, idx) => (
                              <div key={idx} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <div>
                                    <div className="font-semibold text-gray-900">Listing ID</div>
                                    <div className="text-xs font-mono text-gray-600 break-all">{listing.listing_id}</div>
                                    <div className="text-xs text-gray-500 mt-1">
                                      Lister: {listing.lister_id?.substring(0, 8)}... ({listing.lister_type})
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-sm text-gray-600">Lead Records</div>
                                    <div className="text-lg font-bold text-blue-600">{listing.total_lead_records}</div>
                                    <div className="text-xs text-gray-500">Unique Seekers: {listing.unique_seekers}</div>
                                  </div>
                                </div>

                                <div className="mb-3">
                                  <div className="text-sm font-medium text-gray-700 mb-2">Action Types</div>
                                  <div className="flex flex-wrap gap-2">
                                    {Object.entries(listing.action_types || {}).map(([actionType, count]) => (
                                      <div key={actionType} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                                        {actionType}: {count}
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                <div className="mb-3">
                                  <div className="text-sm font-medium text-gray-700 mb-2">Status Breakdown</div>
                                  <div className="flex flex-wrap gap-2">
                                    {Object.entries(listing.status_breakdown || {}).map(([status, count]) => (
                                      <div key={status} className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                                        {status}: {count}
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                <div className="text-xs text-gray-500">
                                  Date Range: {listing.date_range.earliest} to {listing.date_range.latest} | 
                                  Total Actions: {listing.total_actions}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Recent Actions */}
                      {leadsSummaryResult.data.recent_actions && leadsSummaryResult.data.recent_actions.length > 0 && (
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                          <h4 className="font-semibold text-gray-900 mb-3">Recent Actions</h4>
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {leadsSummaryResult.data.recent_actions.map((action, idx) => (
                              <div key={idx} className="bg-gray-50 rounded p-2 text-xs">
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <span className="font-medium">Action:</span> {action.action_type}
                                  </div>
                                  <div>
                                    <span className="font-medium">Date:</span> {new Date(action.action_timestamp).toLocaleString()}
                                  </div>
                                </div>
                                <div className="text-gray-600 mt-1">
                                  Listing: {action.listing_id?.substring(0, 8)}... | 
                                  Seeker: {action.seeker_id?.substring(0, 8)}...
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* COMMENTED OUT: Redis Test Section (migrated to PostHog-only approach) */}
          {false && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Redis Cache Test</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="redisKey" className="block text-sm font-medium text-gray-700 mb-1">
                  Key
                </label>
                <input
                  type="text"
                  id="redisKey"
                  value={redisKey}
                  onChange={(e) => setRedisKey(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter Redis key"
                />
              </div>
              <div>
                <label htmlFor="redisValue" className="block text-sm font-medium text-gray-700 mb-1">
                  Value
                </label>
                <input
                  type="text"
                  id="redisValue"
                  value={redisValue}
                  onChange={(e) => setRedisValue(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter Redis value"
                />
              </div>
            </div>

            {/* Redis Operation Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <button
                onClick={handleTestRedisSet}
                disabled={redisLoading}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
              >
                {redisLoading && redisOperation === 'set' ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Setting...
                  </span>
                ) : (
                  'Set Key-Value'
                )}
              </button>

              <button
                onClick={handleTestRedisGet}
                disabled={redisLoading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
              >
                {redisLoading && redisOperation === 'get' ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Getting...
                  </span>
                ) : (
                  'Get Value by Key'
                )}
              </button>
            </div>

            <div>
            {redisResult && (
              <div className={`p-4 rounded-lg ${redisResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    {redisResult.success ? (
                      <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </div>
                  <div className="ml-3 flex-1">
                    <h3 className={`text-sm font-medium ${redisResult.success ? 'text-green-800' : 'text-red-800'}`}>
                      {redisResult.success ? `Redis ${redisOperation.toUpperCase()} Success!` : `Redis ${redisOperation.toUpperCase()} Error`}
                    </h3>
                    <p className={`mt-1 text-sm ${redisResult.success ? 'text-green-700' : 'text-red-700'}`}>
                      {redisResult.message}
                    </p>
                    {redisResult.data && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-600 font-medium">Response Data:</p>
                        <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto max-h-32">
                          {JSON.stringify(redisResult.data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          </div>
          )}

          {/* Album Gallery Test Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Album Gallery Test</h2>
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <AlbumGallery
                albums={albums}
                onAlbumsChange={setAlbums}
                mode="edit"
              />
            </div>
            
            {/* Albums Data Preview */}
            {albums.length > 0 && (
              <div className="mt-4 bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Albums Data (JSON):</h3>
                <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-64">
                  {JSON.stringify(albums, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Environment Info */}
          <div className="pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Configuration Status</h3>
            <div className="space-y-1 text-xs text-gray-600">
              <p>
                <span className="font-medium">PostHog API Key:</span>{' '}
                {process.env.NEXT_PUBLIC_POSTHOG_KEY 
                  ? '✅ Configured' 
                  : '❌ Not configured'}
              </p>
              <p>
                <span className="font-medium">PostHog Host:</span>{' '}
                {process.env.NEXT_PUBLIC_POSTHOG_HOST 
                  ? '✅ Configured' 
                  : '❌ Not configured'}
              </p>
              <p>
                <span className="font-medium">Redis Host:</span>{' '}
                {process.env.REDIS_HOST ? `✅ ${process.env.REDIS_HOST}` : '❌ Not configured'}
              </p>
              <p>
                <span className="font-medium">Redis Port:</span>{' '}
                {process.env.REDIS_PORT ? `✅ ${process.env.REDIS_PORT}` : '❌ Not configured'}
              </p>
              <p>
                <span className="font-medium">Redis Password:</span>{' '}
                {process.env.REDIS_PASSWORD ? '✅ Configured' : '❌ Not configured'}
              </p>
              <p>
                <span className="font-medium">Cron Secret:</span>{' '}
                {process.env.NEXT_PUBLIC_CRON_SECRET || process.env.CRON_SECRET
                  ? '✅ Configured' 
                  : '❌ Not configured'}
              </p>
              <p className="text-orange-600 mt-2">
                ⚠️ Make sure your Redis Cloud credentials are correct in .env.local
              </p>
              <p className="text-blue-600 mt-2">
                💡 Click the test buttons above to check API connectivity and see real data
              </p>
              <p className="text-purple-600 mt-2">
                🔄 The cron job will fetch events from PostHog and aggregate them into your database
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})

TestPage.displayName = 'TestPage'

export default TestPage
