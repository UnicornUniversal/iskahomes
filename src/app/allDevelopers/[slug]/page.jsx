'use client'
import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { MapPin, Phone, Mail, Globe, Building2, Calendar, Users, CheckCircle, Facebook, Instagram, Linkedin, MessageCircle, Star, Award, Clock, Users2, Map, Share2 } from 'lucide-react'
import ScheduleATour from '@/app/components/ScheduleATour'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useAuth } from '@/contexts/AuthContext'
import ShareModal from '@/app/components/ui/ShareModal'
import { toast } from 'react-toastify'

const DeveloperPage = () => {
  const params = useParams()
  const analytics = useAnalytics()
  const { user } = useAuth()
  const [developer, setDeveloper] = useState(null)
  const [developments, setDevelopments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showShareModal, setShowShareModal] = useState(false)

  useEffect(() => {
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
          setDevelopments(data.data.developments || [])
          
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
        setDevelopments([])
      } finally {
        setLoading(false)
      }
    }

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
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  if (!developer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-600 mb-4">Developer Not Found</h1>
          <p className="text-gray-500">The developer you're looking for doesn't exist.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Cover Image */}
      <div className="relative h-[50vh] min-h-[400px] overflow-hidden">
        {developer.cover_image ? (
          <Image
            src={developer.cover_image.url}
            alt={`${developer.name} cover`}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        )}
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* Profile Section */}
      <div className="max-w-7xl mx-auto px-6 -mt-20 relative z-10">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="px-8 py-12">
            <div className="flex flex-col md:flex-row items-start gap-8">
              {/* Profile Image */}
              <div className="relative">
                {developer.profile_image ? (
                  <Image
                    src={developer.profile_image.url}
                    alt={developer.name}
                    width={160}
                    height={160}
                    className="rounded-2xl border-4 border-white shadow-2xl object-cover"
                  />
                ) : (
                  <div className="w-40 h-40 bg-slate-100 rounded-2xl border-4 border-white shadow-2xl flex items-center justify-center">
                    <Building2 className="w-20 h-20 text-slate-400" />
                  </div>
                )}
                {developer.verified && (
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>

              {/* Developer Info */}
              <div className="flex-1">
                <h1 className="text-4xl md:text-5xl font-light tracking-tight text-slate-900 mb-4">
                  {developer.name}
                </h1>
                {developer.description && (
                  <p className="text-lg text-slate-600 max-w-3xl leading-relaxed mb-8">
                    {developer.description}
                  </p>
                )}
                
                {/* Key Stats */}
                <div className="flex flex-wrap gap-8 text-slate-600">
                  <div className="text-center">
                    <div className="text-2xl font-light text-slate-900">{developer.total_developments}</div>
                    <div className="text-sm uppercase tracking-wider">Developments</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-light text-slate-900">{developer.total_units}</div>
                    <div className="text-sm uppercase tracking-wider">Units</div>
                  </div>
                  {developer.founded_year && (
                    <div className="text-center">
                      <div className="text-2xl font-light text-slate-900">{developer.founded_year}</div>
                      <div className="text-sm uppercase tracking-wider">Established</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Contact & Actions */}
        <div className="mb-16">
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* Contact Information */}
            <div className="flex-1 space-y-6">
              <div className="space-y-4">
                <h2 className="text-2xl font-light text-slate-900 mb-6">Contact Information</h2>
                
                <div className="space-y-6">
                  {/* Primary Contact */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {developer.email && (
                      <div className="flex items-center space-x-3 text-slate-600">
                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                          <Mail className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm text-slate-500 uppercase tracking-wider">Primary Email</div>
                          <button
                            onClick={() => handleEmailClick(developer.email, 'profile')}
                            className="text-lg hover:text-blue-600 transition-colors cursor-pointer"
                            title="Click to copy email"
                          >
                            {developer.email}
                          </button>
                        </div>
                      </div>
                    )}
                    {developer.phone && (
                      <div className="flex items-center space-x-3 text-slate-600">
                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                          <Phone className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm text-slate-500 uppercase tracking-wider">Primary Phone</div>
                          <button
                            onClick={() => handlePhoneClick(developer.phone, 'profile')}
                            className="text-lg hover:text-blue-600 transition-colors cursor-pointer"
                            title="Click to copy phone number"
                          >
                            {developer.phone}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Secondary Contact */}
                  {(developer.secondary_email || developer.secondary_phone) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {developer.secondary_email && (
                        <div className="flex items-center space-x-3 text-slate-600">
                          <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                            <Mail className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="text-sm text-slate-500 uppercase tracking-wider">Secondary Email</div>
                            <span className="text-lg">{developer.secondary_email}</span>
                          </div>
                        </div>
                      )}
                      {developer.secondary_phone && (
                        <div className="flex items-center space-x-3 text-slate-600">
                          <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                            <Phone className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="text-sm text-slate-500 uppercase tracking-wider">Secondary Phone</div>
                            <span className="text-lg">{developer.secondary_phone}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tertiary Contact */}
                  {(developer.tertiary_email || developer.tertiary_phone) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {developer.tertiary_email && (
                        <div className="flex items-center space-x-3 text-slate-600">
                          <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                            <Mail className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="text-sm text-slate-500 uppercase tracking-wider">Tertiary Email</div>
                            <span className="text-lg">{developer.tertiary_email}</span>
                          </div>
                        </div>
                      )}
                      {developer.tertiary_phone && (
                        <div className="flex items-center space-x-3 text-slate-600">
                          <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                            <Phone className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="text-sm text-slate-500 uppercase tracking-wider">Tertiary Phone</div>
                            <span className="text-lg">{developer.tertiary_phone}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Location & Website */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {developer.city && developer.country && (
                      <div className="flex items-center space-x-3 text-slate-600">
                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                          <MapPin className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-sm text-slate-500 uppercase tracking-wider">Location</div>
                          <span className="text-lg">{developer.city}, {developer.country}</span>
                        </div>
                      </div>
                    )}
                    {developer.website && (
                      <div className="flex items-center space-x-3 text-slate-600">
                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                          <Globe className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-sm text-slate-500 uppercase tracking-wider">Website</div>
                          <a 
                            href={developer.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => handleWebsiteClick(developer.website, 'profile')}
                            className="text-lg hover:text-slate-900 transition-colors"
                          >
                            Visit Website
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Social Media */}
              {developer.social_media && Object.keys(developer.social_media).length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-slate-900">Follow Us</h3>
                  <div className="flex space-x-4">
                    {developer.social_media.facebook && (
                      <a
                        href={developer.social_media.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => handleSocialMediaClick('facebook', developer.social_media.facebook, 'profile')}
                        className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center hover:bg-slate-200 transition-colors"
                      >
                        <Facebook className="w-5 h-5 text-slate-600" />
                      </a>
                    )}
                    {developer.social_media.instagram && (
                      <a
                        href={developer.social_media.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => handleSocialMediaClick('instagram', developer.social_media.instagram, 'profile')}
                        className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center hover:bg-slate-200 transition-colors"
                      >
                        <Instagram className="w-5 h-5 text-slate-600" />
                      </a>
                    )}
                    {developer.social_media.linkedin && (
                      <a
                        href={developer.social_media.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => handleSocialMediaClick('linkedin', developer.social_media.linkedin, 'profile')}
                        className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center hover:bg-slate-200 transition-colors"
                      >
                        <Linkedin className="w-5 h-5 text-slate-600" />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-4">
              <ScheduleATour 
                propertyId={developer.developer_id}
                propertyTitle={`Consultation with ${developer.name}`}
                propertyType="developer"
                developer={developer}
              />
              <button 
                onClick={handleMessageClick}
                className="flex items-center justify-center space-x-3 bg-slate-900 text-white px-8 py-4 rounded-full hover:bg-slate-800 transition-colors duration-200 font-medium"
              >
                <MessageCircle className="w-5 h-5" />
                <span>Send Message</span>
              </button>
              <button 
                onClick={() => {
                  setShowShareModal(true)
                  handleShareClick('modal')
                }}
                className="flex items-center justify-center space-x-3 bg-blue-600 text-white px-8 py-4 rounded-full hover:bg-blue-700 transition-colors duration-200 font-medium"
              >
                <Share2 className="w-5 h-5" />
                <span>Share Profile</span>
              </button>
            </div>
          </div>
        </div>

        {/* Location Map */}
        {developer.latitude && developer.longitude && (
          <div className="mb-16">
            <h2 className="text-2xl font-light text-slate-900 mb-8">Location</h2>
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
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
              <div className="p-6 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Map className="w-5 h-5 text-slate-600" />
                    <span className="text-slate-600">
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
                    className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    View on OpenStreetMap →
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Company Information */}
        <div className="mb-16">
          <h2 className="text-2xl font-light text-slate-900 mb-8">Company Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Company Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-slate-900">Details</h3>
              <div className="space-y-3">
                {developer.company_size && (
                  <div className="flex items-center space-x-3 text-slate-600">
                    <Users2 className="w-5 h-5" />
                    <span>{developer.company_size} employees</span>
                  </div>
                )}
                {developer.license_number && (
                  <div className="flex items-center space-x-3 text-slate-600">
                    <Award className="w-5 h-5" />
                    <span>License: {developer.license_number}</span>
                  </div>
                )}
                {developer.founded_year && (
                  <div className="flex items-center space-x-3 text-slate-600">
                    <Clock className="w-5 h-5" />
                    <span>Established {developer.founded_year}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Specializations */}
            {developer.specialization && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-slate-900">Specializations</h3>
                <div className="flex flex-wrap gap-2">
                  {developer.specialization.database?.map((spec, index) => (
                    <span key={index} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-full text-sm font-medium">
                      {spec.name}
                    </span>
                  ))}
                  {developer.specialization.custom?.map((spec, index) => (
                    <span key={index} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-full text-sm font-medium">
                      {spec}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Customer Care */}
            {developer.customer_care && developer.customer_care.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-slate-900">Customer Care</h3>
                <div className="space-y-3">
                  {developer.customer_care.map((contact, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                        <MessageCircle className="w-5 h-5 text-slate-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">{contact.name}</p>
                        <button
                          onClick={() => handlePhoneClick(contact.phone, 'customer_care')}
                          className="text-sm text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
                          title="Click to copy phone number"
                        >
                          {contact.phone}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Developments Section */}
    <div>
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-2xl font-light text-slate-900">Our Developments</h2>
            <span className="text-slate-500 text-sm uppercase tracking-wider">{developments.length} projects</span>
          </div>

          {developments.length === 0 ? (
            <div className="text-center py-16">
              <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No Developments Yet</h3>
              <p className="text-slate-500">This developer hasn't added any developments yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {developments.map((development) => (
                <div 
                  key={development.id} 
                  className="group cursor-pointer"
                  onClick={() => handleDevelopmentClick(development)}
                >
                  <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 hover:shadow-xl transition-all duration-300">
                    {development.banner && (
                      <div className="relative h-64 overflow-hidden">
                        <Image
                          src={development.banner.url}
                          alt={development.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-4 right-4">
                          <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-slate-700 rounded-full text-xs font-medium">
                            {development.status}
                          </span>
                        </div>
                      </div>
                    )}
                    <div className="p-6">
                      <h3 className="text-xl font-medium text-slate-900 mb-3 group-hover:text-slate-700 transition-colors">
                        {development.title}
                      </h3>
                      <p className="text-slate-600 text-sm mb-4 line-clamp-2 leading-relaxed">
                        {development.description}
                      </p>
                      
                      {/* Location */}
                      <div className="flex items-center text-sm text-slate-500 mb-4">
                        <MapPin className="w-4 h-4 mr-2" />
                        <span>{development.city}, {development.country}</span>
                      </div>

                      {/* Development Stats */}
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="text-center py-2 bg-slate-50 rounded-lg">
                          <div className="text-lg font-semibold text-slate-900">{development.number_of_buildings}</div>
                          <div className="text-xs text-slate-500 uppercase tracking-wider">Buildings</div>
                        </div>
                        <div className="text-center py-2 bg-slate-50 rounded-lg">
                          <div className="text-lg font-semibold text-slate-900">{development.total_units}</div>
                          <div className="text-xs text-slate-500 uppercase tracking-wider">Units</div>
                        </div>
                      </div>

                      {/* Purposes */}
                      {development.purposes && development.purposes.length > 0 && (
                        <div className="mb-6">
                          <div className="flex flex-wrap gap-2">
                            {development.purposes.slice(0, 2).map((purpose, index) => (
                              <span key={index} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">
                                {typeof purpose === 'string' ? purpose : purpose.name}
                              </span>
                            ))}
                            {development.purposes.length > 2 && (
                              <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">
                                +{development.purposes.length - 2} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Action Button */}
                      <button className="w-full bg-slate-900 text-white py-3 px-4 rounded-full hover:bg-slate-800 transition-colors duration-200 text-sm font-medium">
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
