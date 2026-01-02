'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Plus, Search, Filter, Calendar, DollarSign, User, FileText, CheckCircle2, Clock, XCircle, AlertCircle, X, Edit, Upload, Image as ImageIcon, Loader2 } from 'lucide-react'

const TransactionRecords = ({ token }) => {
  const params = useParams()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [listingId, setListingId] = useState(null)
  const [propertySlug, setPropertySlug] = useState(null)

  // Fetch listing ID from slug
  useEffect(() => {
    let isMounted = true

    const resolveParams = async () => {
      const resolvedParams = params instanceof Promise ? await params : params
      const slug = resolvedParams.propertySlug

      if (!isMounted) return

      setPropertySlug(slug)

      if (!slug || slug === 'addNewProperty' || slug.endsWith('/edit')) {
        setError('Invalid listing')
        setLoading(false)
        return
      }

      try {
        const response = await fetch(
          `/api/listings/slug/${slug}?listing_type=property`,
          { cache: 'no-store' }
        )
        const result = await response.json()

        if (!isMounted) return

        if (response.ok && result.success) {
          setListingId(result.data.id)
          setError(null)
        } else {
          console.error('Error fetching listing metadata:', result?.error || result)
          setError(result?.error || 'Unable to fetch listing metadata')
        }
      } catch (error) {
        console.error('Error fetching listing metadata:', error)
        if (isMounted) {
          setError('Failed to load listing metadata')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    resolveParams()

    return () => {
      isMounted = false
    }
  }, [params])

  // Fetch transactions
  useEffect(() => {
    if (!listingId || !token) return

    let isMounted = true

    const fetchTransactions = async () => {
      try {
        setLoading(true)
        setError(null)

        const queryParams = new URLSearchParams({
          listing_id: listingId,
          ...(filterType !== 'all' && { transaction_type: filterType }),
          ...(filterStatus !== 'all' && { status: filterStatus }),
          ...(searchTerm && { search: searchTerm })
        })

        const response = await fetch(`/api/transaction-records?${queryParams}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (!isMounted) return

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || 'Failed to fetch transactions')
        }

        const result = await response.json()
        if (result.success) {
          setTransactions(result.data || [])
        } else {
          throw new Error(result.error || 'Failed to fetch transactions')
        }
      } catch (err) {
        console.error('Error fetching transactions:', err)
        if (isMounted) {
          setError(err.message || 'Failed to load transactions')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchTransactions()

    return () => {
      isMounted = false
    }
  }, [listingId, token, filterType, filterStatus, searchTerm])

  // Dummy data - REMOVE THIS AFTER TESTING
  const dummyTransactions = [
    {
      id: '1',
      transaction_type: 'payment',
      category: 'rent',
      customer_name: 'John Mensah',
      customer_phone: '+233 24 123 4567',
      amount: 5000,
      currency: 'USD',
      payment_method: 'bank_transfer',
      payment_status: 'completed',
      payment_date: '2025-01-15T10:30:00',
      due_date: '2025-01-15T00:00:00',
      notes: 'First month rent payment',
      receipt_images: [{ url: 'https://via.placeholder.com/150', name: 'receipt_1.jpg' }],
      verified: true,
      verified_at: '2025-01-15T11:00:00'
    },
    {
      id: '2',
      transaction_type: 'rental_period',
      category: 'rent',
      customer_name: 'John Mensah',
      customer_phone: '+233 24 123 4567',
      check_in_date: '2025-01-15',
      check_out_date: '2025-12-15',
      status: 'completed'
    },
    {
      id: '3',
      transaction_type: 'rent_due',
      category: 'rent',
      customer_name: 'John Mensah',
      customer_phone: '+233 24 123 4567',
      amount: 5000,
      currency: 'USD',
      rent_due_date: '2025-02-15',
      status: 'pending',
      is_overdue: false
    },
    {
      id: '4',
      transaction_type: 'payment',
      category: 'deposit',
      customer_name: 'Sarah Adjei',
      customer_phone: '+233 20 987 6543',
      amount: 10000,
      currency: 'USD',
      payment_method: 'mobile_money',
      payment_status: 'completed',
      payment_date: '2025-01-10T14:20:00',
      due_date: '2025-01-10T00:00:00',
      notes: 'Security deposit for apartment',
      verified: true,
      verified_at: '2025-01-10T15:00:00'
    },
    {
      id: '5',
      transaction_type: 'payment',
      category: 'rent',
      customer_name: 'Kwame Asante',
      customer_phone: '+233 54 111 2233',
      amount: 3500,
      currency: 'GHS',
      payment_method: 'cash',
      payment_status: 'pending',
      payment_date: '2025-01-20T09:15:00',
      due_date: '2025-01-20T00:00:00',
      notes: 'Partial payment, balance due next week',
      verified: false,
      status: 'pending'
    },
    {
      id: '6',
      transaction_type: 'rent_due',
      category: 'rent',
      customer_name: 'Ama Osei',
      customer_phone: '+233 26 444 5566',
      amount: 4500,
      currency: 'USD',
      rent_due_date: '2025-01-05',
      status: 'overdue',
      is_overdue: true,
      overdue_days: 11
    },
    {
      id: '7',
      transaction_type: 'rental_period',
      category: 'rent',
      customer_name: 'Michael Boateng',
      customer_phone: '+233 24 777 8899',
      check_in_date: '2024-06-01',
      check_out_date: '2025-01-12',
      status: 'completed'
    },
    {
      id: '8',
      transaction_type: 'payment',
      category: 'sale',
      customer_name: 'David Kofi',
      customer_phone: '+233 50 222 3344',
      amount: 150000,
      currency: 'USD',
      payment_method: 'bank_transfer',
      payment_status: 'completed',
      payment_date: '2025-01-08T16:45:00',
      transaction_reference: 'TXN-2025-001234',
      notes: 'Full payment for property purchase',
      verified: true,
      verified_at: '2025-01-08T17:30:00'
    }
  ]

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'overdue':
        return 'bg-red-100 text-red-800'
      case 'cancelled':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4" />
      case 'pending':
        return <Clock className="w-4 h-4" />
      case 'overdue':
        return <AlertCircle className="w-4 h-4" />
      case 'cancelled':
        return <XCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const getTypeLabel = (type) => {
    const labels = {
      payment: 'Payment',
      rental_period: 'Rental Period',
      check_in: 'Check In',
      check_out: 'Check Out',
      rent_due: 'Rent Due',
      deposit: 'Deposit',
      security_deposit: 'Security Deposit',
      refund: 'Refund',
      penalty: 'Penalty',
      maintenance: 'Maintenance',
      utility: 'Utility',
      other: 'Other'
    }
    return labels[type] || type
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount, currency) => {
    if (!amount) return 'N/A'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(amount)
  }

  // Refresh transactions after modal closes (if it was a success)
  const handleModalSuccess = async () => {
    // Refetch transactions
    if (!listingId || !token) return

    try {
      setLoading(true)
      const queryParams = new URLSearchParams({
        listing_id: listingId,
        ...(filterType !== 'all' && { transaction_type: filterType }),
        ...(filterStatus !== 'all' && { status: filterStatus }),
        ...(searchTerm && { search: searchTerm })
      })

      const response = await fetch(`/api/transaction-records?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setTransactions(result.data || [])
        }
      }
    } catch (err) {
      console.error('Error refreshing transactions:', err)
    } finally {
      setLoading(false)
    }
  }

  // Use real transactions from API
  const filteredTransactions = transactions

  if (loading && !listingId) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary_color"></div>
      </div>
    )
  }

  if (error && !listingId) {
    return (
      <div className="p-6">
        <div className="border border-red-200 text-red-800 p-4 rounded-lg">
          <p className="font-medium">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className='w-full p-6 space-y-6'>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary_color mb-2">Transaction Records</h1>
          <p className="text-gray-600 text-sm">Manage payments, check-ins, check-outs, and rent due dates</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-primary_color text-white px-4 py-2.5 rounded-lg hover:bg-primary_color/90 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Transaction
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by name, phone, or notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary_color/20 focus:border-primary_color text-sm"
            />
          </div>

          {/* Type Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary_color/20 focus:border-primary_color text-sm appearance-none bg-white"
            >
              <option value="all">All Types</option>
              <option value="payment">Payment</option>
              <option value="rental_period">Rental Period</option>
              <option value="rent_due">Rent Due</option>
              <option value="deposit">Deposit</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary_color/20 focus:border-primary_color text-sm appearance-none bg-white"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Total Transactions</p>
            <FileText className="w-4 h-4 text-primary_color" />
          </div>
          <p className="text-2xl font-bold text-primary_color">{filteredTransactions.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Total Amount</p>
            <DollarSign className="w-4 h-4 text-primary_color" />
          </div>
          <p className="text-2xl font-bold text-primary_color">
            {formatCurrency(
              filteredTransactions
                .filter(t => t.amount)
                .reduce((sum, t) => sum + (t.amount || 0), 0),
              'USD'
            )}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Completed</p>
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-primary_color">
            {filteredTransactions.filter(t => t.status === 'completed' || t.payment_status === 'completed').length}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Overdue</p>
            <AlertCircle className="w-4 h-4 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-primary_color">
            {filteredTransactions.filter(t => t.status === 'overdue' || t.is_overdue).length}
          </p>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary_color" />
          </div>
        ) : error ? (
          <div className="p-6">
            <div className="border border-red-200 text-red-800 p-4 rounded-lg">
              <p className="font-medium">Error loading transactions</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Date / Rental Period</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      No transactions found
                    </td>
                  </tr>
                ) : (
                filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-base font-semibold text-gray-900">{transaction.customer_name}</div>
                      {transaction.customer_phone && (
                        <div className="text-sm text-gray-600 mt-0.5">{transaction.customer_phone}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-sm text-gray-900">
                        {getTypeLabel(transaction.transaction_type)}
                        {transaction.category && (
                          <span className="text-xs text-gray-500">({transaction.category})</span>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {transaction.transaction_type === 'rental_period' || transaction.transaction_type === 'check_in' || transaction.transaction_type === 'check_out' ? (
                        <div className="text-sm text-gray-900">
                          {transaction.check_in_date && (
                            <div>
                              <span className="font-medium">Start:</span> {formatDate(transaction.check_in_date)}
                            </div>
                          )}
                          {transaction.check_out_date && (
                            <div className="mt-1">
                              <span className="font-medium">End:</span> {formatDate(transaction.check_out_date)}
                            </div>
                          )}
                          {!transaction.check_in_date && !transaction.check_out_date && 'N/A'}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-900">
                          {transaction.payment_date ? formatDateTime(transaction.payment_date) : 
                           transaction.rent_due_date ? formatDate(transaction.rent_due_date) :
                           'N/A'}
                          {transaction.due_date && transaction.payment_date && (
                            <div className="text-xs text-gray-500 mt-1">
                              Due: {formatDate(transaction.due_date)}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {transaction.amount ? (
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(transaction.amount, transaction.currency)}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                      {transaction.payment_method && (
                        <div className="text-xs text-gray-500 capitalize">
                          {transaction.payment_method.replace('_', ' ')}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status || transaction.payment_status)}`}>
                        {getStatusIcon(transaction.status || transaction.payment_status)}
                        {transaction.status || transaction.payment_status || 'pending'}
                      </span>
                      {transaction.is_overdue && (
                        <div className="text-xs text-red-600 mt-1">
                          {transaction.overdue_days} days overdue
                        </div>
                      )}
                      {transaction.verified && (
                        <div className="text-xs text-green-600 mt-1">
                          Verified
                        </div>
                      )}
                      {transaction.receipt_images && transaction.receipt_images.length > 0 && (
                        <div className="text-xs text-primary_color mt-1">
                          {transaction.receipt_images.length} receipt(s)
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => {
                          setSelectedTransaction(transaction)
                          setIsEditModalOpen(true)
                        }}
                        className="text-primary_color hover:text-primary_color/80 transition-colors flex items-center gap-1 ml-auto"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </button>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Transaction Modal */}
      {isAddModalOpen && (
        <TransactionModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          mode="add"
          listingId={listingId}
          token={token}
          onSuccess={handleModalSuccess}
        />
      )}

      {/* Edit Transaction Modal */}
      {isEditModalOpen && selectedTransaction && (
        <TransactionModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false)
            setSelectedTransaction(null)
          }}
          mode="edit"
          transaction={selectedTransaction}
          listingId={listingId}
          token={token}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  )
}

// Transaction Modal Component
const TransactionModal = ({ isOpen, onClose, mode = 'add', transaction = null, listingId, token, onSuccess }) => {
  const [propertyPurposes, setPropertyPurposes] = useState([])
  const [loadingPurposes, setLoadingPurposes] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [receiptImageFiles, setReceiptImageFiles] = useState([])
  const [documentFiles, setDocumentFiles] = useState([])
  const [idDocumentFile, setIdDocumentFile] = useState(null)

  // Initialize form data - handle category as either purpose ID or name
  const getInitialCategory = () => {
    if (!transaction?.category) return ''
    // If category is already an ID (UUID format), use it directly
    if (transaction.category.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      return transaction.category
    }
    // If category is a name, we'll need to find the matching ID
    // This will be handled after purposes are loaded
    return transaction.category
  }

  const [formData, setFormData] = useState({
    transaction_type: transaction?.transaction_type || 'payment',
    category: getInitialCategory(),
    customer_name: transaction?.customer_name || '',
    customer_first_name: transaction?.customer_first_name || '',
    customer_last_name: transaction?.customer_last_name || '',
    customer_email: transaction?.customer_email || '',
    customer_phone: transaction?.customer_phone || '',
    customer_secondary_phone: transaction?.customer_secondary_phone || '',
    customer_address: transaction?.customer_address || '',
    customer_id_type: transaction?.customer_id_type || '',
    customer_id_number: transaction?.customer_id_number || '',
    amount: transaction?.amount || '',
    currency: transaction?.currency || 'USD',
    payment_method: transaction?.payment_method || '',
    payment_status: transaction?.payment_status || 'pending',
    payment_date: transaction?.payment_date ? transaction.payment_date.split('T')[0] : '',
    due_date: transaction?.due_date ? transaction.due_date.split('T')[0] : '',
    check_in_date: transaction?.check_in_date || '',
    check_out_date: transaction?.check_out_date || '',
    rent_due_date: transaction?.rent_due_date || '',
    notes: transaction?.notes || '',
    transaction_reference: transaction?.transaction_reference || '',
    status: transaction?.status || transaction?.payment_status || 'pending'
  })

  // Fetch property purposes on mount
  useEffect(() => {
    const fetchPropertyPurposes = async () => {
      setLoadingPurposes(true)
      try {
        const response = await fetch('/api/property-purposes')
        const result = await response.json()
        if (response.ok && result.data) {
          setPropertyPurposes(result.data)
          
          // If editing and category is a name (not an ID), find matching purpose ID
          if (transaction?.category && mode === 'edit') {
            const categoryValue = transaction.category
            // Check if it's not a UUID (meaning it's likely a name)
            if (!categoryValue.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
              // Find purpose by name (case-insensitive)
              const matchingPurpose = result.data.find(
                p => p.name?.toLowerCase() === categoryValue.toLowerCase()
              )
              if (matchingPurpose) {
                setFormData(prev => ({ ...prev, category: matchingPurpose.id }))
              }
            }
          }
        }
      } catch (error) {
        console.error('Error fetching property purposes:', error)
      } finally {
        setLoadingPurposes(false)
      }
    }

    if (isOpen) {
      fetchPropertyPurposes()
    }
  }, [isOpen, transaction?.category, mode])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setSubmitError(null)

    try {
      const formDataToSend = new FormData()

      // Add all form fields
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== undefined && formData[key] !== '') {
          if (typeof formData[key] === 'object' && !(formData[key] instanceof File)) {
            formDataToSend.append(key, JSON.stringify(formData[key]))
          } else {
            formDataToSend.append(key, formData[key])
          }
        }
      })

      // Add listing_id
      if (listingId) {
        formDataToSend.append('listing_id', listingId)
      }

      // Add file uploads
      receiptImageFiles.forEach(file => {
        formDataToSend.append('receipt_images', file)
      })

      documentFiles.forEach(file => {
        formDataToSend.append('additional_documents', file)
      })

      if (idDocumentFile) {
        formDataToSend.append('customer_id_document', idDocumentFile)
      }

      const url = mode === 'add' 
        ? '/api/transaction-records'
        : `/api/transaction-records/${transaction.id}`
      
      const method = mode === 'add' ? 'POST' : 'PUT'

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save transaction')
      }

      if (result.success) {
        // Reset form
        setReceiptImageFiles([])
        setDocumentFiles([])
        setIdDocumentFile(null)
        setSubmitError(null)
        // Call success callback to refresh list
        if (onSuccess) {
          onSuccess()
        }
        onClose()
      } else {
        throw new Error(result.error || 'Failed to save transaction')
      }
    } catch (error) {
      console.error('Error submitting transaction:', error)
      setSubmitError(error.message || 'Failed to save transaction. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-primary_color">
            {mode === 'add' ? 'Add New Transaction' : 'Edit Transaction'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Transaction Type & Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transaction Type *
              </label>
              <select
                name="transaction_type"
                value={formData.transaction_type}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary_color/20 focus:border-primary_color"
                required
              >
                <option value="payment">Payment</option>
                <option value="rental_period">Rental Period (Check In/Out)</option>
                <option value="rent_due">Rent Due</option>
                <option value="deposit">Deposit</option>
                <option value="security_deposit">Security Deposit</option>
                <option value="refund">Refund</option>
                <option value="penalty">Penalty</option>
                <option value="maintenance">Maintenance</option>
                <option value="utility">Utility</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category (Property Purpose) *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary_color/20 focus:border-primary_color"
                required
                disabled={loadingPurposes}
              >
                <option value="">Select Property Purpose</option>
                {propertyPurposes.map((purpose) => (
                  <option key={purpose.id} value={purpose.id}>
                    {purpose.name}
                  </option>
                ))}
              </select>
              {loadingPurposes && (
                <p className="text-xs text-gray-500 mt-1">Loading purposes...</p>
              )}
            </div>
          </div>

          {/* Customer Information */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-primary_color mb-4">Customer Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="customer_name"
                  value={formData.customer_name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary_color/20 focus:border-primary_color"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="customer_email"
                  value={formData.customer_email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary_color/20 focus:border-primary_color"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone *
                </label>
                <input
                  type="tel"
                  name="customer_phone"
                  value={formData.customer_phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary_color/20 focus:border-primary_color"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Secondary Phone
                </label>
                <input
                  type="tel"
                  name="customer_secondary_phone"
                  value={formData.customer_secondary_phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary_color/20 focus:border-primary_color"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <textarea
                  name="customer_address"
                  value={formData.customer_address}
                  onChange={handleChange}
                  rows="2"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary_color/20 focus:border-primary_color"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID Type
                </label>
                <select
                  name="customer_id_type"
                  value={formData.customer_id_type}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary_color/20 focus:border-primary_color"
                >
                  <option value="">Select ID Type</option>
                  <option value="national_id">National ID</option>
                  <option value="passport">Passport</option>
                  <option value="drivers_license">Driver's License</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID Number
                </label>
                <input
                  type="text"
                  name="customer_id_number"
                  value={formData.customer_id_number}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary_color/20 focus:border-primary_color"
                />
              </div>
            </div>
          </div>

          {/* Payment Information - Only for payment-related transactions, not for rental periods */}
          {(formData.transaction_type === 'payment' || formData.transaction_type === 'deposit' || formData.transaction_type === 'rent_due' || formData.transaction_type === 'security_deposit' || formData.transaction_type === 'refund') && (
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-primary_color mb-4">Payment Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount *
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary_color/20 focus:border-primary_color"
                    required={formData.transaction_type === 'payment' || formData.transaction_type === 'deposit'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Currency *
                  </label>
                  <select
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary_color/20 focus:border-primary_color"
                    required
                  >
                    <option value="USD">USD</option>
                    <option value="GHS">GHS</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method
                  </label>
                  <select
                    name="payment_method"
                    value={formData.payment_method}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary_color/20 focus:border-primary_color"
                  >
                    <option value="">Select Method</option>
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="mobile_money">Mobile Money</option>
                    <option value="check">Check</option>
                    <option value="card">Card</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Date
                  </label>
                  <input
                    type="date"
                    name="payment_date"
                    value={formData.payment_date}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary_color/20 focus:border-primary_color"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    name="due_date"
                    value={formData.due_date}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary_color/20 focus:border-primary_color"
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Transaction Reference
                  </label>
                  <input
                    type="text"
                    name="transaction_reference"
                    value={formData.transaction_reference}
                    onChange={handleChange}
                    placeholder="Bank reference, check number, etc."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary_color/20 focus:border-primary_color"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Rental Period - For tracking when rent starts and ends */}
          {formData.transaction_type === 'rental_period' && (
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-primary_color mb-4">Rental Period</h3>
              <p className="text-sm text-gray-600 mb-4">Track when the rental period starts (check-in) and ends (check-out)</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Check In Date (Rent Start) *
                  </label>
                  <input
                    type="date"
                    name="check_in_date"
                    value={formData.check_in_date}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary_color/20 focus:border-primary_color"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Check Out Date (Rent End) *
                  </label>
                  <input
                    type="date"
                    name="check_out_date"
                    value={formData.check_out_date}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary_color/20 focus:border-primary_color"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Other Dates */}
          {formData.transaction_type === 'rent_due' && (
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-primary_color mb-4">Rent Due Date</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rent Due Date *
                  </label>
                  <input
                    type="date"
                    name="rent_due_date"
                    value={formData.rent_due_date}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary_color/20 focus:border-primary_color"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Status - Always visible for all transaction types */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-primary_color mb-4">Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transaction Status *
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary_color/20 focus:border-primary_color"
                  required
                >
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="overdue">Overdue</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="disputed">Disputed</option>
                </select>
              </div>
              {formData.transaction_type === 'payment' || formData.transaction_type === 'deposit' || formData.transaction_type === 'security_deposit' || formData.transaction_type === 'refund' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Status
                  </label>
                  <select
                    name="payment_status"
                    value={formData.payment_status}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary_color/20 focus:border-primary_color"
                  >
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
                    <option value="refunded">Refunded</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              ) : null}
            </div>
          </div>

          {/* Notes & Receipts */}
          <div className="border-t border-gray-200 pt-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Add any additional notes about this transaction..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary_color/20 focus:border-primary_color"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Receipt Images
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-2">Upload receipt images</p>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files)
                      setReceiptImageFiles(prev => [...prev, ...files])
                    }}
                    className="hidden"
                    id="receipt-images-input"
                  />
                  <label
                    htmlFor="receipt-images-input"
                    className="text-sm text-primary_color hover:text-primary_color/80 flex items-center gap-1 mx-auto cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    Choose Files
                  </label>
                  {receiptImageFiles.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {receiptImageFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <span className="text-xs text-gray-700">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => setReceiptImageFiles(prev => prev.filter((_, i) => i !== index))}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {transaction?.receipt_images && transaction.receipt_images.length > 0 && mode === 'edit' && (
                    <div className="mt-4 space-y-2">
                      <p className="text-xs text-gray-500">Existing receipts:</p>
                      {transaction.receipt_images.map((img, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <a href={img.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary_color hover:underline">
                            {img.name || `Receipt ${index + 1}`}
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Documents
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-2">Upload documents (PDF, images, etc.)</p>
                  <input
                    type="file"
                    accept="image/*,.pdf,.doc,.docx"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files)
                      setDocumentFiles(prev => [...prev, ...files])
                    }}
                    className="hidden"
                    id="documents-input"
                  />
                  <label
                    htmlFor="documents-input"
                    className="text-sm text-primary_color hover:text-primary_color/80 flex items-center gap-1 mx-auto cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    Choose Files
                  </label>
                  {documentFiles.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {documentFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <span className="text-xs text-gray-700">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => setDocumentFiles(prev => prev.filter((_, i) => i !== index))}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {transaction?.additional_documents && transaction.additional_documents.length > 0 && mode === 'edit' && (
                    <div className="mt-4 space-y-2">
                      <p className="text-xs text-gray-500">Existing documents:</p>
                      {transaction.additional_documents.map((doc, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary_color hover:underline">
                            {doc.name || `Document ${index + 1}`}
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {submitError && (
            <div className="border-t border-gray-200 pt-4">
              <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-lg">
                <p className="text-sm">{submitError}</p>
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div className="border-t border-gray-200 pt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-primary_color text-white rounded-lg hover:bg-primary_color/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {mode === 'add' ? 'Adding...' : 'Saving...'}
                </>
              ) : (
                mode === 'add' ? 'Add Transaction' : 'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TransactionRecords
