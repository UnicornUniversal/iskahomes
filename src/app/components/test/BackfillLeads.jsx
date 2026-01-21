'use client'
import React, { useState } from 'react'

const BackfillLeads = () => {
  const [backfillLeadsLoading, setBackfillLeadsLoading] = useState(false)
  const [backfillLeadsResult, setBackfillLeadsResult] = useState(null)
  const [cronTestLoading, setCronTestLoading] = useState(false)
  const [cronTestProgress, setCronTestProgress] = useState(null)
  const [cronTestResult, setCronTestResult] = useState(null)

  const handleBackfillLeads = async () => {
    if (backfillLeadsLoading) {
      return
    }

    setBackfillLeadsLoading(true)
    setBackfillLeadsResult(null)

    try {
      // Fetch all available data from PostHog (10 years = 87600 hours)
      // This effectively fetches all available historical data
      const hours = 87600
      const response = await fetch(`/api/test/backfill-leads?hours=${hours}&limit=10000`, {
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

      setBackfillLeadsResult({
        success: data.success,
        message: data.message || 'Backfill completed',
        data: data
      })
    } catch (error) {
      setBackfillLeadsResult({
        success: false,
        message: `Error: ${error.message}`,
        data: null
      })
    } finally {
      setBackfillLeadsLoading(false)
    }
  }

  const handleTestAllDays = async () => {
    if (cronTestLoading) {
      return
    }

    setCronTestLoading(true)
    setCronTestProgress(null)
    setCronTestResult(null)

    try {
      const progress = {
        daysProcessed: 0,
        currentDate: null,
        totalDays: null,
        errors: [],
        summary: {
          totalEvents: 0,
          totalLeads: 0,
          totalListings: 0,
          totalDevelopers: 0,
          totalAgents: 0,
          totalAgencies: 0
        }
      }

      setCronTestProgress(progress)

      let dayCount = 0
      let completed = false
      const maxDays = 1000 // Safety limit to prevent infinite loops

      while (!completed && dayCount < maxDays) {
        dayCount++
        
        // Call cron with testTimeSeries mode
        const response = await fetch(`/api/cron/analytics?testTimeSeries=true&forceRun=true&ignoreLastRun=false`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
          throw new Error(errorData.error || `HTTP ${response.status}`)
        }

        const data = await response.json()

        // Update progress
        progress.daysProcessed = dayCount
        progress.currentDate = data.dayProcessed || data.date || 'Unknown'
        
        // Accumulate summary data from cron response
        if (data.events) {
          progress.summary.totalEvents += data.events.total || 0
        }
        if (data.inserted) {
          progress.summary.totalListings += data.inserted.listings?.inserted || 0
          progress.summary.totalLeads += data.inserted.leads?.inserted || 0
          progress.summary.totalDevelopers += data.inserted.developers?.updated || 0
          progress.summary.totalAgents += data.inserted.agents?.updated || 0
          progress.summary.totalAgencies += data.inserted.agencies?.updated || 0
        }

        // Track errors if any
        if (data.errors && Object.keys(data.errors).length > 0) {
          const errorCount = Object.values(data.errors).reduce((sum, err) => sum + (Array.isArray(err) ? err.length : 1), 0)
          if (errorCount > 0) {
            progress.errors.push({
              day: dayCount,
              date: progress.currentDate,
              errors: data.errors,
              errorCount: errorCount
            })
          }
        }

        setCronTestProgress({ ...progress })

        // Check if we've completed all days
        // The cron returns completed: true when it reaches the end date
        if (data.completed === true || 
            data.message?.toLowerCase().includes('complete') || 
            data.message?.toLowerCase().includes('reached end date')) {
          completed = true
          setCronTestResult({
            success: true,
            message: `Successfully processed ${dayCount} days. ${data.message || 'All available days have been processed.'}`,
            data: {
              daysProcessed: dayCount,
              summary: progress.summary,
              errors: progress.errors,
              lastResponse: data
            }
          })
        } else if (data.message?.toLowerCase().includes('no events found')) {
          // Day with no events - still counts as processed, continue to next day
          console.log(`Day ${progress.currentDate} had no events, continuing...`)
        }

        // Small delay to prevent overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      if (!completed && dayCount >= maxDays) {
        throw new Error(`Reached maximum days limit (${maxDays}). Processed ${dayCount} days.`)
      }

    } catch (error) {
      setCronTestResult({
        success: false,
        message: `Error: ${error.message}`,
        data: cronTestProgress
      })
    } finally {
      setCronTestLoading(false)
    }
  }

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Backfill Leads from PostHog</h2>
      <p className="text-sm text-gray-600 mb-4">
        Fetches all available historical lead events from PostHog and populates the `leads` table and related analytics.
        This will fetch all leads from time memorial (all available data in PostHog).
        Useful for initial data setup or recovery.
      </p>
      <button
        onClick={handleBackfillLeads}
        disabled={backfillLeadsLoading}
        className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors mb-4"
      >
        {backfillLeadsLoading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Backfilling All Historical Leads...
          </span>
        ) : (
          'Backfill All Historical Leads from PostHog'
        )}
      </button>

      {backfillLeadsResult && (
        <div className={`p-4 rounded-lg ${backfillLeadsResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <div className="space-y-4">
            <div>
              <h3 className={`text-sm font-medium ${backfillLeadsResult.success ? 'text-green-800' : 'text-red-800'}`}>
                {backfillLeadsResult.success ? '✅ Leads Backfill Complete' : '❌ Error'}
              </h3>
              <p className={`mt-1 text-sm ${backfillLeadsResult.success ? 'text-green-700' : 'text-red-700'}`}>
                {backfillLeadsResult.message}
              </p>
            </div>

            {backfillLeadsResult.success && backfillLeadsResult.data?.summary && (
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3">Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">Events Fetched</div>
                    <div className="text-2xl font-bold text-blue-600">{backfillLeadsResult.data.summary.total_events_fetched || 0}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Leads Created</div>
                    <div className="text-2xl font-bold text-green-600">{backfillLeadsResult.data.summary.total_leads_created || 0}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Leads Updated</div>
                    <div className="text-2xl font-bold text-purple-600">{backfillLeadsResult.data.summary.total_leads_updated || 0}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Unique Leads</div>
                    <div className="text-2xl font-bold text-orange-600">{backfillLeadsResult.data.summary.total_unique_leads || 0}</div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">Unique Seekers</div>
                    <div className="text-2xl font-bold text-teal-600">{backfillLeadsResult.data.summary.total_unique_seekers || 0}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Duration (s)</div>
                    <div className="text-2xl font-bold text-pink-600">{backfillLeadsResult.data.summary.duration_seconds || 0}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Errors</div>
                    <div className="text-2xl font-bold text-red-600">{backfillLeadsResult.data.summary.errors_count || 0}</div>
                  </div>
                </div>
              </div>
            )}

            {backfillLeadsResult.data?.errors && backfillLeadsResult.data.errors.length > 0 && (
              <details className="bg-white rounded-lg p-4 border border-red-200">
                <summary className="cursor-pointer font-semibold text-red-900">View Errors ({backfillLeadsResult.data.errors.length})</summary>
                <pre className="text-xs bg-red-100 p-2 rounded mt-2 overflow-auto max-h-64">
                  {JSON.stringify(backfillLeadsResult.data.errors, null, 2)}
                </pre>
              </details>
            )}

            {backfillLeadsResult.data && (
              <details className="bg-white rounded-lg p-4 border border-gray-200">
                <summary className="cursor-pointer font-semibold text-gray-900">View Full Response Data</summary>
                <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-auto max-h-96">
                  {JSON.stringify(backfillLeadsResult.data, null, 2)}
                </pre>
              </details>
            )}
          </div>
        </div>
      )}

      {/* Cron Test All Days Section */}
      <div className="mt-8 pt-8 border-t border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Test All Available Days (Cron Analytics)</h2>
        <p className="text-sm text-gray-600 mb-4">
          Tests the full analytics cron job for all available days from November 1, 2025 to today.
          This processes events day-by-day and includes <strong>developers, agents, and agencies analytics</strong>.
          The cron will automatically <strong>continue from where it left off</strong> by checking the database for the last processed day.
          Each day is processed sequentially until all available days are completed.
        </p>
        <button
          onClick={handleTestAllDays}
          disabled={cronTestLoading}
          className="w-full bg-purple-600 text-white py-3 px-4 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors mb-4"
        >
          {cronTestLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing Days... (Day {cronTestProgress?.daysProcessed || 0})
            </span>
          ) : (
            'Test All Available Days (Cron Analytics)'
          )}
        </button>

        {cronTestProgress && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Progress</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-700">Days Processed:</span>
                <span className="font-semibold text-blue-900">{cronTestProgress.daysProcessed}</span>
              </div>
              {cronTestProgress.currentDate && (
                <div className="flex justify-between">
                  <span className="text-blue-700">Current Date:</span>
                  <span className="font-semibold text-blue-900">{cronTestProgress.currentDate}</span>
                </div>
              )}
              {cronTestProgress.summary && (
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                    <div>
                      <div className="text-blue-600">Total Events</div>
                      <div className="font-semibold text-blue-900">{cronTestProgress.summary.totalEvents}</div>
                    </div>
                    <div>
                      <div className="text-blue-600">Total Leads</div>
                      <div className="font-semibold text-blue-900">{cronTestProgress.summary.totalLeads}</div>
                    </div>
                    <div>
                      <div className="text-blue-600">Developers Updated</div>
                      <div className="font-semibold text-blue-900">{cronTestProgress.summary.totalDevelopers}</div>
                    </div>
                    <div>
                      <div className="text-blue-600">Agents Updated</div>
                      <div className="font-semibold text-blue-900">{cronTestProgress.summary.totalAgents}</div>
                    </div>
                    <div>
                      <div className="text-blue-600">Agencies Updated</div>
                      <div className="font-semibold text-blue-900">{cronTestProgress.summary.totalAgencies}</div>
                    </div>
                    <div>
                      <div className="text-blue-600">Listings Updated</div>
                      <div className="font-semibold text-blue-900">{cronTestProgress.summary.totalListings}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {cronTestResult && (
          <div className={`p-4 rounded-lg ${cronTestResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="space-y-4">
              <div>
                <h3 className={`text-sm font-medium ${cronTestResult.success ? 'text-green-800' : 'text-red-800'}`}>
                  {cronTestResult.success ? '✅ Cron Test Complete' : '❌ Error'}
                </h3>
                <p className={`mt-1 text-sm ${cronTestResult.success ? 'text-green-700' : 'text-red-700'}`}>
                  {cronTestResult.message}
                </p>
              </div>

              {cronTestResult.success && cronTestResult.data?.summary && (
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-3">Final Summary</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">Days Processed</div>
                      <div className="text-2xl font-bold text-blue-600">{cronTestResult.data.daysProcessed || 0}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Total Events</div>
                      <div className="text-2xl font-bold text-purple-600">{cronTestResult.data.summary.totalEvents || 0}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Total Leads</div>
                      <div className="text-2xl font-bold text-green-600">{cronTestResult.data.summary.totalLeads || 0}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Developers Updated</div>
                      <div className="text-2xl font-bold text-indigo-600">{cronTestResult.data.summary.totalDevelopers || 0}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Agents Updated</div>
                      <div className="text-2xl font-bold text-teal-600">{cronTestResult.data.summary.totalAgents || 0}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Agencies Updated</div>
                      <div className="text-2xl font-bold text-orange-600">{cronTestResult.data.summary.totalAgencies || 0}</div>
                    </div>
                  </div>
                </div>
              )}

              {cronTestResult.data?.errors && cronTestResult.data.errors.length > 0 && (
                <details className="bg-white rounded-lg p-4 border border-red-200">
                  <summary className="cursor-pointer font-semibold text-red-900">View Errors ({cronTestResult.data.errors.length} days with errors)</summary>
                  <pre className="text-xs bg-red-100 p-2 rounded mt-2 overflow-auto max-h-64">
                    {JSON.stringify(cronTestResult.data.errors, null, 2)}
                  </pre>
                </details>
              )}

              {cronTestResult.data && (
                <details className="bg-white rounded-lg p-4 border border-gray-200">
                  <summary className="cursor-pointer font-semibold text-gray-900">View Full Response Data</summary>
                  <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-auto max-h-96">
                    {JSON.stringify(cronTestResult.data, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default BackfillLeads

