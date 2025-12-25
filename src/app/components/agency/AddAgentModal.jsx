'use client'

import React, { useState, useMemo } from 'react'
import { FiX, FiMail, FiPhone, FiUser, FiMapPin, FiLoader, FiCheckCircle, FiAlertCircle } from 'react-icons/fi'
import { useAuth } from '@/contexts/AuthContext'

const AddAgentModal = ({ isOpen, onClose, onAdd }) => {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location_id: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  // Get company locations from user profile
  const companyLocations = useMemo(() => {
    if (!user?.profile?.company_locations) return []
    
    let locations = user.profile.company_locations
    if (typeof locations === 'string') {
      try {
        locations = JSON.parse(locations)
      } catch (e) {
        return []
      }
    }
    
    return Array.isArray(locations) ? locations : []
  }, [user?.profile?.company_locations])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validate = () => {
    const newErrors = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format'
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validate()) {
      return
    }

    setLoading(true)
    setErrors({})

    try {
      const token = localStorage.getItem('agency_token')
      if (!token) {
        setErrors({ general: 'Authentication required. Please sign in again.' })
        setLoading(false)
        return
      }

      const response = await fetch('/api/agencies/agents/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (!response.ok) {
        setErrors({ general: result.error || 'Failed to send invitation' })
        setLoading(false)
        return
      }

      // Success
      setSuccess(true)
      
      // Call onAdd callback if provided
      if (onAdd) {
        onAdd(result.data)
      }

      // Reset form after a short delay
      setTimeout(() => {
        setFormData({
          name: '',
          email: '',
          phone: '',
          location_id: ''
        })
        setErrors({})
        setSuccess(false)
        onClose()
      }, 2000)

    } catch (error) {
      console.error('Error sending invitation:', error)
      setErrors({ general: 'An unexpected error occurred. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm'>
      <div className='bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto'>
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b border-gray-200'>
          <h2 className='text-xl font-bold text-primary_color'>Invite New Agent</h2>
          <button
            onClick={onClose}
            disabled={loading}
            className='p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50'
          >
            <FiX className='w-5 h-5 text-gray-500' />
          </button>
        </div>

        {/* Success Message */}
        {success && (
          <div className='p-6 bg-green-50 border-b border-green-200'>
            <div className='flex items-center gap-3'>
              <FiCheckCircle className='w-5 h-5 text-green-600 flex-shrink-0' />
              <div>
                <p className='text-sm font-medium text-green-800'>Invitation sent successfully!</p>
                <p className='text-xs text-green-600 mt-1'>The agent will receive an email with instructions to join.</p>
              </div>
            </div>
          </div>
        )}

        {/* General Error */}
        {errors.general && (
          <div className='p-6 bg-red-50 border-b border-red-200'>
            <div className='flex items-center gap-3'>
              <FiAlertCircle className='w-5 h-5 text-red-600 flex-shrink-0' />
              <p className='text-sm text-red-800'>{errors.general}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className='p-6 space-y-4'>
          {/* Name */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              <FiUser className='inline w-4 h-4 mr-1' />
              Full Name *
            </label>
            <input
              type='text'
              name='name'
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary_color/20 focus:border-primary_color ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder='Enter agent full name'
            />
            {errors.name && (
              <p className='mt-1 text-sm text-red-600'>{errors.name}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              <FiMail className='inline w-4 h-4 mr-1' />
              Email Address *
            </label>
            <input
              type='email'
              name='email'
              value={formData.email}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary_color/20 focus:border-primary_color ${
                errors.email ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder='agent@example.com'
            />
            {errors.email && (
              <p className='mt-1 text-sm text-red-600'>{errors.email}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              <FiPhone className='inline w-4 h-4 mr-1' />
              Phone Number *
            </label>
            <input
              type='tel'
              name='phone'
              value={formData.phone}
              onChange={handleChange}
              disabled={loading || success}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary_color/20 focus:border-primary_color disabled:bg-gray-100 disabled:cursor-not-allowed ${
                errors.phone ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder='+233 XX XXX XXXX'
            />
            {errors.phone && (
              <p className='mt-1 text-sm text-red-600'>{errors.phone}</p>
            )}
          </div>

          {/* Location Selector */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              <FiMapPin className='inline w-4 h-4 mr-1' />
              Location {companyLocations.length > 0 ? '(Optional)' : ''}
            </label>
            {companyLocations.length === 0 ? (
              <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-3'>
                <p className='text-xs text-yellow-800'>
                  No company locations found. Please add locations in your agency profile first. The agent will use your primary location.
                </p>
              </div>
            ) : (
              <select
                name='location_id'
                value={formData.location_id}
                onChange={handleChange}
                disabled={loading || success}
                className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary_color/20 focus:border-primary_color disabled:bg-gray-100 disabled:cursor-not-allowed'
              >
                <option value=''>Select a location (optional - uses primary location if not selected)</option>
                {companyLocations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.description || location.address || `${location.city}, ${location.country}`}
                    {location.primary_location ? ' (Primary)' : ''}
                  </option>
                ))}
              </select>
            )}
            {errors.location_id && (
              <p className='mt-1 text-sm text-red-600'>{errors.location_id}</p>
            )}
          </div>

          {/* Info Note */}
          <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
            <p className='text-xs text-blue-800'>
              <strong>Note:</strong> An invitation email will be sent to the agent. They'll need to accept the invitation and create an account to join your agency.
            </p>
          </div>

          {/* Actions */}
          <div className='flex items-center justify-end gap-3 pt-4 border-t border-gray-200'>
            <button
              type='button'
              onClick={onClose}
              disabled={loading || success}
              className='px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {success ? 'Close' : 'Cancel'}
            </button>
            <button
              type='submit'
              disabled={loading || success}
              className='px-4 py-2 bg-primary_color text-white rounded-lg hover:bg-primary_color/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2'
            >
              {loading ? (
                <>
                  <FiLoader className='w-4 h-4 animate-spin' />
                  Sending...
                </>
              ) : success ? (
                <>
                  <FiCheckCircle className='w-4 h-4' />
                  Sent!
                </>
              ) : (
                'Send Invitation'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddAgentModal

