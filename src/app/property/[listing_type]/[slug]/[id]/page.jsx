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
  Navigation,
  Box
} from 'lucide-react'
import Property3DViewer from '@/app/components/propertyManagement/modules/Property3DViewer'
import LoadingSpinner from '@/app/components/ui/LoadingSpinner'
import PropertyContactForm from '@/app/components/PropertyContactForm'
import NearbyAmenities from '@/app/components/Listing/NearbyAmenities'
import ShareModal from '@/app/components/ui/ShareModal'
import SectionTracker from '@/app/components/property/SectionTracker'
import GalleryViewer from '@/app/components/property/GalleryViewer'
import ListingList from '@/app/components/Listing/ListingList'
import { getAmenityIcon, getAmenityName, getAmenityById } from '@/lib/StaticData'
import { getSpecificationDataByTypeName, getSpecificationDataByTypeId, getFieldDataByKey } from '@/app/components/Data/StaticData'
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
  const [showContactModal, setShowContactModal] = useState(false)

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
          
          // Parse types if it's a string
          if (typeof listingData.types === 'string') {
            try {
              listingData.types = JSON.parse(listingData.types)
            } catch (e) {
              console.error('Error parsing types:', e)
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
          <h2 className="text-2xl font-semibold -900 mb-2">Listing Not Found</h2>
          <p className="-600 mb-4">{error || 'The listing you are looking for does not exist.'}</p>
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
    types,
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
  
  // Get property type ID from types field (primary method)
  const getPropertyTypeId = () => {
    // Try types field first (contains property type IDs)
    if (types && Array.isArray(types) && types.length > 0) {
      return types[0] // Use first type ID
    }
    
    // Fallback: try to get from propertySubtypes if it has type IDs
    if (propertySubtypes && propertySubtypes.length > 0) {
      const firstSubtype = propertySubtypes[0]
      if (firstSubtype?.id) return firstSubtype.id
      if (typeof firstSubtype === 'string') return firstSubtype
    }
    
    return null
  }
  
  const propertyTypeId = getPropertyTypeId()
  
  // Get specification data based on property type ID (preferred) or name (fallback)
  const specData = propertyTypeId 
    ? getSpecificationDataByTypeId(propertyTypeId)
    : getSpecificationDataByTypeName(listing_type || '')
  
  // Helper to get icon for a specification field
  const getSpecIcon = (key) => {
    if (!specData) return null
    
    const field = specData.fields.find(f => f.key === key)
    if (field && field.icon) {
      const IconComponent = field.icon
      return <IconComponent className="box_holder w-10 h-10 " />
    }
    return null
  }
  
  // Helper to format specification labels
  const formatSpecLabel = (key) => {
    if (!specData) {
      return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    }
    
    const field = specData.fields.find(f => f.key === key)
    return field ? field.label : key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
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
      <div className="hidden lg:block w-64 flex-shrink-0">
        <div className="sticky top-0 h-screen   border-r border-r-primary_color/10 ">
          <div className="">
            <SectionTracker
            sections={[
              { id: 'intro', label: 'Intro', icon: 'intro' },
              { id: 'gallery', label: 'Gallery', icon: 'gallery' },
              { id: 'description', label: 'Description', icon: 'description' },
              { id: 'pricing', label: 'Pricing', icon: 'pricing' },
              { id: 'specifications', label: 'Specifications', icon: 'specifications' },
              { id: 'amenities', label: 'Amenities', icon: 'amenities' },
              ...(additional_information ? [{ id: 'additionalInfo', label: 'Additional Info', icon: 'additionalInfo' }] : []),
              { id: 'location', label: 'Location', icon: 'location' }
            ]}
          />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1  mx-auto px-4 py-8">
        <div className="mx-auto space-y-8">
          {/* 1. Title, Price, Location, and Badges */}
          <div id="intro" className="scroll-mt-24 space-y-4">
            <div className="flex items-start justify-between flex-col md:flex-row">
              <div className="flex-1">
                <h1 className="text-4xl md:text-[4em] mb-3">{title}</h1>
                
                {/* Price and Status */}
                <div className="flex items-center gap-4 mb-3">
                  <h4 className="text-3xl ">
                    {formatPrice()}
                  </h4>
                  {price_type && (
                    <p className={`px-4 py-1 rounded-full text-sm font-medium ${
                      price_type === 'rent' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {price_type === 'rent' ? 'For Rent' : price_type === 'sale' ? 'For Sale' : price_type.toUpperCase()}
                    </p>
                  )}
                </div>

                {/* Location */}
                <div className="flex items-center -600 mb-4">
                  <MapPin className="w-5 h-5 mr-2 text-blue-600" />
                  <p className="text-base">
                    {full_address || `${town}, ${city}, ${state}, ${country}`}
                  </p>
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
                    <span key={index} className="bg-gray-100 -800 px-3 py-1 rounded-full text-xs">
                      {type}
                    </span>
                  ))}
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center space-x-2 ml-6">
                <button 
                  onClick={() => setShowShareModal(true)}
                  className="flex items-center -600 bg-white text-primary_color hover:text-blue-600 transition-colors p-2 = rounded-lg"
                  title="Share"
                >
                  <Share2 className="w-5 h-5" />
                </button>
                <button 
                  onClick={handleSaveListing}
                  disabled={saving}
                  className={`flex items-center transition-colors bg-white   p-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed  ${
                    isSaved 
                      ? 'text-red-600' 
                      : '-600 hover:text-red-600 '
                  }`}
                  title={isSaved ? 'Saved' : 'Save'}
                >
                  <Heart className={`w-5 h-5 ${isSaved ? 'fill-current' : 'text-primary_color'}`} />
                </button>
              </div>
            </div>
          </div>

          {/* 4. Album */}
          <div id="gallery" className="scroll-mt-24">
            <GalleryViewer media={media} />
          </div>

          {/* After Album - Two Column Layout */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 w-full">
            {/* Left Column - Main Content */}
            <div className="xl:col-span-2 space-y-8">

              {/* Description */}
              <div id="description" className="scroll-mt-24 flex gap-[3em]">
                <h3 className="text-2xl font-semibold mb-4 -900">Description</h3>
                <div className="whitespace-pre-line text-gray-700 leading-relaxed space-y-4">
                  {description?.split('\n').map((paragraph, index) => (
                    paragraph.trim() && (
                      <p key={index} className="mb-4">{paragraph}</p>
                    )
                  ))}
                  <br/>
                    {floorPlan && (
                <div className="scroll-mt-24">
                  <h3 className="text-2xl font-semibold mb-4 -900">Floor Plan</h3>
                  <div className="bg-gray-50 rounded-lg p-6">
                    {Array.isArray(floorPlan) ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {floorPlan.map((plan, index) => (
                          <div key={index} className="relative aspect-square bg-white rounded-lg overflow-hidden border border-gray-200 max-w-[500px]">
                            {plan?.url ? (
                              <img
                                src={plan.url}
                                alt={`Floor plan ${index + 1}`}
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                Floor Plan {index + 1}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : floorPlan?.url ? (
                      <div className="relative aspect-square bg-white rounded-lg overflow-hidden border border-gray-200 max-w-[500px] mx-auto">
                        <img
                          src={floorPlan.url}
                          alt="Floor plan"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    ) : null}
                  </div>
                </div>
              )}
                </div>


                  {/* Floor Plan */}
            
              </div>

            

              {/* Pricing & Availability */}
              {(pricingData || price) && (
              <div id="pricing" className="scroll-mt-24">
                  <h3 className="text-2xl font-semibold mb-6 ">Pricing & Availability</h3>
                  
                  <div className="space-y-6">
                    {(() => {
                      const currencyLabel = (pricingData?.currency || currency || 'GHS').toUpperCase()
                      const basePrice = parseFloat(pricingData?.price || price || 0)
                      const formattedPrice = `${currencyLabel} ${basePrice.toLocaleString()}`
                      const isRent = (pricingData?.price_type || price_type) === 'rent'
                      const billingPeriod = pricingData?.duration || duration || (isRent ? 'month' : '')
                      const priceDisplay = isRent
                        ? `${formattedPrice} / ${billingPeriod}`
                        : formattedPrice

                      let idealLabel = null
                      let idealValue = null
                      if (pricingData?.ideal_duration) {
                        const idealSpan = pricingData.time_span || 'months'
                        idealLabel = `Ideal Duration: ${pricingData.ideal_duration} ${idealSpan}`

                        if (isRent && billingPeriod.toLowerCase().includes('month')) {
                          const yearlyTotal = basePrice * 12
                          idealValue = `${currencyLabel} ${yearlyTotal.toLocaleString()} / year`
                        } else {
                          idealValue = `${formattedPrice} ${billingPeriod ? `/ ${billingPeriod}` : ''}`.trim()
                        }
                      }

                      return (
                        <div className="border-b border-gray-200 pb-6">
                          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                            <div>
                              <p className="text-sm uppercase tracking-wide font-medium mb-2">Price</p>
                              <p className="text-4xl md:text-5xl font-light">{priceDisplay}</p>
                            </div>
                            {idealLabel && (
                              <div>
                                <p className="text-sm uppercase tracking-wide font-medium mb-2">{idealLabel}</p>
                                <p className="text-3xl font-light">{idealValue}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })()}

                    {/* Additional Pricing Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {is_negotiable !== undefined && (
                        <p className=" italic">{is_negotiable ? 'Negotiable' : 'Non-negotiable'}</p>
                      )}

{available_from && (
                        <div>
                          <p className="text-sm font-medium mb-1">Available From</p>
                          <p>
                            {new Date(available_from).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                          </p>
                        </div>
                      )}
                      
                      {available_until && (
                        <div>
                          <p className="text-sm font-medium mb-1">Available Until</p>
                          <p>
                            {new Date(available_until).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                          </p>
                        </div>
                      )}
                      
                      
                      {security_requirements && (
                        <div>
                          <p className="text-sm font-medium mb-1">Security Deposit</p>
                          <p>{security_requirements}</p>
                        </div>
                      )}
                      
                      {cancellation_policy && (
                        <div>
                          <p className="text-sm font-medium mb-1">Cancellation Policy</p>
                          <p>{cancellation_policy}</p>
                        </div>
                      )}
                      
                     
                      {pricingData?.security_requirements && (
                        <div>
                          <p className="text-sm font-medium mb-1">Security Requirements</p>
                          <p>{pricingData.security_requirements}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Unified Specifications */}
              <div id="specifications" className="scroll-mt-24 rounded-2xl ">
                <h3 className="text-2xl font-semibold mb-6 ">Specifications</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {Object.entries(specs).map(([key, value]) => {
                    if (!shouldDisplaySpec(key, value)) return null
                    
                    const icon = getSpecIcon(key)
                    const label = formatSpecLabel(key)
                    
                    // Format the value
                    let displayValue = value
                    if (typeof value === 'number') {
                      // For size, add unit
                      if (key === 'size' || key === 'property_size') {
                        displayValue = `${value} ${listing_type === 'unit' ? 'sq ft' : 'sq m'}`
                      } else {
                        displayValue = value.toString()
                      }
                    } else if (typeof value === 'string') {
                      // Capitalize and replace underscores
                      displayValue = value.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                    } else if (typeof value === 'boolean') {
                      displayValue = value ? 'Yes' : 'No'
                    }
                    
                    // Skip if no icon found (fallback to not showing)
                    if (!icon) return null
                    
                    return (
                      <div 
                        key={key} 
                        className=" flex p-4 text-left gap-2"
                      >
                      
                            {icon}
                       
                        <div className="flex flex-col items-start">
                        <p className="text-lg font-semibold text-[0.7em] mb-1">{label}</p>
                        <p className="text-base font-medium ">{displayValue}</p>
                      
                        </div>
                      
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Amenities */}
              {amenities && (amenities.general?.length > 0 || amenities.database?.length > 0 || amenities.custom?.length > 0) && (
                <div id="amenities" className="scroll-mt-24 rounded-2xl">
                  <h3 className="text-2xl font-semibold mb-6">Amenities</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                     {amenities.general?.map((amenity, index) => {
                       const amenityData = getAmenityById(amenity)
                       const IconComponent = amenityData?.icon
                       const amenityName = getAmenityName(amenity)
                       return (
                         <div key={index} className="flex items-center p-4 text-left gap-2">
                           {IconComponent && <IconComponent className="box_holder w-10 h-10" />}
                          
                             <p className="">{amenityName}</p>
                          
                         </div>
                       )
                     })}
                    {amenities.database?.map((amenity, index) => (
                      <div key={index} className="flex p-4 text-left gap-2">
                        <CheckCircle className="box_holder w-10 h-10" />
                        <div className="flex flex-col items-start">
                          <p className="text-lg font-semibold text-[0.7em] mb-1">Custom Amenity</p>
                        </div>
                      </div>
                    ))}
                    {amenities.custom?.map((amenity, index) => (
                      <div key={index} className="flex p-4 text-left gap-2">
                        <Star className="box_holder w-10 h-10" />
                        <div className="flex flex-col items-start">
                          <p className="text-lg font-semibold text-[0.7em] mb-1">{amenity}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Location Map - Via OpenStreetMap with full location details */}
              {(latitude && longitude) && (
                <div id="location" className="mb-8 scroll-mt-24  rounded-2xl  ">
                  <h3 className="text-2xl font-semibold mb-6 -900">Location</h3>
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
                  <div className="space-y-3">
                    {full_address && (
                      <div className="flex items-start">
                        <MapPin className="w-5 h-5 mr-2 text-blue-600 mt-1 flex-shrink-0" />
                        <div>
                          <p className="font-semibold -900">Full Address</p>
                          <p className="-700">{full_address}</p>
                        </div>
                      </div>
                    )}
                    {(town || city || state || country) && (
                      <div className="flex items-start">
                        <MapPin className="w-5 h-5 mr-2 text-blue-600 mt-1 flex-shrink-0" />
                        <div>
                          <p className="font-semibold -900">Location Details</p>
                          <p className="-700">
                            {[town, city, state, country].filter(Boolean).join(', ')}
                          </p>
                        </div>
                      </div>
                    )}
                    {location_additional_information && (
                      <div className="mt-4 bg-blue-50 p-4 rounded-xl">
                        <p className="-700">{location_additional_information}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}



 {/* Video and YouTube */}
{/* Video and YouTube Section */}
{(video?.url || youtubeUrl) && (
  <div className="mb-12 relative">
    <h3 className="text-2xl font-semibold mb-6">Property Video</h3>
    
    <div className="flex flex-col">
      
      {/* 1. BOTTOM CARD (Uploaded Video) */}
      {/* This STICKS. It waits for the YouTube video to slide over it. */}
      {video?.url && (
        <div className={`w-full overflow-hidden  shadow-lg bg-white/50  
          ${youtubeUrl ? 'sticky top-24 z-0 mb-4' : 'relative'}`} // Add margin-bottom (mb-4) to create a small gap before overlap
        >
          <video
            src={video.url}
            controls
            className="w-full h-auto max-h-[500px] object-contain"
            poster={mainImage}
          >
            Your browser does not support the video tag.
          </video>
        </div>
      )}

      {/* 2. TOP CARD (YouTube) */}
      {/* This SCROLLS over the top. Needs bg-white to hide the video behind it. */}
      {youtubeUrl && (
        <div className="relative z-10 w-full overflow-hidden shadow-lg bg-white">
          <iframe
            src={youtubeUrl.replace('watch?v=', 'embed/').split('&')[0]}
            className="w-full aspect-video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}
      
    </div>
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

            {/* Right Column - PropertyContactForm - Only on XL devices */}
            <div className="hidden xl:block xl:col-span-1">
              <div className="sticky top-2">
                <div className=" rounded-2xl  p-6">
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

          {/* PropertyContactForm at Bottom - For Small/Medium/Large devices (not XL) */}
          <div className="xl:hidden mt-8">
            <PropertyContactForm 
              propertyId={id}
              propertyTitle={title}
              propertyType={listing_type}
              developer={developers}
              listing={listing}
            />
          </div>

          {/* Rest of Content After Two Column Layout */}
          <div className="space-y-8">
            {/* Additional Information */}
            {additional_information && (
              <div id="additionalInfo" className="scroll-mt-24  rounded-2xl  ">
                <h3 className="text-2xl font-semibold mb-4 -900">Additional Information</h3>
                <div className="bg-gray-50 p-6 rounded-xl">
                  <p className="-700 leading-relaxed">{additional_information}</p>
                </div>
              </div>
            )}

            {/* Acquisition Rules */}
            {acquisition_rules && acquisition_rules !== 'None' && (
              <div id="acquisitionRules" className="scroll-mt-24  rounded-2xl  ">
                <h3 className="text-2xl font-semibold mb-4 -900">Acquisition Rules</h3>
                <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-200">
                  <p className="-700 leading-relaxed">{acquisition_rules}</p>
                </div>
              </div>
            )}

            {/* Related Listings */}
            {relatedListings && relatedListings.length > 0 && (
              <div className=" rounded-2xl  ">
                <h3 className="text-2xl font-semibold mb-6 -900">More from {developers?.name}</h3>
                <ListingList listings={relatedListings.slice(0, 6)} />
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


      {/* 3D Model Overlay - Premium Design */}
      {show3DModel && model3D?.url && (
        <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-slate-900/20 via-gray-900/15 to-slate-800/20 backdrop-blur-xl">
          <div className="relative w-full h-full flex items-center justify-center p-8">
            {/* Elegant Close Button */}
            <button
              onClick={() => setShow3DModel(false)}
              className="absolute top-8 right-8 z-20 group"
              aria-label="Close 3D Model"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-white/10 backdrop-blur-md rounded-full group-hover:bg-white/20 transition-all duration-300 w-12 h-12"></div>
                <div className="relative w-12 h-12 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white group-hover:text-gray-200 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>
            </button>

            {/* Premium 3D Model Container with Elegant Frame */}
            <div className="w-full max-w-7xl h-full max-h-[90vh] relative">
              {/* Outer Glow Effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-white/10 via-white/5 to-transparent rounded-3xl blur-2xl opacity-50"></div>
              
              {/* Main Container */}
              <div className="relative w-full h-full bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
                {/* Top Gradient Overlay */}
                <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/20 to-transparent z-10 pointer-events-none"></div>
                
                {/* Bottom Gradient Overlay */}
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/20 to-transparent z-10 pointer-events-none"></div>
                
                {/* 3D Model */}
                <div className="w-full h-full">
                  <Property3DViewer 
                    modelData={model3D} 
                    unitTitle={title}
                    hideTitle={true}
                    hideControls={true}
                  />
                </div>
              </div>
            </div>

            {/* Premium Controls Info - Bottom Left */}
            <div className="absolute bottom-8 left-8 z-20">
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl px-6 py-4 shadow-2xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/60 animate-pulse"></div>
                  <div className="text-sm font-semibold text-white tracking-wide">3D VIEWER CONTROLS</div>
                </div>
                <div className="space-y-2 text-xs text-white/80 font-light">
                  <div className="flex items-center gap-2">
                    <span className="text-white/60">↔</span>
                    <span>Drag to rotate</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-white/60">🔍</span>
                    <span>Scroll to zoom</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-white/60">↕</span>
                    <span>Right-click to pan</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Elegant Title - Top Left */}
            <div className="absolute top-8 left-8 z-20">
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl px-6 py-3 shadow-2xl">
                <div className="text-xs font-medium text-white/60 uppercase tracking-widest mb-1">3D Model</div>
                <div className="text-lg font-light text-white">{title}</div>
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

      {/* Floating Contact Button - Only on Small/Medium/Large devices (not XL) */}
      <div className="xl:hidden fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setShowContactModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 flex items-center justify-center"
          aria-label="Contact Property Owner"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      </div>

      {/* Contact Modal - Only on Small/Medium/Large devices */}
      {showContactModal && (
        <div 
          className="xl:hidden fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowContactModal(false)
            }
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Contact Property Owner</h2>
              <button
                onClick={() => setShowContactModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto">
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
      )}

      {/* Immersive Content - Fixed at Bottom */}
      {(model3D?.url || virtualTourUrl) && (
        <div className="fixed bottom-15 lg:bottom-6 right-0 lg:right-auto lg:left-[15em]  z-50">
          <div className=" backdrop-blur-sm rounded-full shadow-xl border border-gray-200 py-4  px-1 flex flex-col items-center gap-3 ">
            {/* <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Immersive Content</h4> */}
            
            {model3D?.url && (
              <button
                onClick={() => setShow3DModel(true)}
                className="flex flex-col items-center gap-2 p-1  rounded-lg hover:bg-gray-50 transition-colors group"
                aria-label="View 3D Model"
              >
                <Box className="w-6 h-6 text-primary_color group-hover:text-blue-700" />
                {/* <span className="text-xs font-medium text-gray-700">3D Model</span> */}
              </button>
            )}
            
            {virtualTourUrl && (
              <a
                href={virtualTourUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <Eye className="w-6 h-6 text-primary_color group-hover:text-blue-700" />
                {/* <span className="text-xs font-medium text-gray-700">Virtual Tour</span> */}
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default PropertyDetailPage