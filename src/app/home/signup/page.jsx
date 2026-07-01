'use client'

import React, { useState } from 'react'
import PasswordField from '@/app/components/PasswordField'
import Link from 'next/link'
import { toast } from 'react-toastify'

const SIGNUP_SUCCESS_MESSAGE =
  'Account created successfully! Please check your email and confirm your signup to continue.'

const SignupPage = () => {
  const [activeTab, setActiveTab] = useState('seeker')
  const [isLoading, setIsLoading] = useState(false)

  const accountTypes = {
    seeker: {
      title: 'Property Seeker',
      description: 'Find your perfect home with our comprehensive property search tools and expert guidance.',
      image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      features: [
        'Access to thousands of properties',
        'Advanced search filters',
        'Save favorite listings',
        'Get notifications for new matches'
      ]
    },
    agent: {
      title: 'Real Estate Agent',
      description: 'Manage property listings for your clients and grow your business with our platform.',
      image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      features: [
        'List unlimited properties',
        'Manage client relationships',
        'Track listing performance',
        'Access to marketing tools'
      ]
    },
    developer: {
      title: 'Real Estate Developer',
      description: 'Showcase your projects and connect with potential buyers and investors.',
      image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      features: [
        'Showcase multiple projects',
        'Detailed project analytics',
        'Lead management system',
        'Investor connections'
      ]
    },
    agency: {
      title: 'Real Estate Agency',
      description: 'Manage multiple agents and grow your real estate business with comprehensive tools.',
      image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      features: [
        'Manage multiple agents',
        'Track team performance',
        'Centralized lead management',
        'Agency-wide analytics'
      ]
    }
  }

  return (
    <>
      <div className="h-screen w-screen flex overflow-hidden bg-white">
        {/* Loading Overlay */}
        {isLoading && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-md mx-4 text-center shadow-2xl">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#17637C] border-t-transparent mx-auto mb-4"></div>
              <h3 className="text-xl font-semibold text-[#17637C] mb-2">Creating Your Account</h3>
              <p className="text-gray-600">Please wait while we set up your account...</p>
            </div>
          </div>
        )}

        {/* Left Side - Image & Branding */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center transition-all duration-700 ease-in-out"
            style={{
              backgroundImage: `url(${accountTypes[activeTab].image})`
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-[#17637C] to-transparent"></div>
          </div>
          
          <div className="relative z-10 flex flex-col justify-between w-full p-12 text-white">
            {/* Top Section */}
            <div>
              <p className="text-sm font-normal mb-2 text-white">Welcome to</p>
              <h1 className="text-7xl font-bold mb-4 text-white">ISKA Homes</h1>
              <p className="text-sm text-white/90">Join thousands of users finding their perfect property</p>
            </div>


            {/* Bottom Section - Features List */}
            <div className="space-y-2 flex flex-col gap-2">
            <div>
                  <h2 className="text-3xl font-semibold mb-2 text-white">{accountTypes[activeTab].title}</h2>
                  <p className="text-sm text-white/90 max-w-md">{accountTypes[activeTab].description}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
              {accountTypes[activeTab].features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-3">
                  
                  <div className="flex-shrink-0 w-2 h-2 bg-white rounded-full"></div>
                  <span className="text-sm text-white/90">{feature}</span>
                </div>
              ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Signup Form */}
        <div className="w-full lg:w-1/2 overflow-y-auto bg-white">
          <div className="min-h-full flex flex-col justify-center p-8 lg:p-16">
            <div className="max-w-lg mx-auto w-full">
              {/* Mobile Header */}
              <div className="lg:hidden mb-8">
                <h1 className="text-3xl font-bold text-[#17637C] mb-2">ISKA Homes</h1>
                <p className="text-gray-600">Create your account to get started</p>
              </div>

              {/* Desktop Header */}
              <div className="hidden lg:block mb-8">
                <h2 className="text-4xl font-bold text-[#17637C] mb-3">Create Your Account</h2>
                <p className="text-sm text-gray-600">Choose your account type to get started</p>
              </div>

              {/* Tab Navigation - Both Mobile and Desktop */}
              <div className="flex bg-gray-100 rounded-2xl p-1.5 mb-8">
                <button
                  onClick={() => setActiveTab('seeker')}
                  className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    activeTab === 'seeker'
                      ? 'bg-[#17637C] text-white shadow-lg'
                      : 'text-gray-600 hover:text-[#17637C]'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    {accountTypes.seeker.icon}
                    <span>Seeker</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('developer')}
                  className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    activeTab === 'developer'
                      ? 'bg-[#17637C] text-white shadow-lg'
                      : 'text-gray-600 hover:text-[#17637C]'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    {accountTypes.developer.icon}
                    <span>Developer</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('agency')}
                  className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    activeTab === 'agency'
                      ? 'bg-[#17637C] text-white shadow-lg'
                      : 'text-gray-600 hover:text-[#17637C]'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    {accountTypes.agency.icon}
                    <span>Agency</span>
                  </div>
                </button>
              </div>

              {/* Signup Forms */}
              <div className="space-y-6">
                {activeTab === 'seeker' && (
                  <PropertySeekerForm 
                    isLoading={isLoading} 
                    setIsLoading={setIsLoading} 
                  />
                )}
                {activeTab === 'developer' && (
                  <DeveloperForm 
                    isLoading={isLoading} 
                    setIsLoading={setIsLoading} 
                  />
                )}
                {activeTab === 'agency' && (
                  <AgencyForm 
                    isLoading={isLoading} 
                    setIsLoading={setIsLoading} 
                  />
                )}
              </div>

              {/* Login Link */}
              <div className="text-center mt-8">
                <p className="text-gray-600">
                  Already have an account?{' '}
                  <a href="/home/signin" className="text-[#17637C] hover:text-[#17637C]/80 font-semibold transition-colors">
                    Sign in
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

const TermsAgreementField = ({ checked, onChange }) => (
  <div className="rounded-xl border border-gray-200 p-4 bg-gray-50">
    <label className="flex items-start gap-3 cursor-pointer">
      <input
        type="checkbox"
        name="acceptTerms"
        checked={checked}
        onChange={onChange}
        className="mt-1 h-4 w-4 rounded border-gray-300 text-[#17637C] focus:ring-[#17637C]"
        required
      />
      <span className="text-sm text-gray-700 leading-6">
        I agree to the{' '}
        <Link href="/home/termsOfService" className="text-[#17637C] font-semibold hover:underline">
          Terms of Agreement
        </Link>
        ,{' '}
        <Link href="/home/privacyPolicy" className="text-[#17637C] font-semibold hover:underline">
          Privacy Policy
        </Link>
        , and{' '}
        <Link href="/home/cookiePolicy" className="text-[#17637C] font-semibold hover:underline">
          Cookie Policy
        </Link>
        .
      </span>
    </label>
  </div>
)

// Property Seeker Form Component
const PropertySeekerForm = ({ isLoading, setIsLoading }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    acceptTerms: false
  })

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.acceptTerms) {
      toast.error('You must accept the Terms of Agreement to continue.')
      return
    }
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          terms_of_agreement: formData.acceptTerms ? 'accepted' : 'awaiting_acceptance',
          userType: 'property_seeker'
        })
      })

      const result = await response.json()
      console.log('📥 Signup response:', { ok: response.ok, result })

      if (response.ok && result.success) {
        // Clear form fields
        setFormData({
          fullName: '',
          email: '',
          phone: '',
          password: '',
          acceptTerms: false
        })
        // Show success toast
        toast.success(result.message || SIGNUP_SUCCESS_MESSAGE, { autoClose: 6000 })
      } else {
        console.error('❌ Signup failed:', result.error)
        toast.error(result.error || 'Signup failed. Please try again.')
      }
    } catch (error) {
      console.error('Signup error:', error)
      toast.error('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-semibold text-[#17637C] mb-2">Full Name</label>
        <input
          type="text"
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
          required
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17637C] focus:border-transparent transition-all"
          placeholder="Enter your full name"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-[#17637C] mb-2">Email Address</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17637C] focus:border-transparent transition-all"
          placeholder="Enter your email"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-[#17637C] mb-2">Phone Number</label>
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          required
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17637C] focus:border-transparent transition-all"
          placeholder="Enter your phone number"
        />
      </div>

      <PasswordField
        name="password"
        value={formData.password}
        onChange={handleChange}
        required={true}
        placeholder="Enter your password"
      />

      <TermsAgreementField checked={formData.acceptTerms} onChange={handleChange} />

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-[#17637C] text-white py-3 px-4 rounded-xl hover:bg-[#17637C]/90 focus:outline-none focus:ring-2 focus:ring-[#17637C] focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-semibold shadow-lg"
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
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
const AgentForm = ({ isLoading, setIsLoading }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    agencyName: '',
    licenseId: '',
    acceptTerms: false
  })

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.acceptTerms) {
      toast.error('You must accept the Terms of Agreement to continue.')
      return
    }
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          terms_of_agreement: formData.acceptTerms ? 'accepted' : 'awaiting_acceptance',
          userType: 'agent'
        })
      })

      const result = await response.json()
      console.log('📥 Signup response:', { ok: response.ok, result })

      if (response.ok && result.success) {
        // Clear form fields
        setFormData({
          fullName: '',
          email: '',
          phone: '',
          password: '',
          agencyName: '',
          licenseId: '',
          acceptTerms: false
        })
        // Show success toast
        toast.success(result.message || SIGNUP_SUCCESS_MESSAGE, { autoClose: 6000 })
      } else {
        console.error('❌ Signup failed:', result.error)
        toast.error(result.error || 'Signup failed. Please try again.')
      }
    } catch (error) {
      console.error('Signup error:', error)
      toast.error('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-semibold text-[#17637C] mb-2">Full Name</label>
        <input
          type="text"
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
          required
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17637C] focus:border-transparent transition-all"
          placeholder="Enter your full name"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-[#17637C] mb-2">Email Address</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17637C] focus:border-transparent transition-all"
          placeholder="Enter your email"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-[#17637C] mb-2">Phone Number</label>
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          required
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17637C] focus:border-transparent transition-all"
          placeholder="Enter your phone number"
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
        <label className="block text-sm font-semibold text-[#17637C] mb-2">Agency Name <span className="text-gray-400 font-normal">(Optional)</span></label>
        <input
          type="text"
          name="agencyName"
          value={formData.agencyName}
          onChange={handleChange}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17637C] focus:border-transparent transition-all"
          placeholder="Enter agency name"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-[#17637C] mb-2">License/ID Number <span className="text-gray-400 font-normal">(Optional)</span></label>
        <input
          type="text"
          name="licenseId"
          value={formData.licenseId}
          onChange={handleChange}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17637C] focus:border-transparent transition-all"
          placeholder="Enter license or ID number"
        />
      </div>

      <TermsAgreementField checked={formData.acceptTerms} onChange={handleChange} />

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-[#17637C] text-white py-3 px-4 rounded-xl hover:bg-[#17637C]/90 focus:outline-none focus:ring-2 focus:ring-[#17637C] focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-semibold shadow-lg"
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
            Creating Account...
          </>
        ) : (
          'Create Account'
        )}
      </button>
    </form>
  )
}

