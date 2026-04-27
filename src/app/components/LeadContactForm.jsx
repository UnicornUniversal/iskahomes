"use client"
import React, { useState, useEffect, useMemo, useId } from 'react'
import { toast } from 'react-toastify'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAnalytics } from '@/hooks/useAnalytics'
import { FaMapMarkerAlt, FaPhone, FaEnvelope, FaCheckCircle, FaVideo, FaUserFriends } from 'react-icons/fa'
import { FaWhatsapp } from 'react-icons/fa6'
import { HiOutlineCalendar, HiOutlineClock } from 'react-icons/hi'
import CustomDropdown from '@/app/components/propertyManagement/modules/CustomDropdown'
import { resolveLeadAttributionFromSearchString } from '@/lib/leadAttributionResolve'

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
 * @param {object} developer - Developer object (for developer listings)
 * @param {object} agent - Agent object (for agent listings)
 * @param {object} agency - Agency object (for agency listings or agent's parent)
 * @param {object} listing - Listing object
 * @param {object} development - Development object
 * @param {object} profile - Profile object (developer/agent/agency - for profile context)
 */
const LeadContactForm = ({ 
  contextType: providedContextType,
  propertyId, 
  developmentId,
  profileId,
  propertyTitle, 
  propertyType, 
  developer, 
  agent,
  agency,
  listing,
  development,
  profile
}) => {
  const { user, propertySeekerToken, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const analytics = useAnalytics()
  const urlLeadAttribution = useMemo(() => {
    const qs = searchParams?.toString?.() ?? ''
    return resolveLeadAttributionFromSearchString(qs ? `?${qs}` : '')
  }, [searchParams])
  // Unique per instance: property page mounts 2+ LeadContactForms; duplicate id="appointment-form" breaks form= submit
  const formUid = useId().replace(/:/g, '')
  const appointmentFormId = `lead-appointment-${formUid}`
  const messageFormId = `lead-message-${formUid}`

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

  const FIELD_REQUIRED_MSG = 'Field Required!'
  const [appointmentFieldErrors, setAppointmentFieldErrors] = useState({
    date: '',
    time: '',
    name: '',
    email: '',
    emailInvalid: '',
  })

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
    if (profile) return profile.account_type || (profile.agent_id ? 'agent' : profile.agency_id ? 'agency' : 'developer')
    if (agent) return 'agent'
    if (agency) return 'agency'
    return 'developer'
  }
  
  const getAccountId = () => {
    if (listing) return listing.user_id || developer?.developer_id || agent?.agent_id || agency?.agency_id || 'unknown'
    if (development) return development.developer_id || developer?.developer_id || 'unknown'
    if (profile) return profile.developer_id || profile.agent_id || profile.agency_id || 'unknown'
    return developer?.developer_id || agent?.agent_id || agency?.agency_id || 'unknown'
  }

  // Resolve owner: developer, agent, or agency (for listing context use listing.account_type)
  const getOwner = () => {
    if (profile) return profile
    const acct = getAccountType()
    if (acct === 'agent') return agent || agency || null
    if (acct === 'agency') return agency || agent || null
    return developer || null
  }

  // Parse image field (can be JSON string with .url)
  const parseImageUrl = (img) => {
    if (!img) return null
    if (typeof img === 'string') {
      try {
        const parsed = JSON.parse(img)
        return parsed?.url || null
      } catch { return null }
    }
    return img?.url || null
  }

  // Get WhatsApp from social_media (string or object)
  const getWhatsAppFromSocial = (social) => {
    if (!social) return null
    try {
      const sm = typeof social === 'string' ? JSON.parse(social) : social
      return sm?.whatsapp || null
    } catch { return null }
  }
  
  const getContactInfo = () => {
    const owner = getOwner()
    const name = owner?.name || developer?.name || agent?.name || agency?.name || profile?.name || listing?.title || 'Property Owner'
    
    // Profile image: parse JSON if string (developer, agent, agency all can have this)
    const profileImage = parseImageUrl(owner?.profile_image || developer?.profile_image || agent?.profile_image || agency?.profile_image || profile?.profile_image)
    
    let location = (owner?.town && owner?.city) ? `${owner.town}, ${owner.city}` : 
                   owner?.address || (owner?.city && owner?.country ? `${owner.city}, ${owner.country}` : null) ||
                   developer?.address || listing?.full_address || development?.location || null
    if (!location && agency && (agency?.city || agency?.address || agency?.country)) {
      location = [agency.city, agency.country].filter(Boolean).join(', ') || agency.address
    }
    if (!location) location = 'Location n/a'
    
    const accountType = getAccountType()
    const accountTypeLabel = accountType === 'developer' ? 'Developer' : 
                            accountType === 'agent' ? 'Agent' : 
                            accountType === 'agency' ? 'Agency' : ''
    
    // Profile link: slug + base path
    const slug = owner?.slug || developer?.slug || agent?.slug || agency?.slug || profile?.slug
    const profileHref = accountType === 'developer' ? `/home/allDevelopers/${slug}` :
                       accountType === 'agent' ? `/home/allAgents/${slug}` :
                       accountType === 'agency' ? `/home/allAgencies/${slug}` : null
    
    let whatsappNumber = listing?.whatsapp || getWhatsAppFromSocial(owner?.social_media) || getWhatsAppFromSocial(developer?.social_media) || getWhatsAppFromSocial(agent?.social_media) || getWhatsAppFromSocial(agency?.social_media) || profile?.whatsapp
    
    const phone = owner?.phone || developer?.phone || agent?.phone || agency?.phone || listing?.phone || profile?.phone
    const email = owner?.email || developer?.email || agent?.email || agency?.email || profile?.email
    
    const verified = owner?.verified ?? developer?.verified ?? false
    
    return { 
      name, 
      profileImage, 
      location, 
      phone, 
      whatsapp: whatsappNumber, 
      email,
      accountType: accountTypeLabel,
      profileHref,
      slug,
      verified
    }
  }
  const contactInfo = getContactInfo()

  // Distinct lead rule mapping used across lead actions.
  // This does not calculate totals on frontend; it labels each action so backend can aggregate correctly:
  // - developer: profile | listings | development
  // - agent: profile | listings
  // - agency rollup: profile | listings | agents
  const getDistinctLeadRuleContext = () => {
    const ownerType = getAccountType() // developer | agent | agency
    const ownerId = getAccountId()

    const resolvedAgencyId =
      agency?.agency_id ||
      agency?.id ||
      agent?.agency_id ||
      profile?.agency_id ||
      listing?.agency_id ||
      null

    let ownerBucket = 'listings'
    if (ownerType === 'developer') {
      if (contextType === 'profile') ownerBucket = 'profile'
      else if (contextType === 'development') ownerBucket = 'development'
      else ownerBucket = 'listings'
    } else if (ownerType === 'agent') {
      ownerBucket = contextType === 'profile' ? 'profile' : 'listings'
    } else if (ownerType === 'agency') {
      ownerBucket = contextType === 'profile' ? 'profile' : 'listings'
    }

    let agencyBucket = null
    if (ownerType === 'agency') {
      agencyBucket = contextType === 'profile' ? 'profile' : 'listings'
    } else if (ownerType === 'agent' && resolvedAgencyId) {
      agencyBucket = contextType === 'profile' ? 'agents' : 'listings'
    }

    return {
      distinct_owner_type: ownerType,
      distinct_owner_id: ownerId,
      distinct_owner_bucket: ownerBucket,
      distinct_parent_agency_id: resolvedAgencyId,
      distinct_agency_bucket: agencyBucket
    }
  }

  // Build analytics context so lister_id/lister_type are correct for agents, agencies, developers
  const getAnalyticsContext = (extra = {}) => ({
    ...getDistinctLeadRuleContext(),
    contextType: contextType,
    context_type: contextType,
    listingId: contextType === 'listing' ? (propertyId || listing?.id) : null,
    listing_id: contextType === 'listing' ? (propertyId || listing?.id) : null,
    developmentId: contextType === 'development' ? (developmentId || development?.id) : null,
    development_id: contextType === 'development' ? (developmentId || development?.id) : null,
    profileId: contextType === 'profile' ? (profileId || profile?.id || developer?.developer_id) : null,
    profile_id: contextType === 'profile' ? (profileId || profile?.id || developer?.developer_id) : null,
    // CRITICAL: Pass listing so useAnalytics getListerContext extracts user_id + account_type for agents
    ...(listing && { listing }),
    // For profile context: pass lister_id/lister_type so agent/agency leads are attributed correctly
    ...(profile && {
      lister_id: getAccountId(),
      lister_type: getAccountType(),
      agent_id: profile.agent_id,
      agency_id: profile.agency_id
    }),
    developerId: developer?.developer_id,
    ...extra,
    // Lead attribution after ...extra so undefined keys do not wipe URL-resolved values
    lead_source: extra.lead_source ?? urlLeadAttribution.lead_source,
    lead_source_context: extra.lead_source_context ?? urlLeadAttribution.lead_source_context,
  })

  // Handlers
  const handleAppointmentInputChange = (e) => {
    const fieldName = e.target.name
    setAppointmentData(prev => ({ ...prev, [fieldName]: e.target.value }))
    setAppointmentFieldErrors(prev => {
      const next = { ...prev }
      if (fieldName === 'date') next.date = ''
      if (fieldName === 'time') next.time = ''
      if (fieldName === 'name') next.name = ''
      if (fieldName === 'email') {
        next.email = ''
        next.emailInvalid = ''
      }
      return next
    })
  }
  const handleMessageInputChange = (e) => setMessageData({ message: e.target.value })
  
  const handlePhoneClick = async (e) => {
    e?.preventDefault?.()
    e?.stopPropagation?.()
    
    if (!contactInfo.phone) return
    
    try {
      await navigator.clipboard.writeText(contactInfo.phone)
      toast.success("Phone number copied!", { autoClose: 3000 })
      analytics.trackPhoneInteraction('click', getAnalyticsContext({ phoneNumber: contactInfo.phone })).catch(() => {})
    } catch (error) {
      toast.error("Failed to copy phone number", { autoClose: 3000 })
    }
  }
  
  const handleWhatsAppClick = async (e) => {
    e?.preventDefault?.()
    e?.stopPropagation?.()
    
    if (!contactInfo.whatsapp) return
    
    const whatsappLink = `https://wa.me/${contactInfo.whatsapp}`
    
    try {
      await navigator.clipboard.writeText(whatsappLink)
      toast.success("WhatsApp link copied!", { autoClose: 2000 })
      analytics.trackMessageClick(getAnalyticsContext({ messageType: 'whatsapp' })).catch(() => {})
      setTimeout(() => window.open(whatsappLink, '_blank'), 300)
    } catch (error) {
      toast.error("Failed to copy WhatsApp link", { autoClose: 3000 })
    }
  }
  
  const handleEmailClick = async (e) => {
    e?.preventDefault?.()
    e?.stopPropagation?.()
    
    if (!contactInfo.email) return
    
    try {
      await navigator.clipboard.writeText(contactInfo.email)
      
      // Show toast immediately
      toast.success("Email address copied!", { autoClose: 2000 })
      
      // Track email click (non-blocking)
      analytics.trackMessageClick(getAnalyticsContext({ messageType: 'email' })).catch(() => {})
      
      setTimeout(() => { window.location.href = `mailto:${contactInfo.email}` }, 300)
    } catch (error) {
      toast.error("Failed to copy email address", { autoClose: 3000 })
    }
  }
  
  const handleAppointmentSubmit = async (e) => {
    e.preventDefault()
    
    // Check if user is logged in
    if (!user) {
      toast.error("Please log in to book an appointment")
      router.push('/login?redirect=' + encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname : '/'))
      return
    }
    
    // Check if user is a property seeker
    if (user.user_type !== 'property_seeker') {
      toast.error("Only property seekers can book appointments")
      return
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const d = (appointmentData.date || '').trim()
    const t = (appointmentData.time || '').trim()
    const n = (appointmentData.name || '').trim()
    const em = (appointmentData.email || '').trim()

    const nextErrors = {
      date: '',
      time: '',
      name: '',
      email: '',
      emailInvalid: '',
    }
    if (!d) nextErrors.date = FIELD_REQUIRED_MSG
    if (!t) nextErrors.time = FIELD_REQUIRED_MSG
    if (!n) nextErrors.name = FIELD_REQUIRED_MSG
    if (!em) nextErrors.email = FIELD_REQUIRED_MSG
    else if (!emailRegex.test(em)) nextErrors.emailInvalid = 'Invalid email.'

    const hasErrors =
      nextErrors.date ||
      nextErrors.time ||
      nextErrors.name ||
      nextErrors.email ||
      nextErrors.emailInvalid
    setAppointmentFieldErrors(nextErrors)
    if (hasErrors) {
      toast.error('Please complete the required fields (see red hints above).', { autoClose: 3500 })
      return
    }

    setLoading(true)
    
    const listingId = contextType === 'listing' ? (propertyId || listing?.id) : null
    const accountType = getAccountType()
    const accountId = getAccountId()
    const token = propertySeekerToken || (typeof window !== 'undefined' ? localStorage.getItem('property_seeker_token') : null)
    
    // Listing context: create actual appointment via API
    if (listingId && accountId && accountId !== 'unknown' && token && ['developer', 'agent', 'agency'].includes(accountType)) {
      const toastId = toast.loading("Booking appointment...", { autoClose: false })
      try {
        const appointmentType = mode === 'video' ? 'virtual' : 'in-person'
        const res = await fetch('/api/appointments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            account_type: accountType,
            account_id: accountId,
            listing_id: listingId,
            seeker_id: user.id,
            appointment_date: d,
            appointment_time: t,
            client_name: n,
            client_email: em,
            client_phone: (appointmentData.phone || '').trim() || null,
            notes: appointmentData.message || null,
            appointment_type: appointmentType,
          }),
        })
        
        const data = await res.json().catch(() => ({}))
        
        if (!res.ok) {
          throw new Error(data.error || data.details || 'Failed to book appointment')
        }
        
        setLoading(false)
        toast.update(toastId, { type: 'success', render: "Appointment request sent!", autoClose: 3000, isLoading: false })
        setAppointmentFieldErrors({ date: '', time: '', name: '', email: '', emailInvalid: '' })
        analytics.trackAppointmentClick(getAnalyticsContext({ appointmentType: mode === 'video' ? 'virtual' : 'viewing' })).catch(() => {})
      } catch (error) {
        setLoading(false)
        toast.update(toastId, { type: 'error', render: error.message || "Failed to send appointment request", autoClose: 4000, isLoading: false })
      }
      return
    }

    setLoading(false)

    // Listing page but booking API was skipped — tell the user why (never fake success here)
    if (contextType === 'listing' && listingId) {
      if (!token) {
        toast.error('Your session expired. Please log in again to book.')
        router.push('/login?redirect=' + encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname : '/'))
        return
      }
      if (accountId === 'unknown') {
        toast.error('We could not load the host for this listing. Refresh the page or contact support.')
        return
      }
      if (!['developer', 'agent', 'agency'].includes(accountType)) {
        toast.error('This listing cannot accept online bookings yet.')
        return
      }
    }

    // Profile/development context: optimistic UX only — no persisted appointment API yet
    setAppointmentFieldErrors({ date: '', time: '', name: '', email: '', emailInvalid: '' })
    toast.success('Appointment request sent!')
  }
  
  const handleMessageSubmit = async (e) => {
    e.preventDefault()
    
    // Check if user is logged in
    if (!user) {
      toast.error("Please log in to send a message")
      router.push('/login?redirect=' + encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname : '/'))
      return
    }
    
    // Check if user is a property seeker
    if (user.user_type !== 'property_seeker') {
      toast.error("Only property seekers can send messages")
      return
    }
    
    // Validate message is not empty
    if (!messageData.message || messageData.message.trim().length === 0) {
      toast.error("Please enter a message")
      return
    }
    
    // Validate minimum message length
    if (messageData.message.trim().length < 10) {
      toast.error("Message must be at least 10 characters long")
      return
    }
    
    const token = propertySeekerToken || (typeof window !== 'undefined' ? localStorage.getItem('property_seeker_token') : null)
    if (!token) {
      toast.error("Session expired. Please log in again.")
      router.push('/login?redirect=' + encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname : '/'))
      return
    }
    
    const otherUserId = getAccountId()
    const otherUserType = getAccountType()
    if (!otherUserId || otherUserId === 'unknown') {
      toast.error("Unable to send message: recipient not found")
      return
    }
    
    setSendingMessage(true)
    const toastId = toast.loading("Sending message...", { autoClose: false })
    
    try {
      const listingId = contextType === 'listing' ? (propertyId || listing?.id) : null
      const devId = contextType === 'development' ? (developmentId || development?.id) : null
      const subject = propertyTitle ? `Inquiry about ${propertyTitle}` : 'General inquiry'
      
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          otherUserId,
          otherUserType,
          firstMessage: messageData.message.trim(),
          listingId,
          developmentId: devId,
          subject,
          conversationType: 'general_inquiry',
        }),
      })
      
      const data = await res.json().catch(() => ({}))
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send message')
      }
      
      setSendingMessage(false)
      toast.update(toastId, { type: 'success', render: "Message sent!", autoClose: 2000, isLoading: false })
      setMessageData({ message: '' })
      
      analytics.trackMessageClick(getAnalyticsContext({ messageType: 'direct_message' })).catch(() => {})
    } catch (error) {
      setSendingMessage(false)
      toast.update(toastId, { type: 'error', render: error.message || "Failed to send message", autoClose: 4000, isLoading: false })
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
            {contactInfo.verified && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center shadow-sm">
                <FaCheckCircle className="w-2.5 h-2.5 text-white" />
              </div>
            )}
          </div>

          {/* Name & Location */}
          <div className=" min-w-0">
            <div className="">
              {contactInfo.profileHref && contactInfo.slug ? (
                <Link 
                  href={contactInfo.profileHref}
                  className="text-lg font-bold  text-primary_color hover:text-primary_color/80 transition-colors"
                >
                  {contactInfo.name}
                </Link>
              ) : (
                <span className="text-lg font-bold text-primary_color">{contactInfo.name}</span>
              )}
          
            </div>
            {contactInfo.accountType && (
                <span className="text-xs font-medium text-primary_color/60 ml-1.5">{contactInfo.accountType}</span>
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
        {!user && (
          <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-xs text-orange-800 font-medium">
              Please <Link href={`/login?redirect=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname : '/')}`} className="underline font-bold">log in</Link> as a property seeker to book appointments or send messages.
            </p>
          </div>
        )}
        {user && user.user_type !== 'property_seeker' && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs text-red-800 font-medium">
              Only property seekers can book appointments and send messages.
            </p>
          </div>
        )}
        {activeTab === 'appointment' ? (
          <form noValidate onSubmit={handleAppointmentSubmit} className="space-y-4" id={appointmentFormId}>
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
                <label className="text-xs font-semibold text-primary_color">
                  Date<span className="text-red-600 ml-0.5" aria-hidden>*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-primary_color/50">
                    <HiOutlineCalendar className="w-4 h-4" />
                  </div>
                  <input
                    type="date"
                    name="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={appointmentData.date}
                    onChange={handleAppointmentInputChange}
                    aria-invalid={!!appointmentFieldErrors.date}
                    className={`w-full bg-gray-50 text-sm text-primary_color font-medium rounded-lg border pl-10 pr-3 py-2.5 focus:ring-2 focus:ring-primary_color/20 focus:border-primary_color focus:bg-white transition-all outline-none ${
                      appointmentFieldErrors.date ? 'border-red-500 ring-1 ring-red-200' : 'border-gray-200'
                    }`}
                  />
                </div>
                {appointmentFieldErrors.date && (
                  <p className="text-red-600 mt-0.5 text-[10px] leading-tight">{appointmentFieldErrors.date}</p>
                )}
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-primary_color">
                  Time<span className="text-red-600 ml-0.5" aria-hidden>*</span>
                </label>
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
                    aria-invalid={!!appointmentFieldErrors.time}
                    className={`w-full bg-gray-50 text-sm text-primary_color font-medium rounded-lg border pl-10 pr-3 py-2.5 focus:ring-2 focus:ring-primary_color/20 focus:border-primary_color focus:bg-white transition-all outline-none ${
                      appointmentFieldErrors.time ? 'border-red-500 ring-1 ring-red-200' : 'border-gray-200'
                    }`}
                  />
                </div>
                {appointmentFieldErrors.time && (
                  <p className="text-red-600 mt-0.5 text-[10px] leading-tight">{appointmentFieldErrors.time}</p>
                )}
              </div>
            </div>

            {/* Inputs */}
            {['name', 'email', 'phone'].map((field) => {
              const fieldErr =
                field === 'email'
                  ? appointmentFieldErrors.email || appointmentFieldErrors.emailInvalid
                  : appointmentFieldErrors[field]
              return (
                <div key={field} className="space-y-1.5">
                  <label className="text-xs font-semibold text-primary_color capitalize">
                    {field}
                    {field !== 'phone' && (
                      <span className="text-red-600 ml-0.5" aria-hidden>
                        *
                      </span>
                    )}
                  </label>
                  <input
                    type={field === 'email' ? 'email' : field === 'phone' ? 'tel' : 'text'}
                    name={field}
                    required={field !== 'phone'}
                    value={appointmentData[field]}
                    onChange={handleAppointmentInputChange}
                    placeholder={`Enter your ${field}`}
                    minLength={field === 'name' ? 2 : undefined}
                    aria-invalid={!!fieldErr}
                    className={`w-full bg-gray-50 text-sm text-primary_color font-medium rounded-lg border px-3 py-2.5 focus:ring-2 focus:ring-primary_color/20 focus:border-primary_color focus:bg-white transition-all outline-none placeholder-gray-400 ${
                      fieldErr ? 'border-red-500 ring-1 ring-red-200' : 'border-gray-200'
                    }`}
                  />
                  {fieldErr && (
                    <p className="text-red-600 mt-0.5 text-[10px] leading-tight">{fieldErr}</p>
                  )}
                </div>
              )
            })}

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
          <form noValidate onSubmit={handleMessageSubmit} className="space-y-4" id={messageFormId}>
            <h2 className="text-base font-bold text-primary_color mb-1">
              Send us a message
            </h2>
            
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-primary_color">
                Your Message<span className="text-red-600 ml-0.5" aria-hidden>*</span>
              </label>
              <textarea
                name="message"
                rows={5}
                required
                minLength={10}
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
          type="button"
          disabled={loading || sendingMessage || authLoading}
          title={
            authLoading
              ? 'Checking session…'
              : !user
                ? 'Log in as a property seeker to continue'
                : user.user_type !== 'property_seeker'
                  ? 'Only property seekers can use this form'
                  : undefined
          }
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            if (authLoading) return
            if (activeTab === 'appointment') void handleAppointmentSubmit(e)
            else void handleMessageSubmit(e)
          }}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg shadow-md shadow-orange-500/20 transform active:scale-[0.98] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
        >
          {authLoading ? (
            <span className="text-sm font-medium">Checking session…</span>
          ) : loading || sendingMessage ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
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
