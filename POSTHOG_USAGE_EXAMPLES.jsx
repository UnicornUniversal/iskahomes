/**
 * PostHog Analytics - Enhanced Usage Examples for Iska Homes
 * 
 * Analytics Structure:
 * 1. Property Views - Track listing views with automatic seeker_id tracking
 * 2. Profile Views - Track developer/agent profile views
 * 3. Impressions - Social media, website, shares, favorites with seeker tracking
 * 4. Leads - Phone, messages, appointments with seeker identification
 * 
 * NEW FEATURES:
 * - Automatic property seeker ID tracking for logged-in users
 * - Detailed impression tracking for property owners
 * - Enhanced analytics for lead generation and viewer identification
 * 
 * Copy these patterns into your components to track user interactions
 */

import { useAnalytics } from '@/hooks/useAnalytics'
import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'

// ============================================
// 1. PROPERTY VIEWS - ENHANCED WITH SEEKER TRACKING
// ============================================

/**
 * EXAMPLE 1A: Enhanced property view tracking with automatic seeker_id
 * The analytics hook now automatically includes seeker_id for logged-in property seekers
 */
function PropertyCardOnHomePage({ listing }) {
  const analytics = useAnalytics()
  const { user } = useAuth()
  
  const handleClick = () => {
    // Track the view - seeker_id is automatically included if user is logged in as property_seeker
    analytics.trackPropertyView(listing.id, {
      viewedFrom: 'home',
      developerId: listing.developer_id || listing.user_id,
      agentId: listing.agent_id,
      listingType: listing.listing_type // 'unit', 'development', 'property'
    })
    
    // Navigate to listing
    router.push(`/property/${listing.listing_type}/${listing.id}`)
  }
  
  return (
    <div onClick={handleClick} style={{ cursor: 'pointer' }}>
      <h3>{listing.title}</h3>
      <img src={listing.image} alt={listing.title} />
      {/* Debug info - remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <p className="text-xs text-gray-500">
          User: {user?.user_type || 'Anonymous'} | 
          Seeker ID: {user?.user_type === 'property_seeker' ? user.id : 'N/A'}
        </p>
      )}
    </div>
  )
}

/**
 * EXAMPLE 1B: Detailed listing impression tracking for property owners
 * This provides comprehensive data about who viewed the listing
 */
function DetailedListingImpression({ listing }) {
  const analytics = useAnalytics()
  const [sessionId] = useState(() => Math.random().toString(36).substr(2, 9))
  
  useEffect(() => {
    if (listing?.id) {
      // Track detailed impression with all available data
      analytics.trackListingImpression(listing.id, {
        developerId: listing.developer_id || listing.user_id,
        agentId: listing.agent_id,
        listingType: listing.listing_type,
        viewedFrom: 'listing_page',
        sessionId: sessionId,
        propertyTitle: listing.title,
        propertyPrice: listing.price,
        propertyLocation: listing.location
      })
    }
  }, [listing?.id, analytics, sessionId])
  
  return (
    <div>
      <h1>{listing.title}</h1>
      {/* Listing content */}
    </div>
  )
}

/**
 * EXAMPLE 1B: Track property view from explore page
 */
function PropertyCardOnExplorePage({ listing }) {
  const analytics = useAnalytics()
  
  const handleClick = () => {
    analytics.trackPropertyView(listing.id, {
      viewedFrom: 'explore',
      developerId: listing.developer_id || listing.user_id,
      listingType: listing.listing_type
    })
    
    router.push(`/property/${listing.listing_type}/${listing.id}`)
  }
  
  return (
    <div onClick={handleClick}>
      <h3>{listing.title}</h3>
    </div>
  )
}

/**
 * EXAMPLE 1C: Track property view on listing detail page
 */
function PropertyDetailPage({ listing }) {
  const analytics = useAnalytics()
  
  useEffect(() => {
    if (listing?.id) {
      analytics.trackPropertyView(listing.id, {
        viewedFrom: 'listing_page',
        developerId: listing.developer_id || listing.user_id,
        agentId: listing.agent_id,
        listingType: listing.listing_type
      })
    }
  }, [listing?.id])
  
  return (
    <div>
      <h1>{listing.title}</h1>
      {/* ... rest of listing details */}
    </div>
  )
}

/**
 * EXAMPLE 1D: Track property view from search results
 */
function SearchResultCard({ listing }) {
  const analytics = useAnalytics()
  
  const handleClick = () => {
    analytics.trackPropertyView(listing.id, {
      viewedFrom: 'search_results',
      developerId: listing.developer_id || listing.user_id,
      listingType: listing.listing_type
    })
    
    router.push(`/property/${listing.listing_type}/${listing.id}`)
  }
  
  return <div onClick={handleClick}>{listing.title}</div>
}

// ============================================
// 2. PROFILE VIEWS
// ============================================

/**
 * EXAMPLE 2A: Track developer profile view
 */
function DeveloperProfilePage({ developerId }) {
  const analytics = useAnalytics()
  
  useEffect(() => {
    if (developerId) {
      analytics.trackProfileView(developerId, 'developer')
    }
  }, [developerId])
  
  return (
    <div>
      <h1>Developer Profile</h1>
      {/* Profile content */}
    </div>
  )
}

/**
 * EXAMPLE 2B: Track agent profile view
 */
function AgentProfilePage({ agentId }) {
  const analytics = useAnalytics()
  
  useEffect(() => {
    if (agentId) {
      analytics.trackProfileView(agentId, 'agent')
    }
  }, [agentId])
  
  return (
    <div>
      <h1>Agent Profile</h1>
      {/* Profile content */}
    </div>
  )
}

/**
 * EXAMPLE 2C: Track profile view when clicking on developer name from listing
 */
function ListingDeveloperLink({ listing }) {
  const analytics = useAnalytics()
  
  const handleClick = () => {
    analytics.trackProfileView(listing.developer_id, 'developer')
    router.push(`/allDevelopers/${listing.developer_slug}`)
  }
  
  return (
    <button onClick={handleClick}>
      View Developer: {listing.developer_name}
    </button>
  )
}

// ============================================
// 3. IMPRESSIONS
// ============================================

/**
 * EXAMPLE 3A: Track social media click on profile
 */
function ProfileSocialLinks({ profile }) {
  const analytics = useAnalytics()
  
  const handleSocialClick = (platform, url) => {
    analytics.trackSocialMediaClick(platform, {
      contextType: 'profile',
      profileId: profile.id,
      developerId: profile.developer_id,
      agentId: profile.agent_id
    })
    
    window.open(url, '_blank')
  }
  
  return (
    <div>
      {profile.facebook && (
        <button onClick={() => handleSocialClick('facebook', profile.facebook)}>
          Facebook
        </button>
      )}
      {profile.twitter && (
        <button onClick={() => handleSocialClick('twitter', profile.twitter)}>
          Twitter
        </button>
      )}
      {profile.instagram && (
        <button onClick={() => handleSocialClick('instagram', profile.instagram)}>
          Instagram
        </button>
      )}
      {profile.linkedin && (
        <button onClick={() => handleSocialClick('linkedin', profile.linkedin)}>
          LinkedIn
        </button>
      )}
    </div>
  )
}

/**
 * EXAMPLE 3B: Track social media click on listing
 */
function ListingSocialLinks({ listing, developerSocials }) {
  const analytics = useAnalytics()
  
  const handleSocialClick = (platform, url) => {
    analytics.trackSocialMediaClick(platform, {
      contextType: 'listing',
      listingId: listing.id,
      developerId: listing.developer_id || listing.user_id,
      agentId: listing.agent_id
    })
    
    window.open(url, '_blank')
  }
  
  return (
    <div>
      {developerSocials.facebook && (
        <button onClick={() => handleSocialClick('facebook', developerSocials.facebook)}>
          Follow on Facebook
        </button>
      )}
    </div>
  )
}

/**
 * EXAMPLE 3C: Track website click on profile
 */
function ProfileWebsiteButton({ profile }) {
  const analytics = useAnalytics()
  
  const handleWebsiteClick = () => {
    analytics.trackWebsiteClick(profile.website, {
      contextType: 'profile',
      profileId: profile.id,
      developerId: profile.developer_id,
      agentId: profile.agent_id
    })
    
    window.open(profile.website, '_blank')
  }
  
  return (
    <button onClick={handleWebsiteClick}>
      🌐 Visit Website
    </button>
  )
}

/**
 * EXAMPLE 3D: Track website click on listing
 */
function ListingWebsiteButton({ listing, websiteUrl }) {
  const analytics = useAnalytics()
  
  const handleWebsiteClick = () => {
    analytics.trackWebsiteClick(websiteUrl, {
      contextType: 'listing',
      listingId: listing.id,
      developerId: listing.developer_id || listing.user_id
    })
    
    window.open(websiteUrl, '_blank')
  }
  
  return (
    <button onClick={handleWebsiteClick}>
      Visit Developer Website
    </button>
  )
}

/**
 * EXAMPLE 3E: Track share listing
 */
function ShareListingButtons({ listing }) {
  const analytics = useAnalytics()
  
  const handleShare = (platform) => {
    analytics.trackShare('listing', platform, {
      listingId: listing.id,
      developerId: listing.developer_id || listing.user_id,
      agentId: listing.agent_id
    })
    
    const url = window.location.href
    const title = listing.title
    
    switch (platform) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(title + ' - ' + url)}`)
        break
      case 'facebook':
        window.open(`https://facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`)
        break
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`)
        break
      case 'link':
        navigator.clipboard.writeText(url)
        toast.success('Link copied to clipboard!')
        break
      case 'email':
        window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`
        break
    }
  }
  
  return (
    <div>
      <button onClick={() => handleShare('whatsapp')}>📱 WhatsApp</button>
      <button onClick={() => handleShare('facebook')}>📘 Facebook</button>
      <button onClick={() => handleShare('twitter')}>🐦 Twitter</button>
      <button onClick={() => handleShare('link')}>🔗 Copy Link</button>
      <button onClick={() => handleShare('email')}>📧 Email</button>
    </div>
  )
}

/**
 * EXAMPLE 3F: Track share profile
 */
function ShareProfileButtons({ profile }) {
  const analytics = useAnalytics()
  
  const handleShare = (platform) => {
    analytics.trackShare('profile', platform, {
      profileId: profile.id,
      developerId: profile.developer_id,
      agentId: profile.agent_id
    })
    
    const url = window.location.href
    const title = `${profile.name} - ${profile.type === 'developer' ? 'Developer' : 'Agent'}`
    
    switch (platform) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(title + ' - ' + url)}`)
        break
      case 'facebook':
        window.open(`https://facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`)
        break
      case 'link':
        navigator.clipboard.writeText(url)
        toast.success('Profile link copied!')
        break
    }
  }
  
  return (
    <div>
      <button onClick={() => handleShare('whatsapp')}>Share via WhatsApp</button>
      <button onClick={() => handleShare('facebook')}>Share on Facebook</button>
      <button onClick={() => handleShare('link')}>Copy Profile Link</button>
    </div>
  )
}

