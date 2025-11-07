'use client'
import React, { useState } from 'react'
import { useCacheStats } from '@/hooks/useStaticData'

const CacheManagement = () => {
  const { stats, loading, error, refresh } = useCacheStats()
  const [operationLoading, setOperationLoading] = useState(false)
  const [operationResult, setOperationResult] = useState(null)

  const handleCacheOperation = async (operation, type = null) => {
    setOperationLoading(true)
    setOperationResult(null)

    try {
      const url = '/api/cache/static-data'
      const method = operation === 'populate' ? 'POST' : 'GET'
      const body = operation === 'populate' 
        ? JSON.stringify({ type: type || 'all' })
        : undefined

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body
      })

      const result = await response.json()

      if (response.ok) {
        setOperationResult({
          success: true,
          message: result.message || 'Operation completed successfully',
          data: result.data
        })
        // Refresh stats after operation
        refresh()
      } else {
        setOperationResult({
          success: false,
          message: result.error || 'Operation failed',
          data: result
        })
      }
    } catch (err) {
      setOperationResult({
        success: false,
        message: `Error: ${err.message}`,
        data: null
      })
    } finally {
      setOperationLoading(false)
    }
  }

  const dataTypes = [
    { key: 'categories', name: 'Property Categories', color: 'blue' },
    { key: 'purposes', name: 'Property Purposes', color: 'green' },
    { key: 'types', name: 'Property Types', color: 'purple' },
    { key: 'subtypes', name: 'Property Subtypes', color: 'orange' },
    { key: 'amenities', name: 'Amenities', color: 'red' }
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Cache Management</h1>
          <p className="text-gray-600 mb-6">Manage Redis cache for static reference data</p>

          {/* Cache Statistics */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Cache Statistics</h2>
            
            {loading && (
              <div className="flex items-center justify-center py-8">
                <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="ml-2 text-gray-600">Loading cache stats...</span>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error loading cache stats</h3>
                    <p className="mt-1 text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {stats && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Redis Connection Status</h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    stats.redisConnected 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {stats.redisConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dataTypes.map(({ key, name, color }) => {
                    const cacheStat = stats.cacheStats?.[key]
                    const exists = cacheStat?.exists
                    const size = cacheStat?.size || 0
                    
                    return (
                      <div key={key} className={`bg-white rounded-lg p-4 border-l-4 ${
                        exists ? `border-${color}-400` : 'border-gray-300'
                      }`}>
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900">{name}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            exists 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {exists ? 'Cached' : 'Not Cached'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          Size: {size > 0 ? `${(size / 1024).toFixed(1)} KB` : '0 KB'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Last checked: {cacheStat?.lastChecked ? new Date(cacheStat.lastChecked).toLocaleTimeString() : 'Never'}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Cache Operations */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Cache Operations</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Populate All Cache */}
              <button
                onClick={() => handleCacheOperation('populate')}
                disabled={operationLoading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
              >
                {operationLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Populating Cache...
                  </span>
                ) : (
                  'Populate All Cache'
                )}
              </button>

              {/* Refresh Stats */}
              <button
                onClick={refresh}
                disabled={loading}
                className="w-full bg-gray-600 text-white py-3 px-4 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Refreshing...
                  </span>
                ) : (
                  'Refresh Stats'
                )}
              </button>
            </div>

            {/* Individual Cache Operations */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {dataTypes.map(({ key, name, color }) => (
                <button
                  key={key}
                  onClick={() => handleCacheOperation('populate', key)}
                  disabled={operationLoading}
                  className={`w-full bg-${color}-600 text-white py-2 px-3 rounded-md hover:bg-${color}-700 focus:outline-none focus:ring-2 focus:ring-${color}-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors`}
                >
                  Cache {name.split(' ')[1]}
                </button>
              ))}
            </div>
          </div>

          {/* Operation Results */}
          {operationResult && (
            <div className={`p-4 rounded-lg ${
              operationResult.success 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  {operationResult.success ? (
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
                  <h3 className={`text-sm font-medium ${
                    operationResult.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {operationResult.success ? 'Operation Successful!' : 'Operation Failed'}
                  </h3>
                  <p className={`mt-1 text-sm ${
                    operationResult.success ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {operationResult.message}
                  </p>
                  {operationResult.data && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-600 font-medium">Response Data:</p>
                      <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto max-h-32">
                        {JSON.stringify(operationResult.data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Usage Instructions */}
          <div className="pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Usage Instructions</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>• <strong>Populate All Cache:</strong> Fetches fresh data from database and caches all static data types</p>
              <p>• <strong>Individual Cache Buttons:</strong> Cache specific data types (categories, purposes, etc.)</p>
              <p>• <strong>Infinite TTL:</strong> Cached data persists indefinitely until manually cleared</p>
              <p>• <strong>Performance:</strong> Sub-millisecond access vs 50-200ms database queries</p>
              <p>• <strong>Auto-refresh:</strong> Stats automatically refresh after cache operations</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CacheManagement
