'use client'

import React, { useState } from 'react'
import PasswordField from '../components/PasswordField'

const SignupPage = () => {
  const [activeTab, setActiveTab] = useState('seeker')
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [showToast, setShowToast] = useState(false)

  const accountTypes = {
    seeker: {
      title: 'Property Seeker',
      description: 'Find your perfect home with our comprehensive property search tools and expert guidance.',
      features: [
        'Access to thousands of properties',
        'Advanced search filters',
        'Save favorite listings',
        'Get notifications for new matches',
        'Connect with verified agents'
      ],
      images: [
        'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
      ],
      gradient: 'from-emerald-500 via-teal-600 to-cyan-700'
    },
    agent: {
      title: 'Real Estate Agent',
      description: 'Manage property listings for your clients and grow your business with our platform.',
      features: [
        'List unlimited properties',
        'Manage client relationships',
        'Track listing performance',
        'Access to marketing tools',
        'Commission tracking'
      ],
      images: [
        'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
      ],
      gradient: 'from-orange-500 via-red-500 to-pink-600'
    },
    developer: {
      title: 'Real Estate Developer',
      description: 'Showcase your projects and connect with potential buyers and investors.',
      features: [
        'Showcase multiple projects',
        'Detailed project analytics',
        'Lead management system',
        'Investor connections',
        'Marketing support'
      ],
      images: [
        'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
      ],
      gradient: 'from-purple-600 via-indigo-600 to-blue-700'
    }
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setCurrentImageIndex(0)
  }

  const nextImage = () => {
    const currentType = accountTypes[activeTab]
    setCurrentImageIndex((prev) => (prev + 1) % currentType.images.length)
  }

  const prevImage = () => {
    const currentType = accountTypes[activeTab]
    setCurrentImageIndex((prev) => (prev - 1 + currentType.images.length) % currentType.images.length)
  }

  const currentAccountType = accountTypes[activeTab]

  return (
    <>
      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
      <div className="min-h-screen bg-gray-50 flex relative">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md mx-4 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Creating Your Account</h3>
            <p className="text-gray-600">Please wait while we set up your account...</p>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-4 right-4 z-50 animate-slide-in">
          <div className="bg-red-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-semibold">Sign up failed</p>
              <p className="text-sm opacity-90">Please try again or contact support</p>
            </div>
            <button
              onClick={() => setShowToast(false)}
              className="ml-4 text-white hover:text-gray-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
      {/* Left Side - Image Carousel and Information */}
      <div className={`hidden lg:flex lg:w-1/2 bg-gradient-to-br ${currentAccountType.gradient} relative overflow-hidden`}>
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-1000 ease-in-out"
          style={{
            backgroundImage: `url(${currentAccountType.images[currentImageIndex]})`
          }}
        >
          <div className="absolute inset-0 bg-black/20"></div>
        </div>
        
        {/* Content Container */}
        <div className="relative w-full h-full flex flex-col">

          {/* Bottom Content - Left Aligned */}
          <div className="flex-1 flex items-end">
            <div className="p-8 text-white z-10 max-w-lg">
              <h2 className="text-5xl font-bold mb-6 leading-tight text-white">{currentAccountType.title}</h2>
              <p className="text-xl mb-8 text-white opacity-90 leading-relaxed">{currentAccountType.description}</p>
              
              <div className="space-y-4">
                {currentAccountType.features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-4 group">
                    <div className="w-2 h-2 bg-white rounded-full group-hover:scale-125 transition-transform duration-200"></div>
                    <span className="text-sm font-medium text-white">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Bottom Dots Indicator */}
          <div className="absolute bottom-8 left-8 flex space-x-2 z-10">
            {currentAccountType.images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentImageIndex 
                    ? 'bg-white scale-125' 
                    : 'bg-white bg-opacity-50 hover:bg-opacity-75'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Signup Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 py-12 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-md mx-auto w-full">
          {/* Header */}
          <div className="text-left mb-10">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">Create Your Account</h1>
            <p className="text-gray-600 text-lg">Join thousands of users on our platform</p>
          </div>

          {/* Tab Navigation */}
          <div className="flex bg-white rounded-2xl p-2 mb-10 shadow-lg border border-gray-100">
            <button
              onClick={() => handleTabChange('seeker')}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-300 ${
                activeTab === 'seeker'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg transform scale-105'
                  : 'text-gray-400 bg-gray-100 bg-opacity-10 hover:bg-gray-200 hover:bg-opacity-20'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span>Seeker</span>
              </div>
            </button>
            <button
              onClick={() => handleTabChange('agent')}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-300 ${
                activeTab === 'agent'
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg transform scale-105'
                  : 'text-gray-400 bg-gray-100 bg-opacity-10 hover:bg-gray-200 hover:bg-opacity-20'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>Agent</span>
              </div>
            </button>
            <button
              onClick={() => handleTabChange('developer')}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-300 ${
                activeTab === 'developer'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg transform scale-105'
                  : 'text-gray-400 bg-gray-100 bg-opacity-10 hover:bg-gray-200 hover:bg-opacity-20'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span>Developer</span>
              </div>
            </button>
          </div>

          {/* Signup Forms */}
          <div className="space-y-6">
            {activeTab === 'seeker' && <PropertySeekerForm isLoading={isLoading} setIsLoading={setIsLoading} setShowToast={setShowToast} />}
            {activeTab === 'agent' && <AgentForm isLoading={isLoading} setIsLoading={setIsLoading} setShowToast={setShowToast} />}
            {activeTab === 'developer' && <DeveloperForm isLoading={isLoading} setIsLoading={setIsLoading} setShowToast={setShowToast} />}
          </div>

          {/* Login Link */}
          <div className="text-center mt-8">
            <p className="text-gray-600">
              Already have an account?{' '}
              <a href="/login" className="text-blue-600 hover:text-blue-500 font-medium">
                Sign in
              </a>
            </p>
          </div>
        </div>
      </div>
      </div>
    </>
  )
}

// Property Seeker Form Component
const PropertySeekerForm = ({ isLoading, setIsLoading, setShowToast }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: ''
  })

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          userType: 'property_seeker'
        })
      })

      const result = await response.json()

      if (response.ok) {
        // Success - show success message and redirect to verification page
        console.log('Seeker account created:', result)
        alert('Account created successfully! Please check your email for verification link.')
        window.location.href = '/signin'
      } else {
        // Error - show specific error message
        console.error('Signup failed:', result.error)
        alert(`Signup failed: ${result.error}`)
        setShowToast(true)
      }
    } catch (error) {
      console.error('Signup error:', error)
      setShowToast(true)
    } finally {
      setIsLoading(false)
      
      // Auto-hide toast after 5 seconds
      setTimeout(() => {
        setShowToast(false)
      }, 5000)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
        <input
          type="text"
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <PasswordField
        name="password"
        value={formData.password}
        onChange={handleChange}
        required={true}
        placeholder="Enter your password"
      />

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Creating Account...
          </>
        ) : (
          'Create Account'
        )}
      </button>
    </form>
  )
}

