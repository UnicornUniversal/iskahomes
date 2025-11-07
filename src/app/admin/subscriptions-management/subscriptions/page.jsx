'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { FiSearch, FiFilter, FiEye, FiCheckCircle, FiXCircle, FiClock, FiDollarSign, FiUser, FiX, FiPlus, FiEdit } from 'react-icons/fi'
import { toast } from 'react-toastify'

const SubscriptionsPage = () => {
  const [subscriptions, setSubscriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [userTypeFilter, setUserTypeFilter] = useState('all')
  const [selectedSubscription, setSelectedSubscription] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [packages, setPackages] = useState([])
  const [userSearchTerm, setUserSearchTerm] = useState('')
  const [userSearchResults, setUserSearchResults] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [searchingUsers, setSearchingUsers] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [subscriptionFormData, setSubscriptionFormData] = useState({
    package_id: '',
    status: 'active',
    paid_status: 'pending',
    start_date: '',
    end_date: '',
    grace_period_end_date: '',
    activated_at: '',
    cancelled_at: '',
    cancellation_reason: '',
    auto_renew: false,
    currency: 'USD',
    amount: '',
    duration_months: 1,
    admin_notes: ''
  })
  const abortControllerRef = useRef(null)
  const packagesAbortControllerRef = useRef(null)
  const isMountedRef = useRef(true)
  const userSearchTimeoutRef = useRef(null)
  const hasFetchedPackagesRef = useRef(false)

  const fetchSubscriptions = useCallback(async () => {
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
      
      let url = '/api/admin/subscriptions?'
      if (statusFilter !== 'all') {
        url += `status=${statusFilter}&`
      }
      if (userTypeFilter !== 'all') {
        url += `user_type=${userTypeFilter}&`
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
          setSubscriptions(data || [])
        }
      } else {
        if (isMountedRef.current) {
          toast.error('Failed to fetch subscriptions')
        }
      }
    } catch (error) {
      // Don't show error if request was aborted
      if (error.name === 'AbortError') {
        return
      }
      console.error('Error fetching subscriptions:', error)
      if (isMountedRef.current) {
        toast.error('Failed to fetch subscriptions')
      }
    } finally {
      // Only update loading if request wasn't aborted and component is mounted
      if (!abortController.signal.aborted && isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [statusFilter, userTypeFilter])

  // Fetch packages - only once on mount
  const fetchPackages = useCallback(async () => {
    // Don't fetch if already fetched
    if (hasFetchedPackagesRef.current) return

    // Cancel previous request if it exists
    if (packagesAbortControllerRef.current) {
      packagesAbortControllerRef.current.abort()
    }

    // Create new AbortController for this request
    const abortController = new AbortController()
    packagesAbortControllerRef.current = abortController

    try {
      const token = localStorage.getItem('admin_token') || localStorage.getItem('developer_token')
      const response = await fetch('/api/admin/packages', {
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
          setPackages(data || [])
          hasFetchedPackagesRef.current = true
        }
      }
    } catch (error) {
      // Don't show error if request was aborted
      if (error.name === 'AbortError') {
        return
      }
      console.error('Error fetching packages:', error)
    }
  }, [])

  // Search users
  const searchUsersAbortControllerRef = useRef(null)
  const searchUsers = useCallback(async (search) => {
    if (!search || search.length < 2) {
      setUserSearchResults([])
      return
    }

    // Cancel previous search request
    if (searchUsersAbortControllerRef.current) {
      searchUsersAbortControllerRef.current.abort()
    }

    // Create new AbortController for this request
    const abortController = new AbortController()
    searchUsersAbortControllerRef.current = abortController

    setSearchingUsers(true)
    try {
      const token = localStorage.getItem('admin_token') || localStorage.getItem('developer_token')
      const response = await fetch(`/api/admin/users/search?search=${encodeURIComponent(search)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        signal: abortController.signal
      })

      // Check if request was aborted
      if (abortController.signal.aborted) return

      const result = await response.json()

      if (response.ok) {
        if (isMountedRef.current && !abortController.signal.aborted) {
          setUserSearchResults(result.data || [])
        }
      } else {
        console.error('Search API error:', result.error || result)
        if (isMountedRef.current && !abortController.signal.aborted) {
          setUserSearchResults([])
        }
      }
    } catch (error) {
      // Don't show error if request was aborted
      if (error.name === 'AbortError') {
        return
      }
      console.error('Error searching users:', error)
      if (isMountedRef.current) {
        setUserSearchResults([])
      }
    } finally {
      if (isMountedRef.current && !abortController.signal.aborted) {
        setSearchingUsers(false)
      }
    }
  }, [])

  // Handle user search input with debounce
  useEffect(() => {
    // Don't search if a user is already selected
    if (selectedUser) {
      setUserSearchResults([])
      return
    }

    if (userSearchTimeoutRef.current) {
      clearTimeout(userSearchTimeoutRef.current)
    }

    if (userSearchTerm.length >= 2) {
      userSearchTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current && !selectedUser) {
          searchUsers(userSearchTerm)
        }
      }, 300)
    } else {
      setUserSearchResults([])
    }

    return () => {
      if (userSearchTimeoutRef.current) {
        clearTimeout(userSearchTimeoutRef.current)
      }
      // Cancel any ongoing search request
      if (searchUsersAbortControllerRef.current) {
        searchUsersAbortControllerRef.current.abort()
      }
    }
  }, [userSearchTerm, selectedUser]) // Removed searchUsers from deps to prevent re-runs

  // Fetch packages only once on mount
  useEffect(() => {
    isMountedRef.current = true
    fetchPackages()

    // Cleanup: abort request on unmount
    return () => {
      isMountedRef.current = false
      if (packagesAbortControllerRef.current) {
        packagesAbortControllerRef.current.abort()
      }
    }
  }, []) // Empty deps - only run on mount

  // Fetch subscriptions on mount and when filters change
  useEffect(() => {
    if (!isMountedRef.current) return
    
    // Cancel previous request if it exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new AbortController for this request
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    const fetchData = async () => {
      try {
        if (isMountedRef.current) {
          setLoading(true)
        }
        const token = localStorage.getItem('admin_token') || localStorage.getItem('developer_token')
        
        let url = '/api/admin/subscriptions?'
        if (statusFilter !== 'all') {
          url += `status=${statusFilter}&`
        }
        if (userTypeFilter !== 'all') {
          url += `user_type=${userTypeFilter}&`
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
          if (isMountedRef.current && !abortController.signal.aborted) {
            setSubscriptions(data || [])
          }
        } else {
          if (isMountedRef.current && !abortController.signal.aborted) {
            toast.error('Failed to fetch subscriptions')
          }
        }
      } catch (error) {
        // Don't show error if request was aborted
        if (error.name === 'AbortError') {
          return
        }
        console.error('Error fetching subscriptions:', error)
        if (isMountedRef.current && !abortController.signal.aborted) {
          toast.error('Failed to fetch subscriptions')
        }
      } finally {
        // Only update loading if request wasn't aborted and component is mounted
        if (!abortController.signal.aborted && isMountedRef.current) {
          setLoading(false)
        }
      }
    }

    fetchData()

    // Cleanup: abort request on unmount or filter change
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [statusFilter, userTypeFilter]) // Only depend on filters

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      if (packagesAbortControllerRef.current) {
        packagesAbortControllerRef.current.abort()
      }
      if (userSearchTimeoutRef.current) {
        clearTimeout(userSearchTimeoutRef.current)
      }
      if (searchUsersAbortControllerRef.current) {
        searchUsersAbortControllerRef.current.abort()
      }
    }
  }, [])

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', icon: FiCheckCircle },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: FiClock },
      expired: { color: 'bg-red-100 text-red-800', icon: FiXCircle },
      cancelled: { color: 'bg-gray-100 text-gray-800', icon: FiXCircle },
      suspended: { color: 'bg-orange-100 text-orange-800', icon: FiXCircle },
      grace_period: { color: 'bg-blue-100 text-blue-800', icon: FiClock }
    }

    const config = statusConfig[status] || statusConfig.pending
    const IconComponent = config.icon

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <IconComponent className="w-3 h-3" />
        {status.replace('_', ' ')}
      </span>
    )
  }

  const getPaidStatusBadge = (paidStatus) => {
    const paidStatusConfig = {
      paid: { color: 'bg-green-100 text-green-800', icon: FiCheckCircle },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: FiClock },
      failed: { color: 'bg-red-100 text-red-800', icon: FiXCircle },
      cancelled: { color: 'bg-gray-100 text-gray-800', icon: FiXCircle },
      refunded: { color: 'bg-purple-100 text-purple-800', icon: FiDollarSign },
      partial: { color: 'bg-orange-100 text-orange-800', icon: FiClock }
    }

    const config = paidStatusConfig[paidStatus] || paidStatusConfig.pending
    const IconComponent = config.icon

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <IconComponent className="w-3 h-3" />
        {paidStatus.replace('_', ' ')}
      </span>
    )
  }

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = !searchTerm || 
      sub.subscriptions_package?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.user_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.user?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const viewDetails = (subscription) => {
    setSelectedSubscription(subscription)
    setShowDetailsModal(true)
  }

  const handleCreate = () => {
    setSelectedUser(null)
    setUserSearchTerm('')
    setUserSearchResults([])
    setSubscriptionFormData({
      package_id: '',
      status: 'active',
      paid_status: 'pending',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      grace_period_end_date: '',
      activated_at: new Date().toISOString().split('T')[0],
      cancelled_at: '',
      cancellation_reason: '',
      auto_renew: false,
      currency: 'USD',
      amount: '',
      duration_months: 1,
      admin_notes: ''
    })
    setShowCreateModal(true)
  }

  const handleEdit = (subscription) => {
    setSelectedUser({
      id: subscription.user_id,
      name: subscription.user?.name || 'Unknown User',
      user_type: subscription.user_type
    })
    setSubscriptionFormData({
      package_id: subscription.package_id || '',
      status: subscription.status || 'active',
      paid_status: subscription.paid_status || 'pending',
      start_date: subscription.start_date ? new Date(subscription.start_date).toISOString().split('T')[0] : '',
      end_date: subscription.end_date ? new Date(subscription.end_date).toISOString().split('T')[0] : '',
      grace_period_end_date: subscription.grace_period_end_date ? new Date(subscription.grace_period_end_date).toISOString().split('T')[0] : '',
      activated_at: subscription.activated_at ? new Date(subscription.activated_at).toISOString().split('T')[0] : '',
      cancelled_at: subscription.cancelled_at ? new Date(subscription.cancelled_at).toISOString().split('T')[0] : '',
      cancellation_reason: subscription.cancellation_reason || '',
      auto_renew: subscription.auto_renew || false,
      currency: subscription.currency || 'USD',
      amount: subscription.amount?.toString() || '',
      duration_months: subscription.duration_months || 1,
      admin_notes: subscription.admin_notes || ''
    })
    setShowEditModal(true)
    setSelectedSubscription(subscription)
  }

  const handlePackageChange = (packageId) => {
    const selectedPackage = packages.find(pkg => pkg.id === packageId)
    if (selectedPackage) {
      const currency = subscriptionFormData.currency || 'USD'
      
      // Always use ideal_duration from package (not editable)
      const idealDuration = selectedPackage.ideal_duration && selectedPackage.ideal_duration > 0 
        ? selectedPackage.ideal_duration 
        : 1
      
      // Use total_amount from package (not editable) - based on selected currency
      const totalAmount = currency === 'GHS'
        ? (selectedPackage.total_amount_ghs || (selectedPackage.local_currency_price * idealDuration))
        : (selectedPackage.total_amount_usd || (selectedPackage.international_currency_price * idealDuration))

      // Auto-calculate end date and grace period
      const startDate = subscriptionFormData.start_date || new Date().toISOString().split('T')[0]
      const endDate = calculateEndDate(startDate, idealDuration)
      const graceEndDate = calculateGracePeriodEndDate(endDate)

      setSubscriptionFormData(prev => ({
        ...prev,
        package_id: packageId,
        amount: totalAmount.toString(),
        duration_months: idealDuration, // Set from package, not editable
        end_date: endDate,
        grace_period_end_date: graceEndDate
      }))
    }
  }

  const handleCurrencyChange = (currency) => {
    const selectedPackage = packages.find(pkg => pkg.id === subscriptionFormData.package_id)
    if (selectedPackage) {
      // Always use ideal_duration from package (not editable)
      const idealDuration = selectedPackage.ideal_duration && selectedPackage.ideal_duration > 0 
        ? selectedPackage.ideal_duration 
        : 1
      
      // Use total_amount from package (not editable) - based on selected currency
      const totalAmount = currency === 'GHS'
        ? (selectedPackage.total_amount_ghs || (selectedPackage.local_currency_price * idealDuration))
        : (selectedPackage.total_amount_usd || (selectedPackage.international_currency_price * idealDuration))

      // Recalculate dates if start_date exists
      let endDate = subscriptionFormData.end_date
      let graceEndDate = subscriptionFormData.grace_period_end_date
      
      if (subscriptionFormData.start_date) {
        endDate = calculateEndDate(subscriptionFormData.start_date, idealDuration)
        graceEndDate = calculateGracePeriodEndDate(endDate)
      }

      setSubscriptionFormData(prev => ({
        ...prev,
        currency,
        amount: totalAmount.toString(), // Auto-updated from package
        duration_months: idealDuration, // Set from package, not editable
        end_date: endDate,
        grace_period_end_date: graceEndDate
      }))
    } else {
      // If no package selected, just update currency
      setSubscriptionFormData(prev => ({
        ...prev,
        currency
      }))
    }
  }

  // Duration is now read-only and comes from package, so this function is no longer needed
  // But keeping it for backward compatibility in case it's called from somewhere
  const handleDurationChange = (duration) => {
    // Duration is determined by package.ideal_duration and cannot be manually changed
    // This function is kept for compatibility but should not be used
    console.warn('Duration cannot be manually changed. It is determined by the selected package.')
  }

  const calculateEndDate = (startDate, durationMonths) => {
    if (!startDate || !durationMonths) return ''
    const start = new Date(startDate)
    const end = new Date(start)
    end.setMonth(end.getMonth() + parseInt(durationMonths))
    return end.toISOString().split('T')[0]
  }

  const calculateGracePeriodEndDate = (endDate) => {
    if (!endDate) return ''
    const end = new Date(endDate)
    const graceEnd = new Date(end)
    graceEnd.setDate(graceEnd.getDate() + 7)
    return graceEnd.toISOString().split('T')[0]
  }

  const handleStartDateChange = (startDate) => {
    const duration = subscriptionFormData.duration_months || 1
    const endDate = calculateEndDate(startDate, duration)
    const graceEndDate = calculateGracePeriodEndDate(endDate)

    setSubscriptionFormData(prev => ({
      ...prev,
      start_date: startDate,
      end_date: endDate,
      grace_period_end_date: graceEndDate
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedUser) {
      toast.error('Please select a user')
      return
    }
    if (!subscriptionFormData.package_id) {
      toast.error('Please select a package')
      return
    }

    setSubmitting(true)
    try {
      const token = localStorage.getItem('admin_token') || localStorage.getItem('developer_token')
      const response = await fetch('/api/admin/subscriptions/manage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          subscription_id: showEditModal ? selectedSubscription?.id : null,
          user_id: selectedUser.id,
          user_type: selectedUser.user_type,
          package_id: subscriptionFormData.package_id,
          status: subscriptionFormData.status,
          paid_status: subscriptionFormData.paid_status,
          start_date: subscriptionFormData.start_date ? new Date(subscriptionFormData.start_date).toISOString() : null,
          end_date: subscriptionFormData.end_date ? new Date(subscriptionFormData.end_date).toISOString() : null,
          grace_period_end_date: subscriptionFormData.grace_period_end_date ? new Date(subscriptionFormData.grace_period_end_date).toISOString() : null,
          activated_at: subscriptionFormData.activated_at ? new Date(subscriptionFormData.activated_at).toISOString() : null,
          cancelled_at: subscriptionFormData.cancelled_at ? new Date(subscriptionFormData.cancelled_at).toISOString() : null,
          cancellation_reason: subscriptionFormData.cancellation_reason || null,
          auto_renew: subscriptionFormData.auto_renew,
          currency: subscriptionFormData.currency,
          amount: subscriptionFormData.amount ? parseFloat(subscriptionFormData.amount) : null,
          duration_months: subscriptionFormData.duration_months,
          admin_notes: subscriptionFormData.admin_notes || null
        })
      })

      const result = await response.json()

      if (response.ok) {
        toast.success(result.message || 'Subscription saved successfully')
        setShowCreateModal(false)
        setShowEditModal(false)
        setSelectedUser(null)
        setUserSearchTerm('')
        setUserSearchResults([])
        // Refresh subscriptions
        if (isMountedRef.current) {
          fetchSubscriptions()
        }
      } else {
        toast.error(result.error || 'Failed to save subscription')
      }
    } catch (error) {
      console.error('Error saving subscription:', error)
      toast.error('An error occurred. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Subscriptions</h1>
          <p className="text-gray-600">View and manage all user subscriptions</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary_color text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FiPlus className="w-5 h-5" />
          Create Subscription
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search subscriptions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-transparent"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="expired">Expired</option>
            <option value="cancelled">Cancelled</option>
            <option value="suspended">Suspended</option>
            <option value="grace_period">Grace Period</option>
          </select>

          {/* User Type Filter */}
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

          <button
            onClick={() => {
              // Trigger re-fetch by updating a dummy state or directly calling
              // Since fetchSubscriptions is memoized with filters, we can call it directly
              fetchSubscriptions()
            }}
            className="px-4 py-2 bg-primary_color text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Subscriptions Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary_color"></div>
          <p className="mt-4 text-gray-600">Loading subscriptions...</p>
        </div>
      ) : filteredSubscriptions.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <FiUser className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No subscriptions found</p>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSubscriptions.map((subscription) => (
                  <tr key={subscription.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {subscription.user?.profile_image ? (
                          <img 
                            src={(() => {
                              try {
                                if (typeof subscription.user.profile_image === 'string') {
                                  const parsed = JSON.parse(subscription.user.profile_image)
                                  return parsed?.url || subscription.user.profile_image
                                }
                                return subscription.user.profile_image?.url || subscription.user.profile_image
                              } catch (e) {
                                return subscription.user.profile_image
                              }
                            })()}
                            alt={subscription.user?.name || 'User'}
                            className="w-10 h-10 rounded-full object-cover"
                            onError={(e) => {
                              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(subscription.user?.name || 'User')}&background=primary_color&color=fff`
                            }}
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary_color flex items-center justify-center text-white font-semibold">
                            {(subscription.user?.name || subscription.user_type?.[0] || 'U').toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {subscription.user?.name || 'Unknown User'}
                          </div>
                          <div className="text-xs text-gray-500 capitalize">{subscription.user_type}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {subscription.subscriptions_package?.name || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(subscription.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getPaidStatusBadge(subscription.paid_status || 'pending')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {subscription.currency} {subscription.amount?.toLocaleString() || '0'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(subscription.start_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(subscription.end_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => viewDetails(subscription)}
                          className="text-primary_color hover:text-blue-700"
                          title="View Details"
                        >
                          <FiEye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleEdit(subscription)}
                          className="text-green-600 hover:text-green-700"
                          title="Edit Subscription"
                        >
                          <FiEdit className="w-5 h-5" />
                        </button>
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
      {showDetailsModal && selectedSubscription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Subscription Details</h2>
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
                  {selectedSubscription.user?.profile_image ? (
                    <img 
                      src={(() => {
                        try {
                          if (typeof selectedSubscription.user.profile_image === 'string') {
                            const parsed = JSON.parse(selectedSubscription.user.profile_image)
                            return parsed?.url || selectedSubscription.user.profile_image
                          }
                          return selectedSubscription.user.profile_image?.url || selectedSubscription.user.profile_image
                        } catch (e) {
                          return selectedSubscription.user.profile_image
                        }
                      })()}
                      alt={selectedSubscription.user?.name || 'User'}
                      className="w-12 h-12 rounded-full object-cover"
                      onError={(e) => {
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedSubscription.user?.name || 'User')}&background=primary_color&color=fff`
                      }}
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary_color flex items-center justify-center text-white font-semibold">
                      {(selectedSubscription.user?.name || selectedSubscription.user_type?.[0] || 'U').toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-gray-900 font-medium">{selectedSubscription.user?.name || 'Unknown User'}</p>
                    <p className="text-sm text-gray-500 capitalize">{selectedSubscription.user_type}</p>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Package</label>
                <p className="text-gray-900">{selectedSubscription.subscriptions_package?.name || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <div className="mt-1">{getStatusBadge(selectedSubscription.status)}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Payment Status</label>
                <div className="mt-1">{getPaidStatusBadge(selectedSubscription.paid_status || 'pending')}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Amount</label>
                <p className="text-gray-900">{selectedSubscription.currency} {selectedSubscription.amount?.toLocaleString() || '0'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Duration</label>
                <p className="text-gray-900">{selectedSubscription.duration_months} months</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Start Date</label>
                <p className="text-gray-900">{formatDate(selectedSubscription.start_date)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">End Date</label>
                <p className="text-gray-900">{formatDate(selectedSubscription.end_date)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Grace Period End</label>
                <p className="text-gray-900">{formatDate(selectedSubscription.grace_period_end_date)}</p>
              </div>
              {selectedSubscription.admin_notes && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Admin Notes</label>
                  <p className="text-gray-900">{selectedSubscription.admin_notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Subscription Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {showEditModal ? 'Edit Subscription' : 'Create Subscription'}
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setShowEditModal(false)
                  setSelectedUser(null)
                  setUserSearchTerm('')
                  setUserSearchResults([])
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* User Search and Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  User {showEditModal && '(Cannot be changed)'}
                </label>
                {showEditModal ? (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium text-gray-900">{selectedUser?.name || 'Unknown User'}</p>
                    <p className="text-sm text-gray-500 capitalize">{selectedUser?.user_type}</p>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search by user ID or company name..."
                        value={userSearchTerm}
                        onChange={(e) => setUserSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-transparent"
                      />
                    </div>
                    {searchingUsers && (
                      <p className="text-sm text-gray-500 mt-2">Searching...</p>
                    )}
                    {/* Show search results only if no user is selected */}
                    {!selectedUser && userSearchResults.length > 0 && (
                      <div className="mt-2 border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
                        {userSearchResults.map((user) => (
                          <button
                            key={user.id}
                            type="button"
                            onClick={() => {
                              setSelectedUser(user)
                              setUserSearchTerm(user.name)
                              setUserSearchResults([])
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                          >
                            <p className="font-medium text-gray-900">{user.name}</p>
                            <p className="text-sm text-gray-500 capitalize">{user.user_type} • {user.email}</p>
                          </button>
                        ))}
                      </div>
                    )}
                    {/* Show selected user confirmation */}
                    {selectedUser && (
                      <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm font-medium text-green-900">Selected: {selectedUser.name}</p>
                        <p className="text-xs text-green-700 mt-1 capitalize">{selectedUser.user_type} • {selectedUser.email}</p>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedUser(null)
                            setUserSearchTerm('')
                            setUserSearchResults([])
                          }}
                          className="text-xs text-green-700 hover:text-green-900 mt-2 underline"
                        >
                          Change user
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Package Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Package <span className="text-red-500">*</span>
                </label>
                <select
                  value={subscriptionFormData.package_id}
                  onChange={(e) => handlePackageChange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-transparent"
                  required
                >
                  <option value="">Select a package</option>
                  {packages.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.name} - {pkg.user_type || 'All'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status and Payment Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subscription Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={subscriptionFormData.status}
                    onChange={(e) => setSubscriptionFormData(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-transparent"
                    required
                  >
                    <option value="pending">Pending</option>
                    <option value="active">Active</option>
                    <option value="expired">Expired</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="suspended">Suspended</option>
                    <option value="grace_period">Grace Period</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={subscriptionFormData.paid_status}
                    onChange={(e) => setSubscriptionFormData(prev => ({ ...prev, paid_status: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-transparent"
                    required
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="failed">Failed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="refunded">Refunded</option>
                    <option value="partial">Partial</option>
                  </select>
                </div>
              </div>

              {/* Package Details (Read-only) */}
              {subscriptionFormData.package_id && (() => {
                const selectedPackage = packages.find(pkg => pkg.id === subscriptionFormData.package_id)
                if (selectedPackage) {
                  const monthlyPrice = subscriptionFormData.currency === 'GHS'
                    ? parseFloat(selectedPackage.local_currency_price || 0)
                    : parseFloat(selectedPackage.international_currency_price || 0)
                  
                  return (
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">Package Details (Auto-filled from Package)</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">
                            Monthly Price
                          </label>
                          <div className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 font-medium">
                            {subscriptionFormData.currency} {monthlyPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Per month</p>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">
                            Duration (Months)
                          </label>
                          <div className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 font-medium">
                            {subscriptionFormData.duration_months} {subscriptionFormData.duration_months === 1 ? 'month' : 'months'}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">From package: {selectedPackage.name}</p>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">
                            Total Amount
                          </label>
                          <div className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 font-medium">
                            {subscriptionFormData.currency} {parseFloat(subscriptionFormData.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {monthlyPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} × {subscriptionFormData.duration_months} months
                          </p>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">
                            Currency
                          </label>
                          <select
                            value={subscriptionFormData.currency}
                            onChange={(e) => handleCurrencyChange(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-transparent bg-white"
                            required
                          >
                            <option value="USD">USD</option>
                            <option value="GHS">GHS</option>
                          </select>
                          <p className="text-xs text-gray-500 mt-1">Amount updates automatically</p>
                        </div>
                      </div>
                    </div>
                  )
                }
                return null
              })()}

              {/* Currency Selection (if no package selected yet) */}
              {!subscriptionFormData.package_id && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Currency <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={subscriptionFormData.currency}
                    onChange={(e) => handleCurrencyChange(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-transparent"
                    required
                  >
                    <option value="USD">USD</option>
                    <option value="GHS">GHS</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Select a package first to see the amount</p>
                </div>
              )}

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={subscriptionFormData.start_date}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={subscriptionFormData.end_date}
                    onChange={(e) => {
                      setSubscriptionFormData(prev => ({
                        ...prev,
                        end_date: e.target.value,
                        grace_period_end_date: calculateGracePeriodEndDate(e.target.value)
                      }))
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Grace Period End Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={subscriptionFormData.grace_period_end_date}
                    onChange={(e) => setSubscriptionFormData(prev => ({ ...prev, grace_period_end_date: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* Activated At */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Activated At
                </label>
                <input
                  type="datetime-local"
                  value={subscriptionFormData.activated_at ? new Date(subscriptionFormData.activated_at).toISOString().slice(0, 16) : ''}
                  onChange={(e) => setSubscriptionFormData(prev => ({ ...prev, activated_at: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-transparent"
                />
              </div>

              {/* Cancelled At and Reason */}
              {subscriptionFormData.status === 'cancelled' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cancelled At
                    </label>
                    <input
                      type="datetime-local"
                      value={subscriptionFormData.cancelled_at ? new Date(subscriptionFormData.cancelled_at).toISOString().slice(0, 16) : ''}
                      onChange={(e) => setSubscriptionFormData(prev => ({ ...prev, cancelled_at: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cancellation Reason
                    </label>
                    <input
                      type="text"
                      value={subscriptionFormData.cancellation_reason}
                      onChange={(e) => setSubscriptionFormData(prev => ({ ...prev, cancellation_reason: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              {/* Auto Renew */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="auto_renew"
                  checked={subscriptionFormData.auto_renew}
                  onChange={(e) => setSubscriptionFormData(prev => ({ ...prev, auto_renew: e.target.checked }))}
                  className="w-4 h-4 text-primary_color border-gray-300 rounded focus:ring-primary_color"
                />
                <label htmlFor="auto_renew" className="text-sm font-medium text-gray-700">
                  Auto Renew
                </label>
              </div>

              {/* Admin Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Notes
                </label>
                <textarea
                  value={subscriptionFormData.admin_notes}
                  onChange={(e) => setSubscriptionFormData(prev => ({ ...prev, admin_notes: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-transparent"
                  placeholder="Internal notes (not visible to user)"
                />
              </div>

              {/* Form Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false)
                    setShowEditModal(false)
                    setSelectedUser(null)
                    setUserSearchTerm('')
                    setUserSearchResults([])
                  }}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !selectedUser || !subscriptionFormData.package_id}
                  className="flex-1 py-2 px-4 bg-primary_color text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Saving...' : showEditModal ? 'Update Subscription' : 'Create Subscription'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default SubscriptionsPage

