'use client'
import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { MapPin, Phone, Mail, Globe, Building2, Calendar, Users, CheckCircle, Facebook, Instagram, Linkedin, MessageCircle, Star, Award, Clock, Users2, Map, Share2 } from 'lucide-react'
import LeadContactForm from '@/app/components/LeadContactForm'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useAuth } from '@/contexts/AuthContext'
import ShareModal from '@/app/components/ui/ShareModal'
import { toast } from 'react-toastify'
import DataRenderer from '@/app/components/developers/DataRenderer'
import DevelopmentsSwiper from '@/app/components/developers/DevelopmentsSwiper'
import ListingsInfiniteScroll from '@/app/components/developers/ListingsInfiniteScroll'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay } from 'swiper/modules'
import 'swiper/css'
import Nav from '@/app/components/Nav'
import 'swiper/css/autoplay'

const DeveloperPage = () => {
  const params = useParams()
  const analytics = useAnalytics()
  const { user } = useAuth()
  const [developer, setDeveloper] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showShareModal, setShowShareModal] = useState(false)
  const fetchDeveloperBySlug = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch developer by slug (PUBLIC - no auth required)
      const response = await fetch(`/api/public/developers/${params.slug}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch developer')
      }

      if (data.success && data.data) {
        setDeveloper(data.data.developer)
        
        // Track profile view
        if (data.data.developer) {
          analytics.trackProfileView(data.data.developer.developer_id, 'developer')
        }
      } else {
        throw new Error('Invalid response format')
      }
    } catch (err) {
      console.error('Error fetching developer by slug:', err)
      setError(err.message)
      setDeveloper(null)
    } finally {
      setLoading(false)
    }
  }

  
  useEffect(() => {
  

    if (params.slug) {
      fetchDeveloperBySlug()
    }
  }, [params.slug])

  // Analytics tracking functions
  const handlePhoneClick = async (phoneNumber, context = 'profile') => {
    try {
      await navigator.clipboard.writeText(phoneNumber)
      analytics.trackPhoneInteraction('click', {
        contextType: context,
        profileId: developer?.developer_id,
        lister_id: developer?.developer_id,
        lister_type: 'developer',
        phoneNumber: phoneNumber
      })
      toast.success('Phone number copied!')
    } catch (error) {
      console.error('Failed to copy phone number:', error)
      toast.error('Failed to copy phone number')
    }
  }

  const handleEmailClick = async (email, context = 'profile') => {
    try {
      await navigator.clipboard.writeText(email)
    analytics.trackMessageClick({
        contextType: context,
        profileId: developer?.developer_id,
      lister_id: developer?.developer_id,
      lister_type: 'developer',
        messageType: 'email'
      })
      toast.success('Email copied!')
    } catch (error) {
      console.error('Failed to copy email:', error)
      toast.error('Failed to copy email')
    }
  }

  const handleWebsiteClick = (websiteUrl, context = 'profile') => {
    analytics.trackWebsiteClick(websiteUrl, {
      contextType: context,
      profileId: developer?.developer_id,
      lister_id: developer?.developer_id,
      lister_type: 'developer'
    })
  }

  const handleSocialMediaClick = (platform, url, context = 'profile') => {
    analytics.trackSocialMediaClick(platform, {
      contextType: context,
      profileId: developer?.developer_id,
      lister_id: developer?.developer_id,
      lister_type: 'developer'
    })
  }

  const handleMessageClick = () => {
    analytics.trackMessageClick({
      contextType: 'profile',
      profileId: developer?.developer_id,
      lister_id: developer?.developer_id,
      lister_type: 'developer',
      messageType: 'direct_message'
    })
  }

  const handleDevelopmentClick = (development) => {
    analytics.trackDevelopmentView(development.id, {
      viewedFrom: 'developer_profile',
      lister_id: developer?.developer_id,
      lister_type: 'developer',
      location: {
        city: development.city,
        state: development.state
      }
    })
  }

  const handleShareClick = (platform) => {
    analytics.trackShare('developer', platform, {
      lister_id: developer?.developer_id,
      lister_type: 'developer'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className=" font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  if (!developer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className=" font-bold text-gray-600 mb-4">Developer Not Found</h1>
          <p className="text-gray-500">The developer you're looking for doesn't exist.</p>
        </div>
      </div>
    )
  }

  // Parse all company_locations
  let companyLocations = []
  let primaryLocation = null
  try {
    const locations = typeof developer.company_locations === 'string'
      ? JSON.parse(developer.company_locations)
      : developer.company_locations

    if (Array.isArray(locations) && locations.length > 0) {
      companyLocations = locations
      primaryLocation = locations.find(loc => loc.primary_location === true) || locations[0]
    }
  } catch (e) {
    // Continue to fallback
  }

  // Fallback to direct fields if no company_locations
  if (companyLocations.length === 0) {
    const parts = [developer.city, developer.region, developer.country].filter(Boolean)
    if (parts.length > 0) {
      companyLocations = [{
        city: developer.city,
        region: developer.region,
        country: developer.country,
        primary_location: true
      }]
      primaryLocation = companyLocations[0]
    }
  }

  // Parse images
  let coverImageUrl = null
  try {
    const coverImage = typeof developer.cover_image === 'string'
      ? JSON.parse(developer.cover_image)
      : developer.cover_image
    coverImageUrl = coverImage?.url || null
  } catch (e) {
    coverImageUrl = developer.cover_image?.url || developer.cover_image || null
  }

  let profileImageUrl = null
  try {
    const profileImage = typeof developer.profile_image === 'string'
      ? JSON.parse(developer.profile_image)
      : developer.profile_image
    profileImageUrl = profileImage?.url || null
  } catch (e) {
    profileImageUrl = developer.profile_image?.url || developer.profile_image || null
  }

  // Parse company_gallery
  let companyGallery = []
  try {
    const gallery = typeof developer.company_gallery === 'string'
      ? JSON.parse(developer.company_gallery)
      : developer.company_gallery
    companyGallery = Array.isArray(gallery) ? gallery : []
  } catch (e) {
    companyGallery = Array.isArray(developer.company_gallery) ? developer.company_gallery : []
  }

  // Parse company_statistics
  let companyStatistics = []
  try {
    const stats = typeof developer.company_statistics === 'string'
      ? JSON.parse(developer.company_statistics)
      : developer.company_statistics
    companyStatistics = Array.isArray(stats) ? stats : []
  } catch (e) {
    companyStatistics = Array.isArray(developer.company_statistics) ? developer.company_statistics : []
  }

  return (
    <div className="min-h-screen text-primary_color  ">
      <Nav />
      {/* Hero Section - Split Layout */}
      <div className="flex flex-col justify-between lg:grid lg:grid-cols-2 min-h-[600px] h-screen">
        {/* Left Side - Cover Image */}
        <div className="relative w-full h-full  overflow-hidden">
          {coverImageUrl ? (
            <Image
              src={coverImageUrl}
              alt={`${developer.name} cover`}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
          )}
        </div>

        {/* Right Side - Profile Info */}
        <div className="w-full  p-8 flex flex-col justify-between">
          {/* Top Section - Name, Profile Image, Location, Share */}
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              {/* Profile Image */}
              <div className="relative flex-shrink-0">
                {profileImageUrl ? (
                  <Image
                    src={profileImageUrl}
                    alt={developer.name}
                    width={80}
                    height={80}
                    className="rounded-md object-cover border-2 border-white"
                  />
                ) : (
                  <div className="w-20 h-20 bg-slate-100 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                    <Building2 className="w-10 h-10 -400" />
                  </div>
                )}
                {developer.verified && (
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>

              {/* Name and Location */}
              <div className="flex-1 min-w-0">
                <h1 className=" lg:text-3xl  mb-2 truncate">
                  {developer.name}
                </h1>
                {primaryLocation && (
                  <div className="flex items-center gap-2 text-sm mb-3">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">
                      {[primaryLocation.city, primaryLocation.region, primaryLocation.country].filter(Boolean).join(', ') || primaryLocation.address}
                    </span>
                  </div>
                )}
                
                {/* Total Developments and Units */}
                <div className="flex items-center gap-4 text-primary_color">
                  {developer.total_developments !== undefined && developer.total_developments !== null && (
                    <div className="flex items-center gap-1 ">
                      <Building2 className="w-7 h-7 bg-primary_color rounded-md !p-1 text-white" />
                      <span>{developer.total_developments} Developments</span>
                    </div>
                  )}
                  {developer.total_units !== undefined && developer.total_units !== null && (
                    <div className="flex items-center gap-1 ">
                      <Users className="w-7 h-7 bg-primary_color rounded-md !p-1 text-white" />
                      <span>{developer.total_units} Units</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Share Icon */}
              <button
                onClick={() => {
                  setShowShareModal(true)
                  handleShareClick('modal')
                }}
                className="flex-shrink-0 w-10 h-10 box_holder flex items-center justify-center transition-colors"
                title="Share profile"
              >
                <Share2 className="w-5 h-5 -600" />
              </button>
            </div>
          </div>

          {/* Middle Section - Slogan */}
          <div className="">
            <div className="text-xs -400 uppercase tracking-wider mb-2">--Slogan--</div>
            {developer.slogan || developer.tagline ? (
              <p className="text-[2em] italic -700 leading-relaxed">
                {developer.slogan || developer.tagline}
              </p>
            ) : (
              <p className="text-sm -400 italic">No slogan available</p>
            )}
          </div>

          {/* Bottom Section - Contact Info */}
          <div className=" flex flex-col gap-2">
            {developer.email && (
              <div className="flex items-center gap-3 -700 border-b border-primary_color pb-2">
                <div className="w-10 h-10 box_holder flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 -600" />
                </div>
                <button
                  onClick={() => handleEmailClick(developer.email, 'profile')}
                  className="text-sm hover:text-blue-600 transition-colors cursor-pointer truncate"
                  title="Click to copy email"
                >
                  {developer.email}
                </button>
              </div>
            )}
            {developer.phone && (
              <div className="flex items-center gap-3  border-b border-primary_color pb-2">
                <div className="w-10 h-10 box_holder flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5 -600" />
                </div>
                <button
                  onClick={() => handlePhoneClick(developer.phone, 'profile')}
                  className="text-sm hover:text-blue-600 transition-colors cursor-pointer"
                  title="Click to copy phone number"
                >
                  {developer.phone}
                </button>
              </div>
            )}
            {developer.website && (
              <div className="flex items-center gap-3  border-b border-primary_color pb-2">
                <div className="w-10 h-10 box_holder flex items-center justify-center flex-shrink-0">
                  <Globe className="w-5 h-5 -600" />
                </div>
                <a
                  href={developer.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleWebsiteClick(developer.website, 'profile')}
                  className="text-sm hover:text-blue-600 transition-colors truncate"
                >
                  {developer.website}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Side - All Information */}
          <div className="lg:col-span-2 space-y-12">
            {/* About Us / Description */}
            {developer.description && (
              <div>
                <h2 className=" font-light mb-6">About Us</h2>
                <div className="space-y-4">
                  <p className="leading-relaxed">{developer.description}</p>
                </div>
              </div>
            )}

            {/* Company Overview - Moved to top */}
            {(developer.founded_year || developer.company_size) && (
              <div>
                <h2 className=" font-light mb-6">Company Overview</h2>
                <div className="space-y-2">
                  {developer.founded_year && (
                    <DataRenderer
                      title="Founded In"
                      value={developer.founded_year}
                      icon={Calendar}
                    />
                  )}
                  {developer.company_size && (
                    <DataRenderer
                      title="with over"
                      value={`${developer.company_size} employees`}
                      icon={Users2}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Company Statistics */}
            {companyStatistics.length > 0 && (
              <div>
                <h2 className=" font-light mb-6">Company Statistics</h2>
                <div className="space-y-2">
                  {companyStatistics.map((stat, index) => (
                    <DataRenderer
                      key={index}
                      title={stat.label}
                      value={stat.value}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Specializations */}
            {developer.specialization && (
              <div>
                <h2 className=" font-light mb-6">Property Specializations</h2>
                <div className="flex flex-wrap gap-2">
                  {developer.specialization.database?.map((spec, index) => (
                    <span key={index} className="px-4 py-2 border border-primary_color rounded-full text-sm">
                      {typeof spec === 'string' ? spec : spec.name}
                    </span>
                  ))}
                  {developer.specialization.custom?.map((spec, index) => (
                    <span key={index} className="px-4 py-2 border border-primary_color rounded-full text-sm">
                      {typeof spec === 'string' ? spec : spec.name || spec}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Development Stats */}
            {(developer.total_developments !== undefined || developer.total_units !== undefined) && (
              <div>
                <h2 className=" font-light mb-6">Development Statistics</h2>
                <div className="space-y-2">
                  {developer.total_developments !== undefined && developer.total_developments !== null && (
                    <DataRenderer
                      title="Total Developments"
                      value={developer.total_developments}
                      icon={Building2}
                    />
                  )}
                  {developer.total_units !== undefined && developer.total_units !== null && (
                    <DataRenderer
                      title="Total Units and Listings"
                      value={developer.total_units}
                      icon={Users}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Gallery */}
            {companyGallery.length > 0 && (
              <div>
                <h2 className=" font-light mb-6">Our Sample Gallery</h2>
                <Swiper
                  modules={[Autoplay]}
                  spaceBetween={16}
                  slidesPerView={1}
                  breakpoints={{
                    640: {
                      slidesPerView: 2,
                    },
                    1024: {
                      slidesPerView: 3,
                    },
                  }}
                  autoplay={{
                    delay: 3000,
                    disableOnInteraction: false,
                  }}
                  loop={companyGallery.length > 3}
                  className="gallery-swiper"
                >
                  {companyGallery.map((image, index) => (
                    <SwiperSlide key={index}>
                      <div className="relative aspect-square overflow-hidden rounded-lg">
                        <Image
                          src={image.url}
                          alt={image.name || `Gallery image ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>
            )}

            {/* Locations - Show all company locations */}
            {companyLocations.length > 0 && (
              <div>
                <h2 className=" font-light mb-6">Locations</h2>
                <div className="space-y-2">
                  {companyLocations.map((loc, index) => {
                    const parts = [loc.city, loc.region, loc.country].filter(Boolean)
                    const locationString = parts.length > 0 ? parts.join(', ') : loc.address || 'Location'
                    return (
                      <DataRenderer
                        key={index}
                        title={loc.primary_location ? 'Primary Location' : `Location ${index + 1}`}
                        value={locationString}
                        icon={MapPin}
                      />
                    )
                  })}
                </div>
              </div>
            )}

            {/* Contact Information */}
            <div>
              <h2 className=" font-light mb-6">Contact Information</h2>
              <div className="space-y-2">
                {developer.email && (
                  <DataRenderer
                    title="Email"
                    value={developer.email}
                    icon={Mail}
                    onClick={() => handleEmailClick(developer.email, 'profile')}
                  />
                )}
                {developer.phone && (
                  <DataRenderer
                    title="Phone"
                    value={developer.phone}
                    icon={Phone}
                    onClick={() => handlePhoneClick(developer.phone, 'profile')}
                  />
                )}
                {developer.secondary_email && (
                  <DataRenderer
                    title="Secondary Email"
                    value={developer.secondary_email}
                    icon={Mail}
                  />
                )}
                {developer.secondary_phone && (
                  <DataRenderer
                    title="Secondary Phone"
                    value={developer.secondary_phone}
                    icon={Phone}
                  />
                )}
              </div>
            </div>

            {/* Social Media */}
            {developer.social_media && Object.keys(developer.social_media).length > 0 && (
              <div>
                <h2 className=" font-light mb-6">Socials</h2>
                <div className="flex flex-wrap gap-4">
                  {developer.social_media.instagram && (
                    <a
                      href={developer.social_media.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => handleSocialMediaClick('instagram', developer.social_media.instagram, 'profile')}
                      className="flex items-center gap-2"
                    >
                      <Instagram className="w-5 h-5" />
                      <span>@{developer.social_media.instagram.split('/').pop()}</span>
                    </a>
                  )}
                  {developer.social_media.tiktok && (
                    <a
                      href={developer.social_media.tiktok}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => handleSocialMediaClick('tiktok', developer.social_media.tiktok, 'profile')}
                      className="flex items-center gap-2"
                    >
                      <span>@erudite properties</span>
                    </a>
                  )}
                  {developer.social_media.linkedin && (
                    <a
                      href={developer.social_media.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => handleSocialMediaClick('linkedin', developer.social_media.linkedin, 'profile')}
                      className="flex items-center gap-2"
                    >
                      <Linkedin className="w-5 h-5" />
                      <span>Erudite Properties</span>
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Customer Care */}
            {developer.customer_care && developer.customer_care.length > 0 && (
              <div>
                <h2 className=" font-light mb-6">Customer Care</h2>
                <div className="space-y-2">
                  {developer.customer_care.map((contact, index) => (
                    <DataRenderer
                      key={index}
                      title={contact.name}
                      value={contact.phone}
                      icon={MessageCircle}
                      onClick={() => handlePhoneClick(contact.phone, 'customer_care')}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Location Map */}
            {developer.latitude && developer.longitude && (
              <div>
                <h2 className=" font-light mb-6">Location</h2>
                <div className="border border-primary_color/20 rounded-lg overflow-hidden">
                  <div className="h-96 w-full">
                    <iframe
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${developer.longitude - 0.01},${developer.latitude - 0.01},${developer.longitude + 0.01},${developer.latitude + 0.01}&layer=mapnik&marker=${developer.latitude},${developer.longitude}`}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title={`${developer.name} Location`}
                    />
                  </div>
                  <div className="p-6 border-t border-primary_color/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Map className="w-5 h-5" />
                        <span>
                          {developer.city && developer.country 
                            ? `${developer.city}, ${developer.country}`
                            : 'Location coordinates'
                          }
                        </span>
                      </div>
                      <a
                        href={`https://www.openstreetmap.org/?mlat=${developer.latitude}&mlon=${developer.longitude}&zoom=15`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm hover:underline transition-colors"
                      >
                        View on OpenStreetMap →
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}


            {/* Developments Section */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className=" font-light">Our Developments</h2>
              </div>
              <DevelopmentsSwiper developerId={developer?.developer_id} />
            </div>

            {/* Listings Section */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className=" font-light">Our Listings</h2>
              </div>
              <ListingsInfiniteScroll developerId={developer?.developer_id} />
            </div>

          </div>

          {/* Right Side - Sticky Appointment Booking */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <LeadContactForm 
                contextType="profile"
                profileId={developer.developer_id}
                profile={developer}
                developer={developer}
                propertyTitle={`Consultation with ${developer.name}`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      <ShareModal 
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        property={developer}
        propertyType="developer"
      />
    </div>
  )
}

export default DeveloperPage