// Agent Form Component
const AgentForm = ({ isLoading, setIsLoading, setShowToast }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    agencyName: '',
    licenseId: ''
  })

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          userType: 'agent'
        })
      })

      const result = await response.json()

      if (response.ok) {
        // Success - show success message and redirect to verification page
        console.log('Agent account created:', result)
        alert('Account created successfully! Please check your email for verification link.')
        window.location.href = '/signin'
      } else {
        // Error - show specific error message
        console.error('Signup failed:', result.error)
        alert(`Signup failed: ${result.error}`)
        setShowToast(true)
      }
    } catch (error) {
      console.error('Signup error:', error)
      setShowToast(true)
    } finally {
      setIsLoading(false)
      
      // Auto-hide toast after 5 seconds
      setTimeout(() => {
        setShowToast(false)
      }, 5000)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
        <input
          type="text"
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <PasswordField
        name="password"
        value={formData.password}
        onChange={handleChange}
        required={true}
        placeholder="Enter your password"
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Agency Name (Optional)</label>
        <input
          type="text"
          name="agencyName"
          value={formData.agencyName}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">License/ID Number (Optional)</label>
        <input
          type="text"
          name="licenseId"
          value={formData.licenseId}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Creating Account...
          </>
        ) : (
          'Create Account'
        )}
      </button>
    </form>
  )
}

// Developer Form Component
const DeveloperForm = ({ isLoading, setIsLoading, setShowToast }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    companyWebsite: '',
    registrationNumber: ''
  })

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          userType: 'developer'
        })
      })

      const result = await response.json()

      if (response.ok) {
        // Success - show success message and redirect to verification page
        console.log('Developer account created:', result)
        alert('Account created successfully! Please check your email for verification link.')
        window.location.href = '/signin'
      } else {
        // Error - show specific error message
        console.error('Signup failed:', result.error)
        alert(`Signup failed: ${result.error}`)
        setShowToast(true)
      }
    } catch (error) {
      console.error('Signup error:', error)
      setShowToast(true)
    } finally {
      setIsLoading(false)
      
      // Auto-hide toast after 5 seconds
      setTimeout(() => {
        setShowToast(false)
      }, 5000)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name / Company Name</label>
        <input
          type="text"
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <PasswordField
        name="password"
        value={formData.password}
        onChange={handleChange}
        required={true}
        placeholder="Enter your password"
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Company Website (Optional)</label>
        <input
          type="url"
          name="companyWebsite"
          value={formData.companyWebsite}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Company Registration Number (Optional)</label>
        <input
          type="text"
          name="registrationNumber"
          value={formData.registrationNumber}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Creating Account...
          </>
        ) : (
          'Create Account'
        )}
      </button>
    </form>
  )
}

export default SignupPage
