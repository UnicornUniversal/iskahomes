'use client'

import React, { useState, useEffect } from 'react'
import PasswordField from '@/app/components/PasswordField'
import Link from 'next/link'
import { toast } from 'react-toastify'
import { User, Mail, Phone, Globe, Hash } from 'lucide-react'
import AuthLayout from '@/app/components/auth/AuthLayout'
import { AuthHeader, AuthField, AuthSubmitButton } from '@/app/components/auth/AuthUI'

const SIGNUP_SUCCESS_MESSAGE =
  'Account created successfully! Please check your email and confirm your signup to continue.'

const ACCOUNT_TABS = [
  { key: 'seeker', label: 'Seeker' },
  { key: 'developer', label: 'Developer' },
  { key: 'agency', label: 'Agency' }
]

const VALID_ACCOUNT_TABS = ACCOUNT_TABS.map((tab) => tab.key)

const SignupPage = () => {
  const [activeTab, setActiveTab] = useState('seeker')
  const [isLoading, setIsLoading] = useState(false)

  // Preselect account type from ?type= query param (e.g. homepage CTAs)
  useEffect(() => {
    const type = new URLSearchParams(window.location.search).get('type')
    if (type && VALID_ACCOUNT_TABS.includes(type)) {
      setActiveTab(type)
    }
  }, [])

  return (
    <AuthLayout>
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-8 max-w-md mx-4 text-center shadow-2xl">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary_color border-t-transparent mx-auto mb-4"></div>
            <h3 className="text-xl font-semibold text-primary_color mb-2">Creating Your Account</h3>
            <p className="text-gray-600">Please wait while we set up your account...</p>
          </div>
        </div>
      )}

      <AuthHeader
        title="Create Account"
        subtitle="Create your ISKA Homes account to get started."
      />

      {/* Account Type Tabs */}
      <div className="flex bg-gray-100 p-1 mb-6">
        {ACCOUNT_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2.5 px-3 text-sm font-medium transition-all duration-200 ${
              activeTab === tab.key
                ? 'bg-white text-primary_color shadow-sm'
                : 'text-gray-500 hover:text-primary_color'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'seeker' && (
        <PropertySeekerForm isLoading={isLoading} setIsLoading={setIsLoading} />
      )}
      {activeTab === 'developer' && (
        <DeveloperForm isLoading={isLoading} setIsLoading={setIsLoading} />
      )}
      {activeTab === 'agency' && (
        <AgencyForm isLoading={isLoading} setIsLoading={setIsLoading} />
      )}

      <p className="mt-8 text-center text-sm text-gray-500">
        Already have an account?{' '}
        <Link
          href="/home/signin"
          className="font-semibold text-primary_color hover:text-primary_color/80 transition-colors"
        >
          Sign In
        </Link>
      </p>
    </AuthLayout>
  )
}

const TermsAgreementField = ({ checked, onChange }) => (
  <label className="flex items-start gap-3 cursor-pointer">
    <input
      type="checkbox"
      name="acceptTerms"
      checked={checked}
      onChange={onChange}
      className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary_color focus:ring-primary_color"
      required
    />
    <span className="text-xs text-gray-500 leading-5">
      I agree to the{' '}
      <Link href="/home/termsOfService" className="font-medium text-primary_color hover:underline">
        Terms of Agreement
      </Link>
      ,{' '}
      <Link href="/home/privacyPolicy" className="font-medium text-primary_color hover:underline">
        Privacy Policy
      </Link>
      , and{' '}
      <Link href="/home/cookiePolicy" className="font-medium text-primary_color hover:underline">
        Cookie Policy
      </Link>
      .
    </span>
  </label>
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <AuthField
          id="seeker-fullName"
          label="Full Name"
          icon={User}
          type="text"
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
          placeholder="Full name"
          required
        />

        <AuthField
          id="seeker-email"
          label="Email Address"
          icon={Mail}
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Email"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <AuthField
          id="seeker-phone"
          label="Phone Number"
          icon={Phone}
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          placeholder="Phone number"
          required
        />

        <PasswordField
          name="password"
          value={formData.password}
          onChange={handleChange}
          required={true}
          placeholder="Password"
        />
      </div>

      <TermsAgreementField checked={formData.acceptTerms} onChange={handleChange} />

      <AuthSubmitButton loading={isLoading} loadingLabel="Creating Account...">
        Create Account
      </AuthSubmitButton>
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <AuthField
          id="agency-name"
          label="Agency Name"
          icon={User}
          type="text"
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
          placeholder="Agency name"
          required
        />

        <AuthField
          id="agency-email"
          label="Email Address"
          icon={Mail}
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Email"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <AuthField
          id="agency-phone"
          label="Phone Number"
          icon={Phone}
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          placeholder="Phone number"
          required
        />

        <PasswordField
          name="password"
          value={formData.password}
          onChange={handleChange}
          required={true}
          placeholder="Password"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <AuthField
          id="agency-website"
          label="Website (Optional)"
          icon={Globe}
          type="url"
          name="companyWebsite"
          value={formData.companyWebsite}
          onChange={handleChange}
          placeholder="https://example.com"
        />

        <AuthField
          id="agency-registration"
          label="Reg. Number (Optional)"
          icon={Hash}
          type="text"
          name="registrationNumber"
          value={formData.registrationNumber}
          onChange={handleChange}
          placeholder="Registration no."
        />
      </div>

      <TermsAgreementField checked={formData.acceptTerms} onChange={handleChange} />

      <AuthSubmitButton loading={isLoading} loadingLabel="Creating Account...">
        Create Account
      </AuthSubmitButton>
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <AuthField
          id="developer-name"
          label="Full / Company Name"
          icon={User}
          type="text"
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
          placeholder="Company or full name"
          required
        />

        <AuthField
          id="developer-email"
          label="Email Address"
          icon={Mail}
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Email"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <AuthField
          id="developer-phone"
          label="Phone Number"
          icon={Phone}
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          placeholder="Phone number"
          required
        />

        <PasswordField
          name="password"
          value={formData.password}
          onChange={handleChange}
          required={true}
          placeholder="Password"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <AuthField
          id="developer-website"
          label="Website (Optional)"
          icon={Globe}
          type="url"
          name="companyWebsite"
          value={formData.companyWebsite}
          onChange={handleChange}
          placeholder="https://example.com"
        />

        <AuthField
          id="developer-registration"
          label="Reg. Number (Optional)"
          icon={Hash}
          type="text"
          name="registrationNumber"
          value={formData.registrationNumber}
          onChange={handleChange}
          placeholder="Registration no."
        />
      </div>

      <TermsAgreementField checked={formData.acceptTerms} onChange={handleChange} />

      <AuthSubmitButton loading={isLoading} loadingLabel="Creating Account...">
        Create Account
      </AuthSubmitButton>
    </form>
  )
}

export default SignupPage
