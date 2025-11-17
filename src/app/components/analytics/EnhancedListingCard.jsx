/**
 * Enhanced Listing Card with Comprehensive Analytics
 * 
 * This component demonstrates how to use the enhanced analytics system
 * with automatic property seeker ID tracking for logged-in users.
 * 
 * Key Features:
 * - Automatic seeker_id tracking for logged-in property seekers
 * - Detailed impression tracking for property owners
 * - Comprehensive interaction tracking
 * - Session-based analytics
 */

'use client'

import { useAnalytics } from '@/hooks/useAnalytics'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'react-toastify'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function EnhancedListingCard({ listing }) {
  const analytics = useAnalytics()
  const { user } = useAuth()
  const router = useRouter()
  const [isSaved, setIsSaved] = useState(false)
  const [sessionId] = useState(() => Math.random().toString(36).substr(2, 9))

  // Track listing impression when component mounts
  useEffect(() => {
    if (listing?.id) {
      // Track detailed impression for property owners
      analytics.trackListingImpression(listing.id, {
        listing: listing, // Pass full listing object so lister_id can be extracted
        listingType: listing.listing_type,
        viewedFrom: 'home', // or 'explore', 'search_results'
        sessionId: sessionId,
        propertyTitle: listing.title,
        propertyPrice: listing.price,
        propertyLocation: listing.location
      })

      // Also track the general property view
      analytics.trackPropertyView(listing.id, {
        listing: listing, // Pass full listing object so lister_id can be extracted
        listingType: listing.listing_type,
        viewedFrom: 'home'
      })
    }
  }, [listing?.id, analytics, sessionId])

  // Handle card click - track view and navigate
  const handleCardClick = () => {
    // Track the click as a property view
    analytics.trackPropertyView(listing.id, {
      listing: listing, // Pass full listing object so lister_id can be extracted
      listingType: listing.listing_type,
      viewedFrom: 'home'
    })

    // Navigate to listing detail page
    router.push(`/property/${listing.listing_type}/${listing.id}`)
  }

  // Handle save/unsave listing
  const handleToggleSaved = async (e) => {
    e.stopPropagation() // Prevent card click
    
    const action = isSaved ? 'remove' : 'add'
    
    // Track the save/unsave action
    analytics.trackSavedListing(listing.id, action, {
      listing: listing // Pass full listing object so lister_id can be extracted
    })
    
    // Update backend
    try {
      await fetch('/api/saved-listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          listingId: listing.id, 
          action: action 
        })
      })
      
      setIsSaved(!isSaved)
    } catch (error) {
      console.error('Error updating saved listing:', error)
    }
  }

  // Handle share action
  const handleShare = (e, platform) => {
    e.stopPropagation()
    
    // Track the share action
    analytics.trackShare('listing', platform, {
      listingId: listing.id,
      listing: listing // Pass full listing object so lister_id can be extracted
    })
    
    // Implement share logic
    const url = `${window.location.origin}/property/${listing.listing_type}/${listing.id}`
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
        break
    }
  }

  // Handle phone click
  const handlePhoneClick = async (e) => {
    e.stopPropagation()
    
    try {
      await navigator.clipboard.writeText(listing.phone)
      
      // Track phone interaction
      analytics.trackPhoneInteraction('click', {
        contextType: 'listing',
        listingId: listing.id,
        listing: listing, // Pass full listing object so lister_id can be extracted
        phoneNumber: listing.phone
      })
      
      toast.success('Phone number copied!')
    } catch (error) {
      console.error('Failed to copy phone number:', error)
      toast.error('Failed to copy phone number')
    }
  }

  // Handle message click
  const handleMessageClick = (e) => {
    e.stopPropagation()
    
    // Track message click
    analytics.trackMessageClick({
      contextType: 'listing',
      listingId: listing.id,
      listing: listing, // Pass full listing object so lister_id can be extracted
      messageType: 'direct_message'
    })
    
    // Navigate to messages
    router.push(`/messages?listing=${listing.id}`)
  }

  // Handle WhatsApp click
  const handleWhatsAppClick = (e) => {
    e.stopPropagation()
    
    // Track WhatsApp message
    analytics.trackMessageClick({
      contextType: 'listing',
      listingId: listing.id,
      listing: listing, // Pass full listing object so lister_id can be extracted
      messageType: 'whatsapp'
    })
    
    const message = `Hi! I'm interested in ${listing.title}`
    window.open(`https://wa.me/${listing.whatsapp}?text=${encodeURIComponent(message)}`)
  }

  // Handle appointment booking
  const handleAppointmentClick = (e) => {
    e.stopPropagation()
    
    // Track appointment click
    analytics.trackAppointmentClick({
      contextType: 'listing',
      listingId: listing.id,
      listing: listing, // Pass full listing object so lister_id can be extracted
      appointmentType: 'viewing'
    })
    
    // Navigate to appointment booking
    router.push(`/appointments/book?listing=${listing.id}`)
  }

  return (
    <div 
      className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
      onClick={handleCardClick}
    >
      {/* Property Image */}
      <div className="relative">
        <img 
          src={listing.image || '/placeholder-property.jpg'} 
          alt={listing.title}
          className="w-full h-48 object-cover"
        />
        
        {/* Save Button */}
        <button
          onClick={handleToggleSaved}
          className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-50"
        >
          {isSaved ? '💾' : '💾'}
        </button>
      </div>

      {/* Property Details */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {listing.title}
        </h3>
        
        <p className="text-gray-600 text-sm mb-2">
          {listing.location}
        </p>
        
        <p className="text-xl font-bold text-blue-600 mb-3">
          {listing.price}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          {/* Phone Button */}
          {listing.phone && (
            <button
              onClick={handlePhoneClick}
              className="flex-1 bg-green-500 text-white px-3 py-2 rounded text-sm hover:bg-green-600"
              title="Click to copy phone number"
            >
              📞 Copy
            </button>
          )}

          {/* Message Button */}
          <button
            onClick={handleMessageClick}
            className="flex-1 bg-blue-500 text-white px-3 py-2 rounded text-sm hover:bg-blue-600"
          >
            💬 Message
          </button>

          {/* WhatsApp Button */}
          {listing.whatsapp && (
            <button
              onClick={handleWhatsAppClick}
              className="flex-1 bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700"
            >
              📱 WhatsApp
            </button>
          )}

          {/* Appointment Button */}
          <button
            onClick={handleAppointmentClick}
            className="flex-1 bg-purple-500 text-white px-3 py-2 rounded text-sm hover:bg-purple-600"
          >
            📅 Book Viewing
          </button>
        </div>

        {/* Share Buttons */}
        <div className="mt-3 flex gap-2">
          <button
            onClick={(e) => handleShare(e, 'whatsapp')}
            className="px-3 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
          >
            Share WhatsApp
          </button>
          <button
            onClick={(e) => handleShare(e, 'facebook')}
            className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
          >
            Share Facebook
          </button>
          <button
            onClick={(e) => handleShare(e, 'link')}
            className="px-3 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
          >
            Copy Link
          </button>
        </div>

        {/* Analytics Info (for debugging - remove in production) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
            <p><strong>Analytics Debug:</strong></p>
            <p>User Type: {user?.user_type || 'Anonymous'}</p>
            <p>Seeker ID: {user?.user_type === 'property_seeker' ? user.id : 'N/A'}</p>
            <p>Session ID: {sessionId}</p>
          </div>
        )}
      </div>
    </div>
  )
}
