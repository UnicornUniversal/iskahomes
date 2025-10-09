"use client"
import React, { useState } from 'react'
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
  FiExternalLink
} from 'react-icons/fi'
import DeveloperNav from '../../../components/developers/DeveloperNav'

const SubscriptionsPage = () => {
  const [selectedPlan, setSelectedPlan] = useState('pro')
  const [billingCycle, setBillingCycle] = useState('monthly')
  const [activeTab, setActiveTab] = useState('overview')
  const [showChangePlanModal, setShowChangePlanModal] = useState(false)
  const [showBillingSettingsModal, setShowBillingSettingsModal] = useState(false)

  // Mock subscription data
  const currentSubscription = {
    plan: 'pro',
    status: 'active',
    nextBilling: '2024-02-15',
    amount: 99,
    cycle: 'monthly',
    autoRenewal: true,
    trialEnds: null,
    paymentMethod: 'MTN Mobile Money (+256 700 123 456)',
    lastPayment: '2024-01-15',
    paymentStatus: 'successful'
  }

  const subscriptionPlans = [
    {
      id: 'basic',
      name: 'Basic',
      price: { monthly: 29, yearly: 290 },
      description: 'Perfect for small developers starting out',
      features: [
        'Up to 5 properties',
        'Basic analytics',
        'Email support',
        'Standard listing features'
      ],
      limits: {
        properties: 5,
        agents: 2,
        leads: 50,
        apiCalls: 1000,
        storage: '1GB'
      },
      icon: FiStar,
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 'pro',
      name: 'Professional',
      price: { monthly: 99, yearly: 990 },
      description: 'Ideal for growing development companies',
      features: [
        'Up to 25 properties',
        'Advanced analytics',
        'Priority support',
        'Custom branding',
        'Lead management',
        'Appointment scheduling'
      ],
      limits: {
        properties: 25,
        agents: 10,
        leads: 200,
        apiCalls: 5000,
        storage: '10GB'
      },
      icon: FiZap,
      color: 'from-primary_color to-blue-600',
      popular: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: { monthly: 299, yearly: 2990 },
      description: 'For large-scale property developers',
      features: [
        'Unlimited properties',
        'Advanced analytics & reporting',
        '24/7 dedicated support',
        'White-label solution',
        'API access',
        'Custom integrations',
        'Multi-user accounts',
        'Advanced marketing tools'
      ],
      limits: {
        properties: -1, // unlimited
        agents: -1,
        leads: -1,
        apiCalls: -1,
        storage: '100GB'
      },
      icon: FiAward,
      color: 'from-purple-500 to-purple-600'
    }
  ]


  const billingHistory = [
    {
      id: 1,
      date: '2024-01-15',
      amount: 99,
      status: 'paid',
      description: 'Professional Plan - Monthly',
      invoiceUrl: '#',
      paymentMethod: 'MTN Mobile Money (+256 700 123 456)'
    },
    {
      id: 2,
      date: '2023-12-15',
      amount: 99,
      status: 'paid',
      description: 'Professional Plan - Monthly',
      invoiceUrl: '#',
      paymentMethod: 'Bank Transfer (Equity Bank)'
    },
    {
      id: 3,
      date: '2023-11-15',
      amount: 99,
      status: 'failed',
      description: 'Professional Plan - Monthly',
      invoiceUrl: '#',
      paymentMethod: 'MTN Mobile Money (+256 700 123 456)'
    }
  ]

  const subscriptionHistory = [
    {
      id: 1,
      date: '2024-01-15',
      action: 'Plan Upgraded',
      from: 'Basic',
      to: 'Professional',
      reason: 'Need more property listings'
    },
    {
      id: 2,
      date: '2023-12-01',
      action: 'Billing Cycle Changed',
      from: 'Yearly',
      to: 'Monthly',
      reason: 'Flexibility in payment'
    },
    {
      id: 3,
      date: '2023-11-15',
      action: 'Payment Failed',
      from: 'Professional',
      to: 'Professional',
      reason: 'Insufficient funds'
    }
  ]

  const getCurrentPlan = () => subscriptionPlans.find(plan => plan.id === currentSubscription.plan)


  const handleChangePlan = () => {
    setShowChangePlanModal(true)
  }

  const handleUpdatePayment = () => {
    // Redirect to external payment provider or show payment update form
    alert('Redirecting to payment provider to update payment method...')
  }

  const handleBillingSettings = () => {
    setShowBillingSettingsModal(true)
  }

  const handleDownloadAll = () => {
    alert('Downloading all invoices...')
  }

  const handleDownloadInvoice = (invoiceId) => {
    alert(`Downloading invoice ${invoiceId}...`)
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DeveloperNav active={9} />
      
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
              { id: 'overview', label: 'Overview', icon: FiGrid },
              { id: 'plans', label: 'Plans', icon: FiStar },
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

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Current Subscription Status */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Current Subscription</h2>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    currentSubscription.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {currentSubscription.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                  {currentSubscription.autoRenewal && (
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
                    <p className="font-semibold text-gray-900">{getCurrentPlan()?.name}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                    <FiCalendar className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Next Billing</p>
                    <p className="font-semibold text-gray-900">{new Date(currentSubscription.nextBilling).toLocaleDateString()}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <FiDollarSign className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Amount</p>
                    <p className="font-semibold text-gray-900">${currentSubscription.amount}/{currentSubscription.cycle}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                    <FiShield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Payment Method</p>
                    <p className="font-semibold text-gray-900">{currentSubscription.paymentMethod}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FiEdit className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Update Plan</h3>
                </div>
                <p className="text-gray-600 text-sm mb-4">Upgrade or downgrade your subscription plan</p>
                <button 
                  onClick={handleChangePlan}
                  className="w-full bg-primary_color text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Change Plan
                </button>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <FiCreditCard className="w-5 h-5 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Payment Method</h3>
                </div>
                <p className="text-gray-600 text-sm mb-4">Update your payment information</p>
                <button 
                  onClick={handleUpdatePayment}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Update Payment
                </button>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <FiSettings className="w-5 h-5 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Billing Settings</h3>
                </div>
                <p className="text-gray-600 text-sm mb-4">Manage auto-renewal and billing preferences</p>
                <button 
                  onClick={handleBillingSettings}
                  className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Manage Settings
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Plans Tab */}
        {activeTab === 'plans' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Available Plans</h2>
              
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
                  <span className="ml-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Save 20%</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {subscriptionPlans.map((plan) => {
                const IconComponent = plan.icon
                const isCurrentPlan = plan.id === currentSubscription.plan
                const isSelected = plan.id === selectedPlan
                
                return (
                  <div
                    key={plan.id}
                    className={`relative bg-white rounded-2xl p-6 shadow-sm border-2 transition-all duration-200 cursor-pointer hover:shadow-md ${
                      isSelected ? 'border-primary_color shadow-lg' : 'border-gray-100'
                    } ${isCurrentPlan ? 'ring-2 ring-primary_color/20' : ''}`}
                    onClick={() => setSelectedPlan(plan.id)}
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
                        <span className="text-4xl font-bold text-gray-900">${plan.price[billingCycle]}</span>
                        <span className="text-gray-600">/{billingCycle === 'monthly' ? 'month' : 'year'}</span>
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
                      className={`w-full py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
                        isCurrentPlan
                          ? 'bg-gray-100 text-gray-600 cursor-not-allowed'
                          : isSelected
                          ? 'bg-primary_color text-white hover:bg-blue-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      disabled={isCurrentPlan}
                    >
                      {isCurrentPlan ? 'Current Plan' : isSelected ? 'Select Plan' : 'Choose Plan'}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}


        {/* Billing Tab */}
        {activeTab === 'billing' && (
          <div className="space-y-8">
            {/* Billing Information */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Billing Information</h2>
                <button className="flex items-center gap-2 text-primary_color hover:text-blue-700 font-medium">
                  <FiEdit className="w-4 h-4" />
                  Update
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900 mb-3">Personal Information</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input 
                      type="text" 
                      defaultValue="John Doe"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <input 
                      type="email" 
                      defaultValue="john.doe@example.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input 
                      type="tel" 
                      defaultValue="+1 (555) 123-4567"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Payment Methods */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900 mb-3">Payment Methods</h3>
                  
                  {/* Mobile Money */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <FiCreditCard className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Mobile Money</h4>
                        <p className="text-sm text-gray-600">MTN Mobile Money</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                        <input 
                          type="tel" 
                          defaultValue="+256 700 123 456"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
                        <input 
                          type="text" 
                          defaultValue="John Doe"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bank Transfer */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FiCreditCard className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Bank Transfer</h4>
                        <p className="text-sm text-gray-600">Direct bank transfer</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                        <input 
                          type="text" 
                          defaultValue="Equity Bank"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                        <input 
                          type="text" 
                          defaultValue="1234567890"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Account Holder Name</label>
                        <input 
                          type="text" 
                          defaultValue="John Doe"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button className="bg-primary_color text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  Save Billing Information
                </button>
              </div>
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
                {billingHistory.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-primary_color/10 rounded-lg flex items-center justify-center">
                        <FiCreditCard className="w-5 h-5 text-primary_color" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{invoice.description}</p>
                        <p className="text-sm text-gray-600">{new Date(invoice.date).toLocaleDateString()}</p>
                        <p className="text-xs text-gray-500">{invoice.paymentMethod}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-semibold text-gray-900">${invoice.amount}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        invoice.status === 'paid' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {invoice.status}
                      </span>
                      <button 
                        onClick={() => handleDownloadInvoice(invoice.id)}
                        className="text-primary_color hover:text-blue-700"
                      >
                        <FiDownload className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
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
                {subscriptionHistory.map((event) => (
                  <div key={event.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                    <div className="w-10 h-10 bg-primary_color/10 rounded-lg flex items-center justify-center">
                      <FiRefreshCw className="w-5 h-5 text-primary_color" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{event.action}</p>
                      <p className="text-sm text-gray-600">
                        {event.from} → {event.to}
                      </p>
                      <p className="text-xs text-gray-500">{event.reason}</p>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(event.date).toLocaleDateString()}
                    </div>
                  </div>
                ))}
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
                        <p className="text-sm text-gray-600">${plan.price[billingCycle]}/{billingCycle === 'monthly' ? 'month' : 'year'}</p>
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
                  onClick={() => {
                    alert(`Changing to ${subscriptionPlans.find(p => p.id === selectedPlan)?.name} plan...`)
                    setShowChangePlanModal(false)
                  }}
                  className="flex-1 py-2 px-4 bg-primary_color text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Confirm Change
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
                      defaultChecked={currentSubscription.autoRenewal}
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
                    alert('Billing settings updated!')
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
      </div>
    </div>
  )
}

export default SubscriptionsPage
