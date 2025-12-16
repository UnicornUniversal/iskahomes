"use client"
import React, { useState, useEffect } from 'react'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAnalytics } from '@/hooks/useAnalytics'
import { FaMapMarkerAlt, FaPhone, FaEnvelope, FaCheckCircle, FaVideo, FaUserFriends } from 'react-icons/fa'
import { FaWhatsapp } from 'react-icons/fa6'
import { HiOutlineCalendar, HiOutlineClock } from 'react-icons/hi'
import CustomDropdown from '@/app/components/propertyManagement/modules/CustomDropdown'

/**
 * LeadContactForm - Universal contact form for leads
 * Can be used for listings, developments, or profiles
 * 
 * @param {string} contextType - 'listing', 'development', or 'profile' (auto-detected if not provided)
 * @param {string} propertyId - Listing ID (for listing context)
 * @param {string} developmentId - Development ID (for development context)
 * @param {string} profileId - Profile ID (for profile context)
 * @param {string} propertyTitle - Title of the property/listing
 * @param {string} propertyType - Type of property
 * @param {object} developer - Developer object
 * @param {object} listing - Listing object
 * @param {object} development - Development object
 * @param {object} profile - Profile object (developer/agent/agency)
 */
const LeadContactForm = ({ 
  contextType: providedContextType,
  propertyId, 
  developmentId,
  profileId,
  propertyTitle, 
  propertyType, 
  developer, 
  listing,
  development,
  profile
}) => {
  const { user, propertySeekerToken } = useAuth()
  const router = useRouter()
  const analytics = useAnalytics()
  const [activeTab, setActiveTab] = useState('appointment')
  const [mode, setMode] = useState('in-person')
  const [loading, setLoading] = useState(false)
  const [sendingMessage, setSendingMessage] = useState(false)
  
  // Auto-detect contextType if not provided
  const contextType = providedContextType || (
    listing || propertyId ? 'listing' :
    development || developmentId ? 'development' :
    profile || profileId ? 'profile' :
    'listing' // default fallback
  )
  
  // State initialization
  const [appointmentData, setAppointmentData] = useState({
    date: '', time: '', name: '', email: '', phone: '', message: ''
  })
  const [messageData, setMessageData] = useState({ message: '' })

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

  // Helper functions
  const getAccountType = () => {
    if (listing) return listing.account_type || (propertyType === 'unit' || propertyType === 'developer' ? 'developer' : 'agent')
    if (development) return 'developer'
    if (profile) return profile.account_type || 'developer'
    return 'developer'
  }
  
  const getAccountId = () => {
    if (listing) return listing.user_id || developer?.developer_id || 'unknown'
    if (development) return development.developer_id || developer?.developer_id || 'unknown'
    if (profile) return profile.developer_id || profile.agent_id || profile.agency_id || 'unknown'
    return developer?.developer_id || 'unknown'
  }
  
  const getContactInfo = () => {
    const name = developer?.name || profile?.name || listing?.title || 'Property Owner'
    const profileImage = developer?.profile_image?.url || profile?.profile_image?.url || null
    const location = developer?.town && developer?.city ? `${developer.town}, ${developer.city}` : 
                     developer?.address || listing?.full_address || development?.location || 'Location n/a'
    
    // Determine account type
    const accountType = getAccountType()
    const accountTypeLabel = accountType === 'developer' ? 'Developer' : 
                            accountType === 'agent' ? 'Agent' : 
                            accountType === 'agency' ? 'Agency' : ''
    
    // Get developer slug for profile link
    const developerSlug = developer?.slug || profile?.slug || null
    
    // Get WhatsApp from social_media if available
    let whatsappNumber = listing?.whatsapp || developer?.whatsapp || profile?.whatsapp
    if (!whatsappNumber && developer?.social_media) {
      try {
        const socialMedia = typeof developer.social_media === 'string' 
          ? JSON.parse(developer.social_media) 
          : developer.social_media
        whatsappNumber = socialMedia?.whatsapp || null
      } catch (e) {
        // If parsing fails, ignore
      }
    }
    
    return { 
      name, 
      profileImage, 
      location, 
      phone: developer?.phone || listing?.phone || profile?.phone, 
      whatsapp: whatsappNumber, 
      email: developer?.email || profile?.email,
      accountType: accountTypeLabel,
      developerSlug
    }
  }
  const contactInfo = getContactInfo()

  // Handlers
  const handleAppointmentInputChange = (e) => setAppointmentData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  const handleMessageInputChange = (e) => setMessageData({ message: e.target.value })
  
  const handlePhoneClick = async (e) => {
    e?.preventDefault?.()
    e?.stopPropagation?.()
    
    if (!contactInfo.phone) return
    
    try {
      // Copy phone number FIRST
      await navigator.clipboard.writeText(contactInfo.phone)
      
      // Show toast immediately
      toast.success("Phone number copied!", {
        position: "bottom-center",
        autoClose: 3000,
      })
      
      // Track phone interaction (non-blocking)
      analytics.trackPhoneInteraction('click', {
        contextType: contextType,
        listingId: contextType === 'listing' ? (propertyId || listing?.id) : null,
        developmentId: contextType === 'development' ? (developmentId || development?.id) : null,
        profileId: contextType === 'profile' ? (profileId || profile?.id || developer?.developer_id) : null,
        developerId: developer?.developer_id,
        phoneNumber: contactInfo.phone
      }).catch(err => console.error('Analytics error:', err))
    } catch (error) {
      console.error('Failed to copy phone number:', error)
      toast.error("Failed to copy phone number", {
        position: "bottom-center",
        autoClose: 3000,
      })
    }
  }
  
  const handleWhatsAppClick = async (e) => {
    e?.preventDefault?.()
    e?.stopPropagation?.()
    
    if (!contactInfo.whatsapp) return
    
    const whatsappLink = `https://wa.me/${contactInfo.whatsapp}`
    
    try {
      // Copy WhatsApp link FIRST
      await navigator.clipboard.writeText(whatsappLink)
      
      // Show toast immediately
      toast.success("WhatsApp link copied!", {
        position: "bottom-center",
        autoClose: 2000,
      })
      
      // Track message click (non-blocking)
      analytics.trackMessageClick({
        contextType: contextType,
        listingId: contextType === 'listing' ? (propertyId || listing?.id) : null,
        developmentId: contextType === 'development' ? (developmentId || development?.id) : null,
        profileId: contextType === 'profile' ? (profileId || profile?.id || developer?.developer_id) : null,
        developerId: developer?.developer_id,
        messageType: 'whatsapp'
      }).catch(err => console.error('Analytics error:', err))
      
      // Open WhatsApp after toast is visible (delay to show toast first)
      setTimeout(() => {
        window.open(whatsappLink, '_blank')
      }, 500)
    } catch (error) {
      console.error('Failed to copy WhatsApp link:', error)
      toast.error("Failed to copy WhatsApp link", {
        position: "bottom-center",
        autoClose: 3000,
      })
    }
  }
  
  const handleEmailClick = async (e) => {
    e?.preventDefault?.()
    e?.stopPropagation?.()
    
    if (!contactInfo.email) return
    
    try {
      // Copy email FIRST
      await navigator.clipboard.writeText(contactInfo.email)
      
      // Show toast immediately
      toast.success("Email address copied!", {
        position: "bottom-center",
        autoClose: 2000,
      })
      
      // Track email click (non-blocking)
      analytics.trackMessageClick({
        contextType: contextType,
        listingId: contextType === 'listing' ? (propertyId || listing?.id) : null,
        developmentId: contextType === 'development' ? (developmentId || development?.id) : null,
        profileId: contextType === 'profile' ? (profileId || profile?.id || developer?.developer_id) : null,
        developerId: developer?.developer_id,
        messageType: 'email'
      }).catch(err => console.error('Analytics error:', err))
      
      // Open email client after toast is visible (delay to show toast first)
      setTimeout(() => {
        window.location.href = `mailto:${contactInfo.email}`
      }, 500)
    } catch (error) {
      console.error('Failed to copy email:', error)
      toast.error("Failed to copy email address", {
        position: "bottom-center",
        autoClose: 3000,
      })
    }
  }
  
  const handleAppointmentSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      // Track appointment click with context
      await analytics.trackAppointmentClick({
        contextType: contextType,
        listingId: contextType === 'listing' ? (propertyId || listing?.id) : null,
        developmentId: contextType === 'development' ? (developmentId || development?.id) : null,
        profileId: contextType === 'profile' ? (profileId || profile?.id || developer?.developer_id) : null,
        developerId: developer?.developer_id,
        appointmentType: mode === 'video' ? 'virtual' : 'viewing'
      })
      
      // TODO: Implement actual appointment submission logic
      setTimeout(() => {
        setLoading(false)
        toast.success("Appointment request sent!")
      }, 1500)
    } catch (error) {
      console.error('Error submitting appointment:', error)
      setLoading(false)
      toast.error("Failed to send appointment request")
    }
  }
  
  const handleMessageSubmit = async (e) => {
    e.preventDefault()
    setSendingMessage(true)
    
    try {
      // Track message click with context
      await analytics.trackMessageClick({
        contextType: contextType,
        listingId: contextType === 'listing' ? (propertyId || listing?.id) : null,
        developmentId: contextType === 'development' ? (developmentId || development?.id) : null,
        profileId: contextType === 'profile' ? (profileId || profile?.id || developer?.developer_id) : null,
        developerId: developer?.developer_id,
        messageType: 'direct_message'
      })
      
      // TODO: Implement actual message submission logic
      setTimeout(() => {
        setSendingMessage(false)
        toast.success("Message sent!")
      }, 1500)
    } catch (error) {
      console.error('Error sending message:', error)
      setSendingMessage(false)
      toast.error("Failed to send message")
    }
  }

  return (
    <div className="w-full max-w-sm mx-auto bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden flex flex-col" style={{ maxHeight: '600px' }}>
      
      {/* --- HEADER SECTION --- */}
      <div className="p-4 bg-white flex-shrink-0 border-b border-gray-100">
        {/* Profile Header */}
        <div className="flex items-start gap-3 mb-4">
          {/* Profile Image */}
          <div className="relative flex-shrink-0">
            {contactInfo.profileImage ? (
              <img 
                src={contactInfo.profileImage} 
                alt={contactInfo.name} 
                className="w-14 h-14 rounded-xl object-cover border-2 border-gray-100 shadow-sm" 
              />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center border-2 border-gray-100 shadow-sm">
                <span className="text-lg font-bold text-primary_color">
                  {contactInfo.name?.charAt(0)}
                </span>
              </div>
            )}
            {developer?.verified && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center shadow-sm">
                <FaCheckCircle className="w-2.5 h-2.5 text-white" />
              </div>
            )}
          </div>

          {/* Name & Location */}
          <div className="flex-1 min-w-0">
            {contactInfo.developerSlug && getAccountType() === 'developer' ? (
              <Link 
                href={`/allDevelopers/${contactInfo.developerSlug}`}
                className="block text-lg font-bold text-primary_color hover:text-primary_color/80 transition-colors mb-1"
              >
                {contactInfo.name}
              </Link>
            ) : (
              <h3 className="text-lg font-bold text-primary_color mb-1">
                {contactInfo.name}
              </h3>
            )}
            <p className="text-xs text-primary_color/70 flex items-center gap-1.5">
              <FaMapMarkerAlt className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{contactInfo.location}</span>
            </p>
          </div>
        </div>

        {/* Contact Actions - Clean Row */}
        <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-100">
          {contactInfo.phone && (
            <button
              onClick={handlePhoneClick}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-primary_color transition-all group"
            >
              <FaPhone className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">{contactInfo.phone}</span>
            </button>
          )}
          {contactInfo.whatsapp && (
            <button
              onClick={handleWhatsAppClick}
              className="p-2 rounded-lg bg-green-50 hover:bg-green-100 border border-green-200 text-green-600 transition-all"
              title="WhatsApp"
            >
              <FaWhatsapp className="w-4 h-4" />
            </button>
          )}
          {contactInfo.email && (
            <button
              onClick={handleEmailClick}
              className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-600 transition-all"
              title="Email"
            >
              <FaEnvelope className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Tab Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('appointment')}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold text-sm transition-all ${
              activeTab === 'appointment' 
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20' 
                : 'bg-white border-2 border-gray-200 text-primary_color hover:bg-gray-50 hover:border-gray-300'
            }`}
          >
            Book a Tour
          </button>
          <button
            onClick={() => setActiveTab('message')}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold text-sm transition-all ${
              activeTab === 'message' 
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20' 
                : 'bg-white border-2 border-gray-200 text-primary_color hover:bg-gray-50 hover:border-gray-300'
            }`}
          >
            Send a Message
          </button>
        </div>
      </div>

      {/* --- CONTENT SECTION (Scrollable) --- */}
      <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0" style={{ maxHeight: '280px' }}>
        {activeTab === 'appointment' ? (
          <form onSubmit={handleAppointmentSubmit} className="space-y-4" id="appointment-form">
            <h2 className="text-base font-bold text-primary_color mb-1">
              Schedule a tour with us!
            </h2>

            {/* Meeting Type Dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-primary_color">Meeting Type</label>
              <CustomDropdown
                options={[
                  { value: 'in-person', label: 'In Person' },
                  { value: 'video', label: 'Video Chat' }
                ]}
                value={mode}
                onChange={(value) => setMode(value)}
                placeholder="Select meeting type"
              />
            </div>

            {/* Date & Time Row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-primary_color">Date</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-primary_color/50">
                    <HiOutlineCalendar className="w-4 h-4" />
                  </div>
                  <input
                    type="date"
                    name="date"
                    required
                    value={appointmentData.date}
                    onChange={handleAppointmentInputChange}
                    className="w-full bg-gray-50 text-sm text-primary_color font-medium rounded-lg border border-gray-200 pl-10 pr-3 py-2.5 focus:ring-2 focus:ring-primary_color/20 focus:border-primary_color focus:bg-white transition-all outline-none"
                  />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-primary_color">Time</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-primary_color/50">
                    <HiOutlineClock className="w-4 h-4" />
                  </div>
                  <input
                    type="time"
                    name="time"
                    required
                    value={appointmentData.time}
                    onChange={handleAppointmentInputChange}
                    className="w-full bg-gray-50 text-sm text-primary_color font-medium rounded-lg border border-gray-200 pl-10 pr-3 py-2.5 focus:ring-2 focus:ring-primary_color/20 focus:border-primary_color focus:bg-white transition-all outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Inputs */}
            {['name', 'email', 'phone'].map((field) => (
              <div key={field} className="space-y-1.5">
                <label className="text-xs font-semibold text-primary_color capitalize">{field}</label>
                <input
                  type={field === 'email' ? 'email' : field === 'phone' ? 'tel' : 'text'}
                  name={field}
                  required={field !== 'phone'}
                  value={appointmentData[field]}
                  onChange={handleAppointmentInputChange}
                  placeholder={`Enter your ${field}`}
                  className="w-full bg-gray-50 text-sm text-primary_color font-medium rounded-lg border border-gray-200 px-3 py-2.5 focus:ring-2 focus:ring-primary_color/20 focus:border-primary_color focus:bg-white transition-all outline-none placeholder-gray-400"
                />
              </div>
            ))}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-primary_color">Notes</label>
              <textarea
                name="message"
                rows={3}
                value={appointmentData.message}
                onChange={handleAppointmentInputChange}
                placeholder="Any specific requests?"
                className="w-full bg-gray-50 text-sm text-primary_color font-medium rounded-lg border border-gray-200 px-3 py-2.5 focus:ring-2 focus:ring-primary_color/20 focus:border-primary_color focus:bg-white transition-all outline-none resize-none placeholder-gray-400"
              />
            </div>
          </form>
        ) : (
          <form onSubmit={handleMessageSubmit} className="space-y-4" id="message-form">
            <h2 className="text-base font-bold text-primary_color mb-1">
              Send us a message
            </h2>
            
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-primary_color">Your Message</label>
              <textarea
                name="message"
                rows={5}
                required
                value={messageData.message}
                onChange={handleMessageInputChange}
                placeholder="Hi, I am interested..."
                className="w-full bg-gray-50 text-sm text-primary_color font-medium rounded-lg border border-gray-200 px-3 py-2.5 focus:ring-2 focus:ring-primary_color/20 focus:border-primary_color focus:bg-white transition-all outline-none resize-none placeholder-gray-400 leading-relaxed"
              />
            </div>
          </form>
        )}
      </div>

      {/* --- STICKY FOOTER BUTTON --- */}
      <div className="sticky bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 flex-shrink-0">
        <button
          type="submit"
          onClick={activeTab === 'appointment' ? handleAppointmentSubmit : handleMessageSubmit}
          disabled={loading || sendingMessage}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg shadow-md shadow-orange-500/20 transform active:scale-[0.98] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
        >
          {loading || sendingMessage ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
          ) : (
            <>
              {activeTab === 'appointment' ? 'Book Meetings' : 'Send Message'}
            </>
          )}
        </button>
      </div>
      
      {/* Toast Container - Bottom Center */}
      <ToastContainer
        position="bottom-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        style={{ zIndex: 9999 }}
        toastClassName="custom-toast"
      />
    </div>
  )
}

export default LeadContactForm
