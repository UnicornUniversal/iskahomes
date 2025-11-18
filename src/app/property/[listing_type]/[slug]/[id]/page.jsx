'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useAnalytics } from '@/hooks/useAnalytics'
import { 
  MapPin, 
  Bed, 
  Bath, 
  Square, 
  Calendar, 
  DollarSign, 
  Users, 
  Phone, 
  Mail, 
  Globe,
  ArrowLeft,
  Share2,
  Heart,
  Eye,
  Star,
  CheckCircle,
  AlertCircle,
  Home,
  Car,
  Wifi,
  Shield,
  Clock,
  FileText,
  MessageCircle,
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  Map,
  Navigation
} from 'lucide-react'
import Property3DViewer from '@/app/components/propertyManagement/modules/Property3DViewer'
import LoadingSpinner from '@/app/components/ui/LoadingSpinner'
import PropertyContactForm from '@/app/components/PropertyContactForm'
import NearbyAmenities from '@/app/components/Listing/NearbyAmenities'
import ShareModal from '@/app/components/ui/ShareModal'
import SectionTracker from '@/app/components/property/SectionTracker'
import GalleryViewer from '@/app/components/property/GalleryViewer'
import { getAmenityIcon, getAmenityName } from '@/lib/StaticData'
import { toast } from 'react-toastify'

const PropertyDetailPage = () => {
  const params = useParams()
  const router = useRouter()
  const { listing_type, slug, id } = params
  const { user, propertySeekerToken } = useAuth()
  const analytics = useAnalytics()

  const [listing, setListing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [show3DModel, setShow3DModel] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [sendingMessage, setSendingMessage] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)

  useEffect(() => {
    const fetchListing = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/get-listing/${id}`)
        const result = await response.json()

        if (result.success) {
          // Parse JSON fields if they come as strings
          const listingData = { ...result.data }
          
          // Parse media if it's a string
          if (typeof listingData.media === 'string') {
            try {
              listingData.media = JSON.parse(listingData.media)
            } catch (e) {
              console.error('Error parsing media:', e)
            }
          }
          
          // Parse floor_plan if it's a string
          if (typeof listingData.floor_plan === 'string') {
            try {
              listingData.floor_plan = JSON.parse(listingData.floor_plan)
            } catch (e) {
              console.error('Error parsing floor_plan:', e)
            }
          }
          
          // Parse 3d_model if it's a string
          if (typeof listingData['3d_model'] === 'string') {
            try {
              listingData['3d_model'] = JSON.parse(listingData['3d_model'])
            } catch (e) {
              console.error('Error parsing 3d_model:', e)
            }
          }
          
          // Parse pricing if it's a string
          if (typeof listingData.pricing === 'string') {
            try {
              listingData.pricing = JSON.parse(listingData.pricing)
            } catch (e) {
              console.error('Error parsing pricing:', e)
            }
          }
          
          // Parse specifications if it's a string
          if (typeof listingData.specifications === 'string') {
            try {
              listingData.specifications = JSON.parse(listingData.specifications)
            } catch (e) {
              console.error('Error parsing specifications:', e)
            }
          }
          
          setListing(listingData)
          
          // Track property view and detailed impression
          if (listingData) {
            analytics.trackPropertyView(listingData.id, {
              viewedFrom: 'listing_page',
              listing: listingData, // Pass full listing object so lister_id can be extracted
              listingType: listingData.listing_type
            })

            analytics.trackListingImpression(listingData.id, {
              listing: listingData, // Pass full listing object so lister_id can be extracted
              listingType: listingData.listing_type,
              viewedFrom: 'listing_page',
              sessionId: Math.random().toString(36).substr(2, 9),
              propertyTitle: listingData.title,
              propertyPrice: listingData.price,
              propertyLocation: listingData.full_address || `${listingData.city}, ${listingData.state}`
            })
          }
        } else {
          setError(result.error || 'Listing not found')
        }
      } catch (err) {
        console.error('Error fetching listing:', err)
        setError('Failed to fetch listing')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchListing()
    }
  }, [id])

  // Check if listing is saved
  useEffect(() => {
    const checkSavedStatus = async () => {
      if (!user || !propertySeekerToken || user.user_type !== 'property_seeker') {
        return
      }

      try {
        const response = await fetch(`/api/saved-listings?listingId=${id}`, {
          headers: {
            'Authorization': `Bearer ${propertySeekerToken}`
          }
        })
        
        if (response.ok) {
          const result = await response.json()
          setIsSaved(result.data.isSaved)
        }
      } catch (error) {
        console.error('Error checking saved status:', error)
      }
    }

    if (id && user) {
      checkSavedStatus()
    }
  }, [id, user, propertySeekerToken])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Listing Not Found</h2>
          <p className="text-gray-600 mb-4">{error || 'The listing you are looking for does not exist.'}</p>
          <button
            onClick={() => router.back()}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  const {
    title,
    description,
    price,
    currency,
    price_type,
    duration,
    media,
    specifications,
    city,
    state,
    country,
    town,
    full_address,
    latitude,
    longitude,
    location_additional_information,
    amenities,
    available_from,
    available_until,
    is_featured,
    is_verified,
    is_premium,
    developers,
    relatedListings,
    propertySubtypes,
    listing_types,
    socialAmenities,
    cancellation_policy,
    is_negotiable,
    security_requirements,
    flexible_terms,
    acquisition_rules,
    additional_information,
    size,
    status,
    pricing
  } = listing

  // Parse pricing if it's a string
  const pricingData = pricing ? (typeof pricing === 'string' ? JSON.parse(pricing) : pricing) : null

  // Get all media files from albums structure (new) or mediaFiles (backward compatibility)
  const getAllMediaFiles = () => {
    const files = []
    
    // Check for new albums structure
    if (media?.albums && Array.isArray(media.albums)) {
      media.albums.forEach(album => {
        if (album?.images && Array.isArray(album.images)) {
          files.push(...album.images)
        }
      })
    }
    
    // Fallback to mediaFiles (backward compatibility)
    if (files.length === 0 && media?.mediaFiles && Array.isArray(media.mediaFiles)) {
      files.push(...media.mediaFiles)
    }
    
    return files
  }
  
  const mediaFiles = getAllMediaFiles()
  const mainImage = mediaFiles[selectedImageIndex]?.url || media?.banner?.url || mediaFiles[0]?.url
  
  // Get video from media structure
  const video = media?.video || null
  const youtubeUrl = media?.youtubeUrl || null
  const virtualTourUrl = media?.virtualTourUrl || null
  
  // Get floor plan (from separate field) - already parsed in useEffect
  const floorPlan = listing.floor_plan || null
  
  // Get 3D model (from separate field) - already parsed in useEffect
  const model3D = listing['3d_model'] || null

  // Format price - use pricing object if available, otherwise fallback to flat fields
  const formatPrice = () => {
    if (pricingData) {
      const priceNum = parseFloat(pricingData.price || price)
    const formattedPrice = priceNum.toLocaleString()
      const currencySymbol = pricingData.currency || currency || 'GHS'
      const durationText = pricingData.duration || duration || ''
      
      let priceText = `${currencySymbol} ${formattedPrice}`
      
      if (pricingData.price_type === 'rent' && durationText) {
        priceText += `/${durationText}`
      }
      
      return priceText
    }
    
    // Fallback to flat fields
    const priceNum = parseFloat(price)
    const formattedPrice = priceNum.toLocaleString()
    let priceText = `${currency} ${formattedPrice}`
    
    if (price_type === 'rent' && duration) {
      priceText += `/${duration}`
    }
    
    return priceText
  }

  // Get ALL specifications - return the full specifications object
  const getSpecifications = () => {
    if (!specifications) return {}
    
    // Return all specification fields, with fallbacks for common ones
    return {
      // Basic counts
      bedrooms: specifications.bedrooms || 0,
      bathrooms: specifications.bathrooms || 0,
      living_rooms: specifications.living_rooms || 0,
      kitchen: specifications.kitchen || 0,
      toilets: specifications.toilets || 0,
      
      // Size and location
      size: specifications.property_size || specifications.size || size || 0,
      floor_level: specifications.floor_level || 0,
      
      // Property details
      furnishing: specifications.furnishing || null,
      property_age: specifications.property_age || null,
      property_condition: specifications.property_condition || specifications.condition || null,
      building_style: specifications.building_style || null,
      compound_type: specifications.compound_type || null,
      
      // Kitchen details
      kitchen_type: specifications.kitchen_type || null,
      
      // Additional features
      number_of_balconies: specifications.number_of_balconies || 0,
      shared_electricity_meter: specifications.shared_electricity_meter || null,
      guest_room: specifications.guest_room || null,
      guest_washroom: specifications.guest_washroom || null,
      
      // Include any other fields that might exist
      ...specifications
    }
  }

  const specs = getSpecifications()
  
  // Helper to format specification labels
  const formatSpecLabel = (key) => {
    return key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
  }
  
  // Helper to check if a spec value should be displayed
  const shouldDisplaySpec = (key, value) => {
    if (value === null || value === undefined || value === '') return false
    if (typeof value === 'number' && value === 0 && !['floor_level', 'number_of_balconies'].includes(key)) return false
    return true
  }

  // Get listing types display
  const getListingTypes = () => {
    const types = []
    if (listing_types?.custom?.length > 0) {
      types.push(...listing_types.custom)
    }
    if (listing_types?.inbuilt?.length > 0) {
      types.push(...listing_types.inbuilt)
    }
    if (propertySubtypes?.length > 0) {
      types.push(...propertySubtypes.map(subtype => subtype.name))
    }
    return types
  }

  const listingTypes = getListingTypes()

  // Analytics tracking functions
  const handlePhoneClick = async (phoneNumber, context = 'listing') => {
    try {
      await navigator.clipboard.writeText(phoneNumber)
      
      // Ensure lister_id is always available - extract from listing or developers
      const listerId = listing?.user_id || developers?.developer_id || null
      const listerType = listing?.account_type || (developers?.developer_id ? 'developer' : null)
      
      analytics.trackPhoneInteraction('click', {
        contextType: context,
        listingId: id,
        listing: listing, // Pass full listing object so lister_id can be extracted
        lister_id: listerId, // Explicitly pass lister_id as fallback
        lister_type: listerType, // Explicitly pass lister_type as fallback
        phoneNumber: phoneNumber
      })
      toast.success('Phone number copied!')
    } catch (error) {
      console.error('Failed to copy phone number:', error)
      toast.error('Failed to copy phone number')
    }
  }

  const handleEmailClick = async (email, context = 'listing') => {
    try {
      await navigator.clipboard.writeText(email)
      
      // Ensure lister_id is always available - extract from listing or developers
      const listerId = listing?.user_id || developers?.developer_id || null
      const listerType = listing?.account_type || (developers?.developer_id ? 'developer' : null)
      
      analytics.trackMessageClick({
        contextType: context,
        listingId: id,
        listing: listing, // Pass full listing object so lister_id can be extracted
        lister_id: listerId, // Explicitly pass lister_id as fallback
        lister_type: listerType, // Explicitly pass lister_type as fallback
        messageType: 'email'
      })
      toast.success('Email copied!')
    } catch (error) {
      console.error('Failed to copy email:', error)
      toast.error('Failed to copy email')
    }
  }

  const handleWebsiteClick = (websiteUrl, context = 'listing') => {
      analytics.trackWebsiteClick(websiteUrl, {
      contextType: context,
      listingId: id,
      listing: listing // Pass full listing object so lister_id can be extracted
    })
  }

  const handleSocialMediaClick = (platform, url, context = 'listing') => {
    analytics.trackSocialMediaClick(platform, {
      contextType: context,
      listingId: id,
      listing: listing // Pass full listing object so lister_id can be extracted
    })
  }

  const handleShareClick = (platform) => {
    analytics.trackShare('listing', platform, {
      listingId: id,
      listing: listing // Pass full listing object so lister_id can be extracted
    })
  }

  const handleAppointmentClick = () => {
    analytics.trackAppointmentClick({
      contextType: 'listing',
      listingId: id,
      listing: listing, // Pass full listing object so lister_id can be extracted
      appointmentType: 'viewing'
    })
  }

  // Handle sending message to developer
  const handleSendMessage = async () => {
    // Ensure lister_id is always available - extract from listing or developers
    const listerId = listing?.user_id || developers?.developer_id || null
    const listerType = listing?.account_type || (developers?.developer_id ? 'developer' : null)
    
    // Track message click
    analytics.trackMessageClick({
      contextType: 'listing',
      listingId: id,
      listing: listing, // Pass full listing object so lister_id can be extracted
      lister_id: listerId, // Explicitly pass lister_id as fallback
      lister_type: listerType, // Explicitly pass lister_type as fallback
      messageType: 'direct_message'
    })

    // Check if user is logged in as property seeker
    if (!user || !propertySeekerToken || user.user_type !== 'property_seeker') {
      // Redirect to signup page
      router.push('/signup')
      return
    }

    setSendingMessage(true)
    try {
      // Create or find conversation with the developer (without first message)
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${propertySeekerToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          otherUserId: listing?.user_id || developers?.developer_id || developers?.agent_id,
          otherUserType: listing?.account_type || 'developer',
          listingId: id,
          conversationType: 'listing_inquiry',
          subject: `Inquiry about ${title}`
          // No firstMessage - user will type their own message
        })
      })

      if (response.ok) {
        const data = await response.json()
        // Redirect to messages page
        router.push(`/propertySeeker/${user.id}/messages`)
      } else {
        alert('Failed to open conversation. Please try again.')
      }
    } catch (error) {
      console.error('Error opening conversation:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setSendingMessage(false)
    }
  }

  // Handle save/unsave listing
  const handleSaveListing = async () => {
    // Check if user is logged in as property seeker
    if (!user || !propertySeekerToken || user.user_type !== 'property_seeker') {
      // Redirect to signup page
      router.push('/signup')
      return
    }

    const action = isSaved ? 'remove' : 'add'
    
    // Track saved listing action
    analytics.trackSavedListing(id, action, {
      listing: listing // Pass full listing object so lister_id can be extracted
    })

    setSaving(true)
    try {
      if (isSaved) {
        // Unsave the listing
        const response = await fetch(`/api/saved-listings?listingId=${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${propertySeekerToken}`
          }
        })

        if (response.ok) {
          setIsSaved(false)
          toast.success('Property removed from saved listings')
        } else {
          const errorData = await response.json()
          toast.error(errorData.error || 'Failed to remove from saved listings')
        }
      } else {
        // Save the listing
        const response = await fetch('/api/saved-listings', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${propertySeekerToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            listingId: id,
            notes: null
          })
        })

        if (response.ok) {
          setIsSaved(true)
          toast.success('Property saved successfully!')
        } else {
          const errorData = await response.json()
          toast.error(errorData.error || 'Failed to save property')
        }
      }
    } catch (error) {
      console.error('Error saving/unsaving listing:', error)
      toast.error('An error occurred. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Sticky Sidebar - Section Tracker */}
      <div className="hidden lg:block w-64 flex-shrink-0 px-4">
        <div className="sticky h-full top-8">
          <SectionTracker
            sections={[
              { id: 'gallery', label: 'Gallery', icon: 'gallery' },
              { id: 'description', label: 'Description', icon: 'description' },
              { id: 'pricing', label: 'Pricing', icon: 'pricing' },
              { id: 'specifications', label: 'Specifications', icon: 'specifications' },
              { id: 'completeSpecs', label: 'Complete Specs', icon: 'completeSpecs' },
              { id: 'amenities', label: 'Amenities', icon: 'amenities' },
              ...(additional_information ? [{ id: 'additionalInfo', label: 'Additional Info', icon: 'additionalInfo' }] : []),
              ...(acquisition_rules && acquisition_rules !== 'None' ? [{ id: 'acquisitionRules', label: 'Acquisition Rules', icon: 'acquisitionRules' }] : []),
              { id: 'location', label: 'Location', icon: 'location' }
            ]}
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1  mx-auto px-4 py-8">
        <div className="mx-auto space-y-8">
          {/* 1. Title, Price, Location, and Badges */}
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-4xl md:text-[4em] mb-3">{title}</h1>
                
                {/* Price and Status */}
                <div className="flex items-center gap-4 mb-3">
                  <div className="text-3xl ">
                    {formatPrice()}
                  </div>
                  {price_type && (
                    <span className={`px-4 py-1 rounded-full text-sm font-medium ${
                      price_type === 'rent' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {price_type === 'rent' ? 'FOR RENT' : price_type === 'sale' ? 'FOR SALE' : price_type.toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Location */}
                <div className="flex items-center text-gray-600 mb-4">
                  <MapPin className="w-5 h-5 mr-2 text-blue-600" />
                  <span className="text-base">
                    {full_address || `${town}, ${city}, ${state}, ${country}`}
                  </span>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {is_featured && (
                    <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium flex items-center">
                      <Star className="w-3 h-3 mr-1" />
                      Featured
                    </span>
                  )}
                  {is_verified && (
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium flex items-center">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Verified
                    </span>
                  )}
                  {is_premium && (
                    <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-medium">
                      Premium
                    </span>
                  )}
                  {is_negotiable && (
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
                      Negotiable
                    </span>
                  )}
                  {listingTypes.length > 0 && listingTypes.map((type, index) => (
                    <span key={index} className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-xs">
                      {type}
                    </span>
                  ))}
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center space-x-2 ml-6">
                <button 
                  onClick={() => setShowShareModal(true)}
                  className="flex items-center text-gray-600 hover:text-blue-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
                  title="Share"
                >
                  <Share2 className="w-5 h-5" />
                </button>
                <button 
                  onClick={handleSaveListing}
                  disabled={saving}
                  className={`flex items-center transition-colors p-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 ${
                    isSaved 
                      ? 'text-red-600' 
                      : 'text-gray-600 hover:text-red-600'
                  }`}
                  title={isSaved ? 'Saved' : 'Save'}
                >
                  <Heart className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {/* 4. Album */}
          <div id="gallery" className="scroll-mt-24">
            <GalleryViewer media={media} />
          </div>

          {/* After Album - Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-8">

              {/* Description */}
              <div id="description" className="scroll-mt-24 bg-white rounded-2xl shadow-xl p-8">
                <h3 className="text-2xl font-bold mb-4 text-gray-900">Description</h3>
                <p className="text-gray-700 leading-relaxed text-lg">{description}</p>
              </div>

              {/* Pricing Information */}
              {pricingData && (
              <div id="pricing" className="scroll-mt-24 bg-white rounded-2xl shadow-xl p-8">
                  <h3 className="text-2xl font-bold mb-6 text-gray-900">Pricing</h3>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Price</div>
                        <div className="text-2xl font-bold text-gray-900">
                          {pricingData.currency || currency} {parseFloat(pricingData.price || price).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Price Type</div>
                        <div className="text-lg font-semibold text-gray-900 capitalize">
                          {pricingData.price_type || price_type || 'N/A'}
                        </div>
                      </div>
                      {pricingData.duration && (
                        <div>
                          <div className="text-sm text-gray-600 mb-1">Duration</div>
                          <div className="text-lg font-semibold text-gray-900 capitalize">
                            {pricingData.duration}
                          </div>
                        </div>
                      )}
                      {pricingData.time && (
                        <div>
                          <div className="text-sm text-gray-600 mb-1">Time Period</div>
                          <div className="text-lg font-semibold text-gray-900">
                            {pricingData.time} {pricingData.time_span || ''}
                          </div>
                        </div>
                      )}
                      {pricingData.ideal_duration && (
                        <div>
                          <div className="text-sm text-gray-600 mb-1">Ideal Duration</div>
                          <div className="text-lg font-semibold text-gray-900">
                            {pricingData.ideal_duration} {pricingData.time_span || 'months'}
                          </div>
                        </div>
                      )}
                      {pricingData.security_requirements && (
                        <div className="md:col-span-2">
                          <div className="text-sm text-gray-600 mb-1">Security Requirements</div>
                          <div className="text-lg font-semibold text-gray-900">
                            {pricingData.security_requirements}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Specifications Grid - Key Metrics */}
              <div id="specifications" className="scroll-mt-24 bg-white rounded-2xl shadow-xl p-8">
                <h3 className="text-2xl font-bold mb-6 text-gray-900">Key Specifications</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                  {specs.bedrooms > 0 && (
                    <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                      <Bed className="w-8 h-8 mx-auto mb-3 text-blue-600" />
                      <div className="text-2xl font-bold text-gray-900">{specs.bedrooms}</div>
                      <div className="text-sm text-gray-600">Bedrooms</div>
                    </div>
                  )}
                  {specs.bathrooms > 0 && (
                    <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                      <Bath className="w-8 h-8 mx-auto mb-3 text-green-600" />
                      <div className="text-2xl font-bold text-gray-900">{specs.bathrooms}</div>
                      <div className="text-sm text-gray-600">Bathrooms</div>
                    </div>
                  )}
                  {specs.size > 0 && (
                    <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                      <Square className="w-8 h-8 mx-auto mb-3 text-purple-600" />
                      <div className="text-2xl font-bold text-gray-900">{specs.size}</div>
                      <div className="text-sm text-gray-600">
                        {listing_type === 'unit' ? 'sq ft' : 'sq m'}
                      </div>
                    </div>
                  )}
                  {specs.floor_level > 0 && (
                    <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl">
                      <div className="w-8 h-8 mx-auto mb-3 text-orange-600">🏢</div>
                      <div className="text-2xl font-bold text-gray-900">{specs.floor_level}</div>
                      <div className="text-sm text-gray-600">Floor Level</div>
                    </div>
                  )}
                  {specs.living_rooms > 0 && (
                    <div className="text-center p-6 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl">
                      <Home className="w-8 h-8 mx-auto mb-3 text-indigo-600" />
                      <div className="text-2xl font-bold text-gray-900">{specs.living_rooms}</div>
                      <div className="text-sm text-gray-600">Living Rooms</div>
                    </div>
                  )}
                  {specs.number_of_balconies > 0 && (
                    <div className="text-center p-6 bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl">
                      <div className="w-8 h-8 mx-auto mb-3 text-teal-600">🌿</div>
                      <div className="text-2xl font-bold text-gray-900">{specs.number_of_balconies}</div>
                      <div className="text-sm text-gray-600">Balconies</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Complete Specifications Details */}
              <div id="completeSpecs" className="scroll-mt-24 bg-white rounded-2xl shadow-xl p-8">
                <h3 className="text-2xl font-bold mb-6 text-gray-900">Complete Specifications</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Property Details Column */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Property Details</h4>
                  <div className="space-y-3">
                      {shouldDisplaySpec('furnishing', specs.furnishing) && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Furnishing:</span>
                      <span className="font-medium capitalize">{specs.furnishing}</span>
                    </div>
                      )}
                      {shouldDisplaySpec('property_condition', specs.property_condition) && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Condition:</span>
                          <span className="font-medium capitalize">{specs.property_condition}</span>
                    </div>
                      )}
                      {shouldDisplaySpec('property_age', specs.property_age) && (
                    <div className="flex justify-between">
                          <span className="text-gray-600">Property Age:</span>
                          <span className="font-medium capitalize">{specs.property_age}</span>
                    </div>
                      )}
                      {shouldDisplaySpec('building_style', specs.building_style) && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Building Style:</span>
                          <span className="font-medium capitalize">{specs.building_style}</span>
                        </div>
                      )}
                      {shouldDisplaySpec('compound_type', specs.compound_type) && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Compound Type:</span>
                          <span className="font-medium capitalize">{specs.compound_type}</span>
                        </div>
                      )}
                      {shouldDisplaySpec('size', specs.size) && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Size:</span>
                          <span className="font-medium">{specs.size} {listing_type === 'unit' ? 'sq ft' : 'sq m'}</span>
                    </div>
                      )}
                  </div>
                </div>

                  {/* Kitchen & Interior Column */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Kitchen & Interior</h4>
                    <div className="space-y-3">
                      {shouldDisplaySpec('kitchen_type', specs.kitchen_type) && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Kitchen Type:</span>
                          <span className="font-medium capitalize">{specs.kitchen_type.replace(/_/g, ' ')}</span>
                        </div>
                      )}
                      {shouldDisplaySpec('kitchen', specs.kitchen) && specs.kitchen > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Kitchens:</span>
                          <span className="font-medium">{specs.kitchen}</span>
                        </div>
                      )}
                      {shouldDisplaySpec('toilets', specs.toilets) && specs.toilets > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Toilets:</span>
                          <span className="font-medium">{specs.toilets}</span>
                        </div>
                      )}
                      {shouldDisplaySpec('guest_room', specs.guest_room) && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Guest Room:</span>
                          <span className="font-medium capitalize">{specs.guest_room}</span>
                        </div>
                      )}
                      {shouldDisplaySpec('guest_washroom', specs.guest_washroom) && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Guest Washroom:</span>
                          <span className="font-medium capitalize">{specs.guest_washroom}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Utilities & Features Column */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Utilities & Features</h4>
                    <div className="space-y-3">
                      {shouldDisplaySpec('shared_electricity_meter', specs.shared_electricity_meter) && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Electricity Meter:</span>
                          <span className="font-medium capitalize">{specs.shared_electricity_meter}</span>
                        </div>
                      )}
                      {/* Display any other specification fields that exist */}
                      {Object.entries(specs).map(([key, value]) => {
                        // Skip already displayed fields
                        const displayedFields = [
                          'bedrooms', 'bathrooms', 'size', 'floor_level', 'living_rooms', 
                          'number_of_balconies', 'furnishing', 'property_condition', 'property_age',
                          'building_style', 'compound_type', 'kitchen_type', 'kitchen', 'toilets',
                          'guest_room', 'guest_washroom', 'shared_electricity_meter'
                        ]
                        if (displayedFields.includes(key) || !shouldDisplaySpec(key, value)) return null
                        
                        return (
                          <div key={key} className="flex justify-between">
                            <span className="text-gray-600">{formatSpecLabel(key)}:</span>
                            <span className="font-medium">
                              {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : 
                               typeof value === 'string' ? value.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) :
                               value}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Amenities */}
              {amenities && (amenities.general?.length > 0 || amenities.database?.length > 0 || amenities.custom?.length > 0) && (
                <div id="amenities" className="mb-8 scroll-mt-24 bg-white rounded-2xl shadow-xl p-8">
                  <h3 className="text-2xl font-bold mb-6 text-gray-900">Amenities</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                     {amenities.general?.map((amenity, index) => (
                       <div key={index} className="flex items-center p-4 bg-blue-50 rounded-xl">
                         <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                           <span className="text-lg">{getAmenityIcon(amenity)}</span>
                         </div>
                         <span className="font-medium text-gray-900">
                           {getAmenityName(amenity)}
                         </span>
                       </div>
                     ))}
                    {amenities.database?.map((amenity, index) => (
                      <div key={index} className="flex items-center p-4 bg-green-50 rounded-xl">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <span className="font-medium text-gray-900">Custom Amenity</span>
                      </div>
                    ))}
                    {amenities.custom?.map((amenity, index) => (
                      <div key={index} className="flex items-center p-4 bg-purple-50 rounded-xl">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                          <Star className="w-5 h-5 text-purple-600" />
                        </div>
                        <span className="font-medium text-gray-900">{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Location Map - Via OpenStreetMap with full location details */}
              {(latitude && longitude) && (
                <div id="location" className="mb-8 scroll-mt-24 bg-white rounded-2xl shadow-xl p-8">
                  <h3 className="text-2xl font-bold mb-6 text-gray-900">Location</h3>
                  <div className="bg-gray-100 rounded-xl p-6 h-96 flex items-center justify-center mb-4">
                    <iframe
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      scrolling="no"
                      marginHeight="0"
                      marginWidth="0"
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(longitude) - 0.01},${parseFloat(latitude) - 0.01},${parseFloat(longitude) + 0.01},${parseFloat(latitude) + 0.01}&layer=mapnik&marker=${latitude},${longitude}`}
                      className="rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-start">
                      <MapPin className="w-5 h-5 mr-2 text-blue-600 mt-1 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-gray-900">Full Address</p>
                        <p className="text-gray-700">{full_address || `${town}, ${city}, ${state}, ${country}`}</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <Navigation className="w-5 h-5 mr-2 text-blue-600 mt-1 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-gray-900">Coordinates</p>
                        <p className="text-gray-700">{latitude}, {longitude}</p>
                      </div>
                    </div>
                    {location_additional_information && (
                      <div className="mt-4 bg-blue-50 p-4 rounded-xl">
                        <p className="text-gray-700">{location_additional_information}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Video and YouTube */}
              {(video?.url || youtubeUrl) && (
                <div className="mb-8 bg-white rounded-2xl shadow-xl p-8">
                  <h3 className="text-2xl font-bold mb-6 text-gray-900">Property Video</h3>
                  {video?.url ? (
                    <div className="rounded-xl overflow-hidden">
                      <video
                        src={video.url}
                        controls
                        className="w-full h-auto max-h-[500px]"
                        poster={mainImage}
                      >
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  ) : youtubeUrl ? (
                    <div className="rounded-xl overflow-hidden">
                      <iframe
                        src={youtubeUrl.replace('watch?v=', 'embed/').split('&')[0]}
                        className="w-full aspect-video"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : null}
                </div>
              )}

              {/* Social Amenities */}
              {socialAmenities && (
                <NearbyAmenities 
                  socialAmenities={socialAmenities}
                  city={city}
                  state={state}
                />
              )}
            </div>

            {/* Right Column - PropertyContactForm */}
            <div className="lg:col-span-1">
              <div className="sticky top-8">
                <div className="bg-white rounded-2xl shadow-xl p-6">
                  <PropertyContactForm 
                    propertyId={id}
                    propertyTitle={title}
                    propertyType={listing_type}
                    developer={developers}
                    listing={listing}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Rest of Content After Two Column Layout */}
          <div className="space-y-8">
            {/* Additional Information */}
            {additional_information && (
              <div id="additionalInfo" className="scroll-mt-24 bg-white rounded-2xl shadow-xl p-8">
                <h3 className="text-2xl font-bold mb-4 text-gray-900">Additional Information</h3>
                <div className="bg-gray-50 p-6 rounded-xl">
                  <p className="text-gray-700 leading-relaxed">{additional_information}</p>
                </div>
              </div>
            )}

            {/* Acquisition Rules */}
            {acquisition_rules && acquisition_rules !== 'None' && (
              <div id="acquisitionRules" className="scroll-mt-24 bg-white rounded-2xl shadow-xl p-8">
                <h3 className="text-2xl font-bold mb-4 text-gray-900">Acquisition Rules</h3>
                <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-200">
                  <p className="text-gray-700 leading-relaxed">{acquisition_rules}</p>
                </div>
              </div>
            )}

            {/* Related Listings */}
            {relatedListings && relatedListings.length > 0 && (
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h3 className="text-2xl font-bold mb-6 text-gray-900">More from {developers?.name}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {relatedListings.slice(0, 6).map((related) => (
                    <Link
                      key={related.id}
                      href={`/property/${related.listing_type}/${related.slug}/${related.id}`}
                      className="group block"
                    >
                      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 group-hover:scale-105">
                        <div className="h-48 bg-gray-200">
                          {related.media?.mediaFiles?.[0]?.url ? (
                            <img
                              src={related.media.mediaFiles[0].url}
                              alt={related.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500">
                              {related.title?.charAt(0) || 'P'}
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">{related.title}</h4>
                          <p className="text-sm text-gray-600 mb-2">
                            {related.city}, {related.state}
                          </p>
                          <p className="text-lg font-bold text-blue-600">
                            {formatPrice(related.price, related.currency, related.price_type, related.duration)}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
                {relatedListings.length > 6 && (
                  <div className="text-center mt-6">
                    <Link
                      href={`/allDevelopers/${developers?.slug}`}
                      className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                    >
                      View All Properties ({relatedListings.length})
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>


      {/* 3D Model Overlay */}
      {show3DModel && model3D?.url && (
        <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-sm">
          <div className="relative w-full h-full">
            {/* Close Button */}
            <button
              onClick={() => setShow3DModel(false)}
              className="absolute top-6 right-6 z-10 bg-white/90 backdrop-blur-sm hover:bg-white text-gray-900 p-3 rounded-full shadow-lg transition-all duration-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* 3D Model Container */}
            <div className="w-full h-full p-8">
              <div className="w-full h-full bg-white rounded-2xl shadow-2xl overflow-hidden">
                <div className="h-full">
                  <Property3DViewer 
                    modelData={model3D} 
                    unitTitle={title}
                  />
                </div>
              </div>
            </div>

            {/* Controls Info */}
            <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-sm text-gray-900 px-4 py-2 rounded-lg shadow-lg">
              <div className="text-sm font-medium mb-1">3D Viewer Controls</div>
              <div className="text-xs text-gray-600">
                Drag to rotate • Scroll to zoom • Right-click to pan
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      <ShareModal 
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        property={listing}
      />
    </div>
  )
}

export default PropertyDetailPage