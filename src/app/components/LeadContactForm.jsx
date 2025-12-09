"use client"
import React, { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
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
      email: developer?.email || profile?.email
    }
  }
  const contactInfo = getContactInfo()

  // Handlers
  const handleAppointmentInputChange = (e) => setAppointmentData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  const handleMessageInputChange = (e) => setMessageData({ message: e.target.value })
  
  const handlePhoneClick = async () => {
    if (contactInfo.phone) {
      // Track phone interaction with context
      await analytics.trackPhoneInteraction('click', {
        contextType: contextType,
        listingId: contextType === 'listing' ? (propertyId || listing?.id) : null,
        developmentId: contextType === 'development' ? (developmentId || development?.id) : null,
        profileId: contextType === 'profile' ? (profileId || profile?.id || developer?.developer_id) : null,
        developerId: developer?.developer_id,
        phoneNumber: contactInfo.phone
      })
      navigator.clipboard.writeText(contactInfo.phone)
      toast.success("Copied!")
    }
  }
  
  const handleWhatsAppClick = async () => {
    if (contactInfo.whatsapp) {
      // Track message click with context
      await analytics.trackMessageClick({
        contextType: contextType,
        listingId: contextType === 'listing' ? (propertyId || listing?.id) : null,
        developmentId: contextType === 'development' ? (developmentId || development?.id) : null,
        profileId: contextType === 'profile' ? (profileId || profile?.id || developer?.developer_id) : null,
        developerId: developer?.developer_id,
        messageType: 'whatsapp'
      })
      window.open(`https://wa.me/${contactInfo.whatsapp}`, '_blank')
    }
  }
  
  const handleEmailClick = () => {
    if (contactInfo.email) {
      window.location.href = `mailto:${contactInfo.email}`
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
    <div className="w-full max-w-md mx-auto bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">
      
      {/* --- HEADER SECTION --- */}
      <div className="p-6 bg-white flex-shrink-0">
        {/* Profile Card */}
        <div className="flex items-start gap-4 mb-6">
          {/* Profile Image */}
          <div className="relative flex-shrink-0">
            {contactInfo.profileImage ? (
              <img 
                src={contactInfo.profileImage} 
                alt={contactInfo.name} 
                className="w-20 h-20 rounded-lg object-cover border-2 border-gray-100" 
              />
            ) : (
              <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center border-2 border-gray-100">
                <span className="text-2xl font-bold text-primary_color">
                  {contactInfo.name?.charAt(0)}
                </span>
              </div>
            )}
            {developer?.verified && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                <FaCheckCircle className="w-3 h-3 text-white" />
              </div>
            )}
          </div>

          {/* Name, Location, Phone */}
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-primary_color mb-1">
              {contactInfo.name}
            </h3>
            <p className="text-sm text-primary_color mb-2 flex items-center gap-1">
              <FaMapMarkerAlt className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{contactInfo.location}</span>
            </p>
            {contactInfo.phone && (
              <p className="text-sm text-primary_color mb-1">
                {contactInfo.phone}
              </p>
            )}
            {contactInfo.whatsapp && (
              <p className="text-sm text-primary_color mb-4">
                {contactInfo.whatsapp}
              </p>
            )}

            {/* Contact Icons */}
            <div className="flex items-center gap-3">
              {contactInfo.whatsapp && (
                <button 
                  onClick={handleWhatsAppClick} 
                  className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 text-primary_color flex items-center justify-center hover:bg-blue-100 transition-colors"
                  title="WhatsApp"
                >
                  <FaWhatsapp className="w-5 h-5" />
                </button>
              )}
              {contactInfo.email && (
                <button 
                  onClick={handleEmailClick} 
                  className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 text-primary_color flex items-center justify-center hover:bg-blue-100 transition-colors"
                  title="Email"
                >
                  <FaEnvelope className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => setActiveTab('appointment')}
            className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all ${
              activeTab === 'appointment' 
                ? 'bg-orange-500 text-white shadow-md' 
                : 'bg-white border border-gray-200 text-primary_color hover:bg-gray-50'
            }`}
          >
            Book a Tour
          </button>
          <button
            onClick={() => setActiveTab('message')}
            className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all ${
              activeTab === 'message' 
                ? 'bg-orange-500 text-white shadow-md' 
                : 'bg-white border border-gray-200 text-primary_color hover:bg-gray-50'
            }`}
          >
            Send a Message
          </button>
        </div>
      </div>

      {/* --- CONTENT SECTION (Scrollable) --- */}
      <div className="flex-1 overflow-y-auto px-6 py-6 min-h-0 max-h-[400px]">
        {activeTab === 'appointment' ? (
          <form onSubmit={handleAppointmentSubmit} className="space-y-5" id="appointment-form">
            <h2 className="text-2xl font-bold text-primary_color mb-6">
              Schedule a tour with us!
            </h2>

            {/* Meeting Type Dropdown */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-primary_color">Meeting Type:</label>
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-primary_color">Date:</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-primary_color/60">
                    <HiOutlineCalendar className="w-5 h-5" />
                  </div>
                  <input
                    type="date"
                    name="date"
                    required
                    value={appointmentData.date}
                    onChange={handleAppointmentInputChange}
                    className="w-full bg-gray-50 text-primary_color text-sm font-medium rounded-lg border border-gray-200 pl-10 pr-3 py-3 focus:ring-2 focus:ring-primary_color/20 focus:border-primary_color focus:bg-white transition-all outline-none"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-primary_color">Time:</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-primary_color/60">
                    <HiOutlineClock className="w-5 h-5" />
                  </div>
                  <input
                    type="time"
                    name="time"
                    required
                    value={appointmentData.time}
                    onChange={handleAppointmentInputChange}
                    className="w-full bg-gray-50 text-primary_color text-sm font-medium rounded-lg border border-gray-200 pl-10 pr-3 py-3 focus:ring-2 focus:ring-primary_color/20 focus:border-primary_color focus:bg-white transition-all outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Inputs */}
            {['name', 'email', 'phone'].map((field) => (
              <div key={field} className="space-y-2">
                <label className="text-sm font-medium text-primary_color capitalize">{field}:</label>
                <input
                  type={field === 'email' ? 'email' : field === 'phone' ? 'tel' : 'text'}
                  name={field}
                  required={field !== 'phone'}
                  value={appointmentData[field]}
                  onChange={handleAppointmentInputChange}
                  placeholder={`Enter your ${field}`}
                  className="w-full bg-gray-50 text-primary_color text-sm font-medium rounded-lg border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-primary_color/20 focus:border-primary_color focus:bg-white transition-all outline-none placeholder-gray-400"
                />
              </div>
            ))}

            <div className="space-y-2">
              <label className="text-sm font-medium text-primary_color">Notes:</label>
              <textarea
                name="message"
                rows={3}
                value={appointmentData.message}
                onChange={handleAppointmentInputChange}
                placeholder="Any specific requests?"
                className="w-full bg-gray-50 text-primary_color text-sm font-medium rounded-lg border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-primary_color/20 focus:border-primary_color focus:bg-white transition-all outline-none resize-none placeholder-gray-400"
              />
            </div>
          </form>
        ) : (
          <form onSubmit={handleMessageSubmit} className="space-y-5" id="message-form">
            <h2 className="text-2xl font-bold text-primary_color mb-6">
              Send us a message
            </h2>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-primary_color">Your Message:</label>
              <textarea
                name="message"
                rows={8}
                required
                value={messageData.message}
                onChange={handleMessageInputChange}
                placeholder="Hi, I am interested..."
                className="w-full bg-gray-50 text-primary_color text-sm font-medium rounded-lg border border-gray-200 px-4 py-4 focus:ring-2 focus:ring-primary_color/20 focus:border-primary_color focus:bg-white transition-all outline-none resize-none placeholder-gray-400 leading-relaxed"
              />
            </div>
          </form>
        )}
      </div>

      {/* --- STICKY FOOTER BUTTON --- */}
      <div className="sticky bottom-0 left-0 right-0 p-6 bg-white border-t border-gray-100 flex-shrink-0">
        <button
          type="submit"
          onClick={activeTab === 'appointment' ? handleAppointmentSubmit : handleMessageSubmit}
          disabled={loading || sendingMessage}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-500/20 transform active:scale-[0.98] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading || sendingMessage ? (
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
          ) : (
            <>
              {activeTab === 'appointment' ? 'Book Meetings' : 'Send Message'}
            </>
          )}
        </button>
      </div>
    </div>
  )
}

export default LeadContactForm