/**
 * EXAMPLE 3G: Track saved listing/add to saved listings
 */
function SavedListingButton({ listing }) {
  const analytics = useAnalytics()
  const [isSaved, setIsSaved] = useState(false)
  
  const handleToggleSaved = async () => {
    const action = isSaved ? 'remove' : 'add'
    
    // Track analytics
    analytics.trackSavedListing(listing.id, action, {
      developerId: listing.developer_id || listing.user_id,
      agentId: listing.agent_id
    })
    
    // Update backend
    await fetch('/api/saved-listings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        listingId: listing.id, 
        action: action 
      })
    })
    
    setIsSaved(!isSaved)
    toast.success(isSaved ? 'Removed from saved listings' : 'Added to saved listings')
  }
  
  return (
    <button onClick={handleToggleSaved}>
      {isSaved ? '💾 Saved' : '💾 Save Listing'}
    </button>
  )
}

// ============================================
// 4. LEADS
// ============================================

/**
 * EXAMPLE 4A: Enhanced phone click tracking with automatic seeker identification
 */
function ListingPhoneButton({ listing, phoneNumber }) {
  const analytics = useAnalytics()
  const { user } = useAuth()
  
  const handlePhoneClick = () => {
    // Track phone interaction - seeker_id automatically included for logged-in property seekers
    analytics.trackPhoneInteraction('click', {
      contextType: 'listing',
      listingId: listing.id,
      developerId: listing.developer_id || listing.user_id,
      agentId: listing.agent_id,
      phoneNumber: phoneNumber // Optional: can be masked or hashed
    })
    
    window.location.href = `tel:${phoneNumber}`
  }
  
  return (
    <button onClick={handlePhoneClick}>
      📞 Call {phoneNumber}
      {/* Debug info - remove in production */}
      {process.env.NODE_ENV === 'development' && user?.user_type === 'property_seeker' && (
        <span className="text-xs text-gray-500 ml-2">
          (Tracked as: {user.profile?.name})
        </span>
      )}
    </button>
  )
}

/**
 * EXAMPLE 4B: Track phone copy on listing
 */
function CopyPhoneButton({ listing, phoneNumber }) {
  const analytics = useAnalytics()
  
  const handleCopyPhone = async () => {
    analytics.trackPhoneInteraction('copy', {
      contextType: 'listing',
      listingId: listing.id,
      developerId: listing.developer_id || listing.user_id,
      phoneNumber: phoneNumber
    })
    
    await navigator.clipboard.writeText(phoneNumber)
    toast.success('Phone number copied!')
  }
  
  return (
    <button onClick={handleCopyPhone}>
      📋 Copy Phone
    </button>
  )
}

/**
 * EXAMPLE 4C: Track phone click on profile
 */
function ProfilePhoneButton({ profile, phoneNumber }) {
  const analytics = useAnalytics()
  
  const handlePhoneClick = () => {
    analytics.trackPhoneInteraction('click', {
      contextType: 'profile',
      profileId: profile.id,
      developerId: profile.developer_id,
      agentId: profile.agent_id,
      phoneNumber: phoneNumber
    })
    
    window.location.href = `tel:${phoneNumber}`
  }
  
  return (
    <button onClick={handlePhoneClick}>
      📞 Call Now
    </button>
  )
}

/**
 * EXAMPLE 4D: Track message/chat click on listing
 */
function ListingMessageButton({ listing }) {
  const analytics = useAnalytics()
  
  const handleMessageClick = () => {
    analytics.trackMessageClick({
      contextType: 'listing',
      listingId: listing.id,
      developerId: listing.developer_id || listing.user_id,
      agentId: listing.agent_id,
      messageType: 'direct_message'
    })
    
    // Navigate to messages
    router.push(`/messages?listing=${listing.id}`)
  }
  
  return (
    <button onClick={handleMessageClick}>
      💬 Send Message
    </button>
  )
}

/**
 * EXAMPLE 4E: Track WhatsApp click on listing
 */
function ListingWhatsAppButton({ listing, whatsappNumber }) {
  const analytics = useAnalytics()
  
  const handleWhatsAppClick = () => {
    analytics.trackMessageClick({
      contextType: 'listing',
      listingId: listing.id,
      developerId: listing.developer_id || listing.user_id,
      messageType: 'whatsapp'
    })
    
    const message = `Hi! I'm interested in ${listing.title}`
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`)
  }
  
  return (
    <button onClick={handleWhatsAppClick}>
      💬 WhatsApp
    </button>
  )
}

/**
 * EXAMPLE 4F: Track email message on listing
 */
function ListingEmailButton({ listing, email }) {
  const analytics = useAnalytics()
  
  const handleEmailClick = () => {
    analytics.trackMessageClick({
      contextType: 'listing',
      listingId: listing.id,
      developerId: listing.developer_id || listing.user_id,
      messageType: 'email'
    })
    
    const subject = `Inquiry about ${listing.title}`
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}`
  }
  
  return (
    <button onClick={handleEmailClick}>
      📧 Send Email
    </button>
  )
}

/**
 * EXAMPLE 4G: Track message click on profile
 */
function ProfileMessageButton({ profile }) {
  const analytics = useAnalytics()
  
  const handleMessageClick = () => {
    analytics.trackMessageClick({
      contextType: 'profile',
      profileId: profile.id,
      developerId: profile.developer_id,
      agentId: profile.agent_id,
      messageType: 'direct_message'
    })
    
    router.push(`/messages?developer=${profile.id}`)
  }
  
  return (
    <button onClick={handleMessageClick}>
      💬 Message Developer
    </button>
  )
}

/**
 * EXAMPLE 4H: Track appointment click on listing
 */
function ListingAppointmentButton({ listing }) {
  const analytics = useAnalytics()
  
  const handleAppointmentClick = () => {
    analytics.trackAppointmentClick({
      contextType: 'listing',
      listingId: listing.id,
      developerId: listing.developer_id || listing.user_id,
      agentId: listing.agent_id,
      appointmentType: 'viewing'
    })
    
    // Navigate to appointment booking
    router.push(`/appointments/book?listing=${listing.id}`)
  }
  
  return (
    <button onClick={handleAppointmentClick}>
      📅 Book a Viewing
    </button>
  )
}

/**
 * EXAMPLE 4I: Track appointment click on profile
 */
function ProfileAppointmentButton({ profile }) {
  const analytics = useAnalytics()
  
  const handleAppointmentClick = () => {
    analytics.trackAppointmentClick({
      contextType: 'profile',
      profileId: profile.id,
      developerId: profile.developer_id,
      agentId: profile.agent_id,
      appointmentType: 'consultation'
    })
    
    router.push(`/appointments/book?developer=${profile.id}`)
  }
  
  return (
    <button onClick={handleAppointmentClick}>
      📅 Schedule Consultation
    </button>
  )
}

/**
 * EXAMPLE 4J: Track appointment from modal/popup
 */
function BookAppointmentModal({ listing, isOpen, onClose }) {
  const analytics = useAnalytics()
  const [appointmentData, setAppointmentData] = useState({})
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Track the appointment lead
    analytics.trackAppointmentClick({
      contextType: 'listing',
      listingId: listing.id,
      developerId: listing.developer_id || listing.user_id,
      appointmentType: appointmentData.type || 'viewing'
    })
    
    // Submit appointment to backend
    await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        listing_id: listing.id,
        ...appointmentData
      })
    })
    
    toast.success('Appointment booked successfully!')
    onClose()
  }
  
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <h2>Book an Appointment</h2>
        {/* Form fields */}
        <button type="submit">Confirm Booking</button>
      </form>
    </Modal>
  )
}

// ============================================
// 5. DEVELOPMENT TRACKING
// ============================================

/**
 * EXAMPLE 5A: Track development view
 */
function DevelopmentCard({ development }) {
  const analytics = useAnalytics()
  
  const handleCardClick = () => {
    analytics.trackDevelopmentView(development.id, {
      viewedFrom: 'home', // or 'explore', 'development_page', 'search_results'
      developerId: development.developer_id,
      location: {
        city: development.city,
        state: development.state
      }
    })
    
    router.push(`/allDevelopments/${development.slug}`)
  }
  
  return (
    <div onClick={handleCardClick} style={{ cursor: 'pointer' }}>
      <h3>{development.name}</h3>
      <p>{development.location}</p>
    </div>
  )
}

