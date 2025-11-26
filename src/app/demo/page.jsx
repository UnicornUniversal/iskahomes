'use client'
import React, { useState } from 'react'


const page = () => {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)
  const [testConfig, setTestConfig] = useState({
    test: 'both', // 'all', 'filter', 'both', 'full'
    start: '2025-11-02',
    end: '2025-11-02',
    hour: 0
  })
  const [analyticsConfig, setAnalyticsConfig] = useState({
    userId: '2110cf0f-11c5-40a9-9a00-97bc581d2cee',
    userType: 'developer',
    start: '2025-11-06',
    end: '2025-11-14',
    limit: 500,
    includeRaw: false
  })
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [analyticsResults, setAnalyticsResults] = useState(null)
  const [analyticsError, setAnalyticsError] = useState(null)

  const runTest = async () => {
    setLoading(true)
    setError(null)
    setResults(null)

    try {
      const params = new URLSearchParams({
        test: testConfig.test,
        start: testConfig.start,
        end: testConfig.end,
        hour: testConfig.hour.toString()
      })

      const response = await fetch(`/api/test/posthog?${params.toString()}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Test failed')
      }

      setResults(data)
    } catch (err) {
      setError(err.message)
      console.error('Test error:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserAnalytics = async () => {
    setAnalyticsLoading(true)
    setAnalyticsError(null)
    setAnalyticsResults(null)

    try {
      const params = new URLSearchParams({
        startDate: analyticsConfig.start,
        endDate: analyticsConfig.end,
        userType: analyticsConfig.userType,
        limit: analyticsConfig.limit.toString()
      })

      if (analyticsConfig.userId) {
        params.set('userId', analyticsConfig.userId)
      }

      if (analyticsConfig.includeRaw) {
        params.set('includeRaw', 'true')
      }

      const response = await fetch(`/api/test/user-analytics?${params.toString()}`)
      const data = await response.json()

      if (!response.ok || data.success === false) {
        throw new Error(data.error || 'Failed to fetch analytics')
      }

      setAnalyticsResults(data)
    } catch (err) {
      console.error('Analytics fetch error:', err)
      setAnalyticsError(err.message || 'Failed to fetch analytics')
    } finally {
      setAnalyticsLoading(false)
    }
  }
  
  return (
    <div className="min-h-screen py-8 px-4 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold mb-6">PostHog Filter Debug Test</h1>
          
          {/* Test Configuration */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Test Configuration</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Test Type</label>
                <select
                  value={testConfig.test}
                  onChange={(e) => setTestConfig({ ...testConfig, test: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="all">All Events (No Filter)</option>
                  <option value="filter">Method 1: API Filter (event__in)</option>
                  <option value="client-filter">Method 2: Client-Side Filter</option>
                  <option value="api-all">All API Methods (Test All)</option>
                  <option value="api-method1">API Method 1: Multiple event params</option>
                  <option value="api-method2">API Method 2: event__in (comma)</option>
                  <option value="api-method3">API Method 3: Properties JSON</option>
                  <option value="api-method4">API Method 4: Single event</option>
                  <option value="api-method5">API Method 5: Query API (where clause) ⭐</option>
                  <option value="api-method6">API Method 6: Query API (properties)</option>
                  <option value="both">Both Methods (Compare)</option>
                  <option value="full">Full Method (Cron Method)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Start Date</label>
                <input
                  type="date"
                  value={testConfig.start}
                  onChange={(e) => setTestConfig({ ...testConfig, start: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">End Date</label>
                <input
                  type="date"
                  value={testConfig.end}
                  onChange={(e) => setTestConfig({ ...testConfig, end: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Hour (0-23)</label>
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={testConfig.hour}
                  onChange={(e) => setTestConfig({ ...testConfig, hour: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
            </div>
            <button
              onClick={runTest}
              disabled={loading}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Running Test...' : 'Run Test'}
            </button>
        </div>

          {/* User Analytics Debugger */}
          <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
            <h2 className="text-xl font-semibold mb-4">User Analytics Debugger</h2>
            <p className="text-sm text-purple-800 mb-4">
              Fetch raw <code className="px-1 py-0.5 bg-white rounded">user_analytics</code> rows for any user and date range.
              Use this to confirm what the cron inserted per day/hour.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  User ID (developer_id / agent_id)
                </label>
                <input
                  type="text"
                  value={analyticsConfig.userId}
                  onChange={(e) => setAnalyticsConfig({ ...analyticsConfig, userId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Optional — leave empty for all users"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">User Type</label>
                <select
                  value={analyticsConfig.userType}
                  onChange={(e) => setAnalyticsConfig({ ...analyticsConfig, userType: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="developer">Developer</option>
                  <option value="agent">Agent</option>
                  <option value="agency">Agency</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Start Date</label>
                <input
                  type="date"
                  value={analyticsConfig.start}
                  onChange={(e) => setAnalyticsConfig({ ...analyticsConfig, start: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">End Date</label>
                <input
                  type="date"
                  value={analyticsConfig.end}
                  onChange={(e) => setAnalyticsConfig({ ...analyticsConfig, end: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Row Limit</label>
                <input
                  type="number"
                  min="1"
                  max="2000"
                  value={analyticsConfig.limit}
                  onChange={(e) =>
                    setAnalyticsConfig({
                      ...analyticsConfig,
                      limit: Number.parseInt(e.target.value || '0', 10)
                    })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div className="flex items-center space-x-2 mt-6">
                <input
                  id="includeRaw"
                  type="checkbox"
                  checked={analyticsConfig.includeRaw}
                  onChange={(e) => setAnalyticsConfig({ ...analyticsConfig, includeRaw: e.target.checked })}
                  className="h-4 w-4 text-purple-600 border-gray-300 rounded"
                />
                <label htmlFor="includeRaw" className="text-sm">
                  Include raw rows (careful: can be large)
                </label>
              </div>
            </div>
            <button
              onClick={fetchUserAnalytics}
              disabled={analyticsLoading}
              className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
            >
              {analyticsLoading ? 'Fetching Analytics...' : 'Fetch User Analytics'}
            </button>
          </div>

          {/* Analytics Error */}
          {analyticsError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="text-red-800 font-semibold mb-2">Analytics Error</h3>
              <p className="text-red-600">{analyticsError}</p>
            </div>
          )}

          {/* Analytics Results */}
          {analyticsResults && (
            <div className="mb-10 space-y-6">
              <div className="p-4 bg-white border rounded-lg">
                <h3 className="text-xl font-semibold mb-3">Analytics Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                  <p><strong>User ID:</strong> {analyticsResults.filters.userId || 'All users'}</p>
                  <p><strong>User Type:</strong> {analyticsResults.filters.userType}</p>
                  <p><strong>Date Range:</strong> {analyticsResults.filters.startDate} → {analyticsResults.filters.endDate}</p>
                  <p><strong>Rows Returned:</strong> {analyticsResults.counts.totalRows}</p>
                  <p><strong>Unique Dates:</strong> {analyticsResults.counts.uniqueDates}</p>
                  <p><strong>Limit:</strong> {analyticsResults.filters.limit}</p>
                </div>
              </div>

              <div className="p-4 bg-white border rounded-lg">
                <h4 className="font-semibold mb-2">Totals (sum of returned rows)</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <p><strong>Profile Views:</strong> {analyticsResults.totals.profile_views}</p>
                  <p><strong>Listing Views:</strong> {analyticsResults.totals.total_listing_views}</p>
                  <p><strong>Total Leads:</strong> {analyticsResults.totals.total_leads}</p>
                  <p><strong>Listing Leads:</strong> {analyticsResults.totals.total_listing_leads}</p>
                  <p><strong>Total Impressions:</strong> {analyticsResults.totals.total_impressions_received}</p>
                  <p><strong>Leads Initiated:</strong> {analyticsResults.totals.leads_initiated}</p>
                  <p><strong>Appointments:</strong> {analyticsResults.totals.appointments_booked}</p>
                  <p><strong>Properties Saved:</strong> {analyticsResults.totals.properties_saved}</p>
                </div>
              </div>

              <div className="bg-white border rounded-lg overflow-hidden">
                <div className="overflow-auto max-h-[480px]">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-100 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold">Date</th>
                        <th className="px-3 py-2 text-left font-semibold">Entries</th>
                        <th className="px-3 py-2 text-left font-semibold">Profile Views</th>
                        <th className="px-3 py-2 text-left font-semibold">Listing Views</th>
                        <th className="px-3 py-2 text-left font-semibold">Total Views</th>
                        <th className="px-3 py-2 text-left font-semibold">Impressions</th>
                        <th className="px-3 py-2 text-left font-semibold">Leads</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyticsResults.daily.map((day) => (
                        <tr key={day.date} className="border-t">
                          <td className="px-3 py-2 font-mono">{day.date}</td>
                          <td className="px-3 py-2">{day.entries.length}</td>
                          <td className="px-3 py-2">{day.profile_views}</td>
                          <td className="px-3 py-2">{day.total_listing_views}</td>
                          <td className="px-3 py-2">{day.total_views}</td>
                          <td className="px-3 py-2">{day.total_impressions}</td>
                          <td className="px-3 py-2">{day.total_leads}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {analyticsConfig.includeRaw && analyticsResults.rows && (
                <details className="bg-gray-900 text-green-400 rounded-lg p-4 text-xs">
                  <summary className="cursor-pointer font-semibold text-white">
                    Raw Rows ({analyticsResults.rows.length})
                  </summary>
                  <pre className="mt-2 overflow-auto max-h-80">
                    {JSON.stringify(analyticsResults.rows, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="text-red-800 font-semibold mb-2">Error</h3>
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* Results Display */}
          {results && (
            <div className="space-y-6">
              {/* Time Range Info */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold mb-2">Time Range</h3>
                <div className="text-sm space-y-1">
                  <p><strong>Start:</strong> {results.timeRange.start}</p>
                  <p><strong>End:</strong> {results.timeRange.end}</p>
                  <p><strong>Duration:</strong> {results.timeRange.durationHours} hours</p>
                  <p><strong>Date:</strong> {results.timeRange.startDate} (Hour: {results.timeRange.hour})</p>
                </div>
              </div>

              {/* Efficiency Comparison */}
              {results.efficiency && (
                <div className="p-4 bg-green-50 rounded-lg">
                  <h3 className="font-semibold mb-2">Efficiency Comparison</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p><strong>Events Reduction:</strong> {results.efficiency.eventsReduction}</p>
                      <p><strong>Time Reduction:</strong> {results.efficiency.timeReduction}</p>
                    </div>
                    <div>
                      <p><strong>Custom Events Found:</strong> {results.efficiency.customEventsFound}</p>
                      <p><strong>Auto-Capture Avoided:</strong> {results.efficiency.autoCaptureAvoided}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Test Results */}
              {results.tests.map((test, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <h3 className="text-xl font-semibold mb-4">{test.name}</h3>
                  
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-sm text-gray-600">Total Events</p>
                      <p className="text-2xl font-bold">
                        {(() => {
                          const count = test.totalEvents ?? test.totalEventsFetched ?? test.totalEventsAfterFilter ?? 0
                          return typeof count === 'number' ? count.toLocaleString() : String(count || 0)
                        })()}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-sm text-gray-600">Duration</p>
                      <p className="text-2xl font-bold">{test.durationMs ?? 0}ms</p>
                    </div>
                    {test.apiCalls && (
                      <div className="bg-gray-50 p-3 rounded">
                        <p className="text-sm text-gray-600">API Calls</p>
                        <p className="text-2xl font-bold">{test.apiCalls}</p>
                      </div>
                    )}
                  </div>

                  {/* Event Breakdown */}
                  {test.breakdown && Object.keys(test.breakdown).length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-semibold mb-2">Event Breakdown</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {Object.entries(test.breakdown)
                          .sort(([, a], [, b]) => (b || 0) - (a || 0))
                          .slice(0, 20)
                          .map(([event, count]) => (
                            <div key={event} className="flex justify-between p-2 bg-gray-50 rounded">
                              <span className={event.startsWith('$') ? 'text-red-600' : 'text-green-600'}>
                                {event}
                              </span>
                              <span className="font-semibold">{count || 0}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Sample Events */}
                  {test.sampleEvents && test.sampleEvents.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Sample Events (First 5)</h4>
                      <div className="space-y-2">
                        {test.sampleEvents.map((event, idx) => (
                          <div key={idx} className="p-2 bg-gray-50 rounded text-xs">
                            <p><strong>Event:</strong> {event.event}</p>
                            <p><strong>Timestamp:</strong> {event.timestamp}</p>
                            <p><strong>Has listing_id:</strong> {event.has_listing_id ? 'Yes' : 'No'}</p>
                            <p><strong>Has lister_id:</strong> {event.has_lister_id ? 'Yes' : 'No'}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Additional Stats */}
                  <div className="mt-4 pt-4 border-t text-sm space-y-1">
                    {test.method && (
                      <p className="text-xs text-gray-500"><strong>Method:</strong> {test.method}</p>
                    )}
                    {test.customEvents !== undefined && (
                      <p><strong>Custom Events:</strong> {test.customEvents}</p>
                    )}
                    {test.autoCaptureEvents !== undefined && (
                      <p className={test.autoCaptureEvents > 0 ? 'text-red-600 font-semibold' : 'text-green-600'}>
                        <strong>Auto-Capture Events:</strong> {test.autoCaptureEvents} {test.autoCaptureEvents > 0 ? '⚠️ Filter not working!' : '✅'}
                      </p>
                    )}
                    {test.autoCaptureFilteredOut !== undefined && (
                      <p><strong>Auto-Capture Filtered Out:</strong> {test.autoCaptureFilteredOut}</p>
                    )}
                    {test.matchingCustomEvents !== undefined && (
                      <p><strong>Matching Custom Events:</strong> {test.matchingCustomEvents}</p>
                    )}
                    {test.nonMatchingEvents !== undefined && (
                      <p className={test.nonMatchingEvents > 0 ? 'text-red-600 font-semibold' : 'text-green-600'}>
                        <strong>Non-Matching Events:</strong> {test.nonMatchingEvents} {test.nonMatchingEvents > 0 ? '⚠️ Filter not working!' : '✅'}
                      </p>
                    )}
                    {test.totalEventsFetched !== undefined && (
                      <p><strong>Total Events Fetched:</strong> {(test.totalEventsFetched || 0).toLocaleString()}</p>
                    )}
                    {test.totalEventsAfterFilter !== undefined && (
                      <p><strong>Events After Filter:</strong> {(test.totalEventsAfterFilter || 0).toLocaleString()}</p>
                    )}
                    {test.filterWorking !== undefined && (
                      <p className={test.filterWorking ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                        <strong>Filter Status:</strong> {test.filterWorking ? '✅ Working' : '❌ Not Working'}
                      </p>
                    )}
                    {test.hasNextPage !== undefined && (
                      <p><strong>Has Next Page:</strong> {test.hasNextPage ? 'Yes' : 'No'}</p>
                    )}
                  </div>
                </div>
              ))}

              {/* Raw JSON (Collapsible) */}
              <details className="mt-6">
                <summary className="cursor-pointer font-semibold p-2 bg-gray-100 rounded">
                  View Raw JSON
                </summary>
                <pre className="mt-2 p-4 bg-gray-900 text-green-400 rounded-lg overflow-auto max-h-96 text-xs">
                  {JSON.stringify(results, null, 2)}
            </pre>
              </details>
            </div>
          )}
          </div>
      </div>
    </div>
  )
}

export default page
