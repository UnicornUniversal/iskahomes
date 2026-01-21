'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { Input } from '@/app/components/ui/input'
import { Button } from '@/app/components/ui/button'
import { Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useRouter, useSearchParams } from 'next/navigation'

const AcceptInvitationContent = () => {
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(true)
  const [isSuccess, setIsSuccess] = useState(false)
  const [teamMemberData, setTeamMemberData] = useState(null)
  const [error, setError] = useState(null)
  
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const verifyToken = async () => {
      const token = searchParams.get('token')
      
      if (!token) {
        setError('Invalid invitation link. No token provided.')
        setIsVerifying(false)
        return
      }

      try {
        // The API route works for both developers and agencies (queries by token only)
        const response = await fetch(`/api/developers/team/members/invite/accept?token=${token}`)
        const result = await response.json()

        if (response.ok && result.success) {
          setTeamMemberData(result.data)
        } else {
          setError(result.error || 'Invalid or expired invitation token')
        }
      } catch (err) {
        console.error('Error verifying token:', err)
        setError('Failed to verify invitation. Please try again.')
      } finally {
        setIsVerifying(false)
      }
    }

    verifyToken()
  }, [searchParams])

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const validatePassword = (password) => {
    const minLength = 8
    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasNumbers = /\d/.test(password)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)

    return {
      isValid: password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar,
      errors: {
        minLength: password.length < minLength,
        noUpperCase: !hasUpperCase,
        noLowerCase: !hasLowerCase,
        noNumbers: !hasNumbers,
        noSpecialChar: !hasSpecialChar
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const token = searchParams.get('token')
    
    if (!token) {
      toast.error('Invalid invitation link', {
        position: "top-center",
        autoClose: 3000,
      })
      return
    }

    if (!formData.password || !formData.confirmPassword) {
      toast.error('Please fill in all required fields', {
        position: "top-center",
        autoClose: 3000,
      })
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match', {
        position: "top-center",
        autoClose: 3000,
      })
      return
    }

    const passwordValidation = validatePassword(formData.password)
    if (!passwordValidation.isValid) {
      toast.error('Password does not meet requirements', {
        position: "top-center",
        autoClose: 4000,
      })
      return
    }

    setIsLoading(true)

    try {
      // The API route works for both developers and agencies (queries by token only)
      const response = await fetch('/api/developers/team/members/invite/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: token,
          password: formData.password
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setIsSuccess(true)
        toast.success('Invitation accepted successfully! You can now sign in.', {
          position: "top-center",
          autoClose: 3000,
        })
        
        // Redirect to sign-in after 3 seconds
        setTimeout(() => {
          router.push('/home/signin')
        }, 3000)
      } else {
        toast.error(result.error || 'Failed to accept invitation', {
          position: "top-center",
          autoClose: 4000,
        })
      }
    } catch (error) {
      console.error('Accept invitation error:', error)
      toast.error('An error occurred. Please try again.', {
        position: "top-center",
        autoClose: 4000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const passwordValidation = validatePassword(formData.password)

  // Loading state
  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-6"></div>
            <h2 className="text-3xl font-bold text-gray-900">Verifying Invitation...</h2>
            <p className="text-gray-600">Please wait while we verify your invitation link.</p>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Invalid Invitation</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button
              onClick={() => router.push('/home/signin')}
              className="bg-primary_color hover:bg-primary_color/90 text-white"
            >
              Go to Sign In
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              Invitation Accepted!
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Your account has been created successfully. You will be redirected to the sign-in page shortly.
            </p>
            <div className="mt-6">
              <Button
                onClick={() => router.push('/home/signin')}
                className="w-full bg-primary_color hover:bg-primary_color/90 text-white"
              >
                Go to Sign In Now
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <div className="absolute inset-0 max-h-[700px] bg-gradient-to-br from-primary_color/20 to-secondary_color/20 z-10"></div>
        <img 
          src="https://images.unsplash.com/photo-1479839672679-a46483c0e7c8?q=80&w=710&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt="Team Member"
          className="w-full h-full object-cover max-h-[700px]"
        />
      </div>

      {/* Right Side - Accept Invitation Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center md:text-left">
            <h2 className="text-4xl font-bold mb-2">Accept Invitation</h2>
            <p className="text-gray-600">
              {teamMemberData && (
                <>
                  You've been invited to join as a team member.
                  {teamMemberData.role && (
                    <>
                      <br />
                      <strong>Role:</strong> {teamMemberData.role.name}
                    </>
                  )}
                  <br />
                  Complete your account setup below.
                </>
              )}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Display (Read-only) */}
            {teamMemberData && (
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={teamMemberData.email}
                  disabled
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500">This email will be used for your account</p>
              </div>
            )}

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-transparent transition-all duration-200"
                  required
                />
                <span
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </span>
              </div>
              
              {/* Password Requirements */}
              {formData.password && (
                <div className="text-xs text-gray-600 space-y-1">
                  <div className={passwordValidation.errors.minLength ? 'text-red-500' : 'text-green-600'}>
                    • At least 8 characters
                  </div>
                  <div className={passwordValidation.errors.noUpperCase ? 'text-red-500' : 'text-green-600'}>
                    • One uppercase letter
                  </div>
                  <div className={passwordValidation.errors.noLowerCase ? 'text-red-500' : 'text-green-600'}>
                    • One lowercase letter
                  </div>
                  <div className={passwordValidation.errors.noNumbers ? 'text-red-500' : 'text-green-600'}>
                    • One number
                  </div>
                  <div className={passwordValidation.errors.noSpecialChar ? 'text-red-500' : 'text-green-600'}>
                    • One special character
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-transparent transition-all duration-200"
                  required
                />
                <span
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading || !passwordValidation.isValid}
              className="w-full bg-primary_color hover:bg-primary_color/90 text-white py-3 px-4 rounded-lg font-medium transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating Account...</span>
                </div>
              ) : (
                'Accept Invitation & Create Account'
              )}
            </Button>
          </form>
        </div>
      </div>

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
    </div>
  )
}

const AcceptInvitationPage = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-6"></div>
            <h2 className="text-3xl font-bold text-gray-900">Loading...</h2>
            <p className="text-gray-600">Please wait...</p>
          </div>
        </div>
      </div>
    }>
      <AcceptInvitationContent />
    </Suspense>
  )
}

export default AcceptInvitationPage
