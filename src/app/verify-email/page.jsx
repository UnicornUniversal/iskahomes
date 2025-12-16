'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

const VerifyEmailContent = () => {
  const [verificationStatus, setVerificationStatus] = useState('verifying') // 'verifying', 'success', 'error'
  const [message, setMessage] = useState('')
  const searchParams = useSearchParams()

  useEffect(() => {
    const verifyEmail = async () => {
      // Check for Supabase confirmation (hash fragments or type parameter)
      const type = searchParams.get('type')
      const token = searchParams.get('token')
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const supabaseType = hashParams.get('type') || type
      const supabaseToken = hashParams.get('access_token') || token

      // If it's a Supabase confirmation (has type=signup or access_token in hash)
      if (supabaseType === 'signup' || (supabaseToken && window.location.hash)) {
        try {
          // Call Supabase verification API
          const response = await fetch(`/api/auth/verify-email-supabase?token=${encodeURIComponent(supabaseToken || '')}&type=${supabaseType || 'signup'}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            }
          })

          const result = await response.json()

          if (response.ok) {
            setVerificationStatus('success')
            setMessage(result.message || 'Your email has been verified successfully! You can now sign in to your account.')
          } else {
            setVerificationStatus('error')
            setMessage(result.error || 'Verification failed. Please try again.')
          }
        } catch (error) {
          console.error('Supabase verification error:', error)
          setVerificationStatus('error')
          setMessage('An error occurred during verification. Please try again.')
        }
        return
      }

      // Otherwise, use the old custom token flow
      if (!token) {
        setVerificationStatus('error')
        setMessage('Invalid verification link. Please check your email for the correct link.')
        return
      }

      try {
        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token })
        })

        const result = await response.json()

        if (response.ok) {
          setVerificationStatus('success')
          setMessage('Your email has been verified successfully! You can now sign in to your account.')
        } else {
          setVerificationStatus('error')
          setMessage(result.error || 'Verification failed. Please try again.')
        }
      } catch (error) {
        console.error('Verification error:', error)
        setVerificationStatus('error')
        setMessage('An error occurred during verification. Please try again.')
      }
    }

    verifyEmail()
  }, [searchParams])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        {verificationStatus === 'verifying' && (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-6"></div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Verifying Your Email</h1>
            <p className="text-gray-600">Please wait while we verify your email address...</p>
          </>
        )}

        {verificationStatus === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Email Verified!</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <a
              href="/home/signin"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Sign In to Your Account
            </a>
          </>
        )}

        {verificationStatus === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Verification Failed</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="space-y-3">
              <a
                href="/signup"
                className="block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Sign Up Again
              </a>
              <a
                href="/home/signin"
                className="block bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Sign In
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

const VerifyEmailPage = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-6"></div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Loading...</h1>
          <p className="text-gray-600">Please wait...</p>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}

export default VerifyEmailPage
