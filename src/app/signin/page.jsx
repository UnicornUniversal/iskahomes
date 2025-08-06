'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Input } from '@/app/components/ui/input'
import { Button } from '@/app/components/ui/button'
import { ChevronDown, Eye, EyeOff, Building2, Home, User, Users } from 'lucide-react'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

const SignInPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    accountType: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const dropdownRef = useRef(null)

  const accountTypes = [
    { 
      value: 'developer', 
      label: 'Developer', 
      icon: Building2,
      email: 'trassacovalley@gmail.com',
      password: '12345',
      redirectLink: '/developer/7868889796997/dashboard'
    },
    { 
      value: 'agent', 
      label: 'Agent', 
      icon: User,
      email: 'agent@iskahomes.com',
      password: '12345',
      redirectLink: '/agents/7868889796997/dashboard'
    },
    { 
      value: 'homeowner', 
      label: 'Homeowner', 
      icon: Home,
      email: 'homeowner@iskahomes.com',
      password: 'homeowner123',
      redirectLink: '/homeowner/dashboard'
    },
    { 
      value: 'homeseeker', 
      label: 'HomeSeeker', 
      icon: Users,
      email: 'homeseeker@iskahomes.com',
      password: 'homeseeker123',
      redirectLink: '/homeSeeker'
    }
  ]

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.email || !formData.password || !formData.accountType) {
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
      // Find the selected account type
      const selectedType = accountTypes.find(type => type.value === formData.accountType)
      
      if (!selectedType) {
        toast.error('Please select a valid account type', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        })
        setIsLoading(false)
        return
      }
      
             // Check if credentials match the dummy account
       if (formData.email === selectedType.email && formData.password === selectedType.password) {
         console.log('Authentication successful:', formData)
         
         // Show success toast
         toast.success(`Welcome back! Redirecting to ${selectedType.label} dashboard...`, {
           position: "top-center",
           autoClose: 2000,
           hideProgressBar: false,
           closeOnClick: true,
           pauseOnHover: true,
           draggable: true,
         })
         
         // Simulate API call
         await new Promise(resolve => setTimeout(resolve, 1000))
         
         // Redirect to the appropriate dashboard
         window.location.href = selectedType.redirectLink
       } else {
         // Check if it's a different account type that's not developer
         if (formData.accountType !== 'developer') {
           toast.info('Account still being developed. We are almost there! 🚀', {
             position: "top-center",
             autoClose: 4000,
             hideProgressBar: false,
             closeOnClick: true,
             pauseOnHover: true,
             draggable: true,
           })
         } else {
           toast.error('Invalid email or password for the selected account type', {
             position: "top-center",
             autoClose: 4000,
             hideProgressBar: false,
             closeOnClick: true,
             pauseOnHover: true,
             draggable: true,
           })
         }
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

  const selectedAccountType = accountTypes.find(type => type.value === formData.accountType)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

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

            {/* Account Type Dropdown */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Account Type
              </label>
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary_color focus:border-transparent transition-all duration-200 bg-white text-left flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    {selectedAccountType ? (
                      <>
                        <selectedAccountType.icon size={20} className="text-primary_color" />
                        <span className="text-gray-900">{selectedAccountType.label}</span>
                      </>
                    ) : (
                      <span className="text-gray-500">Select account type</span>
                    )}
                  </div>
                  <ChevronDown 
                    size={20} 
                    className={`text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                    {accountTypes.map((type) => (
                      <span
                        key={type.value}
                        type="button "
                        onClick={() => {
                          handleInputChange('accountType', type.value)
                          setIsDropdownOpen(false)
                        }}
                        className="w-full px-4 py-3 flex items-center space-x-3 hover:bg-gray-50 transition-colors duration-150 first:rounded-t-lg last:rounded-b-lg"
                      >
                        <type.icon size={20} className="text-primary_color" />
                        <span className="text-gray-900">{type.label}</span>
                      </span>
                    ))}
                  </div>
                )}
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
              <a href="#" className="text-sm text-primary_color hover:text-primary_color/80 transition-colors">
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

          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-sm font-semibold text-blue-800 mb-3">🧪 Demo Account for Testing:</h3>
            <div className="space-y-2 text-sm text-blue-700">
              <div className="flex items-center space-x-2">
                <span className="font-medium">Email:</span>
                <span className="bg-white px-2 py-1 rounded border">trassacovalley@gmail.com</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-medium">Password:</span>
                <span className="bg-white px-2 py-1 rounded border">12345</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-medium">Account Type:</span>
                <span className="bg-white px-2 py-1 rounded border">Developer</span>
              </div>
            </div>
            <p className="text-xs text-blue-600 mt-2 italic">Use these credentials to test the developer dashboard functionality</p>
          </div>

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