// Agency Form Component
const AgencyForm = ({ isLoading, setIsLoading }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    companyWebsite: '',
    registrationNumber: '',
    acceptTerms: false
  })

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.acceptTerms) {
      toast.error('You must accept the Terms of Agreement to continue.')
      return
    }
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          terms_of_agreement: formData.acceptTerms ? 'accepted' : 'awaiting_acceptance',
          userType: 'agency'
        })
      })

      const result = await response.json()
      console.log('📥 Signup response:', { ok: response.ok, result })

      if (response.ok && result.success) {
        // Clear form fields
        setFormData({
          fullName: '',
          email: '',
          phone: '',
          password: '',
          companyWebsite: '',
          registrationNumber: '',
          acceptTerms: false
        })
        // Show success toast
        toast.success(result.message || SIGNUP_SUCCESS_MESSAGE, { autoClose: 6000 })
      } else {
        console.error('❌ Signup failed:', result.error)
        toast.error(result.error || 'Signup failed. Please try again.')
      }
    } catch (error) {
      console.error('Signup error:', error)
      toast.error('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-semibold text-[#17637C] mb-2">Agency Name</label>
        <input
          type="text"
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
          required
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17637C] focus:border-transparent transition-all"
          placeholder="Enter agency name"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-[#17637C] mb-2">Email Address</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17637C] focus:border-transparent transition-all"
          placeholder="Enter your email"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-[#17637C] mb-2">Phone Number</label>
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          required
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17637C] focus:border-transparent transition-all"
          placeholder="Enter your phone number"
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
        <label className="block text-sm font-semibold text-[#17637C] mb-2">Agency Website <span className="text-gray-400 font-normal">(Optional)</span></label>
        <input
          type="url"
          name="companyWebsite"
          value={formData.companyWebsite}
          onChange={handleChange}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17637C] focus:border-transparent transition-all"
          placeholder="https://example.com"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-[#17637C] mb-2">License/Registration Number <span className="text-gray-400 font-normal">(Optional)</span></label>
        <input
          type="text"
          name="registrationNumber"
          value={formData.registrationNumber}
          onChange={handleChange}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17637C] focus:border-transparent transition-all"
          placeholder="Enter license or registration number"
        />
      </div>

      <TermsAgreementField checked={formData.acceptTerms} onChange={handleChange} />

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-[#17637C] text-white py-3 px-4 rounded-xl hover:bg-[#17637C]/90 focus:outline-none focus:ring-2 focus:ring-[#17637C] focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-semibold shadow-lg"
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
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
const DeveloperForm = ({ isLoading, setIsLoading }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    companyWebsite: '',
    registrationNumber: '',
    acceptTerms: false
  })

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.acceptTerms) {
      toast.error('You must accept the Terms of Agreement to continue.')
      return
    }
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          terms_of_agreement: formData.acceptTerms ? 'accepted' : 'awaiting_acceptance',
          userType: 'developer'
        })
      })

      const result = await response.json()
      console.log('📥 Signup response:', { ok: response.ok, result })

      if (response.ok && result.success) {
        // Clear form fields
        setFormData({
          fullName: '',
          email: '',
          phone: '',
          password: '',
          companyWebsite: '',
          registrationNumber: '',
          acceptTerms: false
        })
        // Show success toast
        toast.success(result.message || SIGNUP_SUCCESS_MESSAGE, { autoClose: 6000 })
      } else {
        console.error('❌ Signup failed:', result.error)
        toast.error(result.error || 'Signup failed. Please try again.')
      }
    } catch (error) {
      console.error('Signup error:', error)
      toast.error('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-semibold text-[#17637C] mb-2">Full Name / Company Name</label>
        <input
          type="text"
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
          required
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17637C] focus:border-transparent transition-all"
          placeholder="Enter company or full name"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-[#17637C] mb-2">Email Address</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17637C] focus:border-transparent transition-all"
          placeholder="Enter your email"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-[#17637C] mb-2">Phone Number</label>
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          required
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17637C] focus:border-transparent transition-all"
          placeholder="Enter your phone number"
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
        <label className="block text-sm font-semibold text-[#17637C] mb-2">Company Website <span className="text-gray-400 font-normal">(Optional)</span></label>
        <input
          type="url"
          name="companyWebsite"
          value={formData.companyWebsite}
          onChange={handleChange}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17637C] focus:border-transparent transition-all"
          placeholder="https://example.com"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-[#17637C] mb-2">Company Registration Number <span className="text-gray-400 font-normal">(Optional)</span></label>
        <input
          type="text"
          name="registrationNumber"
          value={formData.registrationNumber}
          onChange={handleChange}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17637C] focus:border-transparent transition-all"
          placeholder="Enter registration number"
        />
      </div>

      <TermsAgreementField checked={formData.acceptTerms} onChange={handleChange} />

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-[#17637C] text-white py-3 px-4 rounded-xl hover:bg-[#17637C]/90 focus:outline-none focus:ring-2 focus:ring-[#17637C] focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-semibold shadow-lg"
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
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
