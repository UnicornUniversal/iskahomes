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
  FiGrid
} from 'react-icons/fi'
import DeveloperNav from '../../../components/developers/DeveloperNav'

const SubscriptionsPage = () => {
  const [selectedPlan, setSelectedPlan] = useState('pro')
  const [billingCycle, setBillingCycle] = useState('monthly')

  // Mock subscription data
  const currentSubscription = {
    plan: 'pro',
    status: 'active',
    nextBilling: '2024-02-15',
    amount: 99,
    cycle: 'monthly'
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
      description: 'Professional Plan - Monthly'
    },
    {
      id: 2,
      date: '2023-12-15',
      amount: 99,
      status: 'paid',
      description: 'Professional Plan - Monthly'
    },
    {
      id: 3,
      date: '2023-11-15',
      amount: 99,
      status: 'paid',
      description: 'Professional Plan - Monthly'
    }
  ]

  const getCurrentPlan = () => subscriptionPlans.find(plan => plan.id === currentSubscription.plan)

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DeveloperNav active={9} />
      
      <div className="flex-1 p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Subscription Management</h1>
          <p className="text-gray-600">Manage your subscription plan and billing</p>
        </div>

        {/* Current Subscription Status */}
        <div className="bg-white rounded-2xl p-6 mb-8 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Current Subscription</h2>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              Active
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                <FiTrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Amount</p>
                <p className="font-semibold text-gray-900">${currentSubscription.amount}/{currentSubscription.cycle}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Subscription Plans */}
        <div className="mb-8">
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

        {/* Billing History */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Billing History</h2>
            <button className="flex items-center gap-2 text-primary_color hover:text-blue-700 font-medium">
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
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-gray-900">${invoice.amount}</span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                    {invoice.status}
                  </span>
                  <button className="text-primary_color hover:text-blue-700">
                    <FiDownload className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Usage Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          {[
            { label: 'Properties Listed', value: '18', icon: FiMapPin, color: 'bg-blue-500' },
            { label: 'Total Views', value: '2,847', icon: FiTrendingUp, color: 'bg-green-500' },
            { label: 'Active Leads', value: '23', icon: FiUsers, color: 'bg-purple-500' },
            { label: 'Messages', value: '156', icon: FiMessageSquare, color: 'bg-orange-500' }
          ].map((stat, index) => (
            <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default SubscriptionsPage
