'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Mail, MailCheck } from 'lucide-react'
import AuthLayout from '@/app/components/auth/AuthLayout'
import {
  AuthHeader,
  AuthField,
  AuthSubmitButton
} from '@/app/components/auth/AuthUI'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!email) {
      toast.error('Please enter your email address', {
        position: "top-center",
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
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const result = await response.json()

      if (response.ok) {
        setIsSubmitted(true)
        toast.success('Password reset email sent! Check your inbox.', {
          position: "top-center",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        })
      } else {
        toast.error(result.error || 'Failed to send reset email', {
          position: "top-center",
          autoClose: 4000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        })
      }
    } catch (error) {
      console.error('Forgot password error:', error)
      toast.error('An error occurred. Please try again.', {
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

  const backToSignIn = (
    <p className="mt-8 text-center text-sm text-gray-500">
      <Link
        href="/home/signin"
        className="inline-flex items-center gap-1.5 font-semibold text-primary_color hover:text-primary_color/80 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Sign In
      </Link>
    </p>
  )

  const toastContainer = (
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
  )

  if (isSubmitted) {
    return (
      <AuthLayout>
        <div className="mb-6 flex items-center justify-center h-12 w-12 rounded-full bg-primary_color/10">
          <MailCheck className="h-6 w-6 text-primary_color" />
        </div>

        <AuthHeader
          title="Check Your Email"
          subtitle="We've sent a password reset link to your inbox."
        />

        <p className="text-sm text-gray-700 break-all">
          <strong>{email}</strong>
        </p>

        <p className="mt-4 text-sm text-gray-500">
          Didn&apos;t receive the email? Check your spam folder or{' '}
          <button
            type="button"
            onClick={() => setIsSubmitted(false)}
            className="font-semibold text-primary_color hover:text-primary_color/80 transition-colors"
          >
            try again
          </button>
        </p>

        {backToSignIn}

        {toastContainer}
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <AuthHeader
        title="Forgot Password?"
        subtitle="Enter your email address and we'll send you a link to reset your password."
      />

      <form onSubmit={handleSubmit} className="space-y-5">
        <AuthField
          id="email"
          label="Email Address"
          icon={Mail}
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />

        <AuthSubmitButton loading={isLoading} loadingLabel="Sending...">
          Send Reset Link
        </AuthSubmitButton>
      </form>

      {backToSignIn}

      {toastContainer}
    </AuthLayout>
  )
}

export default ForgotPasswordPage
