'use client'

import { usePostHog } from 'posthog-js/react'
import posthog from 'posthog-js'
import { queueEvent } from '@/lib/analyticsBatcher'
import { useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export function useAnalytics() {
  const posthog = usePostHog()
  const { user } = useAuth()

  const nowIso = () => new Date().toISOString()
  const getDistinctId = () => posthog?.get_distinct_id?.() || posthog?.get_distinct_id?.call?.(posthog) || null

  const captureAndQueue = useCallback((event, properties) => {
    // Send to PostHog as usual
    posthog?.capture(event, properties)
    // COMMENTED OUT: Redis batching (migrated to PostHog-only approach)
    // queueEvent({ event, properties, distinct_id: getDistinctId(), timestamp: nowIso() })
  }, [posthog])

  // Helper function to get lister context (who owns/manages the listing)
  const getListerContext = useCallback((context = {}) => {
    // 1) Prefer explicit generic fields if provided
    if (context.lister_id && context.lister_type) {
      return { lister_id: context.lister_id, lister_type: context.lister_type }
    }

    // 2) Accept camelCase as well
    if (context.listerId && context.listerType) {
      return { lister_id: context.listerId, lister_type: context.listerType }
    }

    // 3) Backward-compatible fallbacks
    if (context.developer_id) {
      return { lister_id: context.developer_id, lister_type: 'developer' }
    }
    if (context.agent_id) {
      return { lister_id: context.agent_id, lister_type: 'agent' }
    }
    if (context.agency_id) {
      return { lister_id: context.agency_id, lister_type: 'agency' }
    }
    if (context.property_manager_id) {
      return { lister_id: context.property_manager_id, lister_type: 'property_manager' }
    }

    return { lister_id: null, lister_type: null }
  }, [])

  // Helper function to get seeker context for logged-in property seekers
  const getSeekerContext = useCallback((additionalContext = {}) => {
    const isPropertySeeker = user?.user_type === 'property_seeker'
    return {
      ...additionalContext,
      seekerId: isPropertySeeker ? user.id : null,
      seekerName: isPropertySeeker ? user.profile?.name : null,
      seekerEmail: isPropertySeeker ? user.email : null,
      is_logged_in: isPropertySeeker
    }
  }, [user])

  // ============================================
  // 1. PROPERTY VIEWS
  // ============================================
  /**
   * Track when a property/listing is viewed
   * Can be viewed from: Home page, Explore page, or individual listing page
   * @param {string} listingId - The ID of the listing
   * @param {object} context - Additional context (optional)
   */
  const trackPropertyView = useCallback((listingId, context = {}) => {
    const seekerContext = getSeekerContext(context)
    const listerContext = getListerContext(context)
    
    captureAndQueue('property_view', {
      listing_id: listingId,
      viewed_from: seekerContext.viewedFrom || 'unknown', // 'home', 'explore', 'listing_page', 'search_results'
      lister_id: listerContext.lister_id,
      lister_type: listerContext.lister_type,
      listing_type: seekerContext.listingType, // 'unit', 'development', 'property'
      seeker_id: seekerContext.seekerId, // Property seeker ID for logged-in users
      is_logged_in: seekerContext.is_logged_in, // Boolean flag for easy filtering
      timestamp: nowIso()
    })
  }, [posthog, getSeekerContext, getListerContext])

  // ============================================
  // 2. PROFILE VIEWS
  // ============================================
  /**
   * Track when a user views a developer or agent profile
   * @param {string} profileId - The ID of the profile being viewed
   * @param {string} profileType - 'developer' or 'agent'
   */
  const trackProfileView = useCallback((profileId, profileType) => {
    captureAndQueue('profile_view', {
      profile_id: profileId,
      profile_type: profileType, // 'developer' or 'agent'
      timestamp: nowIso()
    })
  }, [posthog])

  // ============================================
  // 3. IMPRESSIONS
  // ============================================
  
  /**
   * Track listing impression (view) with detailed analytics for property owners
   * This is specifically designed to help property owners see who viewed their listings
   * @param {string} listingId - The ID of the listing
   * @param {object} context - Additional context including seeker information
   */
  const trackListingImpression = useCallback((listingId, context = {}) => {
    const seekerContext = getSeekerContext(context)
    const listerContext = getListerContext(context)
    
    captureAndQueue('listing_impression', {
      listing_id: listingId,
      lister_id: listerContext.lister_id,
      lister_type: listerContext.lister_type,
      seeker_id: seekerContext.seekerId, // Property seeker ID for logged-in users
      seeker_name: seekerContext.seekerName, // Property seeker name (if available)
      seeker_email: seekerContext.seekerEmail, // Property seeker email (if available)
      listing_type: seekerContext.listingType,
      viewed_from: seekerContext.viewedFrom || 'unknown',
      is_logged_in: seekerContext.is_logged_in,
      session_id: seekerContext.sessionId, // To track unique sessions
      timestamp: nowIso(),
      // Additional metadata for property owners
      property_title: seekerContext.propertyTitle,
      property_price: seekerContext.propertyPrice,
      property_location: seekerContext.propertyLocation
    })
  }, [posthog, getSeekerContext, getListerContext])
  /**
   * Track when user clicks on social media link
   * @param {string} platform - Social media platform name
   * @param {object} context - Profile or listing context
   */
  const trackSocialMediaClick = useCallback((platform, context = {}) => {
    const seekerContext = getSeekerContext(context)
    const listerContext = getListerContext(context)
    captureAndQueue('impression_social_media', {
      platform: platform, // 'facebook', 'twitter', 'instagram', 'linkedin', etc.
      context_type: seekerContext.contextType, // 'profile' or 'listing'
      profile_id: seekerContext.profileId,
      listing_id: seekerContext.listingId,
      lister_id: listerContext.lister_id,
      lister_type: listerContext.lister_type,
      seeker_id: seekerContext.seekerId, // Property seeker ID for logged-in users
      is_logged_in: seekerContext.is_logged_in,
      timestamp: nowIso()
    })
  }, [posthog, getSeekerContext, getListerContext])

  /**
   * Track when user clicks on website link
   * @param {string} websiteUrl - The website URL clicked
   * @param {object} context - Profile or listing context
   */
  const trackWebsiteClick = useCallback((websiteUrl, context = {}) => {
    const seekerContext = getSeekerContext(context)
    const listerContext = getListerContext(context)
    captureAndQueue('impression_website_visit', {
      website_url: websiteUrl,
      context_type: seekerContext.contextType, // 'profile' or 'listing'
      profile_id: seekerContext.profileId,
      listing_id: seekerContext.listingId,
      lister_id: listerContext.lister_id,
      lister_type: listerContext.lister_type,
      seeker_id: seekerContext.seekerId, // Property seeker ID for logged-in users
      is_logged_in: seekerContext.is_logged_in,
      timestamp: nowIso()
    })
  }, [posthog, getSeekerContext, getListerContext])

  /**
   * Track when user shares a listing or profile
   * @param {string} shareType - What is being shared
   * @param {string} platform - Platform being shared to
   * @param {object} context - Context data
   */
  const trackShare = useCallback((shareType, platform, context = {}) => {
    const seekerContext = getSeekerContext(context)
    const listerContext = getListerContext(context)
    captureAndQueue('impression_share', {
      share_type: shareType, // 'listing' or 'profile'
      platform: platform, // 'facebook', 'twitter', 'whatsapp', 'link', 'email'
      listing_id: seekerContext.listingId,
      profile_id: seekerContext.profileId,
      lister_id: listerContext.lister_id,
      lister_type: listerContext.lister_type,
      seeker_id: seekerContext.seekerId, // Property seeker ID for logged-in users
      is_logged_in: seekerContext.is_logged_in,
      timestamp: nowIso()
    })
  }, [posthog, getSeekerContext, getListerContext])

  /**
   * Track when user saves/unsaves a listing
   * @param {string} listingId - The listing ID
   * @param {string} action - 'add' or 'remove'
   * @param {object} context - Additional context
   */
  const trackSavedListing = useCallback((listingId, action, context = {}) => {
    const seekerContext = getSeekerContext(context)
    const listerContext = getListerContext(context)
    captureAndQueue('impression_saved_listing', {
      listing_id: listingId,
      action: action, // 'add' or 'remove'
      lister_id: listerContext.lister_id,
      lister_type: listerContext.lister_type,
      seeker_id: seekerContext.seekerId, // Property seeker ID for logged-in users
      is_logged_in: seekerContext.is_logged_in,
      timestamp: nowIso()
    })
  }, [posthog, getSeekerContext, getListerContext])

  // ============================================
  // 4. LEADS
  // ============================================
  /**
   * Track when user clicks or copies phone number
   * @param {string} phoneAction - 'click' or 'copy'
   * @param {object} context - Context data
   */
  const trackPhoneInteraction = useCallback((phoneAction, context = {}) => {
    const seekerContext = getSeekerContext(context)
    const listerContext = getListerContext(context)
    
    captureAndQueue('lead_phone', {
      action: phoneAction, // 'click' or 'copy'
      context_type: seekerContext.contextType, // 'profile' or 'listing'
      listing_id: seekerContext.listingId,
      profile_id: seekerContext.profileId,
      lister_id: listerContext.lister_id,
      lister_type: listerContext.lister_type,
      phone_number: seekerContext.phoneNumber, // Optional: store hashed or masked version
      seeker_id: seekerContext.seekerId, // Property seeker ID for logged-in users
      is_logged_in: seekerContext.is_logged_in,
      timestamp: nowIso()
    })
  }, [posthog, getSeekerContext, getListerContext])

  /**
   * Track when user clicks on messages/chat
   * @param {object} context - Context data
   */
  const trackMessageClick = useCallback((context = {}) => {
    const seekerContext = getSeekerContext(context)
    const listerContext = getListerContext(context)
    
    captureAndQueue('lead_message', {
      context_type: seekerContext.contextType, // 'profile' or 'listing'
      listing_id: seekerContext.listingId,
      profile_id: seekerContext.profileId,
      lister_id: listerContext.lister_id,
      lister_type: listerContext.lister_type,
      message_type: seekerContext.messageType, // 'direct_message', 'whatsapp', 'email'
      seeker_id: seekerContext.seekerId, // Property seeker ID for logged-in users
      is_logged_in: seekerContext.is_logged_in,
      timestamp: nowIso()
    })
  }, [posthog, getSeekerContext, getListerContext])

  /**
   * Track when user clicks to book an appointment
   * @param {object} context - Context data
   */
  const trackAppointmentClick = useCallback((context = {}) => {
    const seekerContext = getSeekerContext(context)
    const listerContext = getListerContext(context)
    
    captureAndQueue('lead_appointment', {
      context_type: seekerContext.contextType, // 'profile' or 'listing'
      listing_id: seekerContext.listingId,
      profile_id: seekerContext.profileId,
      lister_id: listerContext.lister_id,
      lister_type: listerContext.lister_type,
      appointment_type: seekerContext.appointmentType, // 'viewing', 'consultation', etc.
      seeker_id: seekerContext.seekerId, // Property seeker ID for logged-in users
      is_logged_in: seekerContext.is_logged_in,
      timestamp: nowIso()
    })
  }, [posthog, getSeekerContext, getListerContext])

  // ============================================
  // ADDITIONAL UTILITY EVENTS
  // ============================================
  /**
   * Track property search
   * @param {object} searchData - Search query and filters
   */
  const trackSearch = useCallback((searchData) => {
    captureAndQueue('property_search', {
      search_term: searchData.search,
      filters: {
        listing_type: searchData.listing_type,
        purpose: searchData.purpose,
        category: searchData.category,
        location: searchData.location,
        price_min: searchData.price_min,
        price_max: searchData.price_max,
        price_type: searchData.price_type
      },
      results_count: searchData.results_count,
      timestamp: nowIso()
    })
  }, [posthog])

  /**
   * Track listing creation (for developers/agents)
   * @param {object} listing - Listing data
   */
  const trackListingCreated = useCallback((listing) => {
    // Get the user ID - could be developer_id, agent_id, or generic user_id
    const userId = listing.user_id || listing.data?.user_id || listing.developer_id || listing.data?.developer_id || listing.agent_id || listing.data?.agent_id
    const accountType = listing.account_type || listing.data?.account_type
    
    captureAndQueue('listing_created', {
      listing_id: listing.id || listing.data?.id,
      listing_type: listing.listing_type || listing.data?.listing_type,
      account_type: accountType,
      // Send generic user_id and type-specific IDs for maximum compatibility
      user_id: userId,
      developer_id: accountType === 'developer' ? userId : listing.developer_id || listing.data?.developer_id,
      agent_id: accountType === 'agent' ? userId : listing.agent_id || listing.data?.agent_id,
      development_id: listing.development_id || listing.data?.development_id,
      has_3d_model: !!(listing['3d_model'] || listing.data?.['3d_model']),
      timestamp: nowIso()
    })
  }, [posthog])

  /**
   * Track listing update (for developers/agents)
   * @param {string} listingId - Listing ID
   * @param {object} changes - Changed fields
   */
  const trackListingUpdated = useCallback((listingId, changes) => {
    captureAndQueue('listing_updated', {
      listing_id: listingId,
      fields_changed: Object.keys(changes),
      timestamp: nowIso()
    })
  }, [posthog])

  /**
   * Track listing deletion (for developers/agents)
   * @param {string} listingId - Listing ID
   * @param {string} listingType - Type of listing
   */
  const trackListingDeleted = useCallback((listingId, listingType) => {
    captureAndQueue('listing_deleted', {
      listing_id: listingId,
      listing_type: listingType,
      timestamp: nowIso()
    })
  }, [posthog])

  /**
   * Track user login
   * @param {object} user - User data
   */
  const trackLogin = useCallback((user) => {
    posthog?.identify(user.id, {
      email: user.email,
      user_type: user.user_type,
      name: user.profile?.name,
      developer_id: user.profile?.developer_id,
      agent_id: user.profile?.agent_id
    })
    
    captureAndQueue('user_logged_in', {
      user_id: user.id, // Include user_id for proper tracking in Redis
      user_type: user.user_type,
      login_method: 'email',
      timestamp: nowIso()
    })
  }, [posthog])

  /**
   * Track user logout
   */
  const trackLogout = useCallback(() => {
    captureAndQueue('user_logged_out', {
      timestamp: nowIso()
    })
    posthog?.reset()
  }, [posthog])

  /**
   * Track development creation (for developers)
   * @param {object} development - Development data
   */
  const trackDevelopmentCreated = useCallback((development) => {
    captureAndQueue('development_created', {
      development_id: development.id,
      development_name: development.name,
      developer_id: development.developer_id,
      location: {
        city: development.city,
        state: development.state,
        country: development.country
      },
      timestamp: nowIso()
    })
  }, [posthog])

  /**
   * Track development view (when users view development pages)
   * @param {string} developmentId - The development ID
   * @param {object} context - Additional context
   */
  const trackDevelopmentView = useCallback((developmentId, context = {}) => {
    captureAndQueue('development_view', {
      development_id: developmentId,
      viewed_from: context.viewedFrom || 'unknown', // 'home', 'explore', 'development_page', 'search_results'
      developer_id: context.developerId,
      location: context.location,
      timestamp: nowIso()
    })
  }, [posthog])

  /**
   * Track development interaction (saves, shares, etc.)
   * @param {string} developmentId - The development ID
   * @param {string} action - Type of interaction
   * @param {object} context - Additional context
   */
  const trackDevelopmentInteraction = useCallback((developmentId, action, context = {}) => {
    captureAndQueue('development_interaction', {
      development_id: developmentId,
      action: action, // 'save', 'share', 'inquiry', 'contact'
      developer_id: context.developerId,
      platform: context.platform, // For shares
      timestamp: nowIso()
    })
  }, [posthog])

  /**
   * Track development lead (inquiries, contact forms, etc.)
   * @param {string} developmentId - The development ID
   * @param {string} leadType - Type of lead
   * @param {object} context - Additional context
   */
  const trackDevelopmentLead = useCallback((developmentId, leadType, context = {}) => {
    captureAndQueue('development_lead', {
      development_id: developmentId,
      lead_type: leadType, // 'inquiry', 'contact_form', 'phone', 'email'
      developer_id: context.developerId,
      contact_method: context.contactMethod,
      timestamp: nowIso()
    })
  }, [posthog])

  return {
    // Core Analytics (Main 4 categories)
    trackPropertyView,           // 1. Property Views
    trackListingImpression,      // 1. Property Views - Detailed impressions for property owners
    trackProfileView,            // 2. Profile Views
    trackSocialMediaClick,       // 3. Impressions - Social Media
    trackWebsiteClick,           // 3. Impressions - Website
    trackShare,                  // 3. Impressions - Share
    trackSavedListing,           // 3. Impressions - Saved Listing
    trackPhoneInteraction,       // 4. Leads - Phone
    trackMessageClick,           // 4. Leads - Messages
    trackAppointmentClick,       // 4. Leads - Appointments
    
    // Additional Utility Events
    trackSearch,
    trackListingCreated,
    trackListingUpdated,
    trackListingDeleted,
    trackLogin,
    trackLogout,
    
    // Development Analytics
    trackDevelopmentCreated,
    trackDevelopmentView,
    trackDevelopmentInteraction,
    trackDevelopmentLead
  }
}


