'use client'

import React, { useState, useRef, useEffect, Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Mail, Lock } from 'lucide-react'
import AuthLayout from '@/app/components/auth/AuthLayout'
import {
  AuthHeader,
  AuthField,
  AuthPasswordField,
  AuthSubmitButton,
  AuthDivider,
  GoogleButton
} from '@/app/components/auth/AuthUI'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'
import { getAgencyLandingHref } from '@/lib/dashboardRoutes'

const SignInPage = () => {
  const { login, isAuthenticated, user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [multipleOrganizations, setMultipleOrganizations] = useState(null)
  const [selectedOrganization, setSelectedOrganization] = useState(null)
  const [showOtpModal, setShowOtpModal] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [otpTicket, setOtpTicket] = useState('')
  const [otpSecondsLeft, setOtpSecondsLeft] = useState(0)
  const [otpMaskedPhone, setOtpMaskedPhone] = useState('')
  const [otpPendingOrganizationId, setOtpPendingOrganizationId] = useState(null)
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false)
  const [isResendingOtp, setIsResendingOtp] = useState(false)

  // Check for success message from signup redirect
  useEffect(() => {
    const message = searchParams.get('message')
    if (message) {
      toast.success(message, {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      })
      // Clean up URL by removing query parameter
      router.replace('/home/signin')
    }
  }, [searchParams, router])

  // Redirect if already authenticated (but only after token is confirmed saved)
  useEffect(() => {
    // Wait a bit to ensure token is saved after login
    const checkAuth = setTimeout(() => {
      if (!loading && isAuthenticated && user) {
      const userType = user.user_type
      let redirectUrl = '/'
      
      switch (userType) {
        case 'developer':
          redirectUrl = `/developer/${user.profile?.slug}/dashboard`
          break
        case 'agent':
          redirectUrl = `/agents/${user.profile?.slug || user.profile?.agent_id || user.id}/dashboard`
          break
        case 'agency':
          redirectUrl = `/agency/${user.profile?.slug}/dashboard`
          break
        case 'seeker':
          redirectUrl = `/homeSeeker/${user.profile?.slug}/dashboard`
          break
        case 'property_seeker':
          redirectUrl = `/propertySeeker/${user.id}/dashboard`
          break
        case 'team_member':
          // Team members redirect based on organization_type
          if (user.profile?.organization_type === 'developer') {
            redirectUrl = `/developer/${user.profile?.organization_slug}/dashboard`
          } else if (user.profile?.organization_type === 'agency') {
            redirectUrl = getAgencyLandingHref(user)
          } else {
            redirectUrl = '/'
          }
          break
        case 'admin':
          redirectUrl = '/admin/dashboard'
          break
        default:
          redirectUrl = '/'
      }
      
        router.push(redirectUrl)
      }
    }, 500) // Small delay to ensure token is saved
    
    return () => clearTimeout(checkAuth)
  }, [isAuthenticated, user, loading, router])


  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  useEffect(() => {
    if (!showOtpModal || otpSecondsLeft <= 0) return

    const intervalId = setInterval(() => {
      setOtpSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalId)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(intervalId)
  }, [showOtpModal, otpSecondsLeft])

  const formatOtpCountdown = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  const getRedirectUrl = (userData) => {
    const userType = userData.user_type
    let redirectUrl = '/'

    switch (userType) {
      case 'developer':
        redirectUrl = `/developer/${userData.profile?.slug || userData.id}/dashboard`
        break
      case 'agent':
        redirectUrl = `/agents/${userData.profile?.slug || userData.id}/dashboard`
        break
      case 'agency':
        redirectUrl = `/agency/${userData.profile?.slug || userData.id}/dashboard`
        break
      case 'seeker':
        redirectUrl = `/homeSeeker/${userData.profile?.slug || userData.id}/dashboard`
        break
      case 'property_seeker':
        redirectUrl = `/propertySeeker/${userData.id}/dashboard`
        break
      case 'team_member':
        if (userData.profile?.organization_type === 'developer') {
          redirectUrl = `/developer/${userData.profile?.organization_slug}/dashboard`
        } else if (userData.profile?.organization_type === 'agency') {
          redirectUrl = getAgencyLandingHref(userData)
        } else {
          redirectUrl = '/'
        }
        break
      case 'admin':
        redirectUrl = '/admin/dashboard'
        break
      default:
        redirectUrl = '/'
    }

    return redirectUrl
  }

  const openOtpModal = (otpPayload, organizationId = null) => {
    setOtpTicket(otpPayload.otpTicket || '')
    setOtpSecondsLeft(Number(otpPayload.expiresIn) || 180)
    setOtpMaskedPhone(otpPayload.maskedPhone || '')
    setOtpPendingOrganizationId(organizationId)
    setOtpCode('')
    setShowOtpModal(true)

    toast.info(`OTP sent to ${otpPayload.maskedPhone || 'your phone number'}`, {
      position: "top-center",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    })
  }

  const handleLoginSuccess = (result) => {
    const userType = result.user.user_type
    const userName = result.user.profile?.name || result.user.profile?.first_name || result.user.profile?.organization_name || userType

    toast.success(`Welcome back, ${userName}!`, {
      position: "top-center",
      autoClose: 2000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    })

    const redirectUrl = getRedirectUrl(result.user)

    setTimeout(() => {
      const hasToken =
        localStorage.getItem('developer_token') ||
        localStorage.getItem('agency_token') ||
        localStorage.getItem('agent_token') ||
        localStorage.getItem('property_seeker_token')

      console.log('🔐 SIGNIN PAGE: Pre-redirect token check:', hasToken ? 'FOUND' : 'NOT FOUND')

      if (!hasToken) {
        console.error('🔐 SIGNIN PAGE: Token not found before redirect! Retrying...')
        toast.error('Authentication error. Please try again.', {
          position: "top-center",
          autoClose: 3000,
        })
        setIsLoading(false)
        return
      }

      console.log('🔐 SIGNIN PAGE: Redirecting to:', redirectUrl)
      router.push(redirectUrl)
    }, 1000)
  }

  const closeOtpModal = () => {
    setShowOtpModal(false)
    setOtpCode('')
    setOtpTicket('')
    setOtpSecondsLeft(0)
    setOtpMaskedPhone('')
    setOtpPendingOrganizationId(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.email || !formData.password) {
      toast.error('Please fill in all fields', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      })
      return
    }
    
    setIsLoading(true)
    
    try {
      const result = await login(formData.email, formData.password, selectedOrganization?.id)
      
      // Handle multiple organizations
      if (result.multipleOrganizations && result.organizations) {
        setMultipleOrganizations(result.organizations)
        setIsLoading(false)
        return
      }

      if (result.requiresOtp) {
        openOtpModal(result, selectedOrganization?.id || null)
        setIsLoading(false)
        return
      }

      if (result.success) {
        handleLoginSuccess(result)
      } else {
        // Error - show error message
        toast.error(result.error || 'Invalid email or password', {
          position: "top-center",
          autoClose: 4000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        })
      }
    } catch (error) {
      console.error('Sign in error:', error)
      toast.error('An error occurred during sign in. Please try again.', {
        position: "top-center",
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOtp = async (event) => {
    event.preventDefault()

    if (!otpCode || otpCode.trim().length !== 6) {
      toast.error('Enter a valid 6-digit OTP code.', {
        position: "top-center",
        autoClose: 3000,
      })
      return
    }

    if (!otpTicket) {
      toast.error('OTP session has expired. Please request a new code.', {
        position: "top-center",
        autoClose: 3000,
      })
      return
    }

    setIsVerifyingOtp(true)
    try {
      const verifyResponse = await fetch('/api/auth/signin/otp/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          otpTicket,
          otp: otpCode.trim()
        })
      })

      const verifyData = await verifyResponse.json()
      if (!verifyResponse.ok) {
        throw new Error(verifyData?.error || 'Failed to verify OTP')
      }

      const finalLogin = await login(formData.email, formData.password, otpPendingOrganizationId, otpTicket)
      if (finalLogin.success) {
        closeOtpModal()
        handleLoginSuccess(finalLogin)
      } else if (finalLogin.requiresOtp) {
        openOtpModal(finalLogin, otpPendingOrganizationId)
      } else {
        toast.error(finalLogin.error || 'Unable to complete sign in after OTP verification.', {
          position: "top-center",
          autoClose: 4000,
        })
      }
    } catch (error) {
      toast.error(error.message || 'OTP verification failed.', {
        position: "top-center",
        autoClose: 4000,
      })
    } finally {
      setIsVerifyingOtp(false)
    }
  }

  const handleResendOtp = async () => {
    setIsResendingOtp(true)
    try {
      const resendResult = await login(formData.email, formData.password, otpPendingOrganizationId)
      if (resendResult.requiresOtp) {
        openOtpModal(resendResult, otpPendingOrganizationId)
      } else {
        toast.error(resendResult.error || 'Failed to resend OTP. Please try again.', {
          position: "top-center",
          autoClose: 4000,
        })
      }
    } catch (error) {
      toast.error('Unable to resend OTP right now. Please try again.', {
        position: "top-center",
        autoClose: 4000,
      })
    } finally {
      setIsResendingOtp(false)
    }
  }


  // Show loading spinner while auth context is loading
  if (loading) {
    return <AuthLoadingScreen />
  }

  return (
    <AuthLayout>
      <AuthHeader title="Sign In" subtitle="Access your account to continue." />

      <form onSubmit={handleSubmit} className="space-y-5">
        <AuthField
          id="email"
          label="Email Address"
          icon={Mail}
          type="email"
          placeholder="Enter your email"
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          autoComplete="email"
          required
        />

        <AuthPasswordField
          id="password"
          label="Password"
          icon={Lock}
          placeholder="Enter your password"
          value={formData.password}
          onChange={(e) => handleInputChange('password', e.target.value)}
          autoComplete="current-password"
          required
        />

        <div className="flex items-center justify-between">
          <label htmlFor="remember-me" className="flex items-center gap-2 cursor-pointer">
            <input
              id="remember-me"
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-primary_color focus:ring-primary_color"
            />
            <span className="text-sm text-gray-600">Remember me</span>
          </label>
          <Link
            href="/forgot-password"
            className="text-sm font-medium text-primary_color hover:text-primary_color/80 transition-colors"
          >
            Forgot Password?
          </Link>
        </div>

        <AuthSubmitButton loading={isLoading} loadingLabel="Signing In...">
          Sign In
        </AuthSubmitButton>
      </form>

      <div className="my-6">
        <AuthDivider />
      </div>

      <GoogleButton />

      <p className="mt-8 text-center text-sm text-gray-500">
        Don&apos;t have an account?{' '}
        <Link
          href="/home/signup"
          className="font-semibold text-primary_color hover:text-primary_color/80 transition-colors"
        >
          Sign Up
        </Link>
      </p>

      {/* OTP Verification Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-primary_color mb-2">Verify OTP</h3>
            <p className="text-gray-600 mb-3">
              Enter the 6-digit OTP sent to {otpMaskedPhone || 'your phone'}.
            </p>
            <p className={`text-sm mb-4 ${otpSecondsLeft > 0 ? 'text-gray-500' : 'text-red-600 font-medium'}`}>
              {otpSecondsLeft > 0
                ? `Code expires in ${formatOtpCountdown(otpSecondsLeft)}`
                : 'OTP expired. Click resend to get a new code.'}
            </p>

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="Enter 6-digit OTP"
                value={otpCode}
                onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, ''))}
                className="w-full h-12 px-4 border border-gray-200 text-center text-lg tracking-[0.5em] outline-none transition-colors focus:border-primary_color focus:ring-2 focus:ring-primary_color/20"
                required
              />

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={closeOtpModal}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isVerifyingOtp || otpSecondsLeft <= 0}
                  className="flex-1 px-4 py-2 bg-primary_color text-white hover:bg-primary_color/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isVerifyingOtp ? 'Verifying...' : 'Verify OTP'}
                </button>
              </div>
            </form>

            <button
              type="button"
              onClick={handleResendOtp}
              disabled={isResendingOtp}
              className="mt-4 w-full text-sm text-primary_color hover:text-primary_color/80 disabled:opacity-60"
            >
              {isResendingOtp ? 'Resending OTP...' : 'Resend OTP'}
            </button>
          </div>
        </div>
      )}

      {/* Organization Selector Modal */}
      {multipleOrganizations && multipleOrganizations.length > 0 && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-primary_color mb-4">Select Organization</h3>
            <p className="text-gray-600 mb-4">You belong to multiple organizations. Please select one to continue:</p>
            <div className="space-y-2 mb-6">
              {multipleOrganizations.map((org) => (
                <button
                  key={org.id}
                  onClick={() => setSelectedOrganization(org)}
                  className={`w-full text-left p-4 border-2 transition-all ${
                    selectedOrganization?.id === org.id
                      ? 'border-primary_color bg-primary_color/10'
                      : 'border-gray-200 hover:border-primary_color/50'
                  }`}
                >
                  <div className="font-semibold text-gray-900">{org.organization_name || 'Organization'}</div>
                  <div className="text-sm text-gray-600 capitalize">{org.organization_type}</div>
                  <div className="text-sm text-gray-500">Role: {org.role_name}</div>
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setMultipleOrganizations(null)
                  setSelectedOrganization(null)
                  setIsLoading(false)
                }}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!selectedOrganization) {
                    toast.error('Please select an organization', {
                      position: "top-center",
                      autoClose: 3000,
                    })
                    return
                  }
                  setIsLoading(true)
                  try {
                    const result = await login(formData.email, formData.password, selectedOrganization.id || selectedOrganization.team_member_id)
                    if (result.requiresOtp) {
                      openOtpModal(result, selectedOrganization.id || selectedOrganization.team_member_id)
                      setMultipleOrganizations(null)
                      setSelectedOrganization(null)
                      return
                    }

                    if (result.success) {
                      setMultipleOrganizations(null)
                      setSelectedOrganization(null)
                      handleLoginSuccess(result)
                    } else {
                      toast.error(result.error || 'Unable to sign in. Please try again.', {
                        position: "top-center",
                        autoClose: 4000,
                      })
                    }
                  } catch (error) {
                    console.error('Sign in error:', error)
                    toast.error('An error occurred. Please try again.', {
                      position: "top-center",
                      autoClose: 4000,
                    })
                    setIsLoading(false)
                  }
                }}
                disabled={!selectedOrganization || isLoading}
                className="flex-1 px-6 py-2 bg-primary_color text-white hover:bg-primary_color/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Signing In...' : 'Continue'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Toast Container */}
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </AuthLayout>
  )
}

const AuthLoadingScreen = () => (
  <div className="relative min-h-screen w-full flex items-center justify-center bg-[#0b1417]">
    <Image
      src="/aboutUsImages/signuppic.jpg"
      alt=""
      fill
      priority
      sizes="100vw"
      className="object-cover"
    />
    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/65 to-black/45" />
    <div className="relative z-10 h-10 w-10 rounded-full border-2 border-white/30 border-t-white animate-spin" />
  </div>
)

const SignInPageWrapper = () => {
  return (
    <Suspense fallback={<AuthLoadingScreen />}>
      <SignInPage />
    </Suspense>
  )
}

export default SignInPageWrapper
