"use client"
import React, { useState, useEffect, useCallback, useRef } from 'react'
import { 
  FiCreditCard, 
  FiCheck, 
  FiX, 
  FiStar, 
  FiZap, 
  FiAward, 
  FiCalendar, 
  FiDownload,
  FiSettings,
  FiShield,
  FiUsers,
  FiTrendingUp,
  FiMessageSquare,
  FiMapPin,
  FiGrid,
  FiDollarSign,
  FiClock,
  FiAlertCircle,
  FiRefreshCw,
  FiEdit,
  FiTrash2,
  FiEye,
  FiExternalLink,
  FiSave
} from 'react-icons/fi'
import DeveloperNav from '../../../../components/developers/DeveloperNav'

const SubscriptionsPage = () => {
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [billingCycle, setBillingCycle] = useState('monthly')
  const [currency, setCurrency] = useState('GHS') // GHS or USD
  const [activeTab, setActiveTab] = useState('plans')
  const [showChangePlanModal, setShowChangePlanModal] = useState(false)
  const [showBillingSettingsModal, setShowBillingSettingsModal] = useState(false)
  const [showBillingForm, setShowBillingForm] = useState(false)
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false)
  const [selectedPackageForPayment, setSelectedPackageForPayment] = useState(null)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null) // 'manual' or 'online'
  const [packages, setPackages] = useState([])
  const [currentSubscription, setCurrentSubscription] = useState(null)
  const [billingInfo, setBillingInfo] = useState(null)
  const [invoices, setInvoices] = useState([])
  const [subscriptionHistory, setSubscriptionHistory] = useState([])
  const [subscriptionRequests, setSubscriptionRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancellationReason, setCancellationReason] = useState('')
  const [billingFormData, setBillingFormData] = useState({
    preferred_payment_method: 'mobile_money',
    mobile_money_provider: 'mtn',
    mobile_money_number: '',
    mobile_money_account_name: '',
    bank_name: '',
    bank_account_number: '',
    bank_account_name: '',
    bank_branch: '',
    billing_email: '',
    billing_phone: '',
    billing_address: ''
  })
  const abortControllerRef = useRef(null)
  const isMountedRef = useRef(true)

  // Get auth token
  const getAuthToken = useCallback(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('developer_token') || localStorage.getItem('agent_token') || ''
    }
    return ''
  }, [])

  // Fetch all data - only once on mount
  const fetchAllData = useCallback(async () => {
    // Cancel previous request if it exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new AbortController for this request
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    if (!isMountedRef.current) return

    if (isMountedRef.current) {
      setLoading(true)
    }
    const token = getAuthToken()
    
    if (!token) {
      if (isMountedRef.current) setLoading(false)
      return
    }

    try {
      // Fetch developer profile to determine currency
      const profileRes = await fetch('/api/developers/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        signal: abortController.signal
      })
      
      // Check if request was aborted
      if (abortController.signal.aborted) return

      if (profileRes.ok && isMountedRef.current) {
        const { data: developer } = await profileRes.json()
        if (developer && isMountedRef.current) {
          // Determine currency from primary location
          let determinedCurrency = 'USD' // Default to USD
          if (developer.company_locations) {
            let locations = []
            if (typeof developer.company_locations === 'string') {
              try {
                locations = JSON.parse(developer.company_locations)
              } catch (e) {
                locations = []
              }
            } else {
              locations = developer.company_locations
            }

            const primaryLocation = Array.isArray(locations) 
              ? locations.find(loc => loc.primary_location === true)
              : null

            if (primaryLocation) {
              if (primaryLocation.country?.toLowerCase() === 'ghana' || 
                  primaryLocation.currency === 'GHS') {
                determinedCurrency = 'GHS'
              } else {
                determinedCurrency = 'USD'
              }
            } else if (developer.default_currency) {
              try {
                const defaultCurrency = typeof developer.default_currency === 'string'
                  ? JSON.parse(developer.default_currency)
                  : developer.default_currency
                if (defaultCurrency?.code === 'GHS') {
                  determinedCurrency = 'GHS'
                }
              } catch (e) {
                if (developer.default_currency === 'GHS' || developer.default_currency?.includes('GHS')) {
                  determinedCurrency = 'GHS'
                }
              }
            }
          }
          if (isMountedRef.current) setCurrency(determinedCurrency)
        }
      }

      // Fetch packages
      const packagesRes = await fetch('/api/packages?user_type=developers', {
        signal: abortController.signal
      })
      
      if (abortController.signal.aborted) return

      if (packagesRes.ok && isMountedRef.current) {
        const { data } = await packagesRes.json()
        if (isMountedRef.current) {
          setPackages(data || [])
          if (data && data.length > 0) {
            setSelectedPlan(prev => prev || data[0].id)
          }
        }
      }

      // Fetch current subscription
      const subRes = await fetch('/api/subscriptions', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        signal: abortController.signal
      })
      
      if (abortController.signal.aborted) return

      if (subRes.ok && isMountedRef.current) {
        const { data, currency: subscriptionCurrency } = await subRes.json()
        if (isMountedRef.current) {
          setCurrentSubscription(data)
          if (data?.package_id) {
            setSelectedPlan(data.package_id)
          }
          // Use currency from subscription if available (fallback)
          if (subscriptionCurrency) {
            setCurrency(subscriptionCurrency)
          }
        }
      }

      // Fetch billing information
      const billingRes = await fetch('/api/billing-information', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        signal: abortController.signal
      })
      
      if (abortController.signal.aborted) return

      if (billingRes.ok && isMountedRef.current) {
        const { data } = await billingRes.json()
        const primaryBilling = data?.find(b => b.is_primary) || data?.[0] || null
        if (isMountedRef.current) {
          setBillingInfo(primaryBilling)
          if (primaryBilling) {
            setBillingFormData({
              preferred_payment_method: primaryBilling.preferred_payment_method || 'mobile_money',
              mobile_money_provider: primaryBilling.mobile_money_provider || 'mtn',
              mobile_money_number: primaryBilling.mobile_money_number || '',
              mobile_money_account_name: primaryBilling.mobile_money_account_name || '',
              bank_name: primaryBilling.bank_name || '',
              bank_account_number: primaryBilling.bank_account_number || '',
              bank_account_name: primaryBilling.bank_account_name || '',
              bank_branch: primaryBilling.bank_branch || '',
              billing_email: primaryBilling.billing_email || '',
              billing_phone: primaryBilling.billing_phone || '',
              billing_address: primaryBilling.billing_address || ''
            })
          }
        }
      }

      // Fetch invoices
      const invoicesRes = await fetch('/api/subscriptions/invoices', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        signal: abortController.signal
      })
      
      if (abortController.signal.aborted) return

      if (invoicesRes.ok && isMountedRef.current) {
        const { data } = await invoicesRes.json()
        if (isMountedRef.current) {
          setInvoices(data || [])
        }
      }

      // Fetch subscription history
      const historyRes = await fetch('/api/subscriptions/history', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        signal: abortController.signal
      })
      
      if (abortController.signal.aborted) return

      if (historyRes.ok && isMountedRef.current) {
        const { data } = await historyRes.json()
        if (isMountedRef.current) {
          setSubscriptionHistory(data || [])
        }
      }

      // Fetch subscription requests
      const requestsRes = await fetch('/api/subscriptions-requests', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        signal: abortController.signal
      })
      
      if (abortController.signal.aborted) return

      if (requestsRes.ok && isMountedRef.current) {
        const { data } = await requestsRes.json()
        if (isMountedRef.current) {
          setSubscriptionRequests(data || [])
        }
      }

      } catch (error) {
      // Don't show error if request was aborted
      if (error.name === 'AbortError') {
        return
      }
      if (isMountedRef.current) {
        console.error('Error fetching data:', error)
      }
      } finally {
      // Only update loading if request wasn't aborted and component is mounted
      if (!abortController.signal.aborted && isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [getAuthToken])

  useEffect(() => {
    isMountedRef.current = true
    fetchAllData()

    // Cleanup: abort request on unmount
    return () => {
      isMountedRef.current = false
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [fetchAllData])

  // Map database packages to component format
  const subscriptionPlans = (packages || []).map((pkg, index) => {
    // Get monthly price based on currency
    const monthlyPrice = currency === 'GHS' 
      ? parseFloat(pkg.local_currency_price || 0)
      : parseFloat(pkg.international_currency_price || 0)
    
    // Use total_amount from package if available, otherwise calculate
    // ideal_duration is the minimum payment period (e.g., 3 months)
    const idealDuration = pkg.ideal_duration && pkg.ideal_duration > 0 ? pkg.ideal_duration : 1
    const totalPrice = currency === 'GHS'
      ? (pkg.total_amount_ghs || (monthlyPrice * idealDuration))
      : (pkg.total_amount_usd || (monthlyPrice * idealDuration))
    
    // For display purposes, keep price structure (though we'll show total price)
    const priceStructure = {
      monthly: monthlyPrice,
      yearly: monthlyPrice * 12,
      total: totalPrice
    }

    // Map features from objects to display strings
    const features = (pkg.features || []).map(feature => {
      if (typeof feature === 'object' && feature.feature_name) {
        return feature.feature_value 
          ? `${feature.feature_name}: ${feature.feature_value}`
          : feature.feature_name
      }
      return typeof feature === 'string' ? feature : ''
    }).filter(f => f)

    // Icon mapping based on package name or index
    const iconMap = {
      'basic': FiStar,
      'standard': FiZap,
      'premium': FiZap,
      'pro': FiZap,
      'professional': FiZap,
      'enterprise': FiAward
    }
    
    const packageNameLower = (pkg.name || '').toLowerCase()
    let IconComponent = FiStar
    for (const [key, icon] of Object.entries(iconMap)) {
      if (packageNameLower.includes(key)) {
        IconComponent = icon
        break
      }
    }

    // Color mapping
    const colorMap = {
      'basic': 'from-blue-500 to-blue-600',
      'standard': 'from-green-500 to-green-600',
      'premium': 'from-primary_color to-blue-600',
      'pro': 'from-primary_color to-blue-600',
      'professional': 'from-primary_color to-blue-600',
      'enterprise': 'from-purple-500 to-purple-600'
    }
    
    let color = 'from-blue-500 to-blue-600'
    for (const [key, colorValue] of Object.entries(colorMap)) {
      if (packageNameLower.includes(key)) {
        color = colorValue
        break
      }
    }

    return {
      id: pkg.id,
      name: pkg.name,
      price: priceStructure,
      description: pkg.description || '',
      features: features,
      display_text: pkg.display_text || '',
      duration: pkg.duration,
      span: pkg.span,
      ideal_duration: idealDuration,
      monthly_price: monthlyPrice,
      total_price: totalPrice,
      local_price: parseFloat(pkg.local_currency_price || 0),
      international_price: parseFloat(pkg.international_currency_price || 0),
      icon: IconComponent,
      color: color,
      popular: index === 1 || packageNameLower.includes('pro') || packageNameLower.includes('premium') // Mark second or pro/premium as popular
    }
  })

  const getCurrentPlan = () => {
    if (!currentSubscription?.package_id) return null
    return subscriptionPlans.find(plan => plan.id === currentSubscription.package_id)
  }

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'grace_period':
        return 'bg-orange-100 text-orange-800'
      case 'expired':
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatPaymentMethod = (billing) => {
    if (!billing) return 'Not set'
    if (billing.preferred_payment_method === 'mobile_money') {
      const provider = billing.mobile_money_provider?.toUpperCase() || 'Mobile Money'
      return `${provider} (${billing.mobile_money_number || 'N/A'})`
    } else if (billing.preferred_payment_method === 'bank_transfer') {
      return `${billing.bank_name || 'Bank'} - ${billing.bank_account_number || 'N/A'}`
    }
    return billing.preferred_payment_method || 'Not set'
  }

  const formatEventType = (eventType) => {
    const map = {
      'created': 'Subscription Created',
      'activated': 'Activated',
      'renewed': 'Renewed',
      'upgraded': 'Plan Upgraded',
      'downgraded': 'Plan Downgraded',
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


  const handleChangePlan = () => {
    setShowChangePlanModal(true)
  }

  const handleSelectPlan = async (packageId) => {
    const token = getAuthToken()
    if (!token) {
      alert('Please log in to select a plan')
      return
    }

    // Find the selected package
    const selectedPackage = packages.find(pkg => pkg.id === packageId)
    if (!selectedPackage) {
      alert('Package not found')
      return
    }

    // Check if it's the Free plan
    // Free plan is identified by name === "Free" OR price === 0
    const isFreePlan = selectedPackage.name?.toLowerCase().trim() === 'free' || 
                      parseFloat(selectedPackage.local_currency_price || 0) === 0 ||
                      parseFloat(selectedPackage.international_currency_price || 0) === 0

    if (isFreePlan) {
      // Directly activate Free plan (no payment needed)
      await handleActivateFreePlan(packageId)
    } else {
      // Show payment method modal for paid plans
      setSelectedPackageForPayment(selectedPackage)
      setShowPaymentMethodModal(true)
      setShowChangePlanModal(false)
    }
  }

  const handleActivateFreePlan = async (packageId) => {
    const token = getAuthToken()
    if (!token) return

    setSubmitting(true)
    try {
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          package_id: packageId,
          payment_method: 'free' // Special flag for free plan
        })
      })

      const result = await response.json()

      if (response.ok) {
        alert('Free plan activated successfully!')
        // Refresh all data
        const subRes = await fetch('/api/subscriptions', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (subRes.ok) {
          const { data } = await subRes.json()
          setCurrentSubscription(data)
          if (data?.package_id) {
            setSelectedPlan(data.package_id)
          }
        }
        // Refresh packages to get updated info
        const packagesRes = await fetch('/api/packages?user_type=developers')
        if (packagesRes.ok) {
          const { data: packagesData } = await packagesRes.json()
          setPackages(packagesData || [])
        }
        setShowChangePlanModal(false)
      } else {
        alert(result.error || 'Failed to activate free plan')
      }
    } catch (error) {
      console.error('Error activating free plan:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmitRequest = async () => {
    if (!selectedPackageForPayment || !selectedPaymentMethod) return

    const token = getAuthToken()
    if (!token) {
      alert('Please log in to continue')
      return
    }

    if (selectedPaymentMethod === 'manual') {
      setSubmitting(true)
      try {
        // Create subscription request ONLY (no subscription created)
        const response = await fetch('/api/subscriptions-requests', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            package_id: selectedPackageForPayment.id
          })
        })

        const result = await response.json()

        if (response.ok) {
          alert('Subscription request submitted successfully! Please submit your payment proof. An admin will review and activate your subscription. Your current plan remains active until approval.')
          setShowPaymentMethodModal(false)
          setSelectedPackageForPayment(null)
          setSelectedPaymentMethod(null)
          
          // Refresh subscription requests
          const requestsRes = await fetch('/api/subscriptions-requests', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          if (requestsRes.ok) {
            const { data } = await requestsRes.json()
            setSubscriptionRequests(data || [])
          }
          
          // Refresh subscription data (should remain unchanged)
          const subRes = await fetch('/api/subscriptions', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          if (subRes.ok) {
            const { data } = await subRes.json()
            setCurrentSubscription(data)
            if (data?.package_id) {
              setSelectedPlan(data.package_id)
            }
          }
        } else {
          alert(result.error || 'Failed to create subscription request')
        }
      } catch (error) {
        console.error('Error creating subscription request:', error)
        alert('An error occurred. Please try again.')
      } finally {
        setSubmitting(false)
      }
    } else if (selectedPaymentMethod === 'online') {
      // For now, show message that online payment is coming soon
      alert('Online payment integration is coming soon! For now, please use manual payment.')
      // TODO: Implement online payment flow when ready
    }
  }

  const handleUpdatePayment = () => {
    setShowBillingForm(true)
  }

  const handleCancelRequest = async (requestId) => {
    if (!confirm('Are you sure you want to cancel this request?')) return

    const token = getAuthToken()
    if (!token) {
      alert('Please log in to continue')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch(`/api/subscriptions-requests/${requestId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const result = await response.json()

      if (response.ok) {
        alert('Request cancelled successfully')
        // Refresh subscription requests
        const requestsRes = await fetch('/api/subscriptions-requests', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (requestsRes.ok) {
          const { data } = await requestsRes.json()
          setSubscriptionRequests(data || [])
        }
      } else {
        alert(result.error || 'Failed to cancel request')
      }
    } catch (error) {
      console.error('Error cancelling request:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpgradeSubscription = () => {
    // Show the change plan modal for upgrade
    setShowChangePlanModal(true)
  }

  const handleCancelSubscription = () => {
    setShowCancelModal(true)
  }

  const handleConfirmCancel = async () => {
    const token = getAuthToken()
    if (!token) {
      alert('Please log in to continue')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          cancellation_reason: cancellationReason
        })
      })

      const result = await response.json()

      if (response.ok) {
        alert('Cancellation request submitted successfully. Your subscription will be moved to the free plan after admin approval.')
        setShowCancelModal(false)
        setCancellationReason('')
        
        // Refresh all data
        const requestsRes = await fetch('/api/subscriptions-requests', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (requestsRes.ok) {
          const { data } = await requestsRes.json()
          setSubscriptionRequests(data || [])
        }
        
        const historyRes = await fetch('/api/subscriptions/history', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (historyRes.ok) {
          const { data } = await historyRes.json()
          setSubscriptionHistory(data || [])
        }
      } else {
        alert(result.error || 'Failed to submit cancellation request')
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const getRequestStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
      approved: { color: 'bg-green-100 text-green-800', text: 'Approved' },
      rejected: { color: 'bg-red-100 text-red-800', text: 'Rejected' }
    }
    const config = statusConfig[status] || statusConfig.pending
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    )
  }

  const handleBillingSettings = () => {
    setShowBillingSettingsModal(true)
  }

  const handleSaveBillingInfo = async () => {
    const token = getAuthToken()
    if (!token) {
      alert('Please log in to save billing information')
      return
    }

    setSubmitting(true)
    try {
      const url = billingInfo?.id 
        ? `/api/billing-information` 
        : `/api/billing-information`
      
      const method = billingInfo?.id ? 'PUT' : 'POST'
      
      const body = billingInfo?.id 
        ? { id: billingInfo.id, ...billingFormData, is_primary: true }
        : { ...billingFormData, is_primary: true }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      })

      const result = await response.json()

      if (response.ok) {
        alert('Billing information saved successfully!')
        setBillingInfo(result.data)
        setShowBillingForm(false)
        // Refresh billing data without full page reload
        const token = getAuthToken()
        if (token) {
          const billingRes = await fetch('/api/billing-information', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          if (billingRes.ok) {
            const { data } = await billingRes.json()
            const primaryBilling = data?.find(b => b.is_primary) || data?.[0] || null
            setBillingInfo(primaryBilling)
          }
        }
      } else {
        alert(result.error || 'Failed to save billing information')
      }
    } catch (error) {
      console.error('Error saving billing info:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDownloadAll = () => {
    alert('Downloading all invoices...')
  }

  const handleDownloadInvoice = (invoiceId) => {
    alert(`Downloading invoice ${invoiceId}...`)
  }

  const handleUpdateAutoRenew = async (autoRenew) => {
    // This would update the subscription's auto_renew field
    // For now, just show a message since payments are manual
    alert('Auto-renewal is currently disabled as payments are processed manually.')
  }

  return (
  

      
      <div className="flex-1 p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Subscription Management</h1>
          <p className="text-gray-600">Manage your subscription plan, billing, and usage</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            {[
              { id: 'plans', label: 'Manage Subscriptions', icon: FiStar },
              { id: 'requests', label: 'Requests', icon: FiClock },
              { id: 'billing', label: 'Billing', icon: FiCreditCard },
              { id: 'history', label: 'History', icon: FiClock }
            ].map((tab) => {
              const IconComponent = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Current Subscription Status - Shows on all tabs */}
        {loading ? (
          <div className="text-center py-12 mb-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary_color"></div>
            <p className="mt-4 text-gray-600">Loading subscription data...</p>
          </div>
        ) : currentSubscription ? (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Current Subscription</h2>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusBadgeColor(currentSubscription.status)}`}>
                  {currentSubscription.status.replace('_', ' ')}
                </span>
                {currentSubscription.auto_renew && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    Auto-renewal ON
                  </span>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-primary_color to-blue-600 rounded-xl flex items-center justify-center">
                  <FiCreditCard className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Current Plan</p>
                  <p className="font-semibold text-gray-900">{getCurrentPlan()?.name || currentSubscription.subscriptions_package?.name || 'No Plan'}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                  <FiCalendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">End Date</p>
                  <p className="font-semibold text-gray-900">
                    {(() => {
                      // Check if it's a Free plan
                      const packageName = currentSubscription.subscriptions_package?.name || getCurrentPlan()?.name || ''
                      const isFreePlan = packageName?.toLowerCase().trim() === 'free' || 
                                       parseFloat(currentSubscription.amount || 0) === 0
                      
                      if (isFreePlan) {
                        return 'Unlimited'
                      }
                      
                      return currentSubscription.end_date 
                        ? new Date(currentSubscription.end_date).toLocaleDateString()
                        : 'N/A'
                    })()}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <FiDollarSign className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Amount</p>
                  <p className="font-semibold text-gray-900">
                    {currentSubscription.currency} {currentSubscription.amount?.toLocaleString() || '0'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                  <FiShield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Payment Method</p>
                  <p className="font-semibold text-gray-900 text-sm">{formatPaymentMethod(billingInfo)}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center mb-8">
            <FiAlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Active Subscription</h3>
            <p className="text-gray-600 mb-6">Select a subscription plan to get started.</p>
            <button
              onClick={() => setActiveTab('plans')}
              className="bg-primary_color text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Manage Subscriptions
            </button>
          </div>
        )}

        {/* Requests Tab */}
        {activeTab === 'requests' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Subscription Requests</h2>
            </div>

            {subscriptionRequests.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
                <FiClock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Requests</h3>
                <p className="text-gray-600">You haven't submitted any subscription requests yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {subscriptionRequests.map((request) => {
                  const packageData = request.subscriptions_package
                  const monthlyPrice = currency === 'GHS'
                    ? parseFloat(packageData?.local_currency_price || 0)
                    : parseFloat(packageData?.international_currency_price || 0)
                  const totalPrice = currency === 'GHS'
                    ? (packageData?.total_amount_ghs || (monthlyPrice * (packageData?.ideal_duration || 1)))
                    : (packageData?.total_amount_usd || (monthlyPrice * (packageData?.ideal_duration || 1)))

                  return (
                    <div key={request.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {packageData?.name || 'Unknown Package'}
                            </h3>
                            {getRequestStatusBadge(request.status)}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                              <p className="text-sm text-gray-600">Amount</p>
                              <p className="font-semibold text-gray-900">
                                {request.currency} {parseFloat(request.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Payment Method</p>
                              <p className="font-semibold text-gray-900 capitalize">
                                {request.payment_method?.replace('_', ' ') || 'N/A'}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Requested At</p>
                              <p className="font-semibold text-gray-900">
                                {request.requested_at 
                                  ? new Date(request.requested_at).toLocaleDateString()
                                  : 'N/A'}
                              </p>
                            </div>
                          </div>

                          {request.status === 'pending' && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <p className="text-sm text-gray-600 mb-2">
                                Your request is pending admin approval. Please submit payment proof if you haven't already.
                              </p>
                              <button
                                onClick={() => handleCancelRequest(request.id)}
                                className="text-red-600 hover:text-red-700 text-sm font-medium"
                                disabled={submitting}
                              >
                                Cancel Request
                              </button>
                            </div>
                          )}

                          {request.status === 'approved' && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <p className="text-sm text-green-600 font-medium">
                                ✓ Your request has been approved and your subscription has been updated.
                              </p>
                            </div>
                          )}

                          {request.status === 'rejected' && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <p className="text-sm text-red-600 font-medium">
                                ✗ Your request was rejected. Please contact support for more information.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Manage Subscriptions Tab */}
        {activeTab === 'plans' && (
          <div className="space-y-8">
            {/* Action Buttons */}
            {currentSubscription && (
              <div className="flex items-center gap-3 mb-6">
                <button
                  onClick={handleUpgradeSubscription}
                  className="flex items-center gap-2 px-4 py-2 bg-primary_color text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FiTrendingUp className="w-4 h-4" />
                  Upgrade Plan
                </button>
                {currentSubscription.status === 'active' && (
                  <button
                    onClick={handleCancelSubscription}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <FiX className="w-4 h-4" />
                    Cancel Subscription
                  </button>
                )}
              </div>
            )}

            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <h2 className="text-xl font-semibold text-gray-900">Available Plans</h2>
              
              <div className="flex items-center gap-4">
                {/* Currency Display (Auto-determined from primary location) */}
                <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-4 py-2">
                  <span className="text-sm font-medium text-gray-700">
                    Currency: <span className="font-semibold text-gray-900">{currency}</span>
                  </span>
                  <span className="text-xs text-gray-500">(Based on primary location)</span>
                </div>

                {/* Billing Toggle */}
                <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setBillingCycle('monthly')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                      billingCycle === 'monthly'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setBillingCycle('yearly')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                      billingCycle === 'yearly'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Yearly
                  </button>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary_color"></div>
                <p className="mt-4 text-gray-600">Loading plans...</p>
              </div>
            ) : subscriptionPlans.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600">No subscription plans available at the moment.</p>
              </div>
            ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {subscriptionPlans.map((plan) => {
                const IconComponent = plan.icon
                const isCurrentPlan = currentSubscription?.package_id === plan.id
                const isSelected = plan.id === selectedPlan
                
                return (
                  <div
                    key={plan.id}
                    className={`relative bg-white rounded-2xl p-6 shadow-sm border-2 transition-all duration-200 ${
                      isSelected ? 'border-primary_color shadow-lg' : 'border-gray-100'
                    } ${isCurrentPlan ? 'ring-2 ring-primary_color/20' : ''}`}
                  >
                    {/* Popular Badge */}
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <span className="bg-primary_color text-white px-4 py-1 rounded-full text-sm font-medium">
                          Most Popular
                        </span>
                      </div>
                    )}

                    {/* Current Plan Badge */}
                    {isCurrentPlan && (
                      <div className="absolute top-4 right-4">
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                          Current Plan
                        </span>
                      </div>
                    )}

                    {/* Plan Header */}
                    <div className="text-center mb-6">
                      <div className={`w-16 h-16 bg-gradient-to-r ${plan.color} rounded-xl flex items-center justify-center mx-auto mb-4`}>
                        <IconComponent className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                      <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
                      
                      <div className="mb-4">
                        <span className="text-4xl font-bold text-gray-900">
                          {currency === 'GHS' ? 'GHS' : 'USD'} {
                            plan.monthly_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                          }
                        </span>
                        <span className="text-gray-600">
                          /month
                        </span>
                        {plan.ideal_duration > 1 && (
                          <div className="text-gray-600 text-sm mt-1">
                            {plan.monthly_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} × {plan.ideal_duration} months = {currency === 'GHS' ? 'GHS' : 'USD'} {plan.total_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        )}
                        {plan.display_text && (
                          <p className="text-sm text-gray-500 mt-1">{plan.display_text}</p>
                        )}
                      </div>
                    </div>

                    {/* Features */}
                    <div className="space-y-3 mb-6">
                      {plan.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <FiCheck className="w-5 h-5 text-green-500 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => {
                        if (!isCurrentPlan) {
                          handleSelectPlan(plan.id)
                        }
                      }}
                      className={`w-full py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
                        isCurrentPlan
                          ? 'bg-gray-100 text-gray-600 cursor-not-allowed'
                          : 'bg-primary_color text-white hover:bg-blue-700'
                      }`}
                      disabled={isCurrentPlan || submitting}
                    >
                      {isCurrentPlan ? 'Current Plan' : submitting ? 'Processing...' : 'Select Plan'}
                    </button>
                  </div>
                )
              })}
            </div>
            )}
          </div>
        )}


        {/* Billing Tab */}
        {activeTab === 'billing' && (
          <div className="space-y-8">
            {/* Billing Information */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Billing Information</h2>
                <button 
                  onClick={() => setShowBillingForm(!showBillingForm)}
                  className="flex items-center gap-2 text-primary_color hover:text-blue-700 font-medium"
                >
                  <FiEdit className="w-4 h-4" />
                  {showBillingForm ? 'Cancel' : 'Update'}
                </button>
              </div>
              
              {showBillingForm ? (
                <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Information */}
                <div className="space-y-4">
                      <h3 className="font-medium text-gray-900 mb-3">Contact Information</h3>
                  
                  <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Billing Email</label>
                    <input 
                          type="email" 
                          value={billingFormData.billing_email}
                          onChange={(e) => setBillingFormData({...billingFormData, billing_email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-transparent"
                          placeholder="billing@example.com"
                    />
                  </div>
                  
                  <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Billing Phone</label>
                    <input 
                          type="tel" 
                          value={billingFormData.billing_phone}
                          onChange={(e) => setBillingFormData({...billingFormData, billing_phone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-transparent"
                          placeholder="+233 XX XXX XXXX"
                    />
                  </div>
                  
                  <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Billing Address</label>
                        <textarea 
                          value={billingFormData.billing_address}
                          onChange={(e) => setBillingFormData({...billingFormData, billing_address: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-transparent"
                          rows="3"
                          placeholder="Street address, City, Country"
                    />
                  </div>
                </div>

                {/* Payment Methods */}
                <div className="space-y-4">
                      <h3 className="font-medium text-gray-900 mb-3">Payment Method</h3>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Payment Method</label>
                        <select
                          value={billingFormData.preferred_payment_method}
                          onChange={(e) => setBillingFormData({...billingFormData, preferred_payment_method: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-transparent"
                        >
                          <option value="mobile_money">Mobile Money</option>
                          <option value="bank_transfer">Bank Transfer</option>
                          <option value="cash">Cash</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      {billingFormData.preferred_payment_method === 'mobile_money' && (
                        <div className="border border-gray-200 rounded-lg p-4 space-y-3">
                      <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
                            <select
                              value={billingFormData.mobile_money_provider}
                              onChange={(e) => setBillingFormData({...billingFormData, mobile_money_provider: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-transparent"
                            >
                              <option value="mtn">MTN</option>
                              <option value="vodafone">Vodafone</option>
                              <option value="airteltigo">AirtelTigo</option>
                              <option value="other">Other</option>
                            </select>
                    </div>
                    
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                        <input 
                          type="tel" 
                              value={billingFormData.mobile_money_number}
                              onChange={(e) => setBillingFormData({...billingFormData, mobile_money_number: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-transparent"
                              placeholder="+233 XX XXX XXXX"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
                        <input 
                          type="text" 
                              value={billingFormData.mobile_money_account_name}
                              onChange={(e) => setBillingFormData({...billingFormData, mobile_money_account_name: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-transparent"
                              placeholder="Account holder name"
                        />
                      </div>
                    </div>
                      )}

                      {billingFormData.preferred_payment_method === 'bank_transfer' && (
                        <div className="border border-gray-200 rounded-lg p-4 space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                        <input 
                          type="text" 
                              value={billingFormData.bank_name}
                              onChange={(e) => setBillingFormData({...billingFormData, bank_name: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-transparent"
                              placeholder="Bank name"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                        <input 
                          type="text" 
                              value={billingFormData.bank_account_number}
                              onChange={(e) => setBillingFormData({...billingFormData, bank_account_number: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-transparent"
                              placeholder="Account number"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Account Holder Name</label>
                        <input 
                          type="text" 
                              value={billingFormData.bank_account_name}
                              onChange={(e) => setBillingFormData({...billingFormData, bank_account_name: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-transparent"
                              placeholder="Account holder name"
                        />
                      </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Branch (Optional)</label>
                            <input 
                              type="text" 
                              value={billingFormData.bank_branch}
                              onChange={(e) => setBillingFormData({...billingFormData, bank_branch: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-transparent"
                              placeholder="Bank branch"
                            />
                    </div>
                  </div>
                      )}
                </div>
              </div>
              
                  <div className="flex justify-end gap-3">
                    <button 
                      onClick={() => setShowBillingForm(false)}
                      className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleSaveBillingInfo}
                      disabled={submitting}
                      className="bg-primary_color text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <FiSave className="w-4 h-4" />
                      {submitting ? 'Saving...' : 'Save Billing Information'}
                </button>
              </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {billingInfo ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h3 className="font-medium text-gray-900 mb-3">Contact Information</h3>
                          <div className="space-y-2 text-sm">
                            <p><span className="text-gray-600">Email:</span> <span className="font-medium">{billingInfo.billing_email || 'Not set'}</span></p>
                            <p><span className="text-gray-600">Phone:</span> <span className="font-medium">{billingInfo.billing_phone || 'Not set'}</span></p>
                            <p><span className="text-gray-600">Address:</span> <span className="font-medium">{billingInfo.billing_address || 'Not set'}</span></p>
                          </div>
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 mb-3">Payment Method</h3>
                          <div className="space-y-2 text-sm">
                            <p><span className="text-gray-600">Method:</span> <span className="font-medium capitalize">{billingInfo.preferred_payment_method?.replace('_', ' ') || 'Not set'}</span></p>
                            {billingInfo.preferred_payment_method === 'mobile_money' && (
                              <>
                                <p><span className="text-gray-600">Provider:</span> <span className="font-medium uppercase">{billingInfo.mobile_money_provider || 'N/A'}</span></p>
                                <p><span className="text-gray-600">Number:</span> <span className="font-medium">{billingInfo.mobile_money_number || 'N/A'}</span></p>
                                <p><span className="text-gray-600">Account Name:</span> <span className="font-medium">{billingInfo.mobile_money_account_name || 'N/A'}</span></p>
                              </>
                            )}
                            {billingInfo.preferred_payment_method === 'bank_transfer' && (
                              <>
                                <p><span className="text-gray-600">Bank:</span> <span className="font-medium">{billingInfo.bank_name || 'N/A'}</span></p>
                                <p><span className="text-gray-600">Account:</span> <span className="font-medium">{billingInfo.bank_account_number || 'N/A'}</span></p>
                                <p><span className="text-gray-600">Account Name:</span> <span className="font-medium">{billingInfo.bank_account_name || 'N/A'}</span></p>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-gray-600">
                      <FiCreditCard className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p>No billing information set. Click "Update" to add your billing details.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Billing History */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Billing History</h2>
                <button 
                  onClick={handleDownloadAll}
                  className="flex items-center gap-2 text-primary_color hover:text-blue-700 font-medium"
                >
                  <FiDownload className="w-4 h-4" />
                  Download All
                </button>
              </div>

              <div className="space-y-4">
                {invoices.length === 0 ? (
                  <div className="text-center py-8 text-gray-600">
                    <FiCreditCard className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p>No invoices yet</p>
                  </div>
                ) : (
                  invoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-primary_color/10 rounded-lg flex items-center justify-center">
                        <FiCreditCard className="w-5 h-5 text-primary_color" />
                      </div>
                      <div>
                          <p className="font-medium text-gray-900">
                            {invoice.subscriptions?.subscriptions_package?.name || 'Subscription'} - {invoice.invoice_number}
                          </p>
                          <p className="text-sm text-gray-600">
                            {new Date(invoice.invoice_date).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            {invoice.payment_method ? invoice.payment_method.replace('_', ' ').toUpperCase() : 'Pending'}
                          </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="font-semibold text-gray-900">
                          {invoice.currency} {invoice.total_amount?.toLocaleString() || '0'}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                          invoice.payment_status === 'paid' 
                          ? 'bg-green-100 text-green-800' 
                            : invoice.payment_status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                          {invoice.payment_status}
                      </span>
                      <button 
                        onClick={() => handleDownloadInvoice(invoice.id)}
                        className="text-primary_color hover:text-blue-700"
                      >
                        <FiDownload className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-8">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Subscription History</h2>
              
              <div className="space-y-4">
                {subscriptionHistory.length === 0 ? (
                  <div className="text-center py-8 text-gray-600">
                    <FiClock className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p>No subscription history yet</p>
                  </div>
                ) : (
                  subscriptionHistory.map((event) => (
                  <div key={event.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                    <div className="w-10 h-10 bg-primary_color/10 rounded-lg flex items-center justify-center">
                      <FiRefreshCw className="w-5 h-5 text-primary_color" />
                    </div>
                    <div className="flex-1">
                        <p className="font-medium text-gray-900">{formatEventType(event.event_type)}</p>
                      <p className="text-sm text-gray-600">
                          {event.from_package?.name || event.from_status || 'N/A'} → {event.to_package?.name || event.to_status || 'N/A'}
                      </p>
                        {event.reason && (
                      <p className="text-xs text-gray-500">{event.reason}</p>
                        )}
                    </div>
                    <div className="text-sm text-gray-500">
                        {new Date(event.event_date).toLocaleDateString()}
                    </div>
                  </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Change Plan Modal */}
        {showChangePlanModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Change Subscription Plan</h3>
                <button 
                  onClick={() => setShowChangePlanModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>
              
              <p className="text-gray-600 mb-6">
                Select a new plan to upgrade or downgrade your subscription.
              </p>
              
              <div className="space-y-3 mb-6">
                {subscriptionPlans.map((plan) => (
                  <div 
                    key={plan.id}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedPlan === plan.id 
                        ? 'border-primary_color bg-primary_color/5' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedPlan(plan.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{plan.name}</h4>
                        <p className="text-sm text-gray-600">
                          {currency === 'GHS' ? 'GHS' : 'USD'} {
                            plan.monthly_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                          }
                          /month
                          {plan.ideal_duration > 1 && (
                            <span className="text-xs block mt-1">
                              {plan.monthly_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} × {plan.ideal_duration}mo = {currency === 'GHS' ? 'GHS' : 'USD'} {plan.total_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          )}
                        </p>
                      </div>
                      {selectedPlan === plan.id && (
                        <FiCheck className="w-5 h-5 text-primary_color" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowChangePlanModal(false)}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleSelectPlan(selectedPlan)}
                  disabled={!selectedPlan || submitting}
                  className="flex-1 py-2 px-4 bg-primary_color text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Processing...' : 'Confirm Change'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Billing Settings Modal */}
        {showBillingSettingsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Billing Settings</h3>
                <button 
                  onClick={() => setShowBillingSettingsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Auto-renewal</h4>
                    <p className="text-sm text-gray-600">Automatically renew subscription</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={currentSubscription?.auto_renew || false}
                      onChange={(e) => handleUpdateAutoRenew(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary_color/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary_color"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Email Notifications</h4>
                    <p className="text-sm text-gray-600">Receive billing notifications</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      defaultChecked={true}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary_color/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary_color"></div>
                  </label>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowBillingSettingsModal(false)}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    handleUpdateAutoRenew(currentSubscription?.auto_renew || false)
                    setShowBillingSettingsModal(false)
                  }}
                  className="flex-1 py-2 px-4 bg-primary_color text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cancel Subscription Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Cancel Subscription</h3>
                <button 
                  onClick={() => {
                    setShowCancelModal(false)
                    setCancellationReason('')
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-600 mb-4">
                  Are you sure you want to cancel your subscription? Your subscription will be moved to the free plan after admin approval.
                </p>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for Cancellation (Optional)
                  </label>
                  <textarea
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-transparent"
                    placeholder="Please let us know why you're cancelling..."
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowCancelModal(false)
                    setCancellationReason('')
                  }}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={submitting}
                >
                  Keep Subscription
                </button>
                <button
                  onClick={handleConfirmCancel}
                  className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : 'Confirm Cancellation'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Payment Method Selection Modal */}
        {showPaymentMethodModal && selectedPackageForPayment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Select Payment Method</h3>
                <button 
                  onClick={() => {
                    setShowPaymentMethodModal(false)
                    setSelectedPackageForPayment(null)
                    setSelectedPaymentMethod(null)
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-600 mb-2">Package Selected:</p>
                <p className="font-semibold text-gray-900">{selectedPackageForPayment.name}</p>
                <p className="text-sm text-gray-600">
                  {(() => {
                    const monthlyPrice = currency === 'GHS' 
                      ? parseFloat(selectedPackageForPayment.local_currency_price || 0)
                      : parseFloat(selectedPackageForPayment.international_currency_price || 0)
                    const idealDuration = selectedPackageForPayment.ideal_duration && selectedPackageForPayment.ideal_duration > 0 
                      ? selectedPackageForPayment.ideal_duration 
                      : 1
                    const totalPrice = monthlyPrice * idealDuration
                    
                    return (
                      <>
                        {currency === 'GHS' ? 'GHS' : 'USD'} {monthlyPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/month
                        {idealDuration > 1 && (
                          <span className="text-xs block mt-1">
                            {monthlyPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} × {idealDuration} months = {currency === 'GHS' ? 'GHS' : 'USD'} {totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        )}
                      </>
                    )
                  })()}
                </p>
              </div>

              <p className="text-gray-600 mb-6">
                Choose how you would like to pay for this subscription.
              </p>
              
              <div className="space-y-3 mb-6">
                {/* Manual Payment Option - Radio Button */}
                <label
                  className={`w-full p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedPaymentMethod === 'manual'
                      ? 'border-primary_color bg-primary_color/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="manual"
                      checked={selectedPaymentMethod === 'manual'}
                      onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                      className="w-4 h-4 text-primary_color focus:ring-primary_color"
                    />
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <FiCreditCard className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">Manual Payment</h4>
                        <p className="text-sm text-gray-600">Pay via mobile money or bank transfer</p>
                      </div>
                    </div>
                  </div>
                </label>

                {/* Online Payment Option - Radio Button */}
                <label
                  className={`w-full p-4 border-2 rounded-lg cursor-pointer transition-all opacity-60 ${
                    selectedPaymentMethod === 'online'
                      ? 'border-primary_color bg-primary_color/5'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="online"
                      checked={selectedPaymentMethod === 'online'}
                      onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                      className="w-4 h-4 text-primary_color focus:ring-primary_color"
                      disabled
                    />
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FiCreditCard className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">Online Payment</h4>
                        <p className="text-sm text-gray-600">Pay instantly with card (Coming Soon)</p>
                      </div>
                      <span className="px-2 py-1 bg-gray-200 text-gray-600 rounded text-xs">Soon</span>
                    </div>
                  </div>
                </label>
              </div>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    setShowPaymentMethodModal(false)
                    setSelectedPackageForPayment(null)
                    setSelectedPaymentMethod(null)
                  }}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                {selectedPaymentMethod === 'manual' && (
                  <button 
                    onClick={handleSubmitRequest}
                    disabled={submitting || !selectedPaymentMethod}
                    className="flex-1 py-2 px-4 bg-primary_color text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Submitting...' : 'Submit Request'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

  )
}

export default SubscriptionsPage
