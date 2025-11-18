"use client"
import React, { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useAnalytics } from '@/hooks/useAnalytics'
import { FaCalendar, FaComment, FaMapMarkerAlt, FaPhone, FaEnvelope } from 'react-icons/fa'
import { FaWhatsapp } from 'react-icons/fa6'

const PropertyContactForm = ({ propertyId, propertyTitle, propertyType, developer, listing }) => {
  const { user, propertySeekerToken } = useAuth()
  const router = useRouter()
  const analytics = useAnalytics()
  const [activeTab, setActiveTab] = useState('appointment') // 'appointment' or 'message'
  const [mode, setMode] = useState('in-person') // 'in-person' or 'video'
  const [loading, setLoading] = useState(false)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [showAuthMessage, setShowAuthMessage] = useState(false)
  
  // Appointment form data
  const [appointmentData, setAppointmentData] = useState({
    date: '',
    time: '',
    name: '',
    email: '',
    phone: '',
    message: ''
  })
  
  // Message form data
  const [messageData, setMessageData] = useState({
    message: ''
  })

  // Pre-fill form with property seeker data if logged in
  useEffect(() => {
    if (user && user.user_type === 'property_seeker' && user.profile) {
      setAppointmentData(prev => ({
        ...prev,
        name: user.profile.name || '',
        email: user.email || '',
        phone: user.profile.phone || ''
      }))
    }
  }, [user])

  // CRITICAL: Use listing.account_type and listing.user_id directly if listing is provided
  const getAccountType = () => {
    if (listing?.account_type) {
      return listing.account_type
    }
    return propertyType === 'unit' || propertyType === 'developer' ? 'developer' : 'agent'
  }

  const getAccountId = () => {
    if (listing?.user_id) {
      return listing.user_id
    }
    if (propertyType === 'unit' || propertyType === 'developer') {
      return developer?.developer_id || 'unknown'
    }
    return developer?.developer_id || 'unknown'
  }

  // Get developer/agent contact info
  const getContactInfo = () => {
    const accountId = getAccountId()
    const accountType = getAccountType()
    
    // Get name
    const name = developer?.name || listing?.title || 'Property Owner'
    
    // Get profile image
    const profileImage = developer?.profile_image?.url || null
    
    // Get location - format: town, city, country or city, country
    const location = developer?.town && developer?.city && developer?.country
      ? `${developer.town}, ${developer.city}, ${developer.country}`
      : developer?.city && developer?.country 
      ? `${developer.city}, ${developer.country}`
      : developer?.address 
      ? developer.address
      : listing?.town && listing?.city && listing?.country
      ? `${listing.town}, ${listing.city}, ${listing.country}`
      : listing?.city && listing?.country
      ? `${listing.city}, ${listing.country}`
      : listing?.full_address || 'Location not specified'
    
    // Get phone
    const phone = developer?.phone || listing?.phone || null
    
    // Get WhatsApp (from listing or developer)
    const whatsapp = listing?.whatsapp || developer?.whatsapp || null
    
    // Get email
    const email = developer?.email || null
    
    return {
      name,
      profileImage,
      location,
      phone,
      whatsapp,
      email
    }
  }

  const contactInfo = getContactInfo()

  // Handle WhatsApp click
  const handleWhatsAppClick = () => {
    if (!contactInfo.whatsapp) return
    
    // Track WhatsApp message lead
    analytics.trackMessageClick({
      contextType: 'listing',
      listingId: propertyId,
      listing: listing,
      lister_id: getAccountId(),
      lister_type: getAccountType(),
      messageType: 'whatsapp'
    })
    
    const message = `Hi! I'm interested in ${propertyTitle}`
    const whatsappUrl = `https://wa.me/${contactInfo.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  // Handle Email click
  const handleEmailClick = () => {
    if (!contactInfo.email) return
    
    // Track email lead
    analytics.trackMessageClick({
      contextType: 'listing',
      listingId: propertyId,
      listing: listing,
      lister_id: getAccountId(),
      lister_type: getAccountType(),
      messageType: 'email'
    })
    
    const subject = encodeURIComponent(`Inquiry about ${propertyTitle}`)
    const body = encodeURIComponent(`Hi,\n\nI'm interested in learning more about ${propertyTitle}.\n\nPlease contact me at your earliest convenience.\n\nThank you!`)
    window.location.href = `mailto:${contactInfo.email}?subject=${subject}&body=${body}`
  }

  // Handle Phone click
  const handlePhoneClick = async () => {
    if (!contactInfo.phone) return
    
    try {
      await navigator.clipboard.writeText(contactInfo.phone)
      
      // Track phone lead
      analytics.trackPhoneInteraction('click', {
        contextType: 'listing',
        listingId: propertyId,
        listing: listing,
        lister_id: getAccountId(),
        lister_type: getAccountType(),
        phoneNumber: contactInfo.phone
      })
      
      toast.success('Phone number copied!')
    } catch (error) {
      console.error('Failed to copy phone number:', error)
      toast.error('Failed to copy phone number')
    }
  }

  const handleAppointmentInputChange = (e) => {
    const { name, value } = e.target
    setAppointmentData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleMessageInputChange = (e) => {
    setMessageData({
      message: e.target.value
    })
  }

  const handleAppointmentSubmit = async (e) => {
    e.preventDefault()
    
    // Check if user is logged in as property seeker
    if (!user || !propertySeekerToken || user.user_type !== 'property_seeker') {
      toast.error('Only registered property seekers can book appointments. Please sign up first.')
      setShowAuthMessage(true)
      setTimeout(() => {
        setShowAuthMessage(false)
        router.push('/signup')
      }, 3000)
      return
    }
    
    // Validate form
    if (!appointmentData.date || !appointmentData.time || !appointmentData.name || !appointmentData.email) {
      toast.error('Please fill in all required fields')
      return
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(appointmentData.email)) {
      toast.error('Please enter a valid email address')
      return
    }

    setLoading(true)

    try {
      const appointmentPayload = {
        account_type: getAccountType(),
        account_id: getAccountId(),
        listing_id: propertyId,
        seeker_id: user.id,
        appointment_date: new Date(`${appointmentData.date}T${appointmentData.time}`).toISOString(),
        appointment_time: appointmentData.time,
        duration: 60,
        appointment_type: mode === 'video' ? 'virtual' : 'in-person',
        meeting_location: mode === 'video' ? 'Virtual Meeting' : 'Property Location',
        client_name: appointmentData.name,
        client_email: appointmentData.email,
        client_phone: appointmentData.phone,
        notes: appointmentData.message
      }

      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${propertySeekerToken}`
        },
        body: JSON.stringify(appointmentPayload)
      })

      const result = await response.json()

      if (result.success) {
        // Track appointment booking event
        if (propertyType === 'development') {
          analytics.trackDevelopmentLead(propertyId, 'appointment', {
            lister_id: getAccountId(),
            lister_type: getAccountType(),
            appointmentType: mode === 'video' ? 'virtual' : 'in-person'
          })
        } else {
          analytics.trackAppointmentClick({
            contextType: propertyType === 'listing' || propertyType === 'unit' ? 'listing' : 'profile',
            listingId: propertyType === 'listing' || propertyType === 'unit' ? propertyId : undefined,
            listing: listing,
            profileId: propertyType === 'developer' ? propertyId : undefined,
            lister_id: getAccountId(),
            lister_type: getAccountType(),
            appointmentType: mode === 'video' ? 'virtual' : 'in-person'
          })
        }
        
        toast.success('Appointment scheduled successfully! We\'ll contact you soon.')
        
        // Reset form
        setAppointmentData({
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

  const handleMessageSubmit = async (e) => {
    e.preventDefault()
    
    // Check if user is logged in as property seeker
    if (!user || !propertySeekerToken || user.user_type !== 'property_seeker') {
      toast.error('Please sign up to send a message.')
      setTimeout(() => {
        router.push('/signup')
      }, 2000)
      return
    }

    if (!messageData.message.trim()) {
      toast.error('Please enter a message')
      return
    }

    setSendingMessage(true)

    try {
      // Track message click
      const listerId = listing?.user_id || developer?.developer_id || null
      const listerType = listing?.account_type || (developer?.developer_id ? 'developer' : null)
      
      analytics.trackMessageClick({
        contextType: 'listing',
        listingId: propertyId,
        listing: listing,
        lister_id: listerId,
        lister_type: listerType,
        messageType: 'direct_message'
      })

      // Create or find conversation
      const conversationResponse = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${propertySeekerToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          otherUserId: getAccountId(),
          otherUserType: getAccountType(),
          listingId: propertyId,
          conversationType: 'listing_inquiry',
          subject: `Inquiry about ${propertyTitle}`,
          firstMessage: messageData.message.trim()
        })
      })

      if (conversationResponse.ok) {
        const convResult = await conversationResponse.json()
        toast.success('Message sent successfully!')
        
        // Reset message
        setMessageData({ message: '' })
        
        // Redirect to messages page
        setTimeout(() => {
          router.push(`/propertySeeker/${user.id}/messages`)
        }, 1500)
      } else {
        const errorData = await conversationResponse.json()
        toast.error(errorData.error || 'Failed to send message')
      }

    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Something went wrong. Please try again.')
    } finally {
      setSendingMessage(false)
    }
  }

  return (
    <div className='w-full h-auto bg-white rounded-xl shadow p-6 max-w-md mx-auto'>
      {/* Developer/Agent Profile Section */}
      {(developer || listing) && (
        <div className='mb-6 pb-6 border-b border-gray-200'>
          <div className='flex items-start gap-4'>
            {/* Profile Image */}
            <div className='flex-shrink-0'>
              {contactInfo.profileImage ? (
                <img
                  src={contactInfo.profileImage}
                  alt={contactInfo.name}
                  className='w-16 h-16 rounded-lg object-cover'
                />
              ) : (
                <div className='w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center'>
                  <span className='text-white font-bold text-xl'>
                    {contactInfo.name?.charAt(0) || 'P'}
                  </span>
                </div>
              )}
            </div>
            
            {/* Contact Info */}
            <div className='flex-1 min-w-0'>
              <h3 className='text-lg font-bold text-gray-900 mb-1 truncate'>
                {contactInfo.name}
              </h3>
              <div className='flex items-center text-sm text-gray-600 mb-2'>
                <FaMapMarkerAlt className='w-4 h-4 mr-1 flex-shrink-0' />
                <span className='truncate'>{contactInfo.location}</span>
              </div>
              {contactInfo.phone && (
                <div className='flex items-center text-sm text-gray-600 mb-2'>
                  <FaPhone className='w-4 h-4 mr-1 flex-shrink-0' />
                  <button
                    onClick={handlePhoneClick}
                    className='hover:text-blue-600 transition-colors cursor-pointer truncate'
                    title='Click to copy phone number'
                  >
                    {contactInfo.phone}
                  </button>
                </div>
              )}
              
              {/* WhatsApp and Email Icons */}
              <div className='flex items-center gap-2 mt-3'>
                {contactInfo.whatsapp && (
                  <button
                    onClick={handleWhatsAppClick}
                    className='w-10 h-10 bg-green-500 hover:bg-green-600 rounded-lg flex items-center justify-center text-white transition-colors'
                    title='Contact via WhatsApp'
                  >
                    <FaWhatsapp className='w-5 h-5' />
                  </button>
                )}
                {contactInfo.email && (
                  <button
                    onClick={handleEmailClick}
                    className='w-10 h-10 bg-gray-600 hover:bg-gray-700 rounded-lg flex items-center justify-center text-white transition-colors'
                    title='Send email'
                  >
                    <FaEnvelope className='w-5 h-5' />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Buttons */}
      <div className='flex gap-2 mb-6'>
        <button
          type='button'
          onClick={() => setActiveTab('appointment')}
          className={`flex-1 px-4 py-3 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2 ${
            activeTab === 'appointment' 
              ? 'bg-orange-500 text-white' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <FaCalendar className="w-4 h-4" />
          Book a tour
        </button>
        <button
          type='button'
          onClick={() => setActiveTab('message')}
          className={`flex-1 px-4 py-3 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2 ${
            activeTab === 'message' 
              ? 'bg-orange-500 text-white' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <FaComment className="w-4 h-4" />
          Send a message
        </button>
      </div>

      {/* Appointment Tab */}
      {activeTab === 'appointment' && (
        <>
          <h2 className='text-2xl font-bold text-primary_color mb-1'>Schedule a tour</h2>
          <p className='text-gray-500 mb-4'>Choose your preferred day</p>
          
          {/* Toggle */}
          <div className='flex gap-2 mb-4'>
            <button
              type='button'
              className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${
                mode === 'in-person' 
                  ? 'bg-orange-500 text-white' 
                  : 'bg-gray-100 text-gray-500'
              }`}
              onClick={() => setMode('in-person')}
              disabled={loading}
            >
              In Person
            </button>
            <button
              type='button'
              className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${
                mode === 'video' 
                  ? 'bg-orange-500 text-white' 
                  : 'bg-gray-100 text-gray-500'
              }`}
              onClick={() => setMode('video')}
              disabled={loading}
            >
              Video Chat
            </button>
          </div>

          <form onSubmit={handleAppointmentSubmit} className='flex flex-col gap-3'>
            <div>
              <label className='block text-primary_color text-sm font-semibold mb-1'>
                Date: <span className="text-red-500">*</span>
              </label>
              <input 
                type='date' 
                name="date"
                value={appointmentData.date}
                onChange={handleAppointmentInputChange}
                className='w-full p-2 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary_color' 
                required
                disabled={loading}
              />
            </div>
            <div>
              <label className='block text-primary_color text-sm font-semibold mb-1'>
                Time: <span className="text-red-500">*</span>
              </label>
              <input 
                type='time' 
                name="time"
                value={appointmentData.time}
                onChange={handleAppointmentInputChange}
                className='w-full p-2 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary_color' 
                required
                disabled={loading}
              />
            </div>
            <div>
              <label className='block text-primary_color text-sm font-semibold mb-1'>
                Name: <span className="text-red-500">*</span>
              </label>
              <input 
                type='text' 
                name="name"
                value={appointmentData.name}
                onChange={handleAppointmentInputChange}
                placeholder='Enter your full name' 
                className='w-full p-2 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary_color' 
                required
                disabled={loading}
              />
            </div>
            <div>
              <label className='block text-primary_color text-sm font-semibold mb-1'>
                Email: <span className="text-red-500">*</span>
              </label>
              <input 
                type='email' 
                name="email"
                value={appointmentData.email}
                onChange={handleAppointmentInputChange}
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
                value={appointmentData.phone}
                onChange={handleAppointmentInputChange}
                placeholder='+1234567890' 
                className='w-full p-2 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary_color' 
                disabled={loading}
              />
            </div>
            <div>
              <label className='block text-primary_color text-sm font-semibold mb-1'>Message:</label>
              <textarea 
                name="message"
                value={appointmentData.message}
                onChange={handleAppointmentInputChange}
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
        </>
      )}

      {/* Message Tab */}
      {activeTab === 'message' && (
        <>
          <h2 className='text-2xl font-bold text-primary_color mb-1'>Send a message</h2>
          <p className='text-gray-500 mb-4'>Get in touch with the property owner</p>

          <form onSubmit={handleMessageSubmit} className='flex flex-col gap-3'>
            <div>
              <label className='block text-primary_color text-sm font-semibold mb-1'>
                Message: <span className="text-red-500">*</span>
              </label>
              <textarea 
                name="message"
                value={messageData.message}
                onChange={handleMessageInputChange}
                placeholder='Type your message here...' 
                rows={6} 
                className='w-full p-3 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary_color resize-none' 
                required
                disabled={sendingMessage}
              />
            </div>
            
            <button 
              type='submit' 
              className='w-full mt-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center'
              disabled={sendingMessage}
            >
              {sendingMessage ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </>
              ) : (
                <>
                  <FaComment className="w-4 h-4 mr-2" />
                  Send Message
                </>
              )}
            </button>
          </form>
        </>
      )}
    </div>
  )
}

export default PropertyContactForm

