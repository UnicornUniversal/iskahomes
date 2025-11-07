'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { FiSearch, FiCheckCircle, FiXCircle, FiClock, FiEye, FiDollarSign, FiUser, FiX } from 'react-icons/fi'
import { toast } from 'react-toastify'

const SubscriptionRequestsPage = () => {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('pending')
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showActionModal, setShowActionModal] = useState(false)
  const [actionType, setActionType] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [adminNotes, setAdminNotes] = useState('')
  const abortControllerRef = useRef(null)
  const isMountedRef = useRef(true)

  const fetchRequests = useCallback(async () => {
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
      
      let url = '/api/admin/subscriptions-requests?'
      if (statusFilter !== 'all') {
        url += `status=${statusFilter}&`
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
          setRequests(data || [])
        }
      } else {
        if (isMountedRef.current) {
          toast.error('Failed to fetch subscription requests')
        }
      }
    } catch (error) {
      // Don't show error if request was aborted
      if (error.name === 'AbortError') {
        return
      }
      console.error('Error fetching requests:', error)
      if (isMountedRef.current) {
        toast.error('Failed to fetch subscription requests')
      }
    } finally {
      // Only update loading if request wasn't aborted and component is mounted
      if (!abortController.signal.aborted && isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [statusFilter])

  useEffect(() => {
    isMountedRef.current = true
    fetchRequests()

    // Cleanup: abort request on unmount
    return () => {
      isMountedRef.current = false
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [fetchRequests])

  const handleAction = useCallback(async (action) => {
    if (!isMountedRef.current) return
    
    if (action === 'reject' && !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason')
      return
    }

    try {
      const token = localStorage.getItem('admin_token') || localStorage.getItem('developer_token')
      const response = await fetch('/api/admin/subscriptions-requests', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          request_id: selectedRequest.id,
          action: action,
          rejection_reason: rejectionReason,
          admin_notes: adminNotes
        })
      })

      if (response.ok) {
        const { message } = await response.json()
        if (isMountedRef.current) {
          toast.success(message || `Request ${action}d successfully`)
          setShowActionModal(false)
          setShowDetailsModal(false)
          setSelectedRequest(null)
          setRejectionReason('')
          setAdminNotes('')
          fetchRequests()
        }
      } else {
        const { error } = await response.json()
        if (isMountedRef.current) {
          toast.error(error || 'Failed to process request')
        }
      }
    } catch (error) {
      console.error('Error processing request:', error)
      if (isMountedRef.current) {
        toast.error('Failed to process request')
      }
    }
  }, [rejectionReason, selectedRequest, adminNotes, fetchRequests])

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: FiClock },
      payment_proof_submitted: { color: 'bg-blue-100 text-blue-800', icon: FiClock },
      approved: { color: 'bg-green-100 text-green-800', icon: FiCheckCircle },
      rejected: { color: 'bg-red-100 text-red-800', icon: FiXCircle },
      cancelled: { color: 'bg-gray-100 text-gray-800', icon: FiXCircle }
    }

    const config = statusConfig[status] || statusConfig.pending
    const IconComponent = config.icon

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <IconComponent className="w-3 h-3" />
        {status.replace(/_/g, ' ')}
      </span>
    )
  }

  const filteredRequests = requests.filter(req => {
    const matchesSearch = !searchTerm || 
      req.subscriptions_package?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.user_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.user?.name?.toLowerCase().includes(searchTerm.toLowerCase())
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

  const viewDetails = (request) => {
    setSelectedRequest(request)
    setShowDetailsModal(true)
  }

  const openActionModal = (type) => {
    setActionType(type)
    setShowActionModal(true)
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Subscription Requests</h1>
        <p className="text-gray-600">Review and manage manual payment requests</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-transparent"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-transparent"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="payment_proof_submitted">Proof Submitted</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <button
            onClick={fetchRequests}
            className="px-4 py-2 bg-primary_color text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Requests Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary_color"></div>
          <p className="mt-4 text-gray-600">Loading requests...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <FiUser className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No requests found</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Package</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {request.user?.profile_image ? (
                          <img 
                            src={(() => {
                              try {
                                if (typeof request.user.profile_image === 'string') {
                                  const parsed = JSON.parse(request.user.profile_image)
                                  return parsed?.url || request.user.profile_image
                                }
                                return request.user.profile_image?.url || request.user.profile_image
                              } catch (e) {
                                return request.user.profile_image
                              }
                            })()}
                            alt={request.user?.name || 'User'}
                            className="w-10 h-10 rounded-full object-cover"
                            onError={(e) => {
                              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(request.user?.name || 'User')}&background=primary_color&color=fff`
                            }}
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary_color flex items-center justify-center text-white font-semibold">
                            {(request.user?.name || request.user_type?.[0] || 'U').toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {request.user?.name || 'Unknown User'}
                          </div>
                          <div className="text-xs text-gray-500 capitalize">{request.user_type}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {request.subscriptions_package?.name || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(request.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {request.currency} {request.amount?.toLocaleString() || '0'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(request.requested_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => viewDetails(request)}
                          className="text-primary_color hover:text-blue-700"
                        >
                          <FiEye className="w-5 h-5" />
                        </button>
                        {request.status === 'pending' || request.status === 'payment_proof_submitted' ? (
                          <>
                            <button
                              onClick={() => {
                                setSelectedRequest(request)
                                openActionModal('approve')
                              }}
                              className="text-green-600 hover:text-green-700"
                              title="Approve"
                            >
                              <FiCheckCircle className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedRequest(request)
                                openActionModal('reject')
                              }}
                              className="text-red-600 hover:text-red-700"
                              title="Reject"
                            >
                              <FiXCircle className="w-5 h-5" />
                            </button>
                          </>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Request Details</h2>
              <button
                onClick={() => {
                  setShowDetailsModal(false)
                  setSelectedRequest(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">User</label>
                <div className="flex items-center gap-3 mt-1">
                  {selectedRequest.user?.profile_image ? (
                    <img 
                      src={(() => {
                        try {
                          if (typeof selectedRequest.user.profile_image === 'string') {
                            const parsed = JSON.parse(selectedRequest.user.profile_image)
                            return parsed?.url || selectedRequest.user.profile_image
                          }
                          return selectedRequest.user.profile_image?.url || selectedRequest.user.profile_image
                        } catch (e) {
                          return selectedRequest.user.profile_image
                        }
                      })()}
                      alt={selectedRequest.user?.name || 'User'}
                      className="w-12 h-12 rounded-full object-cover"
                      onError={(e) => {
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedRequest.user?.name || 'User')}&background=primary_color&color=fff`
                      }}
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary_color flex items-center justify-center text-white font-semibold">
                      {(selectedRequest.user?.name || selectedRequest.user_type?.[0] || 'U').toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-gray-900 font-medium">{selectedRequest.user?.name || 'Unknown User'}</p>
                    <p className="text-sm text-gray-500 capitalize">{selectedRequest.user_type}</p>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Package</label>
                <p className="text-gray-900">{selectedRequest.subscriptions_package?.name || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Amount</label>
                <p className="text-gray-900">{selectedRequest.currency} {selectedRequest.amount?.toLocaleString() || '0'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Payment Method</label>
                <p className="text-gray-900">{selectedRequest.payment_method || 'N/A'}</p>
              </div>
              {selectedRequest.payment_reference && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Payment Reference</label>
                  <p className="text-gray-900">{selectedRequest.payment_reference}</p>
                </div>
              )}
              {selectedRequest.payment_proof_url && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Payment Proof</label>
                  <a href={selectedRequest.payment_proof_url} target="_blank" rel="noopener noreferrer" className="text-primary_color hover:underline">
                    View Proof
                  </a>
                </div>
              )}
              {selectedRequest.user_notes && (
                <div>
                  <label className="text-sm font-medium text-gray-500">User Notes</label>
                  <p className="text-gray-900">{selectedRequest.user_notes}</p>
                </div>
              )}
              {selectedRequest.rejection_reason && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Rejection Reason</label>
                  <p className="text-gray-900">{selectedRequest.rejection_reason}</p>
                </div>
              )}
              {selectedRequest.admin_notes && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Admin Notes</label>
                  <p className="text-gray-900">{selectedRequest.admin_notes}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-500">Requested At</label>
                <p className="text-gray-900">{formatDate(selectedRequest.requested_at)}</p>
              </div>
            </div>

            {(selectedRequest.status === 'pending' || selectedRequest.status === 'payment_proof_submitted') && (
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => openActionModal('approve')}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Approve
                </button>
                <button
                  onClick={() => openActionModal('reject')}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Modal */}
      {showActionModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {actionType === 'approve' ? 'Approve Request' : 'Reject Request'}
            </h3>

            {actionType === 'reject' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rejection Reason *
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-transparent"
                  placeholder="Enter reason for rejection..."
                />
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Notes (Optional)
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-transparent"
                placeholder="Internal notes..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowActionModal(false)
                  setRejectionReason('')
                  setAdminNotes('')
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAction(actionType)}
                className={`flex-1 px-4 py-2 rounded-lg text-white transition-colors ${
                  actionType === 'approve'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {actionType === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SubscriptionRequestsPage

