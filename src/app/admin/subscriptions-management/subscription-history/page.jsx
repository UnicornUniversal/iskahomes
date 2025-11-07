'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { FiSearch, FiEye, FiUser, FiClock, FiArrowRight, FiCheckCircle, FiXCircle, FiX } from 'react-icons/fi'
import { toast } from 'react-toastify'

const SubscriptionHistoryPage = () => {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [userTypeFilter, setUserTypeFilter] = useState('all')
  const [eventTypeFilter, setEventTypeFilter] = useState('all')
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const abortControllerRef = useRef(null)
  const isMountedRef = useRef(true)

  const fetchHistory = useCallback(async () => {
    // Cancel previous request if it exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new AbortController for this request
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    try {
      if (isMountedRef.current) {
        setLoading(true)
      }
      const token = localStorage.getItem('admin_token') || localStorage.getItem('developer_token')
      
      let url = '/api/admin/subscription-history?'
      if (userTypeFilter !== 'all') {
        url += `user_type=${userTypeFilter}&`
      }
      if (eventTypeFilter !== 'all') {
        url += `event_type=${eventTypeFilter}&`
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        signal: abortController.signal
      })

      // Check if request was aborted
      if (abortController.signal.aborted) return

      if (response.ok) {
        const { data } = await response.json()
        if (isMountedRef.current) {
          setHistory(data || [])
        }
      } else {
        if (isMountedRef.current) {
          toast.error('Failed to fetch subscription history')
        }
      }
    } catch (error) {
      // Don't show error if request was aborted
      if (error.name === 'AbortError') {
        return
      }
      console.error('Error fetching history:', error)
      if (isMountedRef.current) {
        toast.error('Failed to fetch subscription history')
      }
    } finally {
      // Only update loading if request wasn't aborted and component is mounted
      if (!abortController.signal.aborted && isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [userTypeFilter, eventTypeFilter])

  useEffect(() => {
    isMountedRef.current = true
    fetchHistory()

    // Cleanup: abort request on unmount
    return () => {
      isMountedRef.current = false
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [fetchHistory])

  const formatEventType = (eventType) => {
    const map = {
      'created': 'Created',
      'activated': 'Activated',
      'renewed': 'Renewed',
      'upgraded': 'Upgraded',
      'downgraded': 'Downgraded',
      'cancelled': 'Cancelled',
      'expired': 'Expired',
      'suspended': 'Suspended',
      'reactivated': 'Reactivated',
      'payment_received': 'Payment Received',
      'grace_period_started': 'Grace Period Started',
      'grace_period_ended': 'Grace Period Ended'
    }
    return map[eventType] || eventType
  }

  const getEventIcon = (eventType) => {
    if (eventType === 'activated' || eventType === 'reactivated' || eventType === 'payment_received') {
      return FiCheckCircle
    }
    if (eventType === 'cancelled' || eventType === 'expired' || eventType === 'suspended') {
      return FiXCircle
    }
    return FiClock
  }

  const filteredHistory = history.filter(record => {
    const matchesSearch = !searchTerm || 
      record.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.from_package?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.to_package?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.event_type?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const viewDetails = (record) => {
    setSelectedRecord(record)
    setShowDetailsModal(true)
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Subscription History</h1>
        <p className="text-gray-600">View all subscription events and changes</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search history..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-transparent"
            />
          </div>

          <select
            value={userTypeFilter}
            onChange={(e) => setUserTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-transparent"
          >
            <option value="all">All User Types</option>
            <option value="developer">Developers</option>
            <option value="agent">Agents</option>
            <option value="agency">Agencies</option>
          </select>

          <select
            value={eventTypeFilter}
            onChange={(e) => setEventTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-transparent"
          >
            <option value="all">All Events</option>
            <option value="created">Created</option>
            <option value="activated">Activated</option>
            <option value="renewed">Renewed</option>
            <option value="upgraded">Upgraded</option>
            <option value="downgraded">Downgraded</option>
            <option value="cancelled">Cancelled</option>
            <option value="expired">Expired</option>
            <option value="suspended">Suspended</option>
          </select>

          <button
            onClick={fetchHistory}
            className="px-4 py-2 bg-primary_color text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* History Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary_color"></div>
          <p className="mt-4 text-gray-600">Loading history...</p>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <FiClock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No history records found</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">To</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Changed By</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredHistory.map((record) => {
                  const EventIcon = getEventIcon(record.event_type)
                  return (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          {record.user?.profile_image ? (
                            <img 
                              src={(() => {
                                try {
                                  if (typeof record.user.profile_image === 'string') {
                                    const parsed = JSON.parse(record.user.profile_image)
                                    return parsed?.url || record.user.profile_image
                                  }
                                  return record.user.profile_image?.url || record.user.profile_image
                                } catch (e) {
                                  return record.user.profile_image
                                }
                              })()}
                              alt={record.user?.name || 'User'}
                              className="w-10 h-10 rounded-full object-cover"
                              onError={(e) => {
                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(record.user?.name || 'User')}&background=primary_color&color=fff`
                              }}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-primary_color flex items-center justify-center text-white font-semibold">
                              {(record.user?.name || record.user_type?.[0] || 'U').toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {record.user?.name || 'Unknown User'}
                            </div>
                            <div className="text-xs text-gray-500 capitalize">{record.user_type}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <EventIcon className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900">{formatEventType(record.event_type)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {record.from_package?.name || record.from_status || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {record.to_package?.name || record.to_status || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(record.event_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 capitalize">{record.changed_by || 'System'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => viewDetails(record)}
                          className="text-primary_color hover:text-blue-700"
                        >
                          <FiEye className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">History Details</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">User</label>
                <div className="flex items-center gap-3 mt-1">
                  {selectedRecord.user?.profile_image ? (
                    <img 
                      src={(() => {
                        try {
                          if (typeof selectedRecord.user.profile_image === 'string') {
                            const parsed = JSON.parse(selectedRecord.user.profile_image)
                            return parsed?.url || selectedRecord.user.profile_image
                          }
                          return selectedRecord.user.profile_image?.url || selectedRecord.user.profile_image
                        } catch (e) {
                          return selectedRecord.user.profile_image
                        }
                      })()}
                      alt={selectedRecord.user?.name || 'User'}
                      className="w-12 h-12 rounded-full object-cover"
                      onError={(e) => {
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedRecord.user?.name || 'User')}&background=primary_color&color=fff`
                      }}
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary_color flex items-center justify-center text-white font-semibold">
                      {(selectedRecord.user?.name || selectedRecord.user_type?.[0] || 'U').toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-gray-900 font-medium">{selectedRecord.user?.name || 'Unknown User'}</p>
                    <p className="text-sm text-gray-500 capitalize">{selectedRecord.user_type}</p>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Event Type</label>
                <p className="text-gray-900">{formatEventType(selectedRecord.event_type)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">From</label>
                <p className="text-gray-900">
                  {selectedRecord.from_package?.name || selectedRecord.from_status || 'N/A'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">To</label>
                <p className="text-gray-900">
                  {selectedRecord.to_package?.name || selectedRecord.to_status || 'N/A'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Event Date</label>
                <p className="text-gray-900">{formatDate(selectedRecord.event_date)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Changed By</label>
                <p className="text-gray-900 capitalize">{selectedRecord.changed_by || 'System'}</p>
              </div>
              {selectedRecord.reason && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Reason</label>
                  <p className="text-gray-900">{selectedRecord.reason}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SubscriptionHistoryPage

