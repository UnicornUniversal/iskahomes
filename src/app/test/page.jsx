'use client'
import React, { useState, useCallback, memo, useMemo } from 'react'
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

  const [comparisonLoading, setComparisonLoading] = useState(false)
  const [comparisonResult, setComparisonResult] = useState(null)
  const [comparisonUserId, setComparisonUserId] = useState('')
  const [comparisonUserType, setComparisonUserType] = useState('developer')
  const [comparisonStartDate, setComparisonStartDate] = useState(() => {
    const date = new Date()
    date.setUTCDate(date.getUTCDate() - 7)
    return date.toISOString().split('T')[0]
  })
  const [comparisonEndDate, setComparisonEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0]
  })

  const defaultUTC = useMemo(() => {
    const now = new Date()
    return {
      year: now.getUTCFullYear(),
      month: now.getUTCMonth() + 1,
    }
  }, [])

  const [timeSeriesYear, setTimeSeriesYear] = useState(() => String(defaultUTC.year))
  const [timeSeriesMonth, setTimeSeriesMonth] = useState(() => String(defaultUTC.month))
  const [timeSeriesIgnoreLastRun, setTimeSeriesIgnoreLastRun] = useState(false)
  const [timeSeriesLoading, setTimeSeriesLoading] = useState(false)
  const [timeSeriesProgress, setTimeSeriesProgress] = useState([])
  const [timeSeriesResult, setTimeSeriesResult] = useState(null)

  const resolvedTimeSeriesYear = Number(timeSeriesYear) || defaultUTC.year
  const resolvedTimeSeriesMonth = Math.min(12, Math.max(1, Number(timeSeriesMonth) || defaultUTC.month))

  const runAnalyticsCron = useCallback(async (queryParams = {}) => {
    const params = new URLSearchParams()
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return
      params.append(key, String(value))
    })
    const queryString = params.toString() ? `?${params.toString()}` : ''

    const response = await fetch(`/api/cron/analytics${queryString}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    })

    let data = null
    try {
      data = await response.json()
    } catch (error) {
      data = { error: 'Unable to parse response JSON' }
    }

    return { ok: response.ok, data }
  }, [])


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
      const { ok, data } = await runAnalyticsCron({
        testMode: 'true',
        ignoreLastRun: 'true'
      })

      if (ok) {
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

  const buildTimeSeriesQuery = useCallback(() => {
    return {
      testTimeSeries: 'true',
      testYear: String(resolvedTimeSeriesYear),
      testMonth: String(resolvedTimeSeriesMonth),
      ignoreLastRun: timeSeriesIgnoreLastRun ? 'true' : 'false'
    }
  }, [
    resolvedTimeSeriesYear,
    resolvedTimeSeriesMonth,
    timeSeriesIgnoreLastRun
  ])

  const formatCronRunEntry = useCallback((response, index) => {
    return {
      index,
      ok: response.ok,
      runId: response.data?.run_id,
      date: response.data?.date ?? response.data?.target_date ?? null,
      hour: response.data?.hour ?? response.data?.target_hour ?? null,
      message: response.data?.message || response.data?.status_message || response.data?.error || null,
      completed: response.data?.completed || false,
      data: response.data || null
    }
  }, [])

  const handleTimeSeriesSingleRun = useCallback(async () => {
    const query = buildTimeSeriesQuery()
    setTimeSeriesLoading(true)
    setTimeSeriesProgress([])
    setTimeSeriesResult(null)

    try {
      const response = await runAnalyticsCron(query)
      const entry = formatCronRunEntry(response, 1)
      setTimeSeriesProgress([entry])
      setTimeSeriesResult({
        success: response.ok,
        runs: [entry],
        completed: entry.completed
      })
    } catch (error) {
      setTimeSeriesResult({
        success: false,
        runs: [],
        error: error.message
      })
    } finally {
      setTimeSeriesLoading(false)
    }
  }, [buildTimeSeriesQuery, formatCronRunEntry, runAnalyticsCron])

  const handleTimeSeriesBatchRun = useCallback(async () => {
    const query = buildTimeSeriesQuery()
    setTimeSeriesLoading(true)
    setTimeSeriesProgress([])
    setTimeSeriesResult(null)

    const runs = []
    let runCount = 0
    const maxRuns = 1000 // Safety limit to prevent infinite loops

    try {
      while (runCount < maxRuns) {
        runCount++
        const response = await runAnalyticsCron(query)
        const entry = formatCronRunEntry(response, runCount)
        runs.push(entry)
        setTimeSeriesProgress(prev => [...prev, entry])

        // Stop if there's an error or if the cron reports completion
        if (!response.ok || entry.completed) {
          break
        }
      }

      if (runCount >= maxRuns) {
        console.warn(`Reached safety limit of ${maxRuns} runs`)
      }

      setTimeSeriesResult({
        success: runs.length > 0 && runs.every(run => run.ok),
        runs,
        completed: runs.some(run => run.completed),
        totalRuns: runs.length
      })
    } catch (error) {
      setTimeSeriesResult({
        success: false,
        runs,
        error: error.message
      })
    } finally {
      setTimeSeriesLoading(false)
    }
  }, [
    buildTimeSeriesQuery,
    formatCronRunEntry,
    runAnalyticsCron
  ])

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

  const handleComparison = async () => {
    if (comparisonLoading || !comparisonUserId) {
      return
    }

    setComparisonLoading(true)
    setComparisonResult(null)

    try {
      const params = new URLSearchParams({
        userId: comparisonUserId,
        userType: comparisonUserType,
        startDate: comparisonStartDate,
        endDate: comparisonEndDate
      })

      const response = await fetch(`/api/test/comparison?${params.toString()}`, {
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

      setComparisonResult({
        success: true,
        message: `Comparison complete: ${data.summary?.matchRate || 0}% match rate`,
        data: data
      })
    } catch (error) {
      setComparisonResult({
        success: false,
        message: `Error: ${error.message}`,
        data: null
      })
    } finally {
      setComparisonLoading(false)
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

          {/* Time-Series Simulation Section */}
          <div className="mb-8">
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-indigo-900 mb-2">Time-Series Simulation</h2>
              <p className="text-sm text-indigo-700 mb-4">
                Process all available days automatically. Each day will be fully processed (all hours with events).
                The simulation will continue until all days are processed or no more events are found.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-indigo-900 mb-1">Start Year (UTC)</label>
                  <input
                    type="number"
                    min="2000"
                    value={timeSeriesYear}
                    onChange={(e) => setTimeSeriesYear(e.target.value)}
                    className="w-full px-3 py-2 border border-indigo-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-xs text-indigo-700 mt-1">Processing starts from this year</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-indigo-900 mb-1">Start Month (1-12)</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={timeSeriesMonth}
                    onChange={(e) => setTimeSeriesMonth(e.target.value)}
                    className="w-full px-3 py-2 border border-indigo-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-xs text-indigo-700 mt-1">Processing starts from day 1 of this month</p>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <input
                  id="timeSeriesIgnore"
                  type="checkbox"
                  className="h-4 w-4 text-indigo-600 border-indigo-300 rounded"
                  checked={timeSeriesIgnoreLastRun}
                  onChange={(e) => setTimeSeriesIgnoreLastRun(e.target.checked)}
                />
                <label htmlFor="timeSeriesIgnore" className="text-sm text-indigo-900">
                  Ignore last run (restart from the start date)
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <button
                  onClick={handleTimeSeriesSingleRun}
                  disabled={timeSeriesLoading}
                  className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                >
                  {timeSeriesLoading ? 'Processing Day...' : 'Process Next Day'}
                </button>
                <button
                  onClick={handleTimeSeriesBatchRun}
                  disabled={timeSeriesLoading}
                  className="w-full bg-purple-600 text-white py-3 px-4 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                >
                  {timeSeriesLoading
                    ? 'Processing All Days...'
                    : 'Process All Available Days'}
                </button>
              </div>

              {timeSeriesProgress.length > 0 && (
                <div className="mt-6 bg-white border border-indigo-100 rounded-lg p-4 max-h-72 overflow-y-auto">
                  <h3 className="text-sm font-semibold text-indigo-900 mb-3">Run Progress</h3>
                  <div className="space-y-2">
                    {timeSeriesProgress.map((entry) => (
                      <div
                        key={`${entry.index}-${entry.runId || entry.date || entry.message || 'run'}`}
                        className={`p-3 rounded-md border ${
                          entry.ok ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                        }`}
                      >
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">
                            Run {entry.index}: {entry.ok ? '✅ Success' : '❌ Error'}
                          </span>
                          <span className="text-xs text-gray-600">
                            {entry.runId ? entry.runId.substring(0, 8) : '—'}
                          </span>
                        </div>
                        <div className="text-xs text-gray-700 mt-1">
                          Date: {entry.date || 'N/A'} | Hour: {entry.hour ?? '—'}
                        </div>
                        {entry.message && (
                          <div className="text-xs text-gray-600 mt-1">Note: {entry.message}</div>
                        )}
                        {entry.completed && (
                          <div className="text-xs text-indigo-700 mt-1 font-semibold">
                            Simulation reported completion for the configured range.
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {timeSeriesResult?.error && (
                <div className="mt-4 p-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-700">
                  Error: {timeSeriesResult.error}
                </div>
              )}

              {timeSeriesResult?.runs?.length > 0 && (
                <div className="mt-4 text-sm text-indigo-900">
                  <p>
                    Completed {timeSeriesResult.totalRuns || timeSeriesResult.runs.length} day(s).{' '}
                    {timeSeriesResult.completed
                      ? 'All available days have been processed. The simulation is complete.'
                      : 'You can continue running to process more days.'}
                  </p>
                </div>
              )}
            </div>
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
                <div className="space-y-4">
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
                        {cronResult.success ? '✅ Cron Job Success!' : '❌ Cron Job Error'}
                    </h3>
                    <p className={`mt-1 text-sm ${cronResult.success ? 'text-green-700' : 'text-red-700'}`}>
                      {cronResult.message}
                    </p>
                    </div>
                  </div>

                  {cronResult.success && cronResult.data && (
                    <>
                      {/* Summary Stats */}
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <h4 className="font-semibold text-gray-900 mb-3">Run Summary</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                          <div>
                            <div className="text-gray-600">Date</div>
                            <div className="text-lg font-bold text-blue-600">{cronResult.data.date || 'N/A'}</div>
                          </div>
                          <div>
                            <div className="text-gray-600">Hour</div>
                            <div className="text-lg font-bold text-purple-600">{cronResult.data.hour !== undefined ? `${cronResult.data.hour}:00` : 'N/A'}</div>
                          </div>
                          <div>
                            <div className="text-gray-600">Run ID</div>
                            <div className="text-xs font-mono text-gray-600 break-all">{cronResult.data.run_id?.substring(0, 8)}...</div>
                          </div>
                          <div>
                            <div className="text-gray-600">Time Range</div>
                            <div className="text-xs text-gray-600">{cronResult.data.timeRange?.hours || 'N/A'} hours</div>
                          </div>
                        </div>

                        {/* Events Summary */}
                        {cronResult.data.events && (
                          <div className="border-t border-gray-200 pt-4">
                            <h5 className="font-semibold text-gray-900 mb-2">Events Processed</h5>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                              <div>
                                <div className="text-gray-600">Total Events</div>
                                <div className="font-bold text-blue-600">{cronResult.data.events.total || 0}</div>
                              </div>
                              <div>
                                <div className="text-gray-600">Custom Events</div>
                                <div className="font-bold text-green-600">{cronResult.data.events.custom || 0}</div>
                              </div>
                              <div>
                                <div className="text-gray-600">Lead Events</div>
                                <div className="font-bold text-orange-600">{cronResult.data.events.lead_events || 0}</div>
                              </div>
                              <div>
                                <div className="text-gray-600">PostHog API Calls</div>
                                <div className="font-bold text-purple-600">{cronResult.data.posthog?.api_calls || 0}</div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Records Processed */}
                        {cronResult.data.processed && (
                          <div className="border-t border-gray-200 pt-4 mt-4">
                            <h5 className="font-semibold text-gray-900 mb-2">Records Processed</h5>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                              <div>
                                <div className="text-gray-600">Listings</div>
                                <div className="font-bold text-blue-600">{cronResult.data.processed.listings || 0}</div>
                              </div>
                              <div>
                                <div className="text-gray-600">Users</div>
                                <div className="font-bold text-green-600">{cronResult.data.processed.users || 0}</div>
                              </div>
                              <div>
                                <div className="text-gray-600">Developments</div>
                                <div className="font-bold text-purple-600">{cronResult.data.processed.developments || 0}</div>
                              </div>
                              <div>
                                <div className="text-gray-600">Leads</div>
                                <div className="font-bold text-orange-600">{cronResult.data.processed.leads || 0}</div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Records Inserted */}
                        {cronResult.data.inserted && (
                          <div className="border-t border-gray-200 pt-4 mt-4">
                            <h5 className="font-semibold text-gray-900 mb-2">Records Inserted</h5>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                              <div>
                                <div className="text-gray-600">Listings</div>
                                <div className={`font-bold ${cronResult.data.inserted.listings?.inserted > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                                  {cronResult.data.inserted.listings?.inserted || 0}
                                </div>
                                {cronResult.data.inserted.listings?.errors?.length > 0 && (
                                  <div className="text-xs text-red-600">{cronResult.data.inserted.listings.errors.length} errors</div>
                                )}
                              </div>
                              <div>
                                <div className="text-gray-600">Users</div>
                                <div className={`font-bold ${cronResult.data.inserted.users?.inserted > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                                  {cronResult.data.inserted.users?.inserted || 0}
                                </div>
                                {cronResult.data.inserted.users?.errors?.length > 0 && (
                                  <div className="text-xs text-red-600">{cronResult.data.inserted.users.errors.length} errors</div>
                                )}
                              </div>
                              <div>
                                <div className="text-gray-600">Developments</div>
                                <div className={`font-bold ${cronResult.data.inserted.developments?.inserted > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                                  {cronResult.data.inserted.developments?.inserted || 0}
                                </div>
                                {cronResult.data.inserted.developments?.errors?.length > 0 && (
                                  <div className="text-xs text-red-600">{cronResult.data.inserted.developments.errors.length} errors</div>
                                )}
                              </div>
                              <div>
                                <div className="text-gray-600">Leads</div>
                                <div className={`font-bold ${cronResult.data.inserted.leads?.inserted > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                                  {cronResult.data.inserted.leads?.inserted || 0}
                                </div>
                                {cronResult.data.inserted.leads?.errors?.length > 0 && (
                                  <div className="text-xs text-red-600">{cronResult.data.inserted.leads.errors.length} errors</div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Event Breakdown */}
                        {cronResult.data.events?.breakdown && Object.keys(cronResult.data.events.breakdown).length > 0 && (
                          <div className="border-t border-gray-200 pt-4 mt-4">
                            <h5 className="font-semibold text-gray-900 mb-2">Event Breakdown</h5>
                            <div className="space-y-1 max-h-32 overflow-y-auto">
                              {Object.entries(cronResult.data.events.breakdown).map(([eventName, count]) => (
                                <div key={eventName} className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded">
                                  <span className="font-medium text-gray-700">{eventName}</span>
                                  <span className="font-bold text-blue-600">{count}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Time Range Details */}
                        {cronResult.data.timeRange && (
                          <div className="border-t border-gray-200 pt-4 mt-4">
                            <h5 className="font-semibold text-gray-900 mb-2">Time Range</h5>
                            <div className="text-xs text-gray-600 space-y-1">
                              <div><span className="font-medium">Start:</span> {new Date(cronResult.data.timeRange.start).toLocaleString()}</div>
                              <div><span className="font-medium">End:</span> {new Date(cronResult.data.timeRange.end).toLocaleString()}</div>
                              <div><span className="font-medium">Duration:</span> {cronResult.data.timeRange.hours} hours</div>
                            </div>
                          </div>
                        )}

                        {/* Errors and Warnings */}
                        {cronResult.data.errors && (
                          <div className={`border-t border-gray-200 pt-4 mt-4 ${cronResult.data.errors.total_errors > 0 || cronResult.data.errors.total_warnings > 0 ? 'border-red-200' : 'border-green-200'}`}>
                            <h5 className={`font-semibold mb-2 ${cronResult.data.errors.total_errors > 0 ? 'text-red-900' : cronResult.data.errors.total_warnings > 0 ? 'text-yellow-900' : 'text-green-900'}`}>
                              Errors & Warnings
                            </h5>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
                              <div>
                                <div className="text-gray-600">Total Errors</div>
                                <div className={`text-lg font-bold ${cronResult.data.errors.total_errors > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                  {cronResult.data.errors.total_errors || 0}
                                </div>
                              </div>
                              <div>
                                <div className="text-gray-600">Total Warnings</div>
                                <div className={`text-lg font-bold ${cronResult.data.errors.total_warnings > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                                  {cronResult.data.errors.total_warnings || 0}
                                </div>
                              </div>
                              <div>
                                <div className="text-gray-600">Error Categories</div>
                                <div className="text-lg font-bold text-blue-600">
                                  {Object.keys(cronResult.data.errors.errors_by_category || {}).length}
                                </div>
                              </div>
                              <div>
                                <div className="text-gray-600">Status</div>
                                <div className={`text-sm font-bold ${cronResult.data.errors.total_errors > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                  {cronResult.data.errors.total_errors > 0 ? '⚠️ Has Errors' : '✅ Clean'}
                                </div>
                              </div>
                            </div>

                            {/* Errors by Category */}
                            {cronResult.data.errors.errors_by_category && Object.keys(cronResult.data.errors.errors_by_category).length > 0 && (
                              <div className="mb-3">
                                <div className="text-xs font-medium text-gray-700 mb-2">Errors by Category:</div>
                                <div className="flex flex-wrap gap-2">
                                  {Object.entries(cronResult.data.errors.errors_by_category).map(([category, count]) => (
                                    <div key={category} className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">
                                      {category}: {count}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Error Details */}
                            {cronResult.data.errors.errors && cronResult.data.errors.errors.length > 0 && (
                              <details className="mt-3">
                                <summary className="cursor-pointer text-sm font-medium text-red-700 hover:text-red-800">
                                  View {cronResult.data.errors.errors.length} Error(s)
                                </summary>
                                <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
                                  {cronResult.data.errors.errors.map((error, idx) => (
                                    <div key={idx} className="bg-red-50 border border-red-200 rounded p-2 text-xs">
                                      <div className="font-semibold text-red-900">{error.category}: {error.message}</div>
                                      <div className="text-red-700 mt-1">
                                        <div className="text-gray-600">Time: {new Date(error.timestamp).toLocaleString()}</div>
                                        {error.details && Object.keys(error.details).length > 0 && (
                                          <details className="mt-1">
                                            <summary className="cursor-pointer text-red-600">Details</summary>
                                            <pre className="mt-1 text-xs bg-red-100 p-2 rounded overflow-auto">
                                              {JSON.stringify(error.details, null, 2)}
                                            </pre>
                                          </details>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </details>
                            )}

                            {/* Warning Details */}
                            {cronResult.data.errors.warnings && cronResult.data.errors.warnings.length > 0 && (
                              <details className="mt-3">
                                <summary className="cursor-pointer text-sm font-medium text-yellow-700 hover:text-yellow-800">
                                  View {cronResult.data.errors.warnings.length} Warning(s)
                                </summary>
                                <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
                                  {cronResult.data.errors.warnings.map((warning, idx) => (
                                    <div key={idx} className="bg-yellow-50 border border-yellow-200 rounded p-2 text-xs">
                                      <div className="font-semibold text-yellow-900">{warning.category}: {warning.message}</div>
                                      <div className="text-yellow-700 mt-1">
                                        <div className="text-gray-600">Time: {new Date(warning.timestamp).toLocaleString()}</div>
                                        {warning.details && Object.keys(warning.details).length > 0 && (
                                          <details className="mt-1">
                                            <summary className="cursor-pointer text-yellow-600">Details</summary>
                                            <pre className="mt-1 text-xs bg-yellow-100 p-2 rounded overflow-auto">
                                              {JSON.stringify(warning.details, null, 2)}
                                            </pre>
                                          </details>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </details>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Conversion Rate Explanation */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <h4 className="font-semibold text-blue-900 mb-2">📊 Conversion Rate Calculations Explained</h4>
                        <div className="space-y-2 text-sm text-blue-800">
                          <div>
                            <strong>For Listings:</strong>
                            <ul className="ml-4 mt-1 space-y-1 text-xs">
                              <li>• <strong>Conversion Rate</strong> = (Total Leads ÷ Total Views) × 100</li>
                              <li>• <strong>Lead to Sale Rate</strong> = (Total Sales ÷ Total Leads) × 100</li>
                              <li>Example: 100 views, 5 leads, 1 sale → 5% conversion, 20% lead-to-sale</li>
                            </ul>
                          </div>
                          <div>
                            <strong>For Users (Developers/Agents):</strong>
                            <ul className="ml-4 mt-1 space-y-1 text-xs">
                              <li>• <strong>Overall Conversion Rate</strong> = (Total Leads ÷ Total Views) × 100</li>
                              <li>• <strong>Total Views</strong> = Listing Views + Profile Views</li>
                              <li>• <strong>Total Leads</strong> = Listing Leads + Profile Leads</li>
                              <li>• <strong>View to Lead Rate</strong> = Same as Overall Conversion Rate</li>
                              <li>• <strong>Lead to Sale Rate</strong> = (Total Sales ÷ Total Leads) × 100</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      {/* Listing Analytics Data */}
                      {cronResult.data?.data?.listing_analytics && cronResult.data.data.listing_analytics.length > 0 && (
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                          <h4 className="font-semibold text-gray-900 mb-3">Listing Analytics Data ({cronResult.data.data.listing_analytics.length} records)</h4>
                          <div className="space-y-3 max-h-96 overflow-y-auto">
                            {cronResult.data.data.listing_analytics.slice(0, 10).map((listing, idx) => {
                              const views = listing.total_views || 0
                              const leads = listing.total_leads || 0
                              const sales = listing.total_sales || 0
                              const conversionRate = listing.conversion_rate || 0
                              const leadToSaleRate = listing.lead_to_sale_rate || 0
                              const calculatedConversion = views > 0 ? ((leads / views) * 100).toFixed(2) : '0.00'
                              const calculatedLeadToSale = leads > 0 ? ((sales / leads) * 100).toFixed(2) : '0.00'
                              
                              return (
                                <div key={idx} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs mb-2">
                                    <div>
                                      <div className="text-gray-600">Listing ID</div>
                                      <div className="font-mono text-xs break-all">{listing.listing_id?.substring(0, 12)}...</div>
                                    </div>
                                    <div>
                                      <div className="text-gray-600">Total Views</div>
                                      <div className="font-bold text-blue-600">{views}</div>
                                    </div>
                                    <div>
                                      <div className="text-gray-600">Total Leads</div>
                                      <div className="font-bold text-green-600">{leads}</div>
                                    </div>
                                    <div>
                                      <div className="text-gray-600">Conversion Rate</div>
                                      <div className="font-bold text-purple-600">{conversionRate}%</div>
                                      <div className="text-xs text-gray-500 mt-0.5">
                                        ({leads} ÷ {views}) × 100 = {calculatedConversion}%
                                      </div>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                                    <div>
                                      <div className="text-gray-600">Unique Views</div>
                                      <div>{listing.unique_views || 0}</div>
                                    </div>
                                    <div>
                                      <div className="text-gray-600">Lead to Sale Rate</div>
                                      <div className="font-medium">{leadToSaleRate}%</div>
                                      {leads > 0 && (
                                        <div className="text-xs text-gray-500 mt-0.5">
                                          ({sales} ÷ {leads}) × 100 = {calculatedLeadToSale}%
                                        </div>
                                      )}
                                    </div>
                                    <div>
                                      <div className="text-gray-600">Total Sales</div>
                                      <div>{sales}</div>
                                    </div>
                                    <div>
                                      <div className="text-gray-600">Sales Value</div>
                                      <div>${(listing.sales_value || 0).toLocaleString()}</div>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                            {cronResult.data.data.listing_analytics.length > 10 && (
                              <div className="text-xs text-gray-500 text-center">
                                ... and {cronResult.data.data.listing_analytics.length - 10} more listings
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* User Analytics Data */}
                      {cronResult.data?.data?.user_analytics && cronResult.data.data.user_analytics.length > 0 && (
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                          <h4 className="font-semibold text-gray-900 mb-3">User Analytics Data ({cronResult.data.data.user_analytics.length} records)</h4>
                          <div className="space-y-3 max-h-96 overflow-y-auto">
                            {cronResult.data.data.user_analytics.slice(0, 10).map((user, idx) => {
                              const totalViews = user.total_views || 0
                              const totalLeads = user.total_leads || 0
                              const listingViews = user.total_listing_views || 0
                              const profileViews = user.profile_views || 0
                              const listingLeads = user.total_listing_leads || 0
                              const sales = user.total_listing_sales || 0
                              const overallConversion = user.overall_conversion_rate || 0
                              const leadToSaleRate = user.lead_to_sale_rate || 0
                              const calculatedConversion = totalViews > 0 ? ((totalLeads / totalViews) * 100).toFixed(2) : '0.00'
                              const calculatedLeadToSale = totalLeads > 0 ? ((sales / totalLeads) * 100).toFixed(2) : '0.00'
                              
                              return (
                                <div key={idx} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs mb-2">
                                    <div>
                                      <div className="text-gray-600">User ID</div>
                                      <div className="font-mono text-xs break-all">{user.user_id?.substring(0, 12)}...</div>
                                      <div className="text-gray-500 text-xs mt-1">{user.user_type}</div>
                                    </div>
                                    <div>
                                      <div className="text-gray-600">Total Views</div>
                                      <div className="font-bold text-blue-600">{totalViews}</div>
                                      <div className="text-xs text-gray-500 mt-0.5">
                                        Listing: {listingViews} + Profile: {profileViews}
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-gray-600">Total Leads</div>
                                      <div className="font-bold text-green-600">{totalLeads}</div>
                                      <div className="text-xs text-gray-500 mt-0.5">
                                        Listing: {listingLeads}
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-gray-600">Overall Conversion Rate</div>
                                      <div className="font-bold text-purple-600">{overallConversion}%</div>
                                      <div className="text-xs text-gray-500 mt-0.5">
                                        ({totalLeads} ÷ {totalViews}) × 100 = {calculatedConversion}%
                                      </div>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                                    <div>
                                      <div className="text-gray-600">Profile Views</div>
                                      <div>{profileViews}</div>
                                    </div>
                                    <div>
                                      <div className="text-gray-600">View to Lead Rate</div>
                                      <div className="font-medium">{user.view_to_lead_rate || 0}%</div>
                                      <div className="text-xs text-gray-500 mt-0.5">
                                        (Same as Overall)
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-gray-600">Lead to Sale Rate</div>
                                      <div className="font-medium">{leadToSaleRate}%</div>
                                      {totalLeads > 0 && (
                                        <div className="text-xs text-gray-500 mt-0.5">
                                          ({sales} ÷ {totalLeads}) × 100 = {calculatedLeadToSale}%
                                        </div>
                                      )}
                                    </div>
                                    <div>
                                      <div className="text-gray-600">Profile to Lead Rate</div>
                                      <div className="font-medium">{user.profile_to_lead_rate || 0}%</div>
                                      <div className="text-xs text-gray-500 mt-0.5">
                                        (Same as Overall)
                                      </div>
                                    </div>
                                  </div>
                                  <div className="mt-2 text-xs text-gray-500">
                                    Total Listings: {user.total_listings || 0} | Active: {user.active_listings || 0} | Sold: {user.sold_listings || 0}
                                  </div>
                                </div>
                              )
                            })}
                            {cronResult.data.data.user_analytics.length > 10 && (
                              <div className="text-xs text-gray-500 text-center">
                                ... and {cronResult.data.data.user_analytics.length - 10} more users
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Development Analytics Data */}
                      {cronResult.data?.data?.development_analytics && cronResult.data.data.development_analytics.length > 0 && (
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                          <h4 className="font-semibold text-gray-900 mb-3">Development Analytics Data ({cronResult.data.data.development_analytics.length} records)</h4>
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {cronResult.data.data.development_analytics.slice(0, 5).map((dev, idx) => (
                              <div key={idx} className="border border-gray-200 rounded-lg p-2 bg-gray-50 text-xs">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                  <div>
                                    <div className="text-gray-600">Development ID</div>
                                    <div className="font-mono break-all">{dev.development_id?.substring(0, 12)}...</div>
                                  </div>
                                  <div>
                                    <div className="text-gray-600">Total Views</div>
                                    <div className="font-bold text-blue-600">{dev.total_views || 0}</div>
                                  </div>
                                  <div>
                                    <div className="text-gray-600">Total Leads</div>
                                    <div className="font-bold text-green-600">{dev.total_leads || 0}</div>
                                  </div>
                                  <div>
                                    <div className="text-gray-600">Conversion Rate</div>
                                    <div className="font-bold text-purple-600">{dev.conversion_rate || 0}%</div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Leads Data */}
                      {cronResult.data?.data?.leads && cronResult.data.data.leads.length > 0 && (
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                          <h4 className="font-semibold text-gray-900 mb-3">Leads Data ({cronResult.data.data.leads.length} records)</h4>
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {cronResult.data.data.leads.slice(0, 5).map((lead, idx) => (
                              <div key={idx} className="border border-gray-200 rounded-lg p-2 bg-gray-50 text-xs">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                  <div>
                                    <div className="text-gray-600">Listing ID</div>
                                    <div className="font-mono break-all">{lead.listing_id?.substring(0, 12)}...</div>
                                  </div>
                                  <div>
                                    <div className="text-gray-600">Seeker ID</div>
                                    <div className="font-mono break-all">{lead.seeker_id?.substring(0, 12)}...</div>
                                  </div>
                                  <div>
                                    <div className="text-gray-600">Total Actions</div>
                                    <div className="font-bold text-blue-600">{lead.total_actions || 0}</div>
                                  </div>
                                  <div>
                                    <div className="text-gray-600">Status</div>
                                    <div className="font-medium">{lead.status || 'N/A'}</div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Admin Analytics Data */}
                      {cronResult.data?.data?.admin_analytics && (
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                          <h4 className="font-semibold text-gray-900 mb-3">Admin Analytics Data (Platform-Wide)</h4>
                          {(() => {
                            const adminData = cronResult.data.data.admin_analytics
                            const totalViews = adminData.views?.total_views || 0
                            const totalLeads = adminData.leads?.total_leads || 0
                            const conversionRate = adminData.conversion_rates?.conversion_rate || 0
                            const leadToSaleRate = adminData.conversion_rates?.lead_to_sale_rate || 0
                            const calculatedConversion = totalViews > 0 ? ((totalLeads / totalViews) * 100).toFixed(2) : '0.00'
                            
                            return (
                              <div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
                                  <div>
                                    <div className="text-gray-600">Total Views</div>
                                    <div className="font-bold text-blue-600">{totalViews.toLocaleString()}</div>
                                  </div>
                                  <div>
                                    <div className="text-gray-600">Total Leads</div>
                                    <div className="font-bold text-green-600">{totalLeads.toLocaleString()}</div>
                                  </div>
                                  <div>
                                    <div className="text-gray-600">Conversion Rate</div>
                                    <div className="font-bold text-purple-600">{conversionRate}%</div>
                                    <div className="text-xs text-gray-500 mt-1">
                                      ({totalLeads.toLocaleString()} ÷ {totalViews.toLocaleString()}) × 100 = {calculatedConversion}%
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-gray-600">Lead to Sale Rate</div>
                                    <div className="font-bold text-orange-600">{leadToSaleRate}%</div>
                                  </div>
                                </div>
                              </div>
                            )
                          })()}
                        </div>
                      )}

                      {/* Full Response (Collapsible) */}
                      <details className="bg-white rounded-lg p-4 border border-gray-200">
                        <summary className="cursor-pointer font-semibold text-gray-900">View Full Response Data</summary>
                        <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-auto max-h-96">
                          {JSON.stringify(cronResult.data, null, 2)}
                        </pre>
                      </details>
                    </>
                  )}

                  {!cronResult.success && cronResult.data && (
                    <div className="bg-white rounded-lg p-4 border border-red-200">
                      <p className="text-sm text-red-700 font-medium">Error Details:</p>
                      <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-auto max-h-64">
                          {JSON.stringify(cronResult.data, null, 2)}
                        </pre>
                      {/* Show errors if available */}
                      {cronResult.data.errors && (
                        <div className="mt-4">
                          <p className="text-sm text-red-700 font-medium mb-2">Tracked Errors:</p>
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {cronResult.data.errors.errors?.map((error, idx) => (
                              <div key={idx} className="bg-red-50 border border-red-200 rounded p-2 text-xs">
                                <div className="font-semibold text-red-900">{error.category}: {error.message}</div>
                                {error.details && (
                                  <pre className="mt-1 text-xs bg-red-100 p-2 rounded overflow-auto">
                                    {JSON.stringify(error.details, null, 2)}
                                  </pre>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      </div>
                    )}
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

          {/* Data Consistency Comparison Section */}
          <div className="mb-8">
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-purple-900 mb-2">🔍 Data Consistency Comparison</h2>
              <p className="text-sm text-purple-700 mb-6">
                Compare PostHog analytics data with database records to ensure consistency.
                This is your final validation test to verify that all metrics match between sources.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-purple-900 mb-1">User ID *</label>
                  <input
                    type="text"
                    value={comparisonUserId}
                    onChange={(e) => setComparisonUserId(e.target.value)}
                    placeholder="Enter user UUID"
                    className="w-full px-3 py-2 border border-purple-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-purple-900 mb-1">User Type</label>
                  <select
                    value={comparisonUserType}
                    onChange={(e) => setComparisonUserType(e.target.value)}
                    className="w-full px-3 py-2 border border-purple-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="developer">Developer</option>
                    <option value="agent">Agent</option>
                    <option value="agency">Agency</option>
                    <option value="property_seeker">Property Seeker</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-purple-900 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={comparisonStartDate}
                    onChange={(e) => setComparisonStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-purple-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-purple-900 mb-1">End Date</label>
                  <input
                    type="date"
                    value={comparisonEndDate}
                    onChange={(e) => setComparisonEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-purple-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <button
                onClick={handleComparison}
                disabled={comparisonLoading || !comparisonUserId}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 px-4 rounded-md hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors mb-4"
              >
                {comparisonLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Comparing Data...
                  </span>
                ) : (
                  '🔍 Run Comparison'
                )}
              </button>

              {/* Comparison Result Display */}
              {comparisonResult && comparisonResult.data && (
                <div className={`p-4 rounded-lg ${comparisonResult.success ? 'bg-white border-2 border-purple-200' : 'bg-red-50 border-2 border-red-200'}`}>
                  <div className="space-y-4">
                    <div>
                      <h3 className={`text-lg font-bold ${comparisonResult.success ? 'text-purple-800' : 'text-red-800'}`}>
                        {comparisonResult.success ? '✅ Comparison Complete' : '❌ Comparison Error'}
                      </h3>
                      <p className={`mt-1 text-sm ${comparisonResult.success ? 'text-purple-700' : 'text-red-700'}`}>
                        {comparisonResult.message}
                      </p>
                    </div>

                    {comparisonResult.success && (
                      <>
                        {/* Summary Stats */}
                        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4 border border-purple-200">
                          <h4 className="font-bold text-purple-900 mb-3">📊 Summary Statistics</h4>
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                            <div>
                              <div className="text-purple-600 font-medium">Match Rate</div>
                              <div className={`text-2xl font-bold ${comparisonResult.data.summary?.matchRate === 100 ? 'text-green-600' : comparisonResult.data.summary?.matchRate >= 90 ? 'text-yellow-600' : 'text-red-600'}`}>
                                {comparisonResult.data.summary?.matchRate || 0}%
                              </div>
                            </div>
                            <div>
                              <div className="text-purple-600 font-medium">Matches</div>
                              <div className="text-2xl font-bold text-green-600">{comparisonResult.data.summary?.matches || 0}</div>
                            </div>
                            <div>
                              <div className="text-purple-600 font-medium">Major Diffs</div>
                              <div className="text-2xl font-bold text-red-600">{comparisonResult.data.summary?.majorDiffs || 0}</div>
                            </div>
                            <div>
                              <div className="text-purple-600 font-medium">Minor Diffs</div>
                              <div className="text-2xl font-bold text-yellow-600">{comparisonResult.data.summary?.minorDiffs || 0}</div>
                            </div>
                            <div>
                              <div className="text-purple-600 font-medium">Total Fields</div>
                              <div className="text-2xl font-bold text-blue-600">{comparisonResult.data.summary?.totalFields || 0}</div>
                            </div>
                          </div>
                          <div className="mt-3 grid grid-cols-2 gap-4 text-xs text-purple-700">
                            <div>
                              <span className="font-medium">PostHog Events:</span> {comparisonResult.data.summary?.totalEventsFromPostHog || 0}
                            </div>
                            <div>
                              <span className="font-medium">Database Rows:</span> {comparisonResult.data.summary?.totalRowsFromDatabase || 0}
                            </div>
                            <div>
                              <span className="font-medium">PostHog Days:</span> {comparisonResult.data.summary?.posthogDaysCount || 0}
                            </div>
                            <div>
                              <span className="font-medium">Database Days:</span> {comparisonResult.data.summary?.databaseDaysCount || 0}
                            </div>
                          </div>
                          {(comparisonResult.data.summary?.missingDays?.length > 0 || comparisonResult.data.summary?.extraDays?.length > 0) && (
                            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                              {comparisonResult.data.summary?.missingDays?.length > 0 && (
                                <div className="text-xs text-red-700 mb-2">
                                  <span className="font-bold">⚠️ Missing Days in Database ({comparisonResult.data.summary.missingDays.length}):</span>
                                  <div className="mt-1 font-mono">
                                    {comparisonResult.data.summary.missingDays.join(', ')}
                                  </div>
                                  <div className="mt-1 text-yellow-700">
                                    These days have PostHog events but no database entries. The cron job may not have processed these days yet.
                                  </div>
                                </div>
                              )}
                              {comparisonResult.data.summary?.extraDays?.length > 0 && (
                                <div className="text-xs text-blue-700">
                                  <span className="font-bold">ℹ️ Extra Days in Database ({comparisonResult.data.summary.extraDays.length}):</span>
                                  <div className="mt-1 font-mono">
                                    {comparisonResult.data.summary.extraDays.join(', ')}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                          {comparisonResult.data.summary?.hourlyBreakdown && comparisonResult.data.summary.hourlyBreakdown.length > 0 && (
                            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                              <div className="text-xs font-bold text-blue-900 mb-2">📅 Hourly Breakdown (Database)</div>
                              <div className="space-y-1 text-xs text-blue-700">
                                {comparisonResult.data.summary.hourlyBreakdown.map((day, idx) => (
                                  <div key={idx} className="flex justify-between">
                                    <span className="font-mono">{day.date}:</span>
                                    <span>{day.total_hours} hourly entries</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {comparisonResult.data.summary?.hourlyComparison && comparisonResult.data.summary.hourlyComparison.length > 0 && (
                            <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded">
                              <div className="text-xs font-bold text-orange-900 mb-2">
                                ⚠️ Hourly Comparison
                                {comparisonResult.data.summary.missingHours > 0 && (
                                  <span className="ml-2 text-red-600">
                                    ({comparisonResult.data.summary.missingHours} missing hours)
                                  </span>
                                )}
                              </div>
                              <div className="max-h-64 overflow-y-auto space-y-1 text-xs">
                                {comparisonResult.data.summary.hourlyComparison
                                  .filter(h => h.posthog_events > 0 || h.database_exists)
                                  .map((hour, idx) => (
                                    <div key={idx} className={`p-2 rounded ${hour.posthog_events > 0 && !hour.database_exists ? 'bg-red-100 border border-red-300' : hour.database_exists && hour.posthog_events === 0 ? 'bg-yellow-100 border border-yellow-300' : 'bg-green-100 border border-green-300'}`}>
                                      <div className="flex justify-between items-center">
                                        <span className="font-mono font-medium">
                                          {hour.date} {hour.hour}:00
                                        </span>
                                        <div className="flex gap-3">
                                          <span className={hour.posthog_events > 0 ? 'text-green-700 font-bold' : 'text-gray-500'}>
                                            PostHog: {hour.posthog_events} events
                                          </span>
                                          <span className={hour.database_exists ? 'text-blue-700 font-bold' : 'text-gray-500'}>
                                            DB: {hour.database_exists ? '✓' : '✗'}
                                          </span>
                                          {hour.database_exists && (
                                            <span className="text-purple-700">
                                              Views: {hour.database_total_views} | Leads: {hour.database_total_leads}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Totals Comparison */}
                        {comparisonResult.data.totals && (
                          <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <h4 className="font-bold text-gray-900 mb-3">📈 Totals Comparison</h4>
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="bg-gray-50">
                                    <th className="px-3 py-2 text-left font-semibold text-gray-700">Metric</th>
                                    <th className="px-3 py-2 text-right font-semibold text-green-700">PostHog</th>
                                    <th className="px-3 py-2 text-right font-semibold text-blue-700">Database</th>
                                    <th className="px-3 py-2 text-right font-semibold text-gray-700">Difference</th>
                                    <th className="px-3 py-2 text-right font-semibold text-gray-700">Status</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {Object.values(comparisonResult.data.totals.comparisons || {}).map((comp) => (
                                    <tr key={comp.field} className={`border-b ${comp.match ? 'bg-green-50' : comp.status === 'major_diff' ? 'bg-red-50' : 'bg-yellow-50'}`}>
                                      <td className="px-3 py-2 font-medium text-gray-900">{comp.field.replace(/_/g, ' ')}</td>
                                      <td className="px-3 py-2 text-right text-green-700">{comp.posthog.toLocaleString()}</td>
                                      <td className="px-3 py-2 text-right text-blue-700">{comp.database.toLocaleString()}</td>
                                      <td className={`px-3 py-2 text-right font-medium ${comp.difference === 0 ? 'text-gray-600' : comp.difference > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {comp.difference > 0 ? '+' : ''}{comp.difference.toLocaleString()} ({comp.differencePercent > 0 ? '+' : ''}{comp.differencePercent}%)
                                      </td>
                                      <td className="px-3 py-2 text-right">
                                        {comp.match ? (
                                          <span className="text-green-600 font-bold">✓ Match</span>
                                        ) : comp.status === 'major_diff' ? (
                                          <span className="text-red-600 font-bold">⚠ Major</span>
                                        ) : (
                                          <span className="text-yellow-600 font-bold">~ Minor</span>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* Daily Comparison */}
                        {comparisonResult.data.daily && comparisonResult.data.daily.comparisons && comparisonResult.data.daily.comparisons.length > 0 && (
                          <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <h4 className="font-bold text-gray-900 mb-3">📅 Daily Comparison</h4>
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                              {comparisonResult.data.daily.comparisons.map((day, idx) => {
                                const hasMismatch = Object.values(day).some(val => typeof val === 'object' && val && !val.match && val.field)
                                return (
                                  <div key={idx} className={`border rounded-lg p-3 ${hasMismatch ? 'bg-yellow-50 border-yellow-300' : 'bg-green-50 border-green-300'}`}>
                                    <div className="flex justify-between items-center mb-2">
                                      <div className="font-semibold text-gray-900">{day.date}</div>
                                      {day.database_hours_count !== undefined && (
                                        <div className="text-xs text-gray-600">
                                          {day.database_hours_count > 0 ? (
                                            <span className="text-blue-600">📊 {day.database_hours_count} hourly entries</span>
                                          ) : (
                                            <span className="text-red-600">⚠️ No database entries</span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                                      {Object.entries(day).filter(([key]) => key !== 'date' && key !== 'database_hours_count').map(([key, comp]) => {
                                        if (typeof comp !== 'object' || !comp) return null
                                        return (
                                          <div key={key} className={`p-2 rounded ${comp.match ? 'bg-green-100' : 'bg-red-100'}`}>
                                            <div className="font-medium text-gray-700 mb-1">{key.replace(/_/g, ' ')}</div>
                                            <div className="flex justify-between">
                                              <span className="text-green-700">{comp.posthog}</span>
                                              <span className="text-gray-500">vs</span>
                                              <span className="text-blue-700">{comp.database}</span>
                                            </div>
                                            {!comp.match && (
                                              <div className="text-red-600 font-bold text-xs mt-1">
                                                Diff: {comp.difference > 0 ? '+' : ''}{comp.difference}
                                              </div>
                                            )}
                                          </div>
                                        )
                                      })}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
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