/**
 * EXAMPLE 5B: Track development save/share
 */
function DevelopmentActions({ development }) {
  const analytics = useAnalytics()
  const [isSaved, setIsSaved] = useState(false)
  
  const handleSave = () => {
    const action = isSaved ? 'remove' : 'save'
    
    analytics.trackDevelopmentInteraction(development.id, action, {
      developerId: development.developer_id
    })
    
    setIsSaved(!isSaved)
  }
  
  const handleShare = (platform) => {
    analytics.trackDevelopmentInteraction(development.id, 'share', {
      developerId: development.developer_id,
      platform: platform
    })
    
    // Share logic here
  }
  
  return (
    <div>
      <button onClick={handleSave}>
        {isSaved ? '💾 Saved' : '💾 Save Development'}
      </button>
      <button onClick={() => handleShare('whatsapp')}>Share</button>
    </div>
  )
}

/**
 * EXAMPLE 5C: Track development lead/inquiry
 */
function DevelopmentContactForm({ development }) {
  const analytics = useAnalytics()
  
  const handleInquiry = (formData) => {
    analytics.trackDevelopmentLead(development.id, 'inquiry', {
      developerId: development.developer_id,
      contactMethod: 'form'
    })
    
    // Submit form logic
  }
  
  const handlePhoneClick = () => {
    analytics.trackDevelopmentLead(development.id, 'phone', {
      developerId: development.developer_id,
      contactMethod: 'phone'
    })
    
    window.location.href = `tel:${development.phone}`
  }
  
  return (
    <div>
      <form onSubmit={handleInquiry}>
        {/* Form fields */}
        <button type="submit">Send Inquiry</button>
      </form>
      <button onClick={handlePhoneClick}>📞 Call Developer</button>
    </div>
  )
}

// ============================================
// COMPLETE LISTING CARD EXAMPLE
// ============================================

/**
 * EXAMPLE: Complete enhanced listing card with automatic seeker tracking
 * This demonstrates the full power of the enhanced analytics system
 */
