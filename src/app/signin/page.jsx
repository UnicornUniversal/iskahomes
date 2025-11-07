'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Input } from '@/app/components/ui/input'
import { Button } from '@/app/components/ui/button'
import { Eye, EyeOff } from 'lucide-react'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

const SignInPage = () => {
  const { login, isAuthenticated, user, loading } = useAuth()
  const router = useRouter()
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    user_type: '' // Add user type selection
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      const userType = user.user_type
      let redirectUrl = '/'
      
      switch (userType) {
        case 'developer':
          redirectUrl = `/developer/${user.profile?.slug}/dashboard`
          break
        case 'agent':
          redirectUrl = `/agents/${user.profile?.slug}/dashboard`
          break
        case 'seeker':
          redirectUrl = `/homeSeeker/${user.profile?.slug}/dashboard`
          break
        case 'property_seeker':
          redirectUrl = `/propertySeeker/${user.id}/dashboard`
          break
        case 'admin':
          redirectUrl = '/admin/dashboard'
          break
        default:
          redirectUrl = '/'
      }
      
      router.push(redirectUrl)
    }
  }, [isAuthenticated, user, loading, router])


  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.email || !formData.password || !formData.user_type) {
      toast.error('Please fill in all fields including user type', {
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
      const result = await login(formData.email, formData.password, formData.user_type)

      if (result.success) {
        // Success - show success message
        const userType = result.user.user_type
        const userName = result.user.profile?.name || userType
        
        toast.success(`Welcome back, ${userName}!`, {
          position: "top-center",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        })
        
        // Redirect based on user type
        let redirectUrl = '/'
        
        switch (userType) {
          case 'developer':
            redirectUrl = `/developer/${result.user.profile?.slug || result.user.id}/dashboard`
            break
          case 'agent':
            redirectUrl = `/agents/${result.user.profile?.slug || result.user.id}/dashboard`
            break
          case 'seeker':
            redirectUrl = `/homeSeeker/${result.user.profile?.slug || result.user.id}/dashboard`
            break
          case 'property_seeker':
            redirectUrl = `/propertySeeker/${result.user.id}/dashboard`
            break
          case 'admin':
            redirectUrl = '/admin/dashboard'
            break
          default:
            redirectUrl = '/'
        }
        
        // Redirect after a short delay
        setTimeout(() => {
          router.push(redirectUrl)
        }, 2000)
        
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


  // Show loading spinner while auth context is loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex ">
      {/* Left Side - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative ">
        <div className="absolute inset-0  max-h-[700px] bg-gradient-to-br from-primary_color/20 to-secondary_color/20 z-10"></div>
        <img 
          src="https://images.unsplash.com/photo-1479839672679-a46483c0e7c8?q=80&w=710&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt="Luxury Real Estate"
          className="w-full h-full object-cover  max-h-[700px]"
        />
       
      </div>

      {/* Right Side - Sign In Form */}
      <div className="w-full lg:w-1/2 flex items-start justify-start p-8 bg-white">
        <div className="w-full max-w-md space-y-8">
        {/* <div className=" inset-0 z-20 flex items-center justify-center md:text-left md:justify-start">
          <div className="text-center md:text-left text-white">
            <h1 className="text-4xl font-bold mb-4">Welcome to Iska Homes</h1>
            <p className="text-xl opacity-90">Your gateway to exceptional real estate experiences</p>
          </div>
        </div> */}
          {/* Header */}
          <div className="text-center md:text-left">
            <h2 className="text-[4em] font-bold  mb-2">Sign In</h2>
            <p className="">Access your account to continue</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}  className="space-y-6">
            {/* User Type Field */}
            <div className="space-y-2">
              <label htmlFor="user_type" className="block text-sm font-medium text-gray-700">
                Account Type:
              </label>
              <select
                id="user_type"
                value={formData.user_type}
                onChange={(e) => handleInputChange('user_type', e.target.value)}
                className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-transparent transition-all duration-200 bg-white"
                required
              >
                <option value="">Select account type</option>
                <option value="developer">Developer</option>
                <option value="agent">Agent</option>
                <option value="property_seeker">Property Seeker</option>
              </select>
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-transparent transition-all duration-200"
                required
              />
            </div>

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
                  className="absolute unset right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </span>
              </div>
            </div>


            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary_color focus:ring-primary_color border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>
              <a href="/forgot-password" className="text-sm text-primary_color hover:text-primary_color/80 transition-colors">
                Forgot password?
              </a>
            </div>

            {/* Sign In Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary_color hover:bg-primary_color/90 text-white py-3 px-4 rounded-lg font-medium transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing In...</span>
                </div>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

         

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          {/* Social Sign In */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="w-full border-gray-300 bg-secondary_color hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </Button>
            <Button
              variant="outline"
              className="w-full border-gray-300 bg-secondary_color hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Facebook
            </Button>
          </div>

          {/* Sign Up Link */}
          <div className="text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <a href="/signup" className="text-primary_color hover:text-primary_color/80 font-medium transition-colors">
                Sign up
              </a>
            </p>
          </div>

          {/* Demo Account Info */}
       
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

export default SignInPage
