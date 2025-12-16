'use client'
import React, { useState } from 'react'

const BackfillLeads = () => {
  const [backfillLeadsLoading, setBackfillLeadsLoading] = useState(false)
  const [backfillLeadsResult, setBackfillLeadsResult] = useState(null)

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
    </div>
  )
}

export default BackfillLeads