function CompleteListingCard({ listing }) {
  const analytics = useAnalytics()
  const { user } = useAuth()
  const [isSaved, setIsSaved] = useState(false)
  const [sessionId] = useState(() => Math.random().toString(36).substr(2, 9))
  
  // Track detailed impression when component mounts
  useEffect(() => {
    if (listing?.id) {
      analytics.trackListingImpression(listing.id, {
        developerId: listing.developer_id,
        agentId: listing.agent_id,
        listingType: listing.listing_type,
        viewedFrom: 'home',
        sessionId: sessionId,
        propertyTitle: listing.title,
        propertyPrice: listing.price,
        propertyLocation: listing.location
      })
    }
  }, [listing?.id, analytics, sessionId])
  
  // Track view when card is clicked
  const handleCardClick = () => {
    analytics.trackPropertyView(listing.id, {
      viewedFrom: 'home', // or 'explore', 'search_results'
      developerId: listing.developer_id,
      agentId: listing.agent_id,
      listingType: listing.listing_type
    })
    router.push(`/property/${listing.listing_type}/${listing.id}`)
  }
  
  // Track saved listing
  const handleSavedListing = (e) => {
    e.stopPropagation() // Prevent card click
    const action = isSaved ? 'remove' : 'add'
    
    analytics.trackSavedListing(listing.id, action, {
      developerId: listing.developer_id,
      agentId: listing.agent_id
    })
    
    setIsSaved(!isSaved)
  }
  
  // Track share
  const handleShare = (e, platform) => {
    e.stopPropagation()
    
    analytics.trackShare('listing', platform, {
      listingId: listing.id,
      developerId: listing.developer_id,
      agentId: listing.agent_id
    })
    
    // ... share logic
  }
  
  // Track phone lead
  const handlePhone = (e) => {
    e.stopPropagation()
    
    analytics.trackPhoneInteraction('click', {
      contextType: 'listing',
      listingId: listing.id,
      developerId: listing.developer_id,
      agentId: listing.agent_id,
      phoneNumber: listing.phone
    })
    
    window.location.href = `tel:${listing.phone}`
  }
  
  // Track message lead
  const handleMessage = (e) => {
    e.stopPropagation()
    
    analytics.trackMessageClick({
      contextType: 'listing',
      listingId: listing.id,
      developerId: listing.developer_id,
      agentId: listing.agent_id,
      messageType: 'direct_message'
    })
    
    router.push(`/messages?listing=${listing.id}`)
  }
  
  return (
    <div onClick={handleCardClick} style={{ cursor: 'pointer' }}>
      <img src={listing.image} alt={listing.title} />
      <h3>{listing.title}</h3>
      <p>{listing.price}</p>
      
      <div onClick={(e) => e.stopPropagation()}>
        <button onClick={handleSavedListing}>
          {isSaved ? '💾' : '💾'}
        </button>
        <button onClick={(e) => handleShare(e, 'whatsapp')}>Share</button>
        <button onClick={handlePhone}>📞 Call</button>
        <button onClick={handleMessage}>💬 Message</button>
      </div>
      
      {/* Debug info - remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-gray-500 mt-2">
          <p>User: {user?.user_type || 'Anonymous'}</p>
          <p>Seeker ID: {user?.user_type === 'property_seeker' ? user.id : 'N/A'}</p>
          <p>Session: {sessionId}</p>
        </div>
      )}
    </div>
  )
}

/**
 * QUICK REFERENCE - ENHANCED ANALYTICS:
 * 
 * Import: import { useAnalytics } from '@/hooks/useAnalytics'
 * Usage: const analytics = useAnalytics()
 * 
 * NEW FEATURES:
 * - Automatic seeker_id tracking for logged-in property seekers
 * - Detailed impression tracking for property owners
 * - Enhanced lead generation analytics
 * 
 * 1. PROPERTY VIEWS (Enhanced):
 * analytics.trackPropertyView(listingId, { viewedFrom, developerId, listingType })
 * analytics.trackListingImpression(listingId, { developerId, sessionId, propertyTitle, propertyPrice, propertyLocation })
 * 
 * 2. PROFILE VIEWS:
 * analytics.trackProfileView(profileId, 'developer' | 'agent')
 * 
 * 3. IMPRESSIONS (Enhanced with seeker tracking):
 * analytics.trackSocialMediaClick(platform, { contextType, profileId, listingId })
 * analytics.trackWebsiteClick(url, { contextType, profileId, listingId })
 * analytics.trackShare('listing' | 'profile', platform, { listingId, profileId })
 * analytics.trackSavedListing(listingId, 'add' | 'remove', { developerId })
 * 
 * 4. LEADS (Enhanced with seeker identification):
 * analytics.trackPhoneInteraction('click' | 'copy', { contextType, listingId, profileId })
 * analytics.trackMessageClick({ contextType, listingId, profileId, messageType })
 * analytics.trackAppointmentClick({ contextType, listingId, profileId, appointmentType })
 * 
 * 5. DEVELOPMENT TRACKING:
 * analytics.trackDevelopmentView(developmentId, { viewedFrom, developerId, location })
 * analytics.trackDevelopmentInteraction(developmentId, action, { developerId, platform })
 * analytics.trackDevelopmentLead(developmentId, leadType, { developerId, contactMethod })
 * 
 * AUTOMATIC FEATURES:
 * - seeker_id is automatically included for logged-in property seekers
 * - seeker_name and seeker_email are automatically included when available
 * - is_logged_in flag is automatically set based on user authentication status
 * - All tracking functions now support enhanced context for property owners
 */
