"use client"
import React, { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useAnalytics } from '@/hooks/useAnalytics'

const ScheduleATour = ({ propertyId, propertyTitle, propertyType, developer, listing }) => {
  const { user, propertySeekerToken } = useAuth()
  const router = useRouter()
  const analytics = useAnalytics()
  const [mode, setMode] = useState('in-person')
  const [loading, setLoading] = useState(false)
  const [showAuthMessage, setShowAuthMessage] = useState(false)
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    name: '',
    email: '',
    phone: '',
    message: ''
  })

  // Pre-fill form with property seeker data if logged in
  useEffect(() => {
    if (user && user.user_type === 'property_seeker' && user.profile) {
      setFormData(prev => ({
        ...prev,
        name: user.profile.name || '',
        email: user.email || '',
        phone: user.profile.phone || ''
      }))
    }
  }, [user])

  // CRITICAL: Use listing.account_type and listing.user_id directly if listing is provided
  // This avoids database lookups - every listing has these fields
  const getAccountType = () => {
    // If listing object is provided, use its account_type directly
    if (listing?.account_type) {
      return listing.account_type
    }
    // Fallback for profile-based appointments (developer/agent profile pages)
    return propertyType === 'unit' || propertyType === 'developer' ? 'developer' : 'agent'
  }

  // Get account ID - use listing.user_id directly if available
  const getAccountId = () => {
    // CRITICAL: If listing object is provided, use listing.user_id directly
    if (listing?.user_id) {
      return listing.user_id
    }
    // Fallback for profile-based appointments
    if (propertyType === 'unit' || propertyType === 'developer') {
      return developer?.developer_id || 'unknown'
    }
    // For agents, you might need to fetch from a different source
    return developer?.developer_id || 'unknown'
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Check if user is logged in as property seeker
    if (!user || !propertySeekerToken || user.user_type !== 'property_seeker') {
      // Show toast notification
      toast.error('Only registered property seekers can book appointments. Please sign up first.')
      
      // Show message under button
      setShowAuthMessage(true)
      
      // Hide message and redirect after 3 seconds
      setTimeout(() => {
        setShowAuthMessage(false)
        router.push('/signup')
      }, 3000)
      
      return
    }
    
    // Validate form
    if (!formData.date || !formData.time || !formData.name || !formData.email) {
      toast.error('Please fill in all required fields')
      return
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address')
      return
    }

    setLoading(true)

    try {
      const appointmentData = {
        account_type: getAccountType(),
        account_id: getAccountId(),
        listing_id: propertyId,
        seeker_id: user.id, // Add property seeker ID
        appointment_date: new Date(`${formData.date}T${formData.time}`).toISOString(),
        appointment_time: formData.time,
        duration: 60,
        appointment_type: mode === 'video' ? 'virtual' : 'in-person',
        meeting_location: mode === 'video' ? 'Virtual Meeting' : 'Property Location',
        client_name: formData.name,
        client_email: formData.email,
        client_phone: formData.phone,
        notes: formData.message
      }

      console.log('Submitting appointment:', appointmentData)

      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${propertySeekerToken}`
        },
        body: JSON.stringify(appointmentData)
      })

      const result = await response.json()

      if (result.success) {
        // Track appointment booking event
        if (propertyType === 'development') {
          // Track as development lead
          analytics.trackDevelopmentLead(propertyId, 'appointment', {
            lister_id: getAccountId(),
            lister_type: getAccountType(),
            appointmentType: mode === 'video' ? 'virtual' : 'in-person'
          })
        } else {
          // Track as regular appointment lead (for listings/profiles)
          analytics.trackAppointmentClick({
            contextType: propertyType === 'listing' || propertyType === 'unit' ? 'listing' : 'profile',
            listingId: propertyType === 'listing' || propertyType === 'unit' ? propertyId : undefined,
            listing: listing, // Pass listing object if available (for listing-based appointments)
            profileId: propertyType === 'developer' ? propertyId : undefined, // For profile-based appointments
            lister_id: getAccountId(),
            lister_type: getAccountType(),
            appointmentType: mode === 'video' ? 'virtual' : 'in-person'
          })
        }
        
        toast.success('Appointment scheduled successfully! We\'ll contact you soon.')
        
        // Reset form
        setFormData({
          date: '',
          time: '',
          name: '',
          email: '',
          phone: '',
          message: ''
        })
      } else {
        toast.error(result.error || 'Failed to schedule appointment')
      }

    } catch (error) {
      console.error('Error scheduling appointment:', error)
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='w-full h-auto max-h-[800px] bg-white rounded-xl shadow p-6 max-w-md mx-auto'>
      <h2 className='text-2xl font-bold text-primary_color mb-1'>Schedule a tour</h2>
      <p className='text-gray-500 mb-4'>Choose your preferred day</p>
      
      {/* Toggle */}
      <div className='flex gap-2 mb-4'>
        <button
          type='button'
          className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${mode === 'in-person' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-500'}`}
          onClick={() => setMode('in-person')}
          disabled={loading}
        >
          In Person
        </button>
        <button
          type='button'
          className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${mode === 'video' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-500'}`}
          onClick={() => setMode('video')}
          disabled={loading}
        >
          Video Chat
        </button>
      </div>

      <form onSubmit={handleSubmit} className='flex flex-col gap-3'>
        <div>
          <label className='block text-primary_color text-sm font-semibold mb-1'>Date: <span className="text-red-500">*</span></label>
          <input 
            type='date' 
            name="date"
            value={formData.date}
            onChange={handleInputChange}
            className='w-full p-2 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary_color' 
            required
            disabled={loading}
          />
        </div>
        <div>
          <label className='block text-primary_color text-sm font-semibold mb-1'>Time: <span className="text-red-500">*</span></label>
          <input 
            type='time' 
            name="time"
            value={formData.time}
            onChange={handleInputChange}
            className='w-full p-2 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary_color' 
            required
            disabled={loading}
          />
        </div>
        <div>
          <label className='block text-primary_color text-sm font-semibold mb-1'>Name: <span className="text-red-500">*</span></label>
          <input 
            type='text' 
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder='Enter your full name' 
            className='w-full p-2 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary_color' 
            required
            disabled={loading}
          />
        </div>
        <div>
          <label className='block text-primary_color text-sm font-semibold mb-1'>Email: <span className="text-red-500">*</span></label>
          <input 
            type='email' 
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder='your@email.com' 
            className='w-full p-2 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary_color' 
            required
            disabled={loading}
          />
        </div>
        <div>
          <label className='block text-primary_color text-sm font-semibold mb-1'>Phone:</label>
          <input 
            type='tel' 
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            placeholder='+1234567890' 
            className='w-full p-2 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary_color' 
            disabled={loading}
          />
        </div>
        <div>
          <label className='block text-primary_color text-sm font-semibold mb-1'>Message:</label>
          <textarea 
            name="message"
            value={formData.message}
            onChange={handleInputChange}
            placeholder='Any special requirements or questions...' 
            rows={3} 
            className='w-full p-2 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary_color resize-none' 
            disabled={loading}
          />
        </div>
        
        <button 
          type='submit' 
          className='w-full mt-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center'
          disabled={loading}
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Scheduling...
            </>
          ) : (
            'Book Meeting'
          )}
        </button>
        
        {/* Authentication Message */}
        {showAuthMessage && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">
                  <strong>Authentication Required:</strong> Only registered property seekers can book appointments. Redirecting to signup page...
                </p>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}

export default ScheduleATour
